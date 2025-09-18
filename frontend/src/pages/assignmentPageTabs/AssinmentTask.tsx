import React, { useEffect, useMemo, useRef, useCallback } from "react";
import { Box, Tooltip, IconButton} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAppContext } from "../../context/AppContext";
import GanttChart, { GanttItem, GanttGroup } from "../../components/GanttChart";
import DateRangeFilter from "../../components/filters/DateRangeFilter";
import { useFilterContext } from "../../context/FilterContext";
import { fetchAssignmentTasks } from "../../api/bridgeApi";
import CollapsibleFilterPanel from "../../components/filters/CollapsibleFilterPanel";
import CheckboxFilter from "../../components/filters/CheckboxFilter";
import { useDialogContext } from "../../context/DialogContext";

const AssinmentTask: React.FC = () => {
  const { people, tasks, addTasks, setLoading } = useAppContext();
  const { filters, getFilteredData } = useFilterContext();
  const { openDialog } = useDialogContext();
  // 分離した pageKey
  const itemsPageKey = "assignment:task:items";   // DateRange for tasks
  const groupsPageKey = "assignment:task:groups"; // Department filter for people

  // 初期表示範囲（2週前～2か月後）
  const start = new Date();
  start.setDate(start.getDate() - 14);
  const end = new Date();
  end.setMonth(end.getMonth() + 2);

  // データ取得（itemsPageKey の dateRange にのみ連動）
  const debounceRef = useRef<number | undefined>(undefined);
  const itemsDateRange = filters[itemsPageKey]?.dateRange;
  const itemsStart = itemsDateRange?.start;
  const itemsEnd = itemsDateRange?.end;


  const fetchData = useCallback(async () => {
    if (!itemsStart || !itemsEnd) return;
    try {
      setLoading(true);
      const res = await fetchAssignmentTasks(itemsStart, itemsEnd);
      addTasks(res.tasks || []);
    } catch (e: any) {
      openDialog({
        title: "Error",
        message: `Failed to fetch assignment tasks.\n${e.message || String(e)}`,
        okText: "OK"
      });
    } finally {
      setLoading(false);
    }
  }, [itemsStart, itemsEnd, addTasks, setLoading, openDialog]);

  useEffect(() => {
    if (!itemsStart || !itemsEnd) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      fetchData();
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [itemsStart, itemsEnd, addTasks, setLoading]);

  const peopleFiltered = useMemo(() => {
    return getFilteredData(groupsPageKey, people ?? []);
  }, [people, getFilteredData]);

  const allowedPersonIds = useMemo(() => new Set(peopleFiltered.map((p) => p.id)), [peopleFiltered]);

  const groups: GanttGroup[] = useMemo(
    () => (peopleFiltered ?? []).map((person) => ({ id: person.id, content: person.name })),
    [peopleFiltered]
  );

  const filteredTasks = useMemo(() => {
    return getFilteredData(itemsPageKey, tasks ?? []);
  }, [tasks, getFilteredData]);

  const items: GanttItem[] = useMemo(() => {
    const taskItems: GanttItem[] = [];
    (filteredTasks ?? []).forEach((task) => {
      if (!task.start_date || !task.end_date) {
        return; // 不正データはスキップ
      }
      (task.assignees ?? []).forEach((person) => {
        if (!allowedPersonIds.has(person.id)) return; // 部門フィルター
        taskItems.push({
          id: `${task.id}-${person.id}`,
          group: person.id,
          content: task.name,
          start: task.start_date,
          end: task.end_date,
          className: task.status === 'fin' ? 'status-fin' :
            task.status === 'ip' ? 'status-ip' : 'status-wtg',
          tooltipHtml: `<div><strong>${task.name}</strong><br/>${task.subproject?.name}</div>`
        });
      });
    });
    return taskItems;
  }, [filteredTasks, allowedPersonIds]);

  return (
    <div>
      {/* Top bar: Date range on the left, filters on the right */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DateRangeFilter pageKey={itemsPageKey} label="Period" hideTitle={true} compact defaultStartWeek={0} defaultEndWeek={8} />
          <Tooltip title="Reload">
              <span>
                <IconButton onClick={fetchData} size="large" color="primary">
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
        </Box>
        <CollapsibleFilterPanel pageKey={groupsPageKey} sx={{ ml: 2 }}>
          <CheckboxFilter
            pageKey={groupsPageKey}
            data={people ?? []}
            property={"department.name"}
            label="Department"
          />
        </CollapsibleFilterPanel>
      </Box>
      <GanttChart
        items={items}
        groups={groups}
        height='calc(100vh - 200px)'
        start={start}
        end={end}
      />
    </div>
  );
};

export default AssinmentTask;

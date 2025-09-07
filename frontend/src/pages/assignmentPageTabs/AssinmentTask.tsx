import React, { useEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import { useAppContext } from "../../context/AppContext";
import GanttChart, { GanttItem, GanttGroup } from "../../components/GanttChart";
import DateRangeFilter from "../../components/filters/DateRangeFilter";
import { useFilterContext } from "../../context/FilterContext";
import { fetchAssignmentTasks } from "../../api/bridgeApi";
import CollapsibleFilterPanel from "../../components/filters/CollapsibleFilterPanel";
import CheckboxFilter from "../../components/filters/CheckboxFilter";

const AssinmentTask: React.FC = () => {
  const { people, tasks, addTasks, setLoading } = useAppContext();
  const { filters, getFilteredData } = useFilterContext();
  // 分離した pageKey
  const itemsPageKey = "assignment:task:items";   // DateRange for tasks
  const groupsPageKey = "assignment:task:groups"; // Department filter for people

  // データ取得（itemsPageKey の dateRange にのみ連動）
  const debounceRef = useRef<number | undefined>(undefined);
  const itemsDateRange = filters[itemsPageKey]?.dateRange;
  const itemsStart = itemsDateRange?.start;
  const itemsEnd = itemsDateRange?.end;
  useEffect(() => {
    if (!itemsStart || !itemsEnd) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetchAssignmentTasks(itemsStart, itemsEnd);
        addTasks(res.tasks || []); // 追加。置き換えはしない
      } finally {
        setLoading(false);
      }
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
          tooltipHtml: `<div><strong>${task.name}</strong><br/>${task.start_date} - ${task.end_date}</div>`
        });
      });
    });
    return taskItems;
  }, [filteredTasks, allowedPersonIds]);

  return (
    <div>
      {/* Top bar: Date range on the left, filters on the right */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Box>
          <DateRangeFilter pageKey={itemsPageKey} label="Period" compact defaultStartWeek={0} defaultEndWeek={8} />
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
      <GanttChart items={items} groups={groups} />
    </div>
  );
};

export default AssinmentTask;

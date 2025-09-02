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

  // Department options + filtering
  type DeptOption = { departmentName: string };
  const peopleWithDeptName: (DeptOption & { id: number; name: string })[] = useMemo(() => {
    return (people ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      departmentName: p.department?.name || "(No Department)",
    }));
  }, [people]);

  // groups は groupsPageKey を用いて FilterContext 経由で抽出
  const peopleFiltered = useMemo(() => {
    return getFilteredData(groupsPageKey, peopleWithDeptName);
  }, [peopleWithDeptName, getFilteredData]);

  const allowedPersonIds = useMemo(() => new Set(peopleFiltered.map((p) => p.id)), [peopleFiltered]);

  // People毎にグループを作成（部門フィルター適用）
  const groups: GanttGroup[] = useMemo(
    () => peopleFiltered.map((person) => ({ id: person.id, content: person.name })),
    [peopleFiltered]
  );

  // items は itemsPageKey（dateRange）を適用してから、部門で可視化対象の人に限定
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
          <DateRangeFilter pageKey={itemsPageKey} label="Period" compact />
        </Box>
        <CollapsibleFilterPanel pageKey={groupsPageKey} sx={{ ml: 2 }}>
          <CheckboxFilter<DeptOption>
            pageKey={groupsPageKey}
            data={peopleWithDeptName}
            property={"departmentName"}
            label="Department"
          />
        </CollapsibleFilterPanel>
      </Box>
      <GanttChart items={items} groups={groups} />
    </div>
  );
};

export default AssinmentTask;

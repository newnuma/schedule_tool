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
  const { filters } = useFilterContext();
  const pageKey = "assignment:task";
  const debounceRef = useRef<number | undefined>(undefined);

  // フィルター変更に応じてタスクを取得（追加）
  useEffect(() => {
    const dr = filters[pageKey]?.dateRange;
    const start = dr?.start;
    const end = dr?.end;
    if (!start || !end) return;
    // デバウンス
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetchAssignmentTasks(start, end);
        addTasks(res.tasks || []); // 追加。置き換えはしない
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [filters, addTasks, setLoading]);

  // Department options + filtering
  type DeptOption = { departmentName: string };
  const peopleWithDeptName: (DeptOption & { id: number; name: string })[] = useMemo(() => {
    return (people ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      departmentName: p.department?.name || "(No Department)",
    }));
  }, [people]);

  const selectedDepartments: string[] = (filters[pageKey]?.dropdown?.["departmentName"] as string[]) || [];
  const peopleFiltered = useMemo(() => {
    if (!selectedDepartments || selectedDepartments.length === 0) return peopleWithDeptName;
    return peopleWithDeptName.filter((p) => selectedDepartments.includes(p.departmentName));
  }, [peopleWithDeptName, selectedDepartments]);

  const allowedPersonIds = useMemo(() => new Set(peopleFiltered.map((p) => p.id)), [peopleFiltered]);

  // People毎にグループを作成（部門フィルター適用）
  const groups: GanttGroup[] = useMemo(
    () => peopleFiltered.map((person) => ({ id: person.id, content: person.name })),
    [peopleFiltered]
  );

  // console.log("tasks", tasks);

  // 各タスクを、アサインされているpeople毎にアイテムとして展開
  const items: GanttItem[] = useMemo(() => {
    const taskItems: GanttItem[] = [];
    (tasks ?? []).forEach((task) => {
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
  }, [tasks, allowedPersonIds]);

  return (
    <div>
      {/* Top bar: Date range on the left, filters on the right */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Box>
          <DateRangeFilter pageKey={pageKey} label="Period" compact />
        </Box>
        <CollapsibleFilterPanel pageKey={pageKey} sx={{ ml: 2 }}>
          <CheckboxFilter<DeptOption>
            pageKey={pageKey}
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

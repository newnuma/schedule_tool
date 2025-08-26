import React, { useEffect, useMemo, useRef } from "react";
import { Typography } from "@mui/material";
import { useAppContext } from "../../context/AppContext";
import GanttChart, { GanttItem, GanttGroup } from "../../components/GanttChart";
import DateRangeFilter from "../../components/filters/DateRangeFilter";
import { useFilterContext } from "../../context/FilterContext";
import { fetchAssignmentTasks } from "../../api/bridgeApi";

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

  // People毎にグループを作成
  const groups: GanttGroup[] = useMemo(
    () => (people ?? []).map((person) => ({ id: person.id, content: person.name })),
    [people]
  );

  console.log("tasks", tasks);

  // 各タスクを、アサインされているpeople毎にアイテムとして展開
  const items: GanttItem[] = useMemo(() => {
    const taskItems: GanttItem[] = [];
    (tasks ?? []).forEach((task) => {
      if (!task.start_date || !task.end_date) {
        return; // 不正データはスキップ
      }
  (task.assignees ?? []).forEach((person) => {
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
  }, [tasks]);

  return (
    <div>
  <DateRangeFilter pageKey={pageKey} label="Period" />
      <GanttChart items={items} groups={groups} />
    </div>
  );
};

export default AssinmentTask;

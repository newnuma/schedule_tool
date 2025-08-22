import React, { useMemo } from "react";
import { Typography } from "@mui/material";
import { useAppContext } from "../../context/AppContext";
import GanttChart, { GanttItem, GanttGroup } from "../../components/GanttChart";

const AssinmentTask: React.FC = () => {
  const { people, tasks } = useAppContext();

  // People毎にグループを作成
  const groups: GanttGroup[] = useMemo(
    () => (people ?? []).map((person) => ({ id: person.id, content: person.name })),
    [people]
  );

  // 各タスクを、アサインされているpeople毎にアイテムとして展開
  const items: GanttItem[] = useMemo(() => {
    const taskItems: GanttItem[] = [];
    (tasks ?? []).forEach((task) => {
      if (!task.start_date || !task.end_date) {
        return; // 不正データはスキップ
      }
      (task.people ?? []).forEach((person) => {
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
      <Typography variant="h6" gutterBottom>
        Task
      </Typography>
      <GanttChart items={items} groups={groups} />
    </div>
  );
};

export default AssinmentTask;

import React, { useMemo } from "react";
import { Typography } from "@mui/material";
import { Main } from "../components/StyledComponents";
import { useAppContext } from "../context/AppContext";
import GanttChart from "../components/GanttChart";
import ErrorBoundary from "../components/ErrorBoundary";

const AssignmentPage: React.FC = () => {
  const { people, tasks } = useAppContext();

  // People毎にグループを作成
  const groups = useMemo(
    () => (people ?? []).map((person) => ({ 
      id: person.id, 
      content: person.name 
    })),
    [people],
  );

  // 各タスクを、アサインされているpeople毎にアイテムとして展開
  const items = useMemo(() => {
    const taskItems: Array<{
      id: string;
      group: number;
      content: string;
      start: string;
      end: string;
    }> = [];

    (tasks ?? []).forEach((task) => {
      // start_dateとend_dateがnull/undefinedの場合はスキップ
      if (!task.start_date || !task.end_date) {
        console.warn(`Task ${task.id} has missing dates, excluding from chart`, task);
        return;
      }
      
      // タスクにアサインされている各personに対してアイテムを作成
      (task.people ?? []).forEach((person) => {
        taskItems.push({
          id: `${task.id}-${person.id}`, // タスクID-PersonIDで一意性を保つ
          group: person.id,
          content: task.name,
          start: task.start_date,
          end: task.end_date,
        });
      });
    });

    return taskItems;
  }, [tasks]);

  return (
    <Main component="main">
      <Typography variant="h4" gutterBottom>
        Assignment
      </Typography>
      <ErrorBoundary>
        <GanttChart items={items} groups={groups} />
      </ErrorBoundary>
    </Main>
  );
};

export default AssignmentPage;

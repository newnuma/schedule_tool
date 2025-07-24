import React, { useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import GanttChart from "../components/GanttChart";

const DistributePage: React.FC = () => {
  const { projects, tasks } = useAppContext();

  // 例: projects, tasksからガント表示用データを組み立て
  const groups = useMemo(
    () => projects.map(p => ({ id: p.id, content: p.name })),
    [projects]
  );

  const items = useMemo(
    () => tasks.map(t => ({
      id: t.id,
      group: t.project,
      content: t.name,
      start: t.start_date,
      end: t.end_date,
    })),
    [tasks]
  );

  return (
    <main style={{ padding: 24 }}>
      <h2>Distribute</h2>
      <GanttChart items={items} groups={groups} />
    </main>
  );
};

export default DistributePage;

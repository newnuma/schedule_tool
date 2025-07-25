import React, { useMemo } from "react";
import { Typography } from "@mui/material";
import { Main } from "../components/StyledComponents";
import { useAppContext } from "../context/AppContext";
import GanttChart from "../components/GanttChart";
import ErrorBoundary from "../components/ErrorBoundary";

const DistributePage: React.FC = () => {
  const { projects, tasks } = useAppContext();

  // 例: projects, tasksからガント表示用データを組み立て
  const groups = useMemo(
    () => (projects ?? []).map((p) => ({ id: p.id, content: p.name })),
    [projects],
  );

  const items = useMemo(
    () =>
      (tasks ?? []).map((t) => ({
        id: t.id,
        group: t.project,
        content: t.name,
        start: t.start_date,
        end: t.end_date,
      })),
    [tasks],
  );

  return (
    <Main component="main">
      <Typography variant="h4" gutterBottom>
        Distribute
      </Typography>
      <ErrorBoundary>
        <GanttChart items={items} groups={groups} />
      </ErrorBoundary>
    </Main>
  );
};

export default DistributePage;

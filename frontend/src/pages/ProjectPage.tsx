import React, { useMemo } from "react";
import { Typography } from "@mui/material";
import { Main } from "../components/StyledComponents";
import { useAppContext } from "../context/AppContext";
import GanttChart from "../components/GanttChart";
import ErrorBoundary from "../components/ErrorBoundary";

const ProjectPage: React.FC = () => {
  const { phases, assets } = useAppContext();

  // 例: projects, tasksからガント表示用データを組み立て
  const groups = useMemo(
    () => (phases ?? []).map((p) => ({ id: p.id, content: p.name })),
    [phases],
  );

  const items = useMemo(
    () =>
      (assets?? []).map((a) => ({
        id: a.id,
        group: a.phase.id,
        content: a.name,
        start: a.start_date,
        end: a .end_date,
      })),
    [phases],
  );

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

export default ProjectPage;

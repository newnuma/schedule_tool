import React, { useMemo } from "react";
import { Typography } from "@mui/material";
import { Main } from "../components/StyledComponents";
import { useAppContext } from "../context/AppContext";
import GanttChart from "../components/GanttChart";
import ErrorBoundary from "../components/ErrorBoundary";

const DistributePage: React.FC = () => {
  const { subprojects, phases } = useAppContext();
  console.log("phases", phases);

  // 例: projects, tasksからガント表示用データを組み立て
  const groups = useMemo(
    () => (subprojects ?? []).map((p) => ({ id: p.id, content: p.name })),
    [subprojects],
  );

  const items = useMemo(
    () =>
      (phases?? []).map((t) => ({
        id: t.id,
        group: t.subproject,
        content: t.name,
        start: t.start_date,
        end: t.end_date,
      })),
    [phases],
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

import React, { useMemo } from "react";
import { Typography } from "@mui/material";
import { useAppContext } from "../../context/AppContext";
import GanttChart from "../../components/GanttChart";

const TaskTab: React.FC = () => {
  const { assets, tasks, selectedSubprojectId, phases } = useAppContext();

  // 選択されたSubprojectに関連するPhaseのみをフィルタ
  const filteredPhases = useMemo(
    () => phases.filter((phase) => phase.subproject.id === selectedSubprojectId),
    [phases, selectedSubprojectId]
  );

  // 選択されたSubprojectに関連するAssetのみをフィルタ
  const filteredAssets = useMemo(
    () => {
      const phaseIds = filteredPhases.map(p => p.id);
      return assets.filter((asset) => phaseIds.includes(asset.phase.id));
    },
    [assets, filteredPhases]
  );

  // 選択されたSubprojectに関連するTaskのみをフィルタ
  const filteredTasks = useMemo(
    () => {
      const assetIds = filteredAssets.map(a => a.id);
      return tasks.filter((task) => assetIds.includes(task.asset.id));
    },
    [tasks, filteredAssets]
  );

  // ガント表示用データの組み立て
  const groups = useMemo(
    () => filteredAssets.map((a) => ({ id: a.id, content: a.name })),
    [filteredAssets]
  );

  const items = useMemo(
    () =>
      filteredTasks.map((t) => ({
        id: t.id,
        group: t.asset.id,
        content: t.name,
        start: t.start_date,
        end: t.end_date,
        className: t.status === 'Completed' ? 'completed' : 
                  t.status === 'In Progress' ? 'in-progress' : 'not-started'
      })),
    [filteredTasks]
  );

  if (!selectedSubprojectId) {
    return (
      <Typography variant="body1" color="text.secondary">
        Please select a subproject to view tasks
      </Typography>
    );
  }

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Tasks ({filteredTasks.length})
      </Typography>
      {filteredTasks.length > 0 ? (
        <GanttChart items={items} groups={groups} />
      ) : (
        <Typography variant="body2" color="text.secondary">
          No tasks found for this subproject
        </Typography>
      )}
    </div>
  );
};

export default TaskTab;

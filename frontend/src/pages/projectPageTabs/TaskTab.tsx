import React, { useMemo } from "react";
import { Typography, Box } from "@mui/material";
import { useAppContext } from "../../context/AppContext";
import { useFilterContext } from "../../context/FilterContext";
import GanttChart from "../../components/GanttChart";
import { CheckboxFilter, DateRangeFilter, CollapsibleFilterPanel } from "../../components/filters";

const TaskTab: React.FC = () => {
  const { assets, tasks, selectedSubprojectId, phases } = useAppContext();
  const { getFilteredData, filters } = useFilterContext();

  // 選択されたSubprojectに関連するPhaseのみをフィルタ
  const filteredPhases = useMemo(
    () => phases.filter((phase) => phase.subproject.id === selectedSubprojectId),
    [phases, selectedSubprojectId]
  );

  // 選択されたSubprojectに関連するAssetのみをフィルタ（基本フィルタリング）
  const basicFilteredAssets = useMemo(
    () => {
      const phaseIds = filteredPhases.map(p => p.id);
      return assets.filter((asset) => phaseIds.includes(asset.phase.id));
    },
    [assets, filteredPhases]
  );

  // 汎用フィルター適用（Assetに対して）
  const filteredAssets = getFilteredData("project.tasks", basicFilteredAssets);

  // フィルター済みAssetに属するTaskのみを抽出
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
      filteredTasks
        .map((t) => ({
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

  // Filter component
  const Filter: React.FC = () => (
    <CollapsibleFilterPanel
      pageKey="project.tasks"
      defaultExpanded={false}
    >
      <CheckboxFilter
        pageKey="project.tasks"
        data={basicFilteredAssets}
        property="type"
        label="Asset Type"
      />
      <DateRangeFilter
        pageKey="project.tasks"
        label="Asset Date Range"
        startProperty="start_date"
        endProperty="end_date"
      />
    </CollapsibleFilterPanel>
  );

  return (
    <div>
      {/* Title and Filter */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ margin: 0, flex: 1 }}>
          Tasks ({filteredTasks.length} / {basicFilteredAssets.reduce((total, asset) => {
            const assetTaskCount = tasks.filter(task => task.asset.id === asset.id).length;
            return total + assetTaskCount;
          }, 0)})
        </Typography>

        {/* Filter Panel (positioned at top right) */}
        <Box sx={{ position: 'relative' }}>
          <Filter />
        </Box>
      </Box>

      {/* Gantt Chart Container */}
      <Box sx={{ width: '100%', height: '600px' }}>
        {filteredTasks.length > 0 ? (
          <GanttChart items={items} groups={groups} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No tasks match the current filters
          </Typography>
        )}
      </Box>
    </div>
  );
};

export default TaskTab;

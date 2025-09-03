import React, { useMemo } from "react";
import { Typography, Box } from "@mui/material";
import { Assignment as AssignmentIcon, Task as TaskIcon } from "@mui/icons-material";
import { useAppContext } from "../../context/AppContext";
import { useFilterContext } from "../../context/FilterContext";
import { useFormContext } from "../../context/FormContext";
import GanttChart from "../../components/GanttChart";
import { CheckboxFilter, DateRangeFilter, CollapsibleFilterPanel } from "../../components/filters";
import AddButton, { AddButtonItem } from "../../components/common/AddButton";
import ContextMenu from "../../components/common/ContextMenu";
import { useContextMenu } from "../../hooks/useContextMenu";

const TaskTab: React.FC = () => {
  const { assets, tasks, selectedSubprojectId, phases, isEditMode } = useAppContext();
  const { getFilteredData, filters } = useFilterContext();
  // Split pageKeys by target: items vs groups
  const itemsPageKey = "project.tasks:items";   // date range etc. for items
  const groupsPageKey = "project.tasks:groups"; // group-level filter (asset type)
  const { openCreateForm } = useFormContext();
  const {
    contextMenu,
    handleContextMenu: originalHandleContextMenu,
    handleClose,
    handleDetail,
    handleEdit,
    handleCopy,
    handleDelete,
  } = useContextMenu();

  // GanttChartの期待する型に合わせてhandlerを変換
  const handleGanttRightClick = (itemId: number | string, itemName: string, event: MouseEvent) => {
    const syntheticEvent = {
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
      currentTarget: event.target as HTMLElement,
    } as React.MouseEvent<HTMLElement>;
    
    originalHandleContextMenu(syntheticEvent, Number(itemId), itemName, 'task');
  };

  // Add menu handlers
  const handleAddAsset = () => {
    openCreateForm('asset');
  };

  const handleAddTask = () => {
    openCreateForm('task');
  };

  // Add button items configuration
  const addItems: AddButtonItem[] = [
    { 
      label: 'Asset', 
      icon: <AssignmentIcon fontSize="small" />, 
      action: handleAddAsset 
    },
    { 
      label: 'Task', 
      icon: <TaskIcon fontSize="small" />, 
      action: handleAddTask 
    }
  ];

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

  // Apply group filters (asset type, etc.) to decide visible groups
  const assetsForGroups = useMemo(
    () => getFilteredData(groupsPageKey, basicFilteredAssets),
    [basicFilteredAssets, getFilteredData]
  );

  // Base tasks within the selected subproject (by basicFilteredAssets)
  const baseTasksForSubproject = useMemo(
    () => {
      const assetIds = new Set(basicFilteredAssets.map(a => a.id));
      return tasks.filter(t => assetIds.has(t.asset.id));
    },
    [tasks, basicFilteredAssets]
  );

  // Apply item filters (date range etc.) to tasks
  const tasksForItems = useMemo(
    () => getFilteredData(itemsPageKey, baseTasksForSubproject),
    [baseTasksForSubproject, getFilteredData]
  );

  // items側フィルタ結果をそのまま採用（グループとは独立）
  const filteredTasks = useMemo(
    () => tasksForItems,
    [tasksForItems]
  );

  // groups側フィルタ結果をそのまま採用（タスクが無いアセットもグループ表示）
  const filteredAssets = useMemo(
    () => assetsForGroups,
    [assetsForGroups]
  );

  // ガント表示用データの組み立て
  const groups = useMemo(
    () => filteredAssets.map((a) => ({ id: a.id, content: a.name })),
    [filteredAssets]
  );

  const items = useMemo(
    () => {
      // 親Assetの期間を背景として表示するアイテム（groupごと）
      const backgroundItems = filteredAssets
        .filter(a => a.start_date && a.end_date)
        .map(a => ({
          id: `asset-bg-${a.id}`,
          group: a.id,
          content: "", // 背景なのでテキストは表示しない
          start: a.start_date,
          end: a.end_date,
          type: 'background' as const,
          className: 'asset-background',
          tooltipHtml: `<div><strong>Asset:</strong> ${a.name}<br/><strong>Start:</strong> ${a.start_date}<br/><strong>End:</strong> ${a.end_date}</div>`
        }));

      // タスクアイテム
      const taskItems = filteredTasks.map((t) => ({
        id: t.id,
        group: t.asset.id,
        content: t.name,
        start: t.start_date,
        end: t.end_date,
        className: t.status === 'Completed' ? 'completed' :
          t.status === 'In Progress' ? 'in-progress' : 'not-started',
        tooltipHtml: `<div><strong>Task:</strong> ${t.name}<br/><strong>Status:</strong> ${t.status}<br/><strong>Asset:</strong> ${t.asset.name}<br/><strong>Start:</strong> ${t.start_date}<br/><strong>End:</strong> ${t.end_date}</div>`
      }));

      return [...backgroundItems, ...taskItems];
    },
    [filteredAssets, filteredTasks]
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
      pageKey={groupsPageKey}
      defaultExpanded={false}
    >
      <CheckboxFilter
        pageKey={groupsPageKey}
        data={basicFilteredAssets}
        property="type"
        label="Asset Type (Groups)"
      />
      <DateRangeFilter
        pageKey={groupsPageKey}
        label="Asset Date Range (Groups)"
        startProperty="start_date"
        endProperty="end_date"
      />
    </CollapsibleFilterPanel>
  );

  return (
    <div>
      {/* Title and Controls */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 2 }}>
        <AddButton items={addItems} disabled={!isEditMode} />
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
          <GanttChart 
            items={items} 
            groups={groups} 
            onItemRightClick={handleGanttRightClick}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No tasks match the current filters
          </Typography>
        )}
      </Box>
      
      {/* Context Menu */}
      <ContextMenu
        anchorEl={contextMenu.anchorEl}
        open={contextMenu.open}
        onClose={handleClose}
        onDetail={handleDetail}
        onEdit={handleEdit}
        onCopy={handleCopy}
        onDelete={handleDelete}
        itemName={contextMenu.itemName}
      />
    </div>
  );
};

export default TaskTab;

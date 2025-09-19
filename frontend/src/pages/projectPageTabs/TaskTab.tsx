import React, { useMemo } from "react";
import { Typography, Box } from "@mui/material";
import { Assignment as AssignmentIcon, Task as TaskIcon } from "@mui/icons-material";
import { useFilterContext } from "../../context/FilterContext";
import { useFormContext } from "../../context/FormContext";
import GanttChart from "../../components/GanttChart";
import {getTooltipHtml}from "../../components/GanttChart/GanttChart";
import { CheckboxFilter, DateRangeFilter, CollapsibleFilterPanel } from "../../components/filters";
import AddButton, { AddButtonItem } from "../../components/common/AddButton";
import ContextMenu, { ContextMenuItem } from "../../components/common/ContextMenu";
import {useEntityCrud} from "../../hooks/useEntityCrud"
import { openFlowPtUrl } from "../../api/bridgeApi";

// 型定義
import type { IPhase, IAsset, ITask, IPerson } from "../../context/AppContext";

interface TaskTabProps {
  phases: IPhase[];
  assets: IAsset[];
  tasks: ITask[];
  people: IPerson[];
  isEditMode: boolean;
  selectedSubprojectId: number;
}

const TaskTab: React.FC<TaskTabProps> = ({ phases, assets, tasks, people, isEditMode, selectedSubprojectId }) => {
  // CollapsibleFilterPanel展開状態管理
  const [filterPanelExpanded, setFilterPanelExpanded] = React.useState(false);
  const { getFilteredData, filters } = useFilterContext();
  // Split pageKeys by target: items vs groups
  const itemsPageKey = "project.tasks:items";   // date range etc. for items
  const groupsPageKey = "project.tasks:groups"; // group-level filter (asset type)
  const { openForm } = useFormContext();
  const { handleDeleteAsset, handleDeleteTask } = useEntityCrud(); 

  // 初期表示範囲（１週前～1か月後）
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const end = new Date();
  end.setMonth(end.getMonth() + 1);

  // ContextMenuの状態管理
  // ContextMenuの状態管理（Task用は従来通り、Asset用は別管理）
  const [menuState, setMenuState] = React.useState<{
    anchorEl: HTMLElement | null;
    open: boolean;
    itemName?: string;
    task?: ITask;
  }>({ anchorEl: null, open: false });

  // Asset用ContextMenuの状態管理
  const [assetMenuState, setAssetMenuState] = React.useState<{
    anchorEl: HTMLElement | null;
    open: boolean;
    itemName?: string;
    asset?: IAsset;
  }>({ anchorEl: null, open: false });


  // タスクアイテム右クリック
  const [pendingMenu, setPendingMenu] = React.useState<{
    anchorEl: HTMLElement | null;
    open: boolean;
    itemName?: string;
    itemId?: number | string;
    menuType?: 'task' | 'asset';
  } | null>(null);

  // タスクアイテム右クリック
  const handleGanttRightClick = (
    itemId: number | string,
    itemName: string,
    event: MouseEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setPendingMenu({
      anchorEl: event.target as HTMLElement,
      open: true,
      itemName,
      itemId,
      menuType: 'task',
    });
  };

  // グループ（Asset）右クリック
  // GanttChartのonGroupRightClick: (groupId, group, event)
  const handleGanttGroupRightClick = (
    groupId: number | string,
    group: { id: number | string; content: string },
    event: MouseEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setPendingMenu({
      anchorEl: event.target as HTMLElement,
      open: true,
      itemName: group.content,
      itemId: groupId,
      menuType: 'asset',
    });
  };

  // tasks/assetsが更新された時、pendingMenuがあれば最新のtask/assetでmenuStateを更新
  React.useEffect(() => {
    if (pendingMenu && pendingMenu.itemId !== undefined) {
      if (pendingMenu.menuType === 'task') {
        const taskObj = tasks.find(t => t.id === Number(pendingMenu.itemId));
        setMenuState({
          anchorEl: pendingMenu.anchorEl,
          open: pendingMenu.open,
          itemName: pendingMenu.itemName,
          task: taskObj,
        });
      } else if (pendingMenu.menuType === 'asset') {
        const assetObj = assets.find(a => a.id === Number(pendingMenu.itemId));
        setAssetMenuState({
          anchorEl: pendingMenu.anchorEl,
          open: pendingMenu.open,
          itemName: pendingMenu.itemName,
          asset: assetObj,
        });
      }
      setPendingMenu(null);
    }
  }, [tasks, assets, pendingMenu]);

  const handleMenuClose = () => {
    setMenuState({ anchorEl: null, open: false });
  };
  const handleAssetMenuClose = () => {
    setAssetMenuState({ anchorEl: null, open: false });
  };

  // タスク用メニュー（従来通り）
  const taskContextMenuItems: ContextMenuItem[] = [
    {
      label: "Jump to Flow-PT",
      action: () => {},
    },
    {
      label: "Edit",
      action: () => {
        if (menuState.task) {
          openForm({
            type: 'task',
            mode: 'edit',
            initialValues: menuState.task,
            candidates: {
              assets: assets,
              people: people,
            },
          });
        }
      },
      disable: !isEditMode,
    },
    {
      label: "Copy",
      action: () => {
        if (menuState.task) {
          openForm({
            type: 'task',
            mode: 'copy',
            initialValues: menuState.task,
            candidates: {
              assets: assets,
              people: people,
            },
          });
        }
      },
      disable: !isEditMode,
    },
    {
      dividerBefore: true,
      label: "Delete",
      action: () => {handleDeleteTask(menuState.task as ITask)},
      disable: !isEditMode,
      color: "error.main",
    },
  ];

  // Asset用メニュー（AssetTabのassetContextMenuItemsと同等）
  const assetContextMenuItems: ContextMenuItem[] = [
    {
      label: "Jump to Flow-PT",
      action: () => {
        openFlowPtUrl(selectedSubprojectId);
      },
    },
    {
      label: "Edit",
      action: () => {
        if (assetMenuState.asset) {
          openForm({
            type: 'asset',
            mode: 'edit',
            initialValues: assetMenuState.asset,
            candidates: {
              phases: phases,
            },
          });
        }
      },
      disable: !isEditMode,
    },
    {
      label: "Copy",
      action: () => {
        if (assetMenuState.asset) {
          const { id, ...copyData } = assetMenuState.asset;
          openForm({
            type: 'asset',
            mode: 'copy',
            initialValues: copyData,
            candidates: {
              phases: phases,
            },
          });
        }
      },
      disable: !isEditMode,
    },
    {
      dividerBefore: true,
      label: "Delete",
      action: () => {handleDeleteAsset(assetMenuState.asset as IAsset)},
      disable: !isEditMode,
      color: "error.main",
    },
  ];

  // ...existing code...

  // Add menu handlers
  const handleAddAsset = () => {
    openForm({
      type: 'asset',
      mode: 'create',
      initialValues: {},
      candidates: {
        phases: phases,
      },
    });
  };

  const handleAddTask = () => {
    openForm({
      type: 'task',
      mode: 'create',
      initialValues: {},
      candidates: {
        assets: assets,
        people: people,
      },
    });
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

  // ProjectPageからpropsで受け取ったデータをそのまま使う
  const filteredPhases = phases;
  const basicFilteredAssets = assets;
  const baseTasksForSubproject = tasks;
  // Apply group filters (asset type, etc.) to decide visible groups
  const assetsForGroups = useMemo(
    () => getFilteredData(groupsPageKey, basicFilteredAssets),
    [basicFilteredAssets, getFilteredData]
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
        }));

      // タスクアイテム
      const statusLabel = (s: string) => s === 'fin' ? 'Completed' : s === 'ip' ? 'In Progress' : 'Not Started';
      const taskItems = filteredTasks.map((t) => {
        const tooltipItem:[string, any][]  = [
          ["Name", t.name],
          ["Start", t.start_date],
          ["End", t.end_date],
          ["Assignees", t.assignees && t.assignees.length > 0 ? t.assignees.map(a => a.name).join(", ") : "Unassigned"],
        ];
        // assigneesが空ならno-assigneeクラスを追加
        const noAssignee = !t.assignees || t.assignees.length === 0;
        return{
          id: t.id,
          group: t.asset.id,
          content: t.name,
          start: t.start_date,
          end: t.end_date,
          className: [
            t.status === 'fin' ? 'status-fin' :
            t.status === 'ip' ? 'status-ip' : 'status-wtg',
            noAssignee ? 'no-assignee' : ''
          ].filter(Boolean).join(' '),
          tooltipHtml: getTooltipHtml(tooltipItem)
        };
      });
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
      expanded={filterPanelExpanded}
      onChange={setFilterPanelExpanded}
    >
      <CheckboxFilter
        pageKey={groupsPageKey}
        data={basicFilteredAssets}
        property="asset_type"
        label="Asset Type (Groups)"
      />
      <CheckboxFilter
        pageKey={groupsPageKey}
        data={basicFilteredAssets}
        property="work_category.name"
        label="work_category.name (Groups)"
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
      <Box sx={{ width: '100%', height: 'calc(100vh - 180px)' }}>
        {filteredTasks.length > 0 ? (
          <GanttChart 
            items={items} 
            groups={groups} 
            onItemRightClick={handleGanttRightClick}
            onGroupRightClick={handleGanttGroupRightClick}
            height='calc(100vh - 200px)'
            start={start}
            end={end}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No tasks match the current filters
          </Typography>
        )}
      </Box>
      
      {/* Context Menu (Task用) */}
      <ContextMenu
        anchorEl={menuState.anchorEl}
        open={menuState.open}
        onClose={handleMenuClose}
        items={taskContextMenuItems}
        header={menuState.itemName}
      />
      {/* Context Menu (Asset用) */}
      <ContextMenu
        anchorEl={assetMenuState.anchorEl}
        open={assetMenuState.open}
        onClose={handleAssetMenuClose}
        items={assetContextMenuItems}
        header={assetMenuState.itemName}
      />
    </div>
  );
};

export default TaskTab;

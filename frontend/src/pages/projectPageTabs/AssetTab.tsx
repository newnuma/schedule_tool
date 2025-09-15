import React, { useMemo } from "react";
import { Typography, Box } from "@mui/material";
import { Folder as FolderIcon, Assignment as AssignmentIcon } from "@mui/icons-material";
import { useFilterContext } from "../../context/FilterContext";
import { useFormContext, FormType, FormMode } from "../../context/FormContext";
import GanttChart from "../../components/GanttChart";
import {getTooltipHtml}from "../../components/GanttChart/GanttChart";
import { DropdownFilter, CheckboxFilter, DateRangeFilter, CollapsibleFilterPanel } from "../../components/filters";
import AddButton, { AddButtonItem } from "../../components/common/AddButton";
import ContextMenu, { ContextMenuItem } from "../../components/common/ContextMenu";
import { useAppContext } from "../../context/AppContext";
import { useDialogContext } from "../../context/DialogContext";
import { deleteEntity } from "../../api/bridgeApi";
import {useEntityCrud} from "../../hooks/useEntityCrud"

// 型定義
import type { IPhase, IAsset, IMilestoneTask } from "../../context/AppContext";

interface AssetTabProps {
  phases: IPhase[];
  assets: IAsset[];
  milestoneTasks: IMilestoneTask[];
  isEditMode: boolean;
  selectedSubprojectId: number;
}

const AssetTab: React.FC<AssetTabProps> = ({ phases, assets, milestoneTasks, isEditMode, selectedSubprojectId }) => {
  // CollapsibleFilterPanel展開状態管理
  const [filterPanelExpanded, setFilterPanelExpanded] = React.useState(false);
  const { getFilteredData } = useFilterContext();
  // Split pageKeys by target: items vs groups
  const itemsPageKey = "project.assets:items";   // date range + status for items
  const groupsPageKey = "project.assets:groups"; // type for groups
  const { openForm } = useFormContext();
  const { handleDeleteAsset } = useEntityCrud(); 
  const { openDialog } = useDialogContext();

    // 初期表示範囲（2週前～3か月後）
  const start = new Date();
  start.setDate(start.getDate() - 14);
  const end = new Date();
  end.setMonth(end.getMonth() + 2);

  // ContextMenuの状態管理
  const [menuState, setMenuState] = React.useState<{
    anchorEl: HTMLElement | null;
    open: boolean;
    itemName?: string;
    asset?: IAsset;
    phase?: IPhase;
    milestoneTask?: IMilestoneTask;
    itemType?: 'asset' | 'phase' | 'milestone';
  }>({ anchorEl: null, open: false });

  // 右クリック時のハンドラ
  const handleGanttRightClick = (
    itemId: number | string,
    itemName: string,
    event: MouseEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();
    // idのprefixで種別判定
    let itemType: 'asset' | 'phase' | 'milestone' = 'asset';
    let assetObj: IAsset | undefined = undefined;
    let phaseObj: IPhase | undefined = undefined;
    let milestoneTaskObj: IMilestoneTask | undefined = undefined;
    if (typeof itemId === 'string' && itemId.startsWith('phase-')) {
      itemType = 'phase';
      const phaseId = Number(itemId.replace('phase-', ''));
      phaseObj = phases.find(p => p.id === phaseId);
    } else if (typeof itemId === 'string' && itemId.startsWith('ms-')) {
      itemType = 'milestone';
      const msId = Number(itemId.replace('ms-', ''));
      milestoneTaskObj = milestoneTasks.find(ms => ms.id === msId);
    } else {
      // Asset: idが数値 or 数値文字列
      assetObj = assets.find(a => a.id === Number(itemId));
    }
    setMenuState({
      anchorEl: event.target as HTMLElement,
      open: true,
      itemName,
      asset: assetObj,
      phase: phaseObj,
      milestoneTask: milestoneTaskObj,
      itemType,
    });
  };

  const handleMenuClose = () => {
    setMenuState({ anchorEl: null, open: false });
  };

  // メニュー項目定義（新しいForm形式で起動）
  // Asset用
  const assetContextMenuItems: ContextMenuItem[] = [
    {
      label: "Jump to Flow-PT",
      action: () => {
        // asset情報を利用
        console.log("Jump to Flow-PT", menuState.asset);
      },
    },
    {
      label: "Edit",
      action: () => {
        if (menuState.asset) {
          openForm({
            type: 'asset',
            mode: 'edit',
            initialValues: menuState.asset,
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
        if (menuState.asset) {
          // idを除外して新規作成用初期値
          const { id, ...copyData } = menuState.asset;
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
      action: () => {handleDeleteAsset(menuState.asset as IAsset)},
      disable: !isEditMode,
      color: "error.main",
    },
  ];

  // Phase用
  const phaseContextMenuItems: ContextMenuItem[] = [
    {
      label: "Edit Phase",
      action: () => {
        if (menuState.phase) {
          openForm({
            type: 'phase',
            mode: 'edit',
            initialValues: menuState.phase,
          });
        }
      },
      disable: !isEditMode,
    },
    {
      label: "Copy Phase",
      action: () => {
        if (menuState.phase) {
          const { id, ...copyData } = menuState.phase;
          openForm({
            type: 'phase',
            mode: 'copy',
            initialValues: copyData,
          });
        }
      },
      disable: !isEditMode,
    },
    // 必要に応じて他のPhase用メニューを追加
  ];

  // MilestoneTask用
  const milestoneContextMenuItems: ContextMenuItem[] = [
    {
      label: "Edit Milestone",
      action: () => {
        if (menuState.milestoneTask) {
          openForm({
            type: 'milestonetask',
            mode: 'edit',
            initialValues: menuState.milestoneTask,
          });
        }
      },
      disable: !isEditMode,
    },
    // 必要に応じて他のMilestone用メニューを追加
  ];


  // Add menu handlers（新しいForm形式）
  const handleAddPhase = () => {
    openForm({
      type: 'phase',
      mode: 'create',
      initialValues: {},
    });
  };

  const handleAddAsset = () => {
    openForm({
      type: 'asset',
      mode: 'create',
      initialValues: {},
      candidates: {
        phases: phases,
        // 他に必要な候補リストがあれば追加
      },
    });
  };

  // Add button items configuration
  const addItems: AddButtonItem[] = [
    { 
      label: 'Phase', 
      icon: <FolderIcon fontSize="small" />, 
      action: handleAddPhase 
    },
    { 
      label: 'Asset', 
      icon: <AssignmentIcon fontSize="small" />, 
      action: handleAddAsset 
    }
  ];

  // ProjectPageからpropsで受け取ったデータをそのまま使う
  const filteredPhases = phases;
  const basicFilteredAssets = assets;

  // Apply group filters to determine visible type groups
  const assetsForGroups = useMemo(
    () => getFilteredData(groupsPageKey, basicFilteredAssets),
    [basicFilteredAssets, getFilteredData]
  );
  const allowedTypes = useMemo(
    () => new Set(assetsForGroups.map(a => a.asset_type)),
    [assetsForGroups]
  );

  // Apply item filters (date range, status), then intersect with allowed groups
  const assetsForItems = useMemo(
    () => getFilteredData(itemsPageKey, basicFilteredAssets),
    [basicFilteredAssets, getFilteredData]
  );
  const filteredAssets = useMemo(
    () => assetsForItems.filter(a => allowedTypes.has(a.asset_type)),
    [assetsForItems, allowedTypes]
  );

  // ガント表示用データの組み立て
  const groups = useMemo(
    () => {
      // 最初にPhaseグループを追加（固定）
      const phaseGroup = { id: 'phase-group', content: 'Phase', className: 'phase-row' };
      // Groups are asset types that passed the group filter
      const typeSet = new Set(assetsForGroups.map(a => a.asset_type));
      // Ensure subgroup ordering (milestones above bars) and stacking are controlled at group level
      const typeGroups = Array.from(typeSet).map(t => ({
        id: t,
        content: t,
        // Use the item's "subgroupOrder" field to order subgroups within this group
        subgroupOrder: 'subgroupOrder',
        // Control stacking per subgroup: milestones (mile) don't stack; asset bars do
        subgroupStack: { mile: false, asset: true, milestone: false },
      }));
      return [phaseGroup, ...typeGroups];
    },
    [assetsForGroups]
  );

  const items = useMemo(
    () => {
      // Phaseアイテム（マイルストーン形式）
      const phaseItems = filteredPhases
        .map((phase) => {
          const tooltipItem:[string, any][]  = [
              ["Name", phase.name],
              ["Start", phase.start_date],
              ["End", phase.end_date],
          ];
          return {
            id: `phase-${phase.id}`,
            group: 'phase-group',
            content: phase.name,
            start: phase.end_date, // マイルストーンは終了日に表示
            end: phase.end_date,   // start === end でマイルストーンになる
            type: 'point' as const,  // マイルストーンタイプ
            className: 'milestone',
            tooltipHtml: getTooltipHtml(tooltipItem),
          };
        });

      // Assetアイテム
      const assetItems = filteredAssets
        .map((a) => {
          let style;
          if (a.color) {
            // a.color: "r, g, b" → rgba形式で透明度付与
            const rgb = a.color.split(',').map(s => s.trim()).join(',');
            style = `background: rgba(${rgb}, 0.35); border: 1px solid rgba(${rgb}, 0.85);`;
          }
          const tooltipItem:[string, any][]  = [
              ["Name", a.name],
              ["Phase", a.phase?.name],
              ["Work Category", a.work_category?.name],
              ["Start", a.start_date],
              ["End", a.end_date],
          ];
          return {
            id: a.id,
            group: a.asset_type,
            subgroup: "asset",
            subgroupOrder: 1,
            content: a.name,
            start: a.start_date,
            end: a.end_date,
            tooltipHtml: getTooltipHtml(tooltipItem),
            style,
          };
        });

      // 選択中Subprojectに紐づく MilestoneTasks（親のAsset.typeは asset_type に格納済み）
      const phaseIds = filteredPhases.map(p => p.id);
      const assetById = new Map(assets.map(a => [a.id, a]));
      const msItems = milestoneTasks
        .filter(ms => {
          const parentAsset = assetById.get(ms.asset.id);
          if (!parentAsset) return false;
          return phaseIds.includes(parentAsset.phase.id);
        })
        .map(ms => {
          // group は親Assetの type（asset_type から）
          const groupId = ms.asset_type || assetById.get(ms.asset.id)?.asset_type || 'Common';
          // サブグループは親Assetごとに分け、MS はバーの上側に来るよう別サブグループを用意
          const subGroup = "milestone";
          const typeClass = ms.milestone_type === 'Date Receive' ? 'ms-receive'
            : ms.milestone_type === 'Date Release' ? 'ms-release'
            : ms.milestone_type === 'Review' ? 'ms-review'
            : 'ms-dr';
          const parentName = assetById.get(ms.asset.id)?.name || '';
          const tooltipItem:[string, any][]  = [
              ["Name", ms.name],
              ["Start", ms.start_date],
              ["End", ms.end_date],
          ];
          return {
            id: `ms-${ms.id}`,
            group: groupId,
            subgroup: subGroup,
            subgroupOrder: 0,
            content: '', // 表示名は不要
            start: ms.start_date,
            type: 'point' as const,
            className: `milestone ${typeClass}`,
            tooltipHtml: getTooltipHtml(tooltipItem),
          };
        });

      return [...phaseItems, ...assetItems, ...msItems];
    },
    [filteredPhases, filteredAssets, milestoneTasks, assets]
  );

  if (!selectedSubprojectId) {
    return (
      <Typography variant="body1" color="text.secondary">
        Please select a subproject to view assets
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
      <DropdownFilter
        pageKey={groupsPageKey}
        data={basicFilteredAssets}
        property="type"
        label="Type (Groups)"
      />
      <CheckboxFilter
        pageKey={itemsPageKey}
        data={basicFilteredAssets}
        property="status"
        label="Status (Items)"
      />
      <DateRangeFilter
        pageKey={itemsPageKey}
        label="Date Range (Items)"
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
          Assets ({filteredAssets.length} / {basicFilteredAssets.length})
        </Typography>
        
        {/* Filter Panel (positioned at the right end of title row) */}
        <Box sx={{ position: 'relative' }}>
          <Filter />
        </Box>
      </Box>
      
      {/* Gantt Chart Container */}
      <Box sx={{ width: '100%', height: 'calc(100vh - 200px)' }}>
        {filteredAssets.length > 0 ? (
          <GanttChart 
            items={items} 
            groups={groups} 
            onItemRightClick={handleGanttRightClick}
            height='calc(100vh - 200px)'
            start={start}
            end={end}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No assets match the current filters
          </Typography>
        )}
      </Box>
      
      {/* Context Menu */}
      <ContextMenu
        anchorEl={menuState.anchorEl}
        open={menuState.open}
        onClose={handleMenuClose}
        items={
          menuState.itemType === 'phase'
            ? phaseContextMenuItems
            : menuState.itemType === 'milestone'
              ? milestoneContextMenuItems
              : assetContextMenuItems
        }
        header={menuState.itemName}
      />
    </div>
  );
};

export default AssetTab;

import React, { useMemo } from "react";
import { Typography, Box } from "@mui/material";
import { Folder as FolderIcon, Assignment as AssignmentIcon } from "@mui/icons-material";
import { useAppContext } from "../../context/AppContext";
import { useFilterContext } from "../../context/FilterContext";
import { useFormContext } from "../../context/FormContext";
import GanttChart from "../../components/GanttChart";
import { DropdownFilter, CheckboxFilter, DateRangeFilter, CollapsibleFilterPanel } from "../../components/filters";
import AddButton, { AddButtonItem } from "../../components/common/AddButton";
import ContextMenu from "../../components/common/ContextMenu";
import { useContextMenu } from "../../hooks/useContextMenu";

const AssetTab: React.FC = () => {
  const { phases, assets, selectedSubprojectId, isEditMode } = useAppContext();
  const { getFilteredData } = useFilterContext();
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
    
    originalHandleContextMenu(syntheticEvent, Number(itemId), itemName, 'asset');
  };

  // Add menu handlers
  const handleAddPhase = () => {
    openCreateForm('phase');
  };

  const handleAddAsset = () => {
    openCreateForm('asset');
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

  // 汎用フィルター適用
  const filteredAssets = getFilteredData("project.assets", basicFilteredAssets);

  // ガント表示用データの組み立て
  const groups = useMemo(
    () => {
      // 最初にPhaseグループを追加（固定）
  const phaseGroup = { id: 'phase-group', content: 'Phase', className: 'phase-row' };
      
      // Asset typeによるグループ
      const typeGroups = [
        { id: 'EXT', content: 'EXT' },
        { id: 'INT', content: 'INT' },
        { id: 'Common', content: 'Common' }
      ];
      
      return [phaseGroup, ...typeGroups];
    },
    []
  );

  const items = useMemo(
    () => {
      // Phaseアイテム（マイルストーン形式）
      const phaseItems = filteredPhases
        .map((phase) => ({
          id: `phase-${phase.id}`,
          group: 'phase-group',
          content: phase.name,
          start: phase.end_date, // マイルストーンは終了日に表示
          end: phase.end_date,   // start === end でマイルストーンになる
          type: 'point' as const,  // マイルストーンタイプ
          className: 'milestone',
          tooltipHtml: `<div><strong>Phase:</strong> ${phase.name}<br/><strong>End:</strong> ${phase.end_date}</div>`
        }));

      // Assetアイテム
      const assetItems = filteredAssets
        .map((a) => ({
          id: a.id,
          group: a.type, // Asset typeでグループ化
          content: a.name,
          start: a.start_date,
          end: a.end_date,
          className: a.status === 'Completed' ? 'completed' : 
                    a.status === 'In Progress' ? 'in-progress' : 'not-started',
          tooltipHtml: `<div><strong>Asset:</strong> ${a.name}<br/><strong>Type:</strong> ${a.type}<br/><strong>Status:</strong> ${a.status}<br/><strong>Start:</strong> ${a.start_date}<br/><strong>End:</strong> ${a.end_date}</div>`
        }));

      return [...phaseItems, ...assetItems];
    },
    [filteredPhases, filteredAssets]
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
      pageKey="project.assets" 
      defaultExpanded={false}
    >
      <DropdownFilter
        pageKey="project.assets"
        data={basicFilteredAssets}
        property="type"
        label="Type"
      />
      <CheckboxFilter
        pageKey="project.assets"
        data={basicFilteredAssets}
        property="status"
        label="Status"
      />
      <DateRangeFilter
        pageKey="project.assets"
        label="Date Range"
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
      <Box sx={{ width: '100%', height: '600px' }}>
        {filteredAssets.length > 0 ? (
          <GanttChart 
            items={items} 
            groups={groups} 
            onItemRightClick={handleGanttRightClick}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No assets match the current filters
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

export default AssetTab;

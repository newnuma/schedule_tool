import React, { useMemo } from "react";
import { Typography, Box } from "@mui/material";
import { useAppContext } from "../../context/AppContext";
import { useFilterContext } from "../../context/FilterContext";
import GanttChart from "../../components/GanttChart";
import { DropdownFilter, CheckboxFilter, DateRangeFilter, CollapsibleFilterPanel } from "../../components/filters";

const AssetTab: React.FC = () => {
  const { phases, assets, selectedSubprojectId } = useAppContext();
  const { getFilteredData } = useFilterContext();

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
      const phaseGroup = { id: 'phase-group', content: 'Phase' };
      
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
          className: 'milestone'
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
                    a.status === 'In Progress' ? 'in-progress' : 'not-started'
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
      {/* Title and Filter Panel */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 2 }}>
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
          <GanttChart items={items} groups={groups} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No assets match the current filters
          </Typography>
        )}
      </Box>
    </div>
  );
};

export default AssetTab;

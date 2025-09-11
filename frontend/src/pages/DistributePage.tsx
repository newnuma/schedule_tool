import React, { useMemo } from "react";
import { Typography, Box } from "@mui/material";
import { Main } from "../components/StyledComponents";
import { useAppContext } from "../context/AppContext";
import GanttChart from "../components/GanttChart";
import ErrorBoundary from "../components/ErrorBoundary";
import { useFilterContext } from "../context/FilterContext";
import { CollapsibleFilterPanel, CheckboxFilter, DateRangeFilter } from "../components/filters";
import StackSwitch from "../components/common/StackSwitch";

const DistributePage: React.FC = () => {
  // CollapsibleFilterPanel展開状態管理
  const [filterPanelExpanded, setFilterPanelExpanded] = React.useState(false);
  // Stack表示切替
  const [stacked, setStacked] = React.useState(true);
  const { subprojects, phases } = useAppContext();
  const { getFilteredData } = useFilterContext();

  // Split pageKeys by target: items vs groups
  const itemsPageKey = "distribute.phases:items";   // date range on phases (items)
  const groupsPageKey = "distribute.subprojects:groups"; // checkbox on subprojects (groups)

  // 基本データ拡張（フィルタ用にサブプロジェクト名を平坦化）
  const basePhases = useMemo(
    () => (phases ?? []).map(p => ({ ...p, subprojectName: p.subproject?.name ?? "" })),
    [phases]
  );

  // Apply group filter to subprojects directly
  const baseSubprojects = useMemo(
    () => (subprojects ?? []).map(sp => ({ ...sp })),
    [subprojects]
  );
  const filteredSubprojects = useMemo(
    () => getFilteredData(groupsPageKey, baseSubprojects),
    [baseSubprojects, getFilteredData]
  );
  const allowedSubprojectIds = useMemo(
    () => new Set(filteredSubprojects.map(sp => sp.id)),
    [filteredSubprojects]
  );

  // Apply items filter (date range) then intersect with allowed groups
  const phasesForItems = useMemo(
    () => getFilteredData(itemsPageKey, basePhases),
    [basePhases, getFilteredData]
  );
  const filteredPhases = useMemo(
    () => phasesForItems.filter(p => allowedSubprojectIds.has(p.subproject.id)),
    [phasesForItems, allowedSubprojectIds]
  );

  // グループはAppContextのSubprojects（グループフィルタ適用後）
    // グループはAppContextのSubprojects（グループフィルタ適用後）
    // AssetTabと同様にsubgroupOrder/subgroupStackを追加
  const groups = useMemo(() => {
    return filteredSubprojects.map(sp => ({
      id: sp.id,
      content: sp.name,
      subgroupOrder: 'subgroupOrder',
      subgroupStack: stacked ? { milestone: false, bar: true } : { milestone: false, bar: false },
    }));
  }, [filteredSubprojects, stacked]);

  // アイテム（milestoneとバーで分割）
  const items = useMemo(() => {
    const milestoneItems = filteredPhases
      .filter(p => p.milestone)
      .map(p => ({
        id: `ms-${p.id}`,
        group: p.subproject.id,
        subgroup: "milestone",
        subgroupOrder: 0,
        content: p.name,
        start: p.start_date,
        end: p.start_date,
        type: "point" as const,
        className: p.phase_type ? `phase-ms-${p.phase_type.toLowerCase()}` : 'phase-ms-default',
        tooltipHtml: `<div><strong>Phase:</strong> ${p.name}<br/><strong>Type:</strong> ${p.phase_type}<br/><strong>End:</strong> ${p.end_date}</div>`
      }));
    const barItems = filteredPhases
      .filter(p => !p.milestone)
      .map(p => ({
        id: p.id,
        group: p.subproject.id,
        subgroup: "bar",
        subgroupOrder: 1,
        content: p.name,
        start: p.start_date,
        end: p.end_date,
        type: "range" as const,
        className: p.phase_type ? `phase-bar-${p.phase_type.toLowerCase()}` : 'phase-bar-default',
        tooltipHtml: `<div><strong>Phase:</strong> ${p.name}<br/><strong>Type:</strong> ${p.phase_type}<br/><strong>Start:</strong> ${p.start_date}<br/><strong>End:</strong> ${p.end_date}</div>`
      }));
    return [...milestoneItems, ...barItems];
  }, [filteredPhases]);

  // フィルタコンポーネント
  const Filter: React.FC = () => (
    <CollapsibleFilterPanel
      pageKey={groupsPageKey}
      expanded={filterPanelExpanded}
      onChange={setFilterPanelExpanded}
    >
      <CheckboxFilter
        pageKey={groupsPageKey}
        data={baseSubprojects}
        property="name"
        label="Subproject"
      />
      <DateRangeFilter
        pageKey={itemsPageKey}
        label="Date Range"
        startProperty="start_date"
        endProperty="end_date"
      />
    </CollapsibleFilterPanel>
  );

  return (
    <Main component="main">
      {/* Title Row */}
      <Typography variant="h4" gutterBottom sx={{ mb: 1 }}>
        Distribute
      </Typography>
      {/* Counts + Filter Row */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
        </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
            <StackSwitch value={stacked} onChange={setStacked} label="Stack" labelPosition="top" />
          <Box sx={{ position: 'relative' }}>
            <Filter />
          </Box>
        </Box>
      </Box>
      <ErrorBoundary>
        <Box sx={{ width: '100%', height: 'calc(100vh - 200px)' }}>
          {filteredPhases.length > 0 ? (
            <GanttChart 
            items={items} 
            groups={groups} 
            options={{ stack: stacked }} 
            height='calc(100vh - 200px)'
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No phases match the current filters
            </Typography>
          )}
        </Box>
      </ErrorBoundary>
    </Main>
  );
};
export default DistributePage;

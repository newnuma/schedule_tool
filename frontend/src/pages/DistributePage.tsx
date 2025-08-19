import React, { useMemo } from "react";
import { Typography, Box } from "@mui/material";
import { Main } from "../components/StyledComponents";
import { useAppContext } from "../context/AppContext";
import GanttChart from "../components/GanttChart";
import ErrorBoundary from "../components/ErrorBoundary";
import { useFilterContext } from "../context/FilterContext";
import { CollapsibleFilterPanel, CheckboxFilter, DateRangeFilter } from "../components/filters";

const DistributePage: React.FC = () => {
  const { subprojects, phases } = useAppContext();
  const { getFilteredData } = useFilterContext();

  // 基本データ拡張（フィルタ用にサブプロジェクト名を平坦化）
  const basePhases = useMemo(
    () => (phases ?? []).map(p => ({ ...p, subprojectName: p.subproject?.name ?? "" })),
    [phases]
  );

  // フィルタ適用
  const filteredPhases = getFilteredData("distribute.phases", basePhases);

  // グループ（フィルタ後のPhaseが属するSubprojectのみ表示）
  const groups = useMemo(
    () => {
      const ids = new Set<number>();
      const list = [] as { id: number; content: string }[];
      filteredPhases.forEach(p => {
        if (!ids.has(p.subproject.id)) {
          ids.add(p.subproject.id);
          list.push({ id: p.subproject.id, content: p.subproject.name });
        }
      });
      return list;
    },
    [filteredPhases]
  );

  // アイテム
  const items = useMemo(
    () => filteredPhases.map(t => ({
      id: t.id,
      group: t.subproject.id,
      content: t.name,
      start: t.start_date,
      end: t.end_date,
      tooltipHtml: `<div><strong>Phase:</strong> ${t.name}<br/><strong>Subproject:</strong> ${t.subproject.name}<br/><strong>Start:</strong> ${t.start_date}<br/><strong>End:</strong> ${t.end_date}</div>`
    })),
    [filteredPhases]
  );

  // フィルタコンポーネント
  const Filter: React.FC = () => (
    <CollapsibleFilterPanel
      pageKey="distribute.phases"
      defaultExpanded={false}
    >
      <CheckboxFilter
        pageKey="distribute.phases"
        data={basePhases}
        property="subprojectName"
        label="Subproject"
      />
      <DateRangeFilter
        pageKey="distribute.phases"
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
        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
          Phases: {filteredPhases.length} / {basePhases.length}
        </Typography>
        <Box sx={{ position: 'relative' }}>
          <Filter />
        </Box>
      </Box>
      <ErrorBoundary>
        <Box sx={{ width: '100%', height: '600px' }}>
          {filteredPhases.length > 0 ? (
            <GanttChart items={items} groups={groups} />
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

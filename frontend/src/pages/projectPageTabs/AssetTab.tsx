import React, { useMemo } from "react";
import { Typography } from "@mui/material";
import { useAppContext } from "../../context/AppContext";
import GanttChart from "../../components/GanttChart";

const AssetTab: React.FC = () => {
  const { phases, assets, selectedSubprojectId } = useAppContext();

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
      const phaseItems = filteredPhases.map((phase) => ({
        id: `phase-${phase.id}`,
        group: 'phase-group',
        content: phase.name,
        start: phase.end_date, // マイルストーンは終了日に表示
        end: phase.end_date,   // start === end でマイルストーンになる
        type: 'point' as const,  // マイルストーンタイプ
        className: 'milestone'
      }));

      // Assetアイテム
      const assetItems = filteredAssets.map((a) => ({
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

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Assets ({filteredAssets.length})
      </Typography>
      {filteredAssets.length > 0 ? (
        <GanttChart items={items} groups={groups} />
      ) : (
        <Typography variant="body2" color="text.secondary">
          No assets found for this subproject
        </Typography>
      )}
    </div>
  );
};

export default AssetTab;

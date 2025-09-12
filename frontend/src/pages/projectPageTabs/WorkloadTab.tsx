import React, { useMemo, useState } from "react";
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, TextField, IconButton } from "@mui/material";
import { ExpandMore, ChevronRight } from "@mui/icons-material";
import { useFilterContext } from "../../context/FilterContext";
import DateRangeFilter from "../../components/filters/DateRangeFilter";
import SearchDropdownFilter from "../../components/filters/SearchDropdownFilter";

// 型定義
import type { IPhase, IAsset, ITask,IForignKey, IPersonWorkload, IPMMWorkload, IPerson, IWorkCategory } from "../../context/AppContext";

interface WorkloadTabProps {
  phases: IPhase[];
  assets: IAsset[];
  tasks: ITask[];
  personWorkloads: IPersonWorkload[];
  pmmWorkloads: IPMMWorkload[];
  people: IPerson[];
  workCategories: IWorkCategory[] | undefined;
  selectedSubprojectId: number;
}

const WorkloadTab: React.FC<WorkloadTabProps> = ({ phases, assets, tasks, personWorkloads, pmmWorkloads, people, workCategories, selectedSubprojectId }) => {
  // SearchDropdownFilterで選択されたwork_category.idを取得
  const { filters, setDropdownFilter, getFilteredData, setDateRangeFilter } = useFilterContext();
  const [expandedAssets, setExpandedAssets] = useState<Set<number>>(new Set());
  const assetFilterKey = "workload:asset";
  // SearchDropdownFilterで選択されたwork_category.idを取得
  const selectedWorkCategoryId = filters[assetFilterKey]?.dropdown?.["work_category.id"]?.[0];

  // 編集state（PersonWorkloadのみ例示。PMMWorkloadも同様に追加可能）
  const [personWorkloadState, setPersonWorkloadState] = useState<Partial<IPersonWorkload>[]>([]);

  // サブプロジェクト切替時のみ初期化
  React.useEffect(() => {
    setPersonWorkloadState(personWorkloads.map(w => ({ ...w })));
    // setPMMWorkloadState(pmmWorkloads.map(w => ({ ...w }))); // PMMWorkloadも同様に
  }, [selectedSubprojectId]);

  // PersonWorkload編集イベント（IForignKey型で統一）
  const handlePWChange = async (task: IForignKey, person: IForignKey, week: string, value: number) => {
    setPersonWorkloadState(prev => {
      const idx = prev.findIndex(
        w => w.task?.id === task.id && w.person?.id === person.id && w.week === week
      );
      const id = personWorkloads.find(
        w => w.task?.id === task.id && w.person?.id === person.id && w.week === week
      )?.id;
      const edit: Partial<IPersonWorkload> = {
        id,
        task,
        person,
        week,
        man_week: value,
        subproject: { type: "Subproject", id: selectedSubprojectId }
      };
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...edit };
        return updated;
      }
      return [...prev, edit];
    });

    // API送信（即時）
    const id = personWorkloads.find(
      w => w.task?.id === task.id && w.person?.id === person.id && w.week === week
    )?.id;
    const edit: Partial<IPersonWorkload> = {
      id,
      task,
      person,
      week,
      man_week: value,
      subproject: { type: "Subproject", id: selectedSubprojectId }
    };
    console.log("handlePWChange edit:", edit);
    let result: IPersonWorkload;
    if (id) {
      // result = await updateEntity(id, edit);
    } else {
      // result = await createEntity(edit);
    }
    // if (result) addPersonWorkloads([result]);
  };

  // --- テーブル本体 ---
  // 週ラベル生成（DateRangeFilterの値に連動）
  const assetDr = filters[assetFilterKey]?.dateRange;
  const start = assetDr?.start;
  const end = assetDr?.end;
  const weekIsos = useMemo(() => {
    if (!start || !end) return [];
    const arr: string[] = [];
    const s = new Date(start);
    const e = new Date(end);
    let cur = new Date(s);
    while (cur <= e) {
      arr.push(cur.toISOString().split("T")[0]);
      cur.setDate(cur.getDate() + 7);
    }
    return arr;
  }, [start, end]);
  const weekLabels = useMemo(() => weekIsos.map(iso => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }), [weekIsos]);

  // FilterContextのgetFilteredDataでフィルタ適用
  // Assetに対してSearchDropdownFilterとDateRangeFilterを適用
  const filteredAssets = useMemo(() => getFilteredData(assetFilterKey, assets), [getFilteredData, assetFilterKey, assets]);
  // filteredAssetsに紐づくTaskのみ表示
  const filteredTasks = useMemo(() => {
    const assetIds = new Set(filteredAssets.map(a => a.id));
    return tasks.filter(t => t.asset && typeof t.asset.id === 'number' && assetIds.has(t.asset.id));
  }, [tasks, filteredAssets]);
  // filteredAssets/filteredTasksに紐づくpersonWorkloadのみ表示（週もフィルタ）
  const filteredPW = useMemo(() => {
    const taskIds = new Set(filteredTasks.map(t => t.id));
    return personWorkloads.filter(w =>
      w.task && taskIds.has(w.task.id) && weekIsos.includes(w.week)
    );
  }, [personWorkloads, filteredTasks, weekIsos]);

  // 選択workCategoryと週でPMMWorkloadをフィルタ
  const filteredPMMW = useMemo(() => {
    if (!selectedWorkCategoryId) return [];
    return pmmWorkloads.filter(w =>
      w.work_category?.id === Number(selectedWorkCategoryId) &&
      weekIsos.includes(w.week)
    );
  }, [pmmWorkloads, selectedWorkCategoryId, weekIsos]);


  // 展開トグル
  const toggleAssetExpansion = (assetId: number) => {
    setExpandedAssets(prev => {
      const n = new Set(prev);
      if (n.has(assetId)) n.delete(assetId); else n.add(assetId);
      return n;
    });
  };

  // 値取得ヘルパー（編集stateを参照）
  const getPMMWValue = (weekIso: string): { id?: number, value: number } => {
    const rec = filteredPMMW.find(w => w.week === weekIso);
    return rec ? { id: rec.id, value: rec.man_week } : { value: 0 };
  };

  // 編集stateから値取得
  const getPWValue = (taskId: number, personId: number, weekIso: string): { id?: number, value: number } => {
    const rec = personWorkloadState.find(w => w.task?.id === taskId && w.person?.id === personId && w.week === weekIso);
    return rec ? { id: rec.id, value: rec.man_week ?? 0 } : { value: 0 };
  };

  const getTaskTotal = (taskId: number, weekIso: string) => {
    return people.reduce((sum, p) => sum + getPWValue(taskId, p.id, weekIso).value, 0);
  };
  const getAssetTotal = (assetId: number, weekIso: string) => {
    const assetTasks = filteredTasks.filter(t => t.asset.id === assetId);
    return assetTasks.reduce((sum, t) => sum + getTaskTotal(t.id, weekIso), 0);
  };
  const getCurrentPlanTotal = (weekIso: string) => {
    return filteredPW.filter(w => w.week === weekIso).reduce((sum, w) => sum + w.man_week, 0);
  };

  if (!selectedSubprojectId) {
    return <Typography variant="body1" color="text.secondary">Please select a subproject to view workloads</Typography>;
  }

  const Filter: React.FC = () => (
    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
      <SearchDropdownFilter
        pageKey={assetFilterKey}
        data={assets}
        property="work_category.id"
        label="Work Category"
      />
      <DateRangeFilter
        pageKey={assetFilterKey}
        label="Period (Week)"
        startProperty="start_date"
        endProperty="end_date"
        alignStartToMonday
        alignEndToFriday
        defaultStartWeek={0}
        defaultEndWeek={8}
      />
    </Box>
  );

  const PmmWorkloadRow: React.FC = () => (
    <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
      <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#f9f9f9', zIndex: 1 }}>Approved Plan</TableCell>
      {weekIsos.map((weekIso, idx) => {
        const { id, value } = getPMMWValue(weekIso);
        return (
          <TableCell key={weekIso} align="center">
            <TextField size="small" type="number" value={value} sx={{ width: 60, '& input': { textAlign: 'center' } }} inputProps={{ 'data-id': id ?? '', 'data-week': weekIso }} />
          </TableCell>
        );
      })}
    </TableRow>
  );

  const CurrentPlanRow: React.FC = () => (
    <TableRow sx={{ backgroundColor: '#fff3cd' }}>
      <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#fff3cd', zIndex: 1 }}>Current Plan</TableCell>
      {weekIsos.map((weekIso, idx) => (
        <TableCell key={weekIso} align="center">
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{getCurrentPlanTotal(weekIso)}</Typography>
        </TableCell>
      ))}
    </TableRow>
  );


  return (
    <Box>
      <Filter />
      <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
        <Table sx={{ minWidth: 1000 }} size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 200, backgroundColor: '#f5f5f5', position: 'sticky', left: 0, zIndex: 2 }}></TableCell>
              {weekLabels.map((label, idx) => (
                <TableCell key={idx} align="center" sx={{ backgroundColor: '#f5f5f5', minWidth: 80 }}><strong>{label}</strong></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <PmmWorkloadRow />
            <CurrentPlanRow />
            {/* Asset, Task, Person階層 */}
            {filteredAssets.map(asset => {
              // Task: 親Assetに紐づくもののみ
              const assetTasks = filteredTasks.filter(t => t.asset.id === asset.id);
              const isExpanded = expandedAssets.has(asset.id);
              return (
                <React.Fragment key={asset.id}>
                  {/* Asset行 */}
                  <TableRow sx={{ backgroundColor: '#e9ecef' }}>
                    <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: '#e9ecef', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton size="small" onClick={() => toggleAssetExpansion(asset.id)} sx={{ mr: 1 }}>
                          {isExpanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
                        </IconButton>
                        <strong>{asset.name}{isExpanded ? '△' : '▽'}</strong>
                      </Box>
                    </TableCell>
                    {weekIsos.map(weekIso => (
                      <TableCell key={weekIso} align="center">{getAssetTotal(asset.id, weekIso)}</TableCell>
                    ))}
                  </TableRow>
                  {/* Task・Person行（展開時のみ） */}
                  {isExpanded && assetTasks.map(task => (
                    <React.Fragment key={task.id}>
                      {/* Task行 */}
                      <TableRow sx={{ backgroundColor: '#d1ecf1' }}>
                        <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: '#d1ecf1', zIndex: 1, pl: 4 }}>
                          <strong>{task.name}</strong>
                        </TableCell>
                        {weekIsos.map(weekIso => (
                          <TableCell key={weekIso} align="center">{getTaskTotal(task.id, weekIso)}</TableCell>
                        ))}
                      </TableRow>
                      {/* Person行: task.assigneesのみ表示 */}
                      {task.assignees && task.assignees.map(personFk => (
                        <TableRow key={`${task.id}-${personFk.id}`}>
                          <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, pl: 8 }}>{personFk.name}</TableCell>
                          {weekIsos.map(weekIso => {
                            const { id, value } = getPWValue(task.id, personFk.id, weekIso);
                            return (
                              <TableCell key={weekIso} align="center">
                                <TextField
                                  size="small"
                                  type="number"
                                  value={value}
                                  sx={{ width: 60, '& input': { textAlign: 'center' } }}
                                  // inputProps={{ 'data-id': id ?? '', 'data-task': task.id, 'data-person': personFk.id, 'data-week': weekIso }}
                                  onChange={e => handlePWChange(
                                    { type: "Task", id: task.id, name: task.name },
                                    { type: "Person", id: personFk.id, name: personFk.name },
                                    weekIso,
                                    Number(e.target.value)
                                  )}
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
export default WorkloadTab;

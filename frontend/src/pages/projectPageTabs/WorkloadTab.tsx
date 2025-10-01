import React, { useMemo, useState } from "react";
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, TextField, IconButton, Button, CircularProgress } from "@mui/material";
import { ExpandMore, ChevronRight } from "@mui/icons-material";
import AddIcon from '@mui/icons-material/Add';
import { useFilterContext } from "../../context/FilterContext";
import { useAppContext } from "../../context/AppContext";
import DateRangeFilter from "../../components/filters/DateRangeFilter";
import SearchDropdownFilter from "../../components/filters/SearchDropdownFilter";
import ContextMenu, { ContextMenuItem } from "../../components/common/ContextMenu";
import { useFormContext } from "../../context/FormContext";
import { useDialogContext } from "../../context/DialogContext";

// 型定義
import type { IPhase, IAsset, ITask, IForignKey, IPersonWorkload, IPMMWorkload, IPerson, IWorkCategory, ISubproject } from "../../context/AppContext";
import { updateEntity, createEntity, exportPMMWorkloadsCSV } from "../../api/bridgeApi";

interface WorkloadTabProps {
  phases: IPhase[];
  assets: IAsset[];
  tasks: ITask[];
  personWorkloads: IPersonWorkload[];
  pmmWorkloads: IPMMWorkload[];
  people: IPerson[];
  workCategories: IWorkCategory[] | undefined;
  currentSubproject: ISubproject | undefined;
  isEditMode: boolean;
}

const WorkloadTab: React.FC<WorkloadTabProps> = ({ phases, assets, tasks, personWorkloads, pmmWorkloads, people, workCategories, currentSubproject, isEditMode }) => {
  const { filters, setDropdownFilter, getFilteredData, setDateRangeFilter } = useFilterContext();
  const [expandedAssets, setExpandedAssets] = useState<Set<number>>(new Set());
  // Scope filter key by subproject so filters don't leak across subprojects
  const assetFilterKey = `workload:${currentSubproject?.id ?? 'none'}:asset`;
  const { addPersonWorkloads, addPMMWorkloads, setLoading } = useAppContext();
  const { openForm } = useFormContext();
  const { openDialog } = useDialogContext();
  // Exporting state must be declared before any early return
  const [exporting, setExporting] = React.useState(false);

  const selectedWorkCategoryName = filters[assetFilterKey]?.dropdown?.["work_category.name"]?.[0];
  const selectedWorkCategory: IForignKey = {
    id: workCategories?.find(c => c.name === selectedWorkCategoryName)?.id || 0,
    name: selectedWorkCategoryName,
    type: "WorkCategory"
  }

  // 編集・表示用state
  const [personWorkloadState, setPersonWorkloadState] = useState<Partial<IPersonWorkload>[]>([]); // Partial型で部分更新を許容
  const [pmmWorkloadState, setPMMWorkloadState] = useState<Partial<IPMMWorkload>[]>([]); // Partial型で部分更新を許容

  // 初期化時のみAppContextの値と連動
  React.useEffect(() => {
    if (personWorkloadState.length) return;
    setPersonWorkloadState(personWorkloads.map(w => ({ ...w })));
  }, [personWorkloads]);
  React.useEffect(() => {
    if (pmmWorkloadState.length) return;
    setPMMWorkloadState(pmmWorkloads.map(w => ({ ...w })));
  }, [pmmWorkloads]);

  // Subproject変更時にstateをリセット
  React.useEffect(() => {
    setPersonWorkloadState(personWorkloads.map(w => ({ ...w })));
    setPMMWorkloadState(pmmWorkloads.map(w => ({ ...w })));
  }, [currentSubproject]);


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


  // 表示データのフィルタリング
  // Assetに対してSearchDropdownFilterとDateRangeFilterを適用 →　子要素を取得
  const filteredAssets = useMemo(() => getFilteredData(assetFilterKey, assets), [getFilteredData, assetFilterKey, assets]);
  const filteredTasks = useMemo(() => {
    const assetIds = new Set(filteredAssets.map(a => a.id));
    return tasks.filter(t => t.asset && typeof t.asset.id === 'number' && assetIds.has(t.asset.id));
  }, [tasks, filteredAssets]);
  const filteredPW = useMemo(() => {
    const taskIds = new Set(filteredTasks.map(t => t.id));
    return personWorkloadState.filter(w =>
      w.task && taskIds.has(w.task.id) && weekIsos.includes(w.week as string)
    );
  }, [personWorkloadState, filteredTasks, weekIsos]);

  // AssetのWorkCategoryフィルターを流用してPMMWorkloadをフィルタ
  const filteredPMMW = useMemo(() => {
    if (!selectedWorkCategory) return [];
    return pmmWorkloadState.filter(w =>
      w.work_category?.id === selectedWorkCategory.id &&
      weekIsos.includes(w.week as string)
    );
  }, [pmmWorkloadState, selectedWorkCategory, weekIsos]);


  // 展開トグル
  const toggleAssetExpansion = (assetId: number) => {
    setExpandedAssets(prev => {
      const n = new Set(prev);
      if (n.has(assetId)) n.delete(assetId); else n.add(assetId);
      return n;
    });
  };

  // テーブルの値取得
  const getPMMWValue = (weekIso: string): { id?: number, value: number } => {
    const hasCategory = filteredAssets.some(a => a.work_category?.id === selectedWorkCategory.id);
    if (!selectedWorkCategory.id || !hasCategory) return { value: 0 };
    const rec = pmmWorkloadState.find(w => w.week === weekIso && w.work_category?.id === selectedWorkCategory.id);
    return rec ? { id: rec.id, value: rec.man_week ?? 0 } : { value: 0 };
  };
  const getPWValue = (taskId: number, personId: number, weekIso: string): { id?: number, value: number } => {
    const rec = personWorkloadState.find(w => w.task?.id === taskId && w.person?.id === personId && w.week === weekIso);
    return rec ? { id: rec.id, value: rec.man_week ?? 0 } : { value: 0 };
  };
  const getTaskTotal = (task: ITask, weekIso: string) => {
    return task.assignees.reduce((sum, p) => sum + getPWValue(task.id, p.id, weekIso).value, 0);
  };
  const getAssetTotal = (assetId: number, weekIso: string) => {
    const assetTasks = filteredTasks.filter(t => t.asset.id === assetId);
    return assetTasks.reduce((sum, t) => sum + getTaskTotal(t, weekIso), 0);
  };
  const getCurrentPlanTotal = (weekIso: string) => {
    return filteredPW.filter(w => w.week === weekIso).reduce((sum, w) => sum + (w.man_week ?? 0), 0);
  };

  // 入力値送信
  // PersonWorkload送信
  const personWorkloadSubmit = async (task: IForignKey, person: IForignKey, week: string, value: number) => {
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
      };
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...edit };
        return updated;
      }
      return [...prev, edit];
    });

    const id = personWorkloads.find(
      w => w.task?.id === task.id && w.person?.id === person.id && w.week === week
    )?.id;
    const edit: Partial<IPersonWorkload> = {
      id,
      type: "PersonWorkload",
      task,
      person,
      week,
      man_week: value,
    };
    console.log("handlePWChange edit:", edit);
    if (id) {
      updateEntity(id, edit).then((result) => {
        if (result.id) {
          addPersonWorkloads([result]);
        }
      }).finally();
    } else {
      createEntity(edit).then((result) => {
        if (result.id) {
          addPersonWorkloads([result]);
        }
      }).finally();
    }
  };
  // PMMWorkload送信
  const pmmWorkloadSubmit = async (week: string, value: number) => {
    if (!currentSubproject) return;

    setPMMWorkloadState(prev => {
      const idx = prev.findIndex(w => w.week === week && w.work_category?.id === selectedWorkCategory.id);
      const id = pmmWorkloads.find(w => w.week === week && w.work_category?.id === selectedWorkCategory.id)?.id;
      const edit: Partial<IPMMWorkload> = {
        id,
        week,
        work_category: selectedWorkCategory,
        man_week: value,
      };
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...edit };
        return updated;
      }
      return [...prev, edit];
    });

    const id = pmmWorkloads.find(
      w => w.week === week && w.work_category?.id === selectedWorkCategory.id
    )?.id;
    const edit: Partial<IPMMWorkload> = {
      id,
      type: "PMMWorkload",
      work_category: selectedWorkCategory,
      subproject: { id: currentSubproject?.id, name: currentSubproject?.name, type: "Subproject" },
      week,
      man_week: value,
    };
    console.log("handlePWChange edit:", edit);
    if (id) {
      updateEntity(id, edit).then((result) => {
        if (result.id) {
          addPMMWorkloads([result]);
        }
      }).catch((error) => {
      openDialog({
        title: "Update Failed",
        message: `Failed to update Workload.\n${error.message}`,
        okText: "OK",
      });
      console.error('Failed to update entity:', error);
      });
    } else {
      createEntity(edit).then((result) => {
        if (result.id) {
          addPMMWorkloads([result]);
        }
      }).catch((error) => {
      openDialog({
        title: "Create Failed",
        message: `Failed to create Workload.\n${error.message}`,
        okText: "OK",
      });
      console.error('Failed to cre entity:', error);
      });
    }
  };

  // 右クリックメニュー関連
  // Task用
  const [taskMenuState, setTaskMenuState] = useState<{
    open: boolean;
    task?: ITask;
    anchorPosition?: { top: number; left: number };
  }>({ open: false });

  const handleTaskContextMenu = (task: ITask, event: React.MouseEvent<HTMLTableCellElement>) => {
    event.preventDefault();
    setTaskMenuState({
      open: true,
      task,
      anchorPosition: { top: event.clientY, left: event.clientX },
    });
  };

  const handleTaskMenuClose = () => {
    setTaskMenuState({ open: false });
  };

  const taskContextMenuItems: ContextMenuItem[] = [
    {
      label: "Edit",
      action: () => {
        if (taskMenuState.task) {
          openForm({
            type: 'task',
            mode: 'edit',
            initialValues: taskMenuState.task,
            candidates: {
              assets: assets,
              people: people,
            },
          });
        }
      },
      disable: !isEditMode,
    },
  ];

  // Asset用
  const [assetMenuState, setAssetMenuState] = useState<{
    open: boolean;
    asset?: IAsset;
    anchorPosition?: { top: number; left: number };
  }>({ open: false });

  const handleAssetContextMenu = (asset: IAsset, event: React.MouseEvent<HTMLTableCellElement>) => {
    event.preventDefault();
    setAssetMenuState({
      open: true,
      asset,
      anchorPosition: { top: event.clientY, left: event.clientX },
    });
  };

  const handleAssetMenuClose = () => {
    setAssetMenuState({ open: false });
  };

  const assetContextMenuItems: ContextMenuItem[] = [
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
      label: "Add Task",
      icon: <AddIcon />,
      action: () => {
        if (assetMenuState.asset) {
          const selectedAsset = { id: assetMenuState.asset?.id, name: assetMenuState.asset?.name, type: "Asset" } as IForignKey;
          openForm({
            type: 'task',
            mode: 'create',
            initialValues: { asset: selectedAsset },
            candidates: {
              assets: [assetMenuState.asset],
              people: people,
            },
          });
        }
      },
      disable: !isEditMode,
    },
  ];

  // 表示コンポーネント
  if (!personWorkloadState) {
    return <Typography variant="body1" color="text.secondary">loading</Typography>;
  }
  if (!currentSubproject) {
    return <Typography variant="body1" color="text.secondary">Please select a subproject to view workloads</Typography>;
  }

  const Filter: React.FC = () => (
    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
      <SearchDropdownFilter
        pageKey={assetFilterKey}
        data={assets}
        property="work_category.name"
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
      {/* Spacer to push Export button to right */}
      <Box sx={{ flex: 1 }} />
      <ExportButton />
    </Box>
  );

  const ExportButton: React.FC = () => {
    const handleExport = async () => {
      if (!currentSubproject) {
        openDialog({ title: 'Export', message: 'Please select a subproject.', okText: 'OK' });
        return;
      }
      // Collect all PMM workloads for the selected subproject (send all weeks as requested)
      const records = pmmWorkloads.filter(w => w.subproject?.id === currentSubproject.id);
      if (!records.length) {
        openDialog({ title: 'Export', message: 'No PMM workload data for this subproject.', okText: 'OK' });
        return;
      }
      try {
        setExporting(true);
        const res = await exportPMMWorkloadsCSV({
          subproject: { id: currentSubproject.id, name: currentSubproject.name },
          records,
        });
        if (res && res.success) {
          openDialog({ title: 'Export Complete', message: `Saved to:\n${res.path}`, okText: 'OK' });
        } else {
          const msg = (res && (res.error || res.message)) || 'Failed to export CSV.';
          openDialog({ title: 'Export Failed', message: msg, okText: 'OK' });
        }
      } catch (e: any) {
        openDialog({ title: 'Export Failed', message: e?.message || String(e), okText: 'OK' });
      } finally {
        setExporting(false);
      }
    };

    const disabled = !currentSubproject || !pmmWorkloads.some(w => w.subproject?.id === currentSubproject?.id) || exporting;
    return (
      <Button variant="contained" color="primary" onClick={handleExport} disabled={disabled} sx={{ alignSelf: 'flex-end' }}>
        {exporting ? <><CircularProgress size={16} sx={{ mr: 1 }} />Exporting…</> : 'Export CSV'}
      </Button>
    );
  };
  const PmmWorkloadRow: React.FC = () => {
    // 週ごとの入力値を保持するローカルstate
    const [inputValues, setInputValues] = React.useState<{ [weekIso: string]: string }>({});

    React.useEffect(() => {
      // pmmWorkloadStateや週が変わったらinput値も同期
      const initial: { [weekIso: string]: string } = {};
      weekIsos.forEach(weekIso => {
        const { value } = getPMMWValue(weekIso);
        initial[weekIso] = value === undefined || value === null ? "" : String(value);
      });
      setInputValues(initial);
    }, [pmmWorkloadState, weekIsos, selectedWorkCategory]);

    const isPlanning = currentSubproject?.pmm_status !== "approved";

    return (
      <TableRow sx={{ backgroundColor: '#dae7f3ff', border: '2px solid #707070ff' }}>
        <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#dae7f3ff', zIndex: 1 }}>
          PMM   &nbsp;
          {isPlanning ? (
            <Typography component="span" variant="body2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>[Planning]</Typography>
          ) : (
            <Typography component="span" variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>[Approved]</Typography>
          )}
          &nbsp;
        </TableCell>
        {weekIsos.map((weekIso, idx) => (
          <TableCell key={weekIso} align="center">
            {isPlanning && isEditMode? (
              <TextField
                size="small"
                type="number"
                value={inputValues[weekIso] ?? ""}
                sx={{ width: 70, '& input': { textAlign: 'center' } }}
                onChange={(e) => {
                  const input = e.target.value;
                  setInputValues(prev => ({ ...prev, [weekIso]: input }));
                }}
                onBlur={(e) => {
                  const input = e.target.value;
                  if (input === "") return;
                  pmmWorkloadSubmit(weekIso, Number(input));
                }}
              />) : (
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{getPMMWValue(weekIso).value}</Typography>
            )}
          </TableCell>
        ))}
      </TableRow>
    );
  };

  const CurrentPlanRow: React.FC = () => (
    <TableRow sx={{ backgroundColor: '#fff3cd', border: '2px solid #707070ff' }}>
      <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#fff3cd', zIndex: 1 }}>Current Plan</TableCell>
      {weekIsos.map((weekIso, idx) => (
        <TableCell key={weekIso} align="center">
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{getCurrentPlanTotal(weekIso).toFixed(1)}</Typography>
        </TableCell>
      ))}
    </TableRow>
  );

  const AssetRow: React.FC<{ asset: IAsset, isExpanded: boolean }> = ({ asset, isExpanded }) => {
    const isWeekInRange = (weekIso: string) => {
      const weekStart = new Date(weekIso);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // 月曜+6=日曜
      const start = new Date(asset.start_date);
      const end = new Date(asset.end_date);
      return (
        (start >= weekStart && start <= weekEnd) ||
        (end >= weekStart && end <= weekEnd) ||
        (weekStart >= start && weekEnd <= end)
      );
    };



    return (
      <TableRow sx={{ backgroundColor: '#f7f7f7ff' }}>
        <TableCell
          sx={{ position: 'sticky', left: 0, backgroundColor: '#f7f7f7ff', zIndex: 1 }}
          onContextMenu={(e) => handleAssetContextMenu(asset, e)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" onClick={() => toggleAssetExpansion(asset.id)} sx={{ mr: 1 }}>
              {isExpanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
            </IconButton>
            <strong>{asset.name}</strong>
          </Box>
        </TableCell>
        {weekIsos.map(weekIso => (
          <TableCell
            key={weekIso}
            align="center"
            sx={{
              backgroundColor: isWeekInRange(weekIso) ? '#ffffff' : '#d1d1d1ff'
            }}
          >{getAssetTotal(asset.id, weekIso).toFixed(1)}
          </TableCell>
        ))}
      </TableRow>
    );
  };

  const TaskRow: React.FC<{ task: ITask, }> = ({ task }) => {
    const isWeekInRange = (weekIso: string) => {
      const weekStart = new Date(weekIso);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // 月曜+4=金曜
      const start = new Date(task.start_date);
      const end = new Date(task.end_date);
      return (
        (start >= weekStart && start <= weekEnd) ||
        (end >= weekStart && end <= weekEnd) ||
        (weekStart >= start && weekEnd <= end)
      );
    };

    return (
      <TableRow sx={{ backgroundColor: '#d1ecf1' }}>
        <TableCell 
        sx={{ position: 'sticky', left: 0, backgroundColor: '#d1ecf1', zIndex: 1, pl: 4 }}
        onContextMenu={(e) => handleTaskContextMenu(task, e)}
        >
          <strong>{task.name}</strong>
        </TableCell>
        {weekIsos.map(weekIso => (
          <TableCell
            key={weekIso}
            align="center"
            sx={{
              backgroundColor: isWeekInRange(weekIso) ? '#d1ecf1' : '#b1c4c7ff'
            }}
          >{getTaskTotal(task, weekIso).toFixed(1)}</TableCell>
        ))}
      </TableRow>
    );
  };

  const PersonRow: React.FC<{ task: ITask, personFk: IForignKey }> = ({ task, personFk }) => {
    // 週ごとの入力値をローカルstateで管理
    const [inputValues, setInputValues] = React.useState<{ [weekIso: string]: string }>({});

    React.useEffect(() => {
      // personWorkloadStateや週が変わったらinput値も同期
      const initial: { [weekIso: string]: string } = {};
      weekIsos.forEach(weekIso => {
        const { value } = getPWValue(task.id, personFk.id, weekIso);
        initial[weekIso] = value === undefined || value === null ? "" : String(value);
      });
      setInputValues(initial);
    }, [personWorkloadState, weekIsos, task.id, personFk.id]);

    const isWeekInRange = (weekIso: string) => {
      const weekStart = new Date(weekIso);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // 月曜+6=日曜
      const start = new Date(task.start_date);
      const end = new Date(task.end_date);
      return (
        (start >= weekStart && start <= weekEnd) ||
        (end >= weekStart && end <= weekEnd) ||
        (weekStart >= start && weekEnd <= end)
      );
    };

    return (
      <TableRow>
        <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, pl: 8 }}>{personFk.name}</TableCell>
        {weekIsos.map(weekIso => (
          <TableCell
            key={`${task.id}-${personFk.id}-${weekIso}`}
            align="center"
            sx={{
              backgroundColor: isWeekInRange(weekIso) ? '#ffffffff' : '#cacacaff'
            }}
          >
            {isEditMode ? (
              <TextField
              size="small"
              type="number"
              inputProps={{ step: 0.1, min: 0 }}
              value={inputValues[weekIso] ?? ""}
              sx={{ width: 70, '& input': { textAlign: 'center' } }}
              onChange={(e) => {
                const input = e.target.value;
                setInputValues(prev => ({ ...prev, [weekIso]: input }));
              }}
              onBlur={(e) => {
                const input = e.target.value;
                if (input === "") return;
                personWorkloadSubmit(
                  { type: "Task", id: task.id, name: task.name },
                  personFk,
                  weekIso,
                  Number(input)
                );
              }}
            />) : (
              <Typography variant="body2">{getPWValue(task.id, personFk.id, weekIso).value}</Typography>
            )}
            
          </TableCell>
        ))}
      </TableRow>
    );
  }


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
                  <AssetRow asset={asset} isExpanded={isExpanded} />
                  {isExpanded && assetTasks.map(task => (
                    <React.Fragment key={task.id}>
                      <TaskRow task={task} />
                      {task.assignees && task.assignees.map(personFk => (
                        <PersonRow key={`${task.id}-${personFk.id}`} task={task} personFk={personFk} />
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* コンテキストメニュー（座標指定） */}
      {/* Asset用 */}
      <ContextMenu
        open={assetMenuState.open}
        onClose={handleAssetMenuClose}
        items={assetContextMenuItems}
        header={assetMenuState.asset?.name}
        anchorPosition={assetMenuState.anchorPosition}
      />
      {/* Task用 */}
      <ContextMenu
        open={taskMenuState.open}
        onClose={handleTaskMenuClose}
        items={taskContextMenuItems}
        header={taskMenuState.task?.name}
        anchorPosition={taskMenuState.anchorPosition}
      />
    </Box>
  );
}
export default WorkloadTab;

import React, { useMemo, useState } from "react";
import { 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton
} from "@mui/material";
import { ExpandMore, ChevronRight } from "@mui/icons-material";
import { useAppContext } from "../../context/AppContext";

const WorkloadTab: React.FC = () => {
  const { tasks, people, selectedSubprojectId, phases, assets } = useAppContext();
  const [selectedWorkCategory, setSelectedWorkCategory] = useState<string>("category1");
  const [startDate, setStartDate] = useState<string>("2025-06");
  const [endDate, setEndDate] = useState<string>("2025-07");
  const [expandedAssets, setExpandedAssets] = useState<Set<number>>(new Set());
  const [workloadData, setWorkloadData] = useState<Record<string, number>>({});

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

  // 選択されたSubprojectに関連するTaskのみをフィルタ
  const filteredTasks = useMemo(
    () => {
      const assetIds = filteredAssets.map(a => a.id);
      return tasks.filter((task) => assetIds.includes(task.asset.id));
    },
    [tasks, filteredAssets]
  );

  // 週の日付を生成（月曜日ベース）
  const generateWeekDates = useMemo(() => {
    const weeks: string[] = [];
    const start = new Date("2025-07-14"); // 7/16を含む週の月曜日
    
    for (let i = 0; i < 9; i++) { // 9週間分
      const monday = new Date(start);
      monday.setDate(start.getDate() + (i * 7));
      const monthDay = `${monday.getMonth() + 1}/${monday.getDate()}`;
      weeks.push(monthDay);
    }
    return weeks;
  }, []);

  // Asset展開/折りたたみ
  const toggleAssetExpansion = (assetId: number) => {
    const newExpanded = new Set(expandedAssets);
    if (newExpanded.has(assetId)) {
      newExpanded.delete(assetId);
    } else {
      newExpanded.add(assetId);
    }
    setExpandedAssets(newExpanded);
  };

  // Workloadデータ更新
  const updateWorkloadData = (key: string, value: number) => {
    setWorkloadData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Personの名前を取得するヘルパー関数
  const getPersonName = (personId: number) => {
    const person = people.find(p => p.id === personId);
    return person ? person.name : `Person ${personId}`;
  };

  // Taskの名前を取得するヘルパー関数
  const getTaskName = (taskId: number) => {
    const task = filteredTasks.find(t => t.id === taskId);
    return task ? task.name : `Task ${taskId}`;
  };

  // Taskの合計値を計算
  const calculateTaskTotal = (taskId: number, weekIndex: number) => {
    const task = filteredTasks.find(t => t.id === taskId);
    if (!task) return 0;
    
    let total = 0;
  task.assignees.forEach(personRef => {
      const key = `task-${taskId}-person-${personRef.id}-week-${weekIndex}`;
      total += workloadData[key] || 0;
    });
    return total;
  };

  // Assetの合計値を計算（Asset入力値 + Task配下のPerson入力値）
  const calculateAssetTotal = (assetId: number, weekIndex: number) => {
    // Asset自体の入力値
    const assetInputValue = workloadData[`asset-${assetId}-week-${weekIndex}`] || 0;
    
    // 配下のTaskのPerson入力値の合計
    const assetTasks = filteredTasks.filter(t => t.asset.id === assetId);
    let taskTotal = 0;
    assetTasks.forEach(task => {
      taskTotal += calculateTaskTotal(task.id, weekIndex);
    });
    
    return assetInputValue + taskTotal;
  };

  // Current Planの合計値を計算（全Asset値の合計）
  const calculateCurrentPlanTotal = (weekIndex: number) => {
    let total = 0;
    filteredAssets.forEach(asset => {
      total += calculateAssetTotal(asset.id, weekIndex);
    });
    return total;
  };

  if (!selectedSubprojectId) {
    return (
      <Typography variant="body1" color="text.secondary">
        Please select a subproject to view workloads
      </Typography>
    );
  }

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Workload Management
      </Typography>
      
      {/* フィルターコントロール */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>WorkCategory</InputLabel>
          <Select
            value={selectedWorkCategory}
            label="WorkCategory"
            onChange={(e) => setSelectedWorkCategory(e.target.value)}
          >
            <MenuItem value="category1">category1</MenuItem>
            <MenuItem value="category2">category2</MenuItem>
            <MenuItem value="category3">category3</MenuItem>
          </Select>
        </FormControl>
        
        <Typography variant="body1">Date:</Typography>
        <TextField
          type="month"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          sx={{ minWidth: 150 }}
        />
        <Typography variant="body1">to</Typography>
        <TextField
          type="month"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          sx={{ minWidth: 150 }}
        />
      </Box>

      {/* Workload表 */}
      <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
        <Table sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  minWidth: 200, 
                  backgroundColor: '#f5f5f5',
                  position: 'sticky',
                  left: 0,
                  zIndex: 2
                }}
              >
                <strong></strong>
              </TableCell>
              <TableCell 
                sx={{ 
                  width: 1000,
                  backgroundColor: '#f5f5f5',
                  overflow: 'auto'
                }}
              >
                <Box sx={{ display: 'flex', minWidth: 800 }}>
                  {generateWeekDates.map((date) => (
                    <Box 
                      key={date} 
                      sx={{ 
                        minWidth: 80, 
                        textAlign: 'center',
                        px: 1,
                        borderRight: '1px solid #e0e0e0',
                        '&:last-child': { borderRight: 'none' }
                      }}
                    >
                      <strong>{date}</strong>
                    </Box>
                  ))}
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Approved Plan行 */}
            <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#f9f9f9',
                  zIndex: 1
                }}
              >
                Approved Plan
              </TableCell>
              <TableCell sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', minWidth: 800 }}>
                  {generateWeekDates.map((_, weekIndex) => (
                    <Box 
                      key={weekIndex} 
                      sx={{ 
                        minWidth: 80, 
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        p: 1,
                        borderRight: '1px solid #e0e0e0',
                        '&:last-child': { borderRight: 'none' }
                      }}
                    >
                      <TextField
                        size="small"
                        type="number"
                        value={workloadData[`approved-week-${weekIndex}`] || ''}
                        onChange={(e) => updateWorkloadData(`approved-week-${weekIndex}`, Number(e.target.value) || 0)}
                        sx={{ width: 60, '& input': { textAlign: 'center' } }}
                      />
                    </Box>
                  ))}
                </Box>
              </TableCell>
            </TableRow>
            
            {/* Current Plan行（合計表示のみ） */}
            <TableRow sx={{ backgroundColor: '#fff3cd' }}>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#fff3cd',
                  zIndex: 1
                }}
              >
                Current Plan
              </TableCell>
              <TableCell sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', minWidth: 800 }}>
                  {generateWeekDates.map((_, weekIndex) => (
                    <Box 
                      key={weekIndex} 
                      sx={{ 
                        minWidth: 80, 
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        p: 1,
                        borderRight: '1px solid #e0e0e0',
                        '&:last-child': { borderRight: 'none' }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {calculateCurrentPlanTotal(weekIndex)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </TableCell>
            </TableRow>

            {/* Asset, Task, Person階層 */}
            {filteredAssets.map((asset) => {
              const assetTasks = filteredTasks.filter(t => t.asset.id === asset.id);
              const isExpanded = expandedAssets.has(asset.id);
              
              return (
                <React.Fragment key={asset.id}>
                  {/* Asset行（入力可能） */}
                  <TableRow sx={{ backgroundColor: '#e9ecef' }}>
                    <TableCell 
                      sx={{ 
                        position: 'sticky',
                        left: 0,
                        backgroundColor: '#e9ecef',
                        zIndex: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => toggleAssetExpansion(asset.id)}
                          sx={{ mr: 1 }}
                        >
                          {isExpanded ? <ExpandMore /> : <ChevronRight />}
                        </IconButton>
                        <strong>{asset.name}{isExpanded ? '△' : '∇'}</strong>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ p: 0 }}>
                      <Box sx={{ display: 'flex', minWidth: 800 }}>
                        {generateWeekDates.map((_, weekIndex) => (
                          <Box 
                            key={weekIndex} 
                            sx={{ 
                              minWidth: 80, 
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              p: 1,
                              borderRight: '1px solid #e0e0e0',
                              '&:last-child': { borderRight: 'none' }
                            }}
                          >
                            <TextField
                              size="small"
                              type="number"
                              value={workloadData[`asset-${asset.id}-week-${weekIndex}`] || ''}
                              onChange={(e) => updateWorkloadData(`asset-${asset.id}-week-${weekIndex}`, Number(e.target.value) || 0)}
                              sx={{ width: 60, '& input': { textAlign: 'center' } }}
                            />
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>

                  {/* Task・Person行（展開時のみ） */}
                  {isExpanded && assetTasks.map((task) => (
                    <React.Fragment key={task.id}>
                      {/* Task行（合計表示） */}
                      <TableRow sx={{ backgroundColor: '#d1ecf1' }}>
                        <TableCell 
                          sx={{ 
                            pl: 4,
                            position: 'sticky',
                            left: 0,
                            backgroundColor: '#d1ecf1',
                            zIndex: 1
                          }}
                        >
                          <strong>{task.name}</strong>
                        </TableCell>
                        <TableCell sx={{ p: 0 }}>
                          <Box sx={{ display: 'flex', minWidth: 800 }}>
                            {generateWeekDates.map((_, weekIndex) => (
                              <Box 
                                key={weekIndex} 
                                sx={{ 
                                  minWidth: 80, 
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  p: 1,
                                  borderRight: '1px solid #e0e0e0',
                                  '&:last-child': { borderRight: 'none' }
                                }}
                              >
                                <Typography variant="body2" color="text.secondary">
                                  {calculateTaskTotal(task.id, weekIndex)}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </TableCell>
                      </TableRow>
                      
                      {/* Person行（入力可能） */}
                      {task.assignees.map((personRef) => (
                        <TableRow key={`${task.id}-${personRef.id}`}>
                          <TableCell 
                            sx={{ 
                              pl: 6,
                              position: 'sticky',
                              left: 0,
                              backgroundColor: 'white',
                              zIndex: 1
                            }}
                          >
                            {getPersonName(personRef.id)}
                          </TableCell>
                          <TableCell sx={{ p: 0 }}>
                            <Box sx={{ display: 'flex', minWidth: 800 }}>
                              {generateWeekDates.map((_, weekIndex) => (
                                <Box 
                                  key={weekIndex} 
                                  sx={{ 
                                    minWidth: 80, 
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    p: 1,
                                    borderRight: '1px solid #e0e0e0',
                                    '&:last-child': { borderRight: 'none' }
                                  }}
                                >
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={workloadData[`task-${task.id}-person-${personRef.id}-week-${weekIndex}`] || ''}
                                    onChange={(e) => updateWorkloadData(
                                      `task-${task.id}-person-${personRef.id}-week-${weekIndex}`, 
                                      Number(e.target.value) || 0
                                    )}
                                    sx={{ width: 60, '& input': { textAlign: 'center' } }}
                                  />
                                </Box>
                              ))}
                            </Box>
                          </TableCell>
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
    </div>
  );
};

export default WorkloadTab;

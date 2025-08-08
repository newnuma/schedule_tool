import React, { useMemo } from "react";
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { useAppContext } from "../../context/AppContext";

const WorkloadTab: React.FC = () => {
  const { tasks, workloads, people, selectedSubprojectId, phases, assets } = useAppContext();

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

  // 選択されたSubprojectに関連するWorkloadのみをフィルタ
  const filteredWorkloads = useMemo(
    () => {
      const taskIds = filteredTasks.map(t => t.id);
      return workloads.filter((workload) => taskIds.includes(workload.task.id));
    },
    [workloads, filteredTasks]
  );

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
        Workloads ({filteredWorkloads.length})
      </Typography>
      {filteredWorkloads.length > 0 ? (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="workloads table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Person</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell align="right">Hours</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWorkloads.map((workload) => (
                <TableRow
                  key={workload.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {workload.name}
                  </TableCell>
                  <TableCell>{getTaskName(workload.task.id)}</TableCell>
                  <TableCell>{getPersonName(workload.people)}</TableCell>
                  <TableCell>{new Date(workload.start_date).toLocaleDateString()}</TableCell>
                  <TableCell align="right">{workload.hours}h</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No workloads found for this subproject
        </Typography>
      )}
    </div>
  );
};

export default WorkloadTab;

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Typography, Box, Tabs, Tab, Autocomplete, TextField, Switch, FormControlLabel, IconButton, Tooltip } from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import { Main } from "../components/StyledComponents";
import { useAppContext, IPerson } from "../context/AppContext";
import ErrorBoundary from "../components/ErrorBoundary";
import { fetchProjectPage, acquireEditLock, heartbeatEditLock, releaseEditLock } from "../api/bridgeApi";
import AssetTab from "../pages/projectPageTabs/AssetTab";
import TaskTab from "../pages/projectPageTabs/TaskTab";
import WorkloadTab from "../pages/projectPageTabs/WorkloadTab";
import type { ISubproject } from "../context/AppContext";
import { FormProvider } from "../context/FormContext";
import { FormManager } from "../components/forms";
import { useDialogContext } from "../context/DialogContext";

const TabPanel: React.FC<{ children?: React.ReactNode; index: number; value: number }> = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      <Box sx={{ p: 3, display: value === index ? "block" : "none" }}>{children}</Box>
    </div>
  );


const ProjectPage: React.FC = () => {
  const { selectedSubprojectId, setSelectedSubprojectId, subprojects, setLoading,
    addSteps, addPhases, addAssets, addTasks, addPersonWorkloads, addPMMWorkloads, addMilestoneTasks,
    addPeople, setSelectedPersonList, isEditMode, setEditMode,
    phases, assets, tasks, milestoneTasks, personWorkloads, pmmWorkloads, people, workCategories, currentUser } = useAppContext();
  const [tabValue, setTabValue] = useState(0);
  const { openDialog } = useDialogContext();

  // --- 内部コンポーネント定義 ---
  // TabPanel
  
  // SubprojectSelector
  const SubprojectSelector: React.FC<{
    selectedSubproject: ISubproject | undefined;
    subprojects: ISubproject[];
    onChange: (event: any, value: ISubproject | null) => void;
  }> = ({ selectedSubproject, subprojects, onChange }) => {
    // サブプロジェクト名でabc順ソート
    const sortedOptions = [...subprojects].sort((a, b) => a.name.localeCompare(b.name));
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h4" component="span">
          SubProject:
        </Typography>
        <Autocomplete
          value={selectedSubproject || null}
          onChange={(event, newValue) => onChange(event, newValue)}
          options={sortedOptions}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          filterOptions={(options, { inputValue }) =>
            options.filter(option =>
              option.name.toLowerCase().startsWith(inputValue.toLowerCase())
            )
          }
          sx={{ minWidth: 200 }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              size="small"
              placeholder="Select subproject"
            />
          )}
        />
      </Box>
    );
  };

  // EditModeButton
  const EditModeButton: React.FC = () => {
    const editTimeoutId = useRef<NodeJS.Timeout | null>(null);
    const heartbeatId = useRef<NodeJS.Timeout | null>(null);

    const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      if (checked) {
        if (!selectedSubprojectId || !currentUser) return;
        const res = await acquireEditLock(selectedSubprojectId, currentUser.id);
        if (res && res.success === false) {
          openDialog({
            title: "Edit Locked",
            message: `Another user (${res.editingUser?.name || "Unknown"}) is currently editing. Please try again later.`,
            okText: "OK"
          });
          setEditMode(false);
          return;
        }
        setEditMode(true);
        editTimeoutId.current = setTimeout(() => {
          setEditMode(false);
          openDialog({
            title: "Edit Time Expired",
            message: "Edit mode has been turned off after 15 minutes. If you wish to continue editing, please turn on the Edit button again.",
            okText: "OK"
          });
        }, 15 * 60 * 1000);
        heartbeatId.current = setInterval(() => {
          heartbeatEditLock(selectedSubprojectId, currentUser.id);
        }, 60 * 1000);
      } else {
        if (selectedSubprojectId && currentUser) {
          releaseEditLock(selectedSubprojectId, currentUser.id);
        }
        setEditMode(false);
        if (editTimeoutId.current) clearTimeout(editTimeoutId.current);
        if (heartbeatId.current) clearInterval(heartbeatId.current);
        editTimeoutId.current = null;
        heartbeatId.current = null;
      }
    };

    useEffect(() => {
      return () => {
        if (editTimeoutId.current) clearTimeout(editTimeoutId.current);
        if (heartbeatId.current) clearInterval(heartbeatId.current);
      };
    }, [selectedSubprojectId]);

    return (
      <FormControlLabel
        control={
          <Switch
            checked={isEditMode}
            onChange={handleChange}
            color="primary"
            size="medium"
          />
        }
        label={<Typography variant="h6">Edit</Typography>}
        labelPlacement="start"
        sx={{ gap: 1 }}
      />
    );
  };

  function a11yProps(index: number) {
    return {
      id: `project-tab-${index}`,
      'aria-controls': `project-tabpanel-${index}`,
    };
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };


  // 選択されたSubprojectオブジェクトを取得
  const selectedSubproject = subprojects.find(sp => sp.id === selectedSubprojectId);

  // Autocompleteでの選択変更ハンドラー
  const handleSubprojectChange = (event: any, newValue: ISubproject | null) => {
    if (newValue) {
      setSelectedSubprojectId(newValue.id);
    } else {
      setSelectedSubprojectId(undefined);
    }
  };

  // fetchData: サブプロジェクトデータを取得
  const fetchData = useCallback(async () => {
    if (selectedSubprojectId) {
      setLoading(true);
      try {
        const result = await fetchProjectPage(selectedSubprojectId);
        addPhases(result.phases || []);
        addAssets(result.assets || []);
        addTasks(result.tasks || []);
        addMilestoneTasks(result.milestoneTasks || []);
        addPersonWorkloads(result.personworkloads || []);
        addPMMWorkloads(result.pmmworkloads || []);
      } catch (error: any) {
        openDialog({
          title: "Error",
          message: `Failed to fetch subproject data. '\n${error.message}`,
          okText: "OK"
        });
        console.error('Failed to fetch subproject data:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [selectedSubprojectId, setLoading, addPhases, addAssets, addTasks, addMilestoneTasks, addPersonWorkloads, addPMMWorkloads]);

  // Subprojectが選択されたときにデータを取得
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- サブプロジェクト関連データのフィルタリング ---
  const currentSubproject = subprojects.find(sp => sp.id === selectedSubprojectId);
  // Phase
  const filteredPhases = phases.filter(p => p.subproject.id === selectedSubprojectId);
  // Asset（Phaseに紐づく）
  const filteredAssets = assets.filter(a => filteredPhases.map(p => p.id).includes(a.phase.id));
  // Task（Assetに紐づく）
  const filteredTasks = tasks.filter(t => filteredAssets.map(a => a.id).includes(t.asset.id));
  // MilestoneTask（AssetのPhaseに紐づく）
  const assetById = new Map(assets.map(a => [a.id, a]));
  const filteredMilestoneTasks = milestoneTasks.filter(ms => {
    const parentAsset = assetById.get(ms.asset.id);
    return parentAsset && filteredPhases.map(p => p.id).includes(parentAsset.phase.id);
  });
  // PersonWorkload（Task, Subprojectに紐づく）
  const filteredPersonWorkloads = personWorkloads.filter(w => {
    return w.subproject?.id === selectedSubprojectId && w.task && filteredTasks.map(t => t.id).includes(w.task.id);
  });
  // PMMWorkload（Subprojectに紐づく）
  const filteredPMMWorkloads = pmmWorkloads.filter(w => w.subproject.id === selectedSubprojectId);

  // アクセス権に基づくアサイン可能なユーザーリスト
  let assignablePeople = [] as IPerson[];
  if (currentSubproject?.access === "Common") {
    assignablePeople = people
  } else if (currentSubproject?.access === "Project Team") {
    const departmentPeople = people.filter(p => p.department === currentSubproject?.department);
    const projectPeople = people.filter(p => p.project?.some(proj => proj.id === currentSubproject.id));
    assignablePeople = [...departmentPeople, ...projectPeople];
  } else if (currentSubproject?.access === "High Confidential") {
    assignablePeople = people.filter(p => p.project?.some(proj => proj.id === currentSubproject.id));
  }

  return (
    <FormProvider>
      <Main component="main">
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, pr: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
            <SubprojectSelector
              selectedSubproject={selectedSubproject}
              subprojects={subprojects}
              onChange={handleSubprojectChange}
            />
            <Tooltip title="Reload">
              <span>
                <IconButton onClick={fetchData} disabled={!selectedSubprojectId} size="large" color="primary">
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          <EditModeButton />
        </Box>

        {selectedSubprojectId ? (
          <ErrorBoundary>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="project tabs">
                <Tab label="Asset" {...a11yProps(0)} />
                <Tab label="Task" {...a11yProps(1)} />
                <Tab label="Workload" {...a11yProps(2)} />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <AssetTab
                phases={filteredPhases}
                assets={filteredAssets}
                milestoneTasks={filteredMilestoneTasks}
                isEditMode={isEditMode}
                selectedSubprojectId={selectedSubprojectId}
              />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <TaskTab
                phases={filteredPhases}
                assets={filteredAssets}
                tasks={filteredTasks}
                isEditMode={isEditMode}
                selectedSubprojectId={selectedSubprojectId}
                people={assignablePeople}
              />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <WorkloadTab
                phases={filteredPhases}
                assets={filteredAssets}
                tasks={filteredTasks}
                personWorkloads={filteredPersonWorkloads}
                pmmWorkloads={filteredPMMWorkloads}
                people={assignablePeople}
                workCategories={workCategories}
                currentSubproject={currentSubproject}
                isEditMode={isEditMode}
              />
            </TabPanel>
          </ErrorBoundary>
        ) : (
          <Typography variant="h6" color="text.secondary">
            Please select a subproject to view details
          </Typography>
        )}
        <FormManager />
      </Main>
    </FormProvider>
  );
};

export default ProjectPage;

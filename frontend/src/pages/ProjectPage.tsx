import React, { useState, useEffect } from "react";
import { Typography, Box, Tabs, Tab, Autocomplete, TextField, Switch, FormControlLabel } from "@mui/material";
import { Main } from "../components/StyledComponents";
import { useAppContext } from "../context/AppContext";
import ErrorBoundary from "../components/ErrorBoundary";
import { fetchProjectPage } from "../api/bridgeApi";
import AssetTab from "../pages/projectPageTabs/AssetTab";
import TaskTab from "../pages/projectPageTabs/TaskTab";
import WorkloadTab from "../pages/projectPageTabs/WorkloadTab";
import type { ISubproject } from "../context/AppContext";
import { FormProvider } from "../context/FormContext";
import { FormManager } from "../components/forms";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface SubprojectSelectorProps {
  selectedSubproject: ISubproject | undefined;
  subprojects: ISubproject[];
  onChange: (event: any, value: ISubproject | null) => void;
  isEditMode: boolean;
  setEditMode: (enabled: boolean) => void;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function SubprojectSelector({ selectedSubproject, subprojects, onChange, isEditMode, setEditMode }: SubprojectSelectorProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, pr: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h5" component="span">
          SubProject:
        </Typography>
        <Autocomplete
          value={selectedSubproject || null}
          onChange={(event, newValue) => onChange(event, newValue)}
          options={subprojects}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
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
      <FormControlLabel
        control={
          <Switch
            checked={isEditMode}
            onChange={(event) => setEditMode(event.target.checked)}
            color="primary"
            size="medium"
          />
        }
        label={<Typography variant="h6">Edit</Typography>}
        labelPlacement="start"
        sx={{ gap: 1 }}
      />
    </Box>
  );
}

function a11yProps(index: number) {
  return {
    id: `project-tab-${index}`,
    'aria-controls': `project-tabpanel-${index}`,
  };
}

const ProjectPage: React.FC = () => {
  const { selectedSubprojectId, setSelectedSubprojectId, subprojects, setLoading, addSteps, addPhases, addAssets, addTasks, addPersonWorkloads, addPMMWorkloads, addPeople, setSelectedPersonList, isEditMode, setEditMode, createPhase, createAsset, createTask } = useAppContext();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  console.log("Selected Subproject ID:", selectedSubprojectId);

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

  // Subprojectが選択されたときにデータを取得
  useEffect(() => {
    const fetchData = async () => {
      if (selectedSubprojectId) {
        try {
          setLoading(true);
          const result = await fetchProjectPage(selectedSubprojectId);
          addPhases(result.phases || []);
          addAssets(result.assets || []);
          addTasks(result.tasks || []);
          addPersonWorkloads(result.personworkloads || []);
          addPMMWorkloads(result.pmmworkloads || []);
          console.log('Subproject data fetched for ID:', selectedSubprojectId);
        } catch (error) {
          console.error('Failed to fetch subproject data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [selectedSubprojectId, setLoading]);

  return (
    <FormProvider
      onPhaseSubmit={createPhase}
      onAssetSubmit={createAsset}
      onTaskSubmit={createTask}
    >
      <Main component="main">
        <SubprojectSelector
          selectedSubproject={selectedSubproject}
          subprojects={subprojects}
          onChange={handleSubprojectChange}
          isEditMode={isEditMode}
          setEditMode={setEditMode}
        />

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
              <AssetTab />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <TaskTab />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <WorkloadTab />
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

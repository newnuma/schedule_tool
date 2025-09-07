import React, { useEffect, useState } from "react";
import { Typography, Box, Tabs, Tab } from "@mui/material";
import { Main } from "../components/StyledComponents";
import ErrorBoundary from "../components/ErrorBoundary";
import AssinmentTask from "./assignmentPageTabs/AssinmentTask";
import AssinmentWorkload from "./assignmentPageTabs/AssinmentWorkload";
import { useFilterContext } from "../context/FilterContext";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`assignment-tabpanel-${index}`}
      aria-labelledby={`assignment-tab-${index}`}
      {...other}
    >
      <Box sx={{ p: 3, display: value === index ? 'block' : 'none' }}>{children}</Box>
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `assignment-tab-${index}`,
    'aria-controls': `assignment-tabpanel-${index}`,
  };
}

const AssignmentPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { filters, setDateRangeFilter } = useFilterContext();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Main component="main">
      <Typography variant="h4" gutterBottom>
        Assignment
      </Typography>
      <ErrorBoundary>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="assignment tabs">
            <Tab label="Task" {...a11yProps(0)} />
            <Tab label="Workload" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <AssinmentTask />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <AssinmentWorkload />
        </TabPanel>
      </ErrorBoundary>
    </Main>
  );
};

export default AssignmentPage;

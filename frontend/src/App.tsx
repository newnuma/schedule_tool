import { AppBar, CircularProgress, Toolbar, Box } from "@mui/material";
import {
  Layout,
  Content,
  HeaderTitle,
  OverlayBackdrop,
} from "./components/StyledComponents";
import { useAppContext } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import DistributePage from "./pages/DistributePage";
import ProjectPage from "./pages/ProjectPage";
import AssignmentPage from "./pages/AssignmentPage";

const App = () => {
  const { currentPage, loading } = useAppContext();

  return (
      <Layout>
        <Sidebar />
        <Content>
          <AppBar position="static">
          </AppBar>
          <Box sx={{ display: currentPage === 'Distribute' ? 'block' : 'none' }}>
            <DistributePage />
          </Box>
          <Box sx={{ display: currentPage === 'Project' ? 'block' : 'none' }}>
            <ProjectPage />
          </Box>
          <Box sx={{ display: currentPage === 'Assignment' ? 'block' : 'none' }}>
            <AssignmentPage />
          </Box>
        </Content>
        <OverlayBackdrop open={loading}>
          <CircularProgress color="inherit" />
        </OverlayBackdrop>
      </Layout>
  );
};

export default App;

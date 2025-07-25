import { AppBar, CircularProgress, Toolbar } from "@mui/material";
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
          <Toolbar>
            <HeaderTitle variant="h6" component="div">
              共通ヘッダー
            </HeaderTitle>
          </Toolbar>
        </AppBar>
        {currentPage === "Distribute" && <DistributePage />}
        {currentPage === "Project" && <ProjectPage />}
        {currentPage === "Assignment" && <AssignmentPage />}
      </Content>
      <OverlayBackdrop open={loading}>
        <CircularProgress color="inherit" />
      </OverlayBackdrop>
    </Layout>
  );
};

export default App;

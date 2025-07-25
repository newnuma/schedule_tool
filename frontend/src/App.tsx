import {
  AppBar,
  Backdrop,
  Box,
  CircularProgress,
  Toolbar,
  Typography,
} from "@mui/material";
import { useAppContext } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import DistributePage from "./pages/DistributePage";
import ProjectPage from "./pages/ProjectPage";
import AssignmentPage from "./pages/AssignmentPage";

const App = () => {
  const { currentPage, loading } = useAppContext();

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              共通ヘッダー
            </Typography>
          </Toolbar>
        </AppBar>
        {currentPage === "Distribute" && <DistributePage />}
        {currentPage === "Project" && <ProjectPage />}
        {currentPage === "Assignment" && <AssignmentPage />}
      </Box>
      <Backdrop
        open={loading}
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default App;

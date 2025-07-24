import { useAppContext } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import DistributePage from "./pages/DistributePage";
import ProjectPage from "./pages/ProjectPage";
import AssignmentPage from "./pages/AssignmentPage";

const App = () => {
  const { currentPage, loading } = useAppContext();

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <header>共通ヘッダー</header>
        {currentPage === "Distribute" && <DistributePage />}
        {currentPage === "Project" && <ProjectPage />}
        {currentPage === "Assignment" && <AssignmentPage />}
      </div>
      {loading && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(255,255,255,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div>Loading...</div>
        </div>
      )}
    </div>
  );
};

export default App;

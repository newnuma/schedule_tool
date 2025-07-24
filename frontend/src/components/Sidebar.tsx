import React from "react";
import { useAppContext } from "../context/AppContext";

const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage } = useAppContext();

  return (
    <nav style={{ width: 150, background: "#cbe7f5", minHeight: "100vh", paddingTop: 32 }}>
      <button
        style={{ width: "100%", padding: 16, background: currentPage === "Distribute" ? "#50b3e0" : undefined, border: "none" }}
        onClick={() => setCurrentPage("Distribute")}
      >
        Distribute
      </button>
      <button
        style={{ width: "100%", padding: 16, background: currentPage === "Project" ? "#50b3e0" : undefined, border: "none" }}
        onClick={() => setCurrentPage("Project")}
      >
        Project
      </button>
      <button
        style={{ width: "100%", padding: 16, background: currentPage === "Assignment" ? "#50b3e0" : undefined, border: "none" }}
        onClick={() => setCurrentPage("Assignment")}
      >
        Assignment
      </button>
    </nav>
  );
};

export default Sidebar;

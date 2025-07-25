import React from "react";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderIcon from "@mui/icons-material/Folder";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import { useAppContext } from "../context/AppContext";
import { SideDrawer } from "./StyledComponents";

const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage } = useAppContext();

  return (
    <SideDrawer variant="permanent">
      <List>
        <ListItem disablePadding>
          <ListItemButton
            selected={currentPage === "Distribute"}
            onClick={() => setCurrentPage("Distribute")}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Distribute" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            selected={currentPage === "Project"}
            onClick={() => setCurrentPage("Project")}
          >
            <ListItemIcon>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText primary="Project" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            selected={currentPage === "Assignment"}
            onClick={() => setCurrentPage("Assignment")}
          >
            <ListItemIcon>
              <AssignmentIndIcon />
            </ListItemIcon>
            <ListItemText primary="Assignment" />
          </ListItemButton>
        </ListItem>
      </List>
    </SideDrawer>
  );
};

export default Sidebar;

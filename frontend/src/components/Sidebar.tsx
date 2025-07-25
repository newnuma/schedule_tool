import React from "react";
import {
  Drawer,
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

const drawerWidth = 180;

const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage } = useAppContext();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          pt: 4,
        },
      }}
    >
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
    </Drawer>
  );
};

export default Sidebar;

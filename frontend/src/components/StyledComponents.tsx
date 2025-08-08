import {
  Box,
  Typography,
  Drawer,
  Backdrop,
  type TypographyProps,
  type BoxProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";

export const Layout = styled(Box)({
  display: "flex",
});

export const Content = styled(Box)({
  flexGrow: 1,
});

export const HeaderTitle = styled(Typography)<TypographyProps>({
  flexGrow: 1,
});

export const OverlayBackdrop = styled(Backdrop)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
}));

export const Main = styled(Box)<BoxProps>(({ theme }) => ({
  padding: theme.spacing(3),
}));

export const drawerWidth = 180;
export const SideDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  [`.MuiDrawer-paper`]: {
    width: drawerWidth,
    boxSizing: "border-box",
    paddingTop: theme.spacing(4),
  },
}));

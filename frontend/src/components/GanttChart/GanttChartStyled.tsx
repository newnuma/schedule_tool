import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

export const GanttContainer = styled(Box)<{ h: number | string }>(({ h }) => ({
  width: "100%",
  height: h,
  position: "relative",
  // マイルストーン用のCSSスタイル
  "& .vis-item.milestone": {
    backgroundColor: "#2196f3",
    borderColor: "#1976d2",
    borderRadius: "50%",
    width: "12px !important",
    height: "12px !important",
  },
  "& .vis-item.vis-point": {
    backgroundColor: "#2196f3",
    borderColor: "#1976d2",
    borderRadius: "50%",
    width: "12px !important",
    height: "12px !important",
  },
  // Asset用のスタイル
  "& .vis-item.completed": {
    backgroundColor: "#4caf50",
    borderColor: "#388e3c",
  },
  "& .vis-item.in-progress": {
    backgroundColor: "#ff9800",
    borderColor: "#f57c00",
  },
  "& .vis-item.not-started": {
    backgroundColor: "#9e9e9e",
    borderColor: "#616161",
  },
}));

export const NoDataBox = styled(Box)(({ theme }) => ({
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
}));

export const TimelineBox = styled(Box)({
  width: "100%",
  height: "100%",
});

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

export const GanttContainer = styled(Box)<{ h: number | string }>(({ h }) => ({
  width: "100%",
  // 指定値は最大高さとして扱い、データ量が少なければ縮む
  maxHeight: h,
  height: "auto",
  position: "relative",
  overflowY: "auto", // 縦スクロールのみ表示
  overflowX: "hidden", // 横スクロールは隠す（パン操作はそのまま）
  // マイルストーン（フェーズ）の表示: 丸 + テキスト
  "& .vis-item.milestone, & .vis-item.vis-point": {
    background: "transparent !important",
    border: "none !important",
    padding: "0 !important",
    margin: "0 !important",
  },
  "& .vis-item.milestone .vis-item-content, & .vis-item.vis-point .vis-item-content": {
    display: "flex",
    alignItems: "center",
    padding: "0 !important",
    margin: "0 !important",
    background: "transparent",
    border: "none",
  fontSize: "13px", // 文字を少し大きく
    lineHeight: 1.2,
    fontWeight: 500,
    color: "#1a1a1a",
    whiteSpace: "nowrap",
  },
  "& .vis-item.milestone .vis-item-content::before, & .vis-item.vis-point .vis-item-content::before": {
    content: "''",
    display: "inline-block",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#2196f3",
    border: "2px solid #1976d2",
    boxSizing: "border-box",
    marginRight: "6px",
    flexShrink: 0,
  },
  // Phase行の背景色（ラベル & アイテム側）
  // vis-timeline DOM 構造に合わせて複数指定（ラベルセット/アイテムセット）
  "& .vis-labelset .vis-label[data-groupid='phase-group']": {
    backgroundColor: "#e8f5ff !important",
  },
  "& .vis-labelset .vis-label[data-groupid='phase-group'] .vis-inner": {
    backgroundColor: "#e8f5ff !important",
  },
  "& .vis-group[data-groupid='phase-group']": {
    backgroundColor: "#e8f5ff !important",
  },
  "& .vis-group[data-groupid='phase-group'] .vis-itemset": {
    backgroundColor: "#e8f5ff !important",
  },
  // className指定によるフェーズ行背景（フォールバック）
  "& .vis-group.phase-row, & .vis-label.phase-row, & .vis-group.phase-row .vis-itemset": {
    backgroundColor: "#e8f5ff !important",
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
  // 背景アイテムのスタイル（薄い色で後ろに）
  "& .vis-item.vis-background": {
    backgroundColor: "rgba(33, 150, 243, 0.08)",
    borderColor: "transparent",
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
  // 親がauto高さのため子もauto。timeline内部で高さ計算される。
  height: "auto",
});

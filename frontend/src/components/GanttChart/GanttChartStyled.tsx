import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

export const GanttContainer = styled(Box)<{ h: number | string }>(({ h }) => ({
  // ====== Phase行（phase-group）上のバーにも透明度を反映 ======
  "& .vis-group[data-groupid='phase-group'] .vis-item.phase-bar-design": {
    backgroundColor: "rgba(33, 150, 243, 0.35) !important",
    borderColor: "#1976d2 !important",
  },
  "& .vis-group[data-groupid='phase-group'] .vis-item.phase-bar-prodt": {
    backgroundColor: "rgba(229, 57, 53, 0.35) !important",
    borderColor: "#e53935 !important",
  },
  "& .vis-group[data-groupid='phase-group'] .vis-item.phase-bar-eng": {
    backgroundColor: "rgba(67, 160, 71, 0.35) !important",
    borderColor: "#43a047 !important",
  },
  width: "100%",
  // 指定値は最大高さとして扱い、データ量が少なければ縮む
  maxHeight: h,
  height: "auto",
  position: "relative",
  overflowY: "auto", // 縦スクロールのみ表示
  overflowX: "hidden", // 横スクロールは隠す（パン操作はそのまま）
  // マイルストーン（MilestoneTasks）用のベーススタイル
  "& .vis-item.milestone": {
    background: "transparent !important",
    border: "none !important",
    padding: "0 !important",
    margin: "0 !important",
  },
  "& .vis-item.milestone .vis-item-content": {
    display: "flex",
    alignItems: "center",
    padding: "0 !important",
    margin: "0 !important",
    background: "transparent",
    border: "none",
    fontSize: "14px", // 文字を少し大きく
    lineHeight: 1.2,
    fontWeight: 500,
    color: "#1a1a1a", // currentColor を図形に使用
    whiteSpace: "nowrap",
  },
  // Milestone の丸マーカー
  "& .vis-item.milestone .vis-item-content::before": {
    content: '""',
    display: "inline-block",
    width: "11px",
    height: "11px",
    borderRadius: "50%",
    background: "#0e69f1ff",
    border: "none",
    boxSizing: "border-box",
    marginRight: "6px",
    flexShrink: 0,
  },
  // ====== MilestoneTasks 形状（種類別） ======
  // ms-receive: ダイヤ（枠のみ）♢
  "& .vis-item.milestone.ms-receive .vis-item-content::before": {
    background: "transparent",
    border: "2px solid currentColor",
    borderRadius: 0,
    transform: "rotate(45deg)",
    width: "10px",
    height: "10px",
  },
  // ms-release: 三角 ▲
  "& .vis-item.milestone.ms-release .vis-item-content::before": {
    width: 0,
    height: 0,
    background: "transparent",
    borderRadius: 0,
    borderLeft: "6px solid transparent",
    borderRight: "6px solid transparent",
    borderBottom: "11px solid currentColor",
    transform: "none",
    boxSizing: "content-box",
  },
  // ms-review: 塗り丸 ●
  "& .vis-item.milestone.ms-review .vis-item-content::before": {
    background: "currentColor",
    border: "none",
    borderRadius: "50%",
    width: "11px",
    height: "11px",
    transform: "none",
  },
  // ms-dr: 二重丸 ◎（
  "& .vis-item.milestone.ms-dr .vis-item-content": {
    position: "relative",
  },
  // DESIGN: 青丸
  "& .vis-item.phase-ms-design .vis-item-content::before": {
    background: "#2196f3",
    border: "2px solid #1976d2",
    borderRadius: "50%",
    width: "12px",
    height: "12px",
    marginRight: "6px",
  },
  // PRODT: 赤三角
  "& .vis-item.phase-ms-prodt .vis-item-content::before": {
    width: 0,
    height: 0,
    background: "transparent",
    borderLeft: "7px solid transparent",
    borderRight: "7px solid transparent",
    borderBottom: "13px solid #e53935",
    marginRight: "6px",
  },
  // ENG: 緑四角
  "& .vis-item.phase-ms-eng .vis-item-content::before": {
    background: "#43a047",
    border: "2px solid #388e3c",
    borderRadius: "2px",
    width: "12px",
    height: "12px",
    marginRight: "6px",
  },

  // ====== Phase Bar 色分け（typeごと） ======
  // DESIGN: 青（透明度追加）
  // このCSSは全ページ共通で適用されるため、他ページのバーにも自動的に反映されます。
  "& .vis-item.phase-bar-design": {
    backgroundColor: "rgba(33, 150, 243, 0.35)",
    borderColor: "#1976d2",
  },
  // PRODT: 赤（透明度追加）
  "& .vis-item.phase-bar-prodt": {
    backgroundColor: "rgba(229, 57, 53, 0.35)",
    borderColor: "#e53935",
  },
  // ENG: 緑（透明度追加）
  "& .vis-item.phase-bar-eng": {
    backgroundColor: "rgba(67, 160, 71, 0.35)",
    borderColor: "#43a047",
  },


  "& .vis-item.milestone.ms-dr .vis-item-content::before": {
    background: "transparent",
    border: "2px solid currentColor",
    width: "11px",
    height: "11px",
    borderRadius: "50%",
  },
  // ==========================================
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

  // ========= Phase行専用オーバーライド =========
  // ラベル表示（Phaseは非表示にしない）
  "& .vis-group[data-groupid='phase-group'] .vis-item.vis-point .vis-item-content, & .vis-item.phase-point .vis-item-content": {
    // 例: フォントを強調
    fontSize: "11px",
    fontWeight: 600,
    lineHeight: 1,
    color: "#1a1a1a",
  },
  // Phaseの丸アイコンを青色に
  "& .vis-group[data-groupid='phase-group'] .vis-item.vis-point .vis-item-content::before": {
    content: '""',
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
  // 例: Phaseのポイントアイテムの内側余白を微調整（任意）
  "& .vis-group[data-groupid='phase-group'] .vis-item.vis-point": {
    padding: "0 2px",
  },
  // ============================================
  // Status styles for items (wtg/ip/fin) - rgba形式に統一
  "& .vis-item.status-fin": {
    backgroundColor: "rgba(76, 175, 80, 0.65)", // #4caf50
    borderColor: "rgba(56, 142, 60, 0.85)",    // #388e3c
  },
  "& .vis-item.status-ip": {
    backgroundColor: "rgba(255, 152, 0, 0.65)", // #ff9800
    borderColor: "rgba(245, 124, 0, 0.85)",    // #f57c00
  },
  "& .vis-item.status-wtg": {
    backgroundColor: "rgba(158, 158, 158, 0.65)", // #9e9e9e
    borderColor: "rgba(97, 97, 97, 0.85)",       // #616161
  },
  // 背景アイテムのスタイル（薄い色で後ろに）
  "& .vis-item.vis-background": {
    backgroundColor: "rgba(33, 150, 243, 0.08)",
    borderColor: "transparent",
  },
  // ====== assigneesが空のタスクアイテム枠線 ======
  "& .vis-item.no-assignee": {
    borderWidth: "3px !important",
    borderColor: "#e53935 !important", // 赤
  },
  // ====== 週末背景色（グリッド） ======
  // 土曜・日曜のグリッド背景色と文字色を変更
  '& .vis-time-axis .vis-grid.vis-saturday, & .vis-time-axis .vis-grid.vis-sunday': {
    background: '#f5f5f5',
  },
  '& .vis-time-axis .vis-text.vis-saturday, & .vis-time-axis .vis-text.vis-sunday': {
    color: '#888',
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

// vis-timelineをラップしたガントチャート描画コンポーネント
// 各ページで再利用可能
import React, { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import {
  DataSet,
  Timeline,
  TimelineOptions,
  TimelineItem,
} from "vis-timeline/standalone"; // vis-timelineをimport
import "vis-timeline/styles/vis-timeline-graph2d.min.css"; // 必要なCSSもimport

// データ型定義（propsを型安全に！）
export interface GanttItem {
  id: number | string;
  group: number | string;
  content: string;
  start: string | Date;
  end?: string | Date;
  className?: string; // 色分けなど
}

export interface GanttGroup {
  id: number | string;
  content: string;
}

export interface GanttChartProps {
  items?: GanttItem[];
  groups?: GanttGroup[];
  options?: TimelineOptions;
  height?: string | number;
}

const GanttChart: React.FC<GanttChartProps> = ({
  items = [],
  groups,
  options,
  height = 400,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 既にTimelineインスタンスがある場合はdestroyして再生成
    if (timelineRef.current) {
      timelineRef.current.destroy();
    }

    const dataSet = new DataSet(items);
    let groupSet;
    if (groups) {
      groupSet = new DataSet(groups);
    }

    if (items.length > 0) {
      timelineRef.current = groups
        ? new Timeline(containerRef.current, dataSet, groupSet, {
            stack: false,
            orientation: "top",
            ...options,
            height,
          })
        : new Timeline(containerRef.current, dataSet, {
            stack: false,
            orientation: "top",
            ...options,
            height,
          });
    }
    // クリーンアップ
    return () => {
      timelineRef.current?.destroy();
    };
  }, [
    JSON.stringify(items),
    JSON.stringify(groups),
    JSON.stringify(options),
    height,
  ]); // データ・オプション変化で再描画

  return (
    <Box sx={{ width: "100%", height, position: "relative" }}>
      {items.length === 0 && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          No data
        </Box>
      )}
      <Box ref={containerRef} sx={{ width: "100%", height: "100%" }} />
    </Box>
  );
};

export default GanttChart;

// vis-timelineをラップしたガントチャート描画コンポーネント
// 各ページで再利用可能
import React, { useEffect, useRef, useMemo } from "react";
import {
  GanttContainer,
  NoDataBox,
  TimelineBox,
} from "./GanttChartStyled";
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
  type?: 'range' | 'point' | 'box'; // マイルストーン用のtypeを追加
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

  // データセットをメモ化して不要な再描画を防ぐ
  const memoizedItems = useMemo(() => items, [JSON.stringify(items)]);
  const memoizedGroups = useMemo(() => groups, [JSON.stringify(groups)]);
  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 既にTimelineインスタンスがある場合はdestroyして再生成
    if (timelineRef.current) {
      try {
        timelineRef.current.destroy();
        timelineRef.current = null;
      } catch (error) {
        console.warn("Error destroying timeline:", error);
        timelineRef.current = null;
      }
    }

    const dataSet = new DataSet(memoizedItems);
    let groupSet: DataSet<GanttGroup> | undefined;
    if (memoizedGroups) {
      groupSet = new DataSet(memoizedGroups);
    }

    if (memoizedItems.length > 0) {
      try {
        const defaultOptions: TimelineOptions = {
          stack: false,
          orientation: "top",
          ...memoizedOptions,
          height,
        };

        if (memoizedGroups && memoizedGroups.length > 0 && groupSet) {
          timelineRef.current = new Timeline(containerRef.current, dataSet, groupSet, defaultOptions);
        } else {
          timelineRef.current = new Timeline(containerRef.current, dataSet, defaultOptions);
        }
      } catch (error) {
        console.error("Error creating timeline:", error);
      }
    }
    // クリーンアップ
    return () => {
      if (timelineRef.current) {
        try {
          timelineRef.current.destroy();
          timelineRef.current = null;
        } catch (error) {
          console.warn("Error destroying timeline in cleanup:", error);
          timelineRef.current = null;
        }
      }
    };
  }, [memoizedItems, memoizedGroups, memoizedOptions, height]);

  return (
    <GanttContainer h={height}>
      {memoizedItems.length === 0 && <NoDataBox>No data</NoDataBox>}
      <TimelineBox ref={containerRef} />
    </GanttContainer>
  );
};

export default GanttChart;

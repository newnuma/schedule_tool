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
  start: string | Date | null | undefined;
  end?: string | Date | null | undefined;
  type?: 'range' | 'point' | 'box'; // マイルストーン用のtypeを追加
  className?: string; // 色分けなど
}

// vis-timeline用の内部型（nullが除外された状態）
interface ValidGanttItem {
  id: number | string;
  group: number | string;
  content: string;
  start: string | Date;
  end?: string | Date;
  type?: 'range' | 'point' | 'box';
  className?: string;
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
  // start/endがnullやundefinedのアイテムを除外し、vis-timeline互換の型に変換
  const memoizedItems = useMemo(() => {
    const validItems: ValidGanttItem[] = items
      .filter(item => {
        // startは必須
        if (!item.start) {
          console.warn(`Item ${item.id} has no start date, excluding from chart`, item);
          return false;
        }
        // typeがpointの場合はendは必須ではない
        if (item.type === 'point') {
          return true;
        }
        // range/boxタイプの場合はendも必要
        if (!item.end) {
          console.warn(`Item ${item.id} has no end date, excluding from chart`, item);
          return false;
        }
        return true;
      })
      .map(item => ({
        id: item.id,
        group: item.group,
        content: item.content,
        start: item.start!,
        end: item.end || undefined,
        type: item.type,
        className: item.className
      }));
    return validItems;
  }, [JSON.stringify(items)]);
  
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

    const dataSet = new DataSet<ValidGanttItem, 'id'>(memoizedItems);
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

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
  subgroup?: number | string;
  subgroupOrder?: number;
  content: string;
  start: string | Date | null | undefined;
  end?: string | Date | null | undefined;
  type?: 'range' | 'point' | 'box' | 'background'; // 背景表示用のtypeも許可
  className?: string; // 色分けなど
  style?: string; // CSS文字列
  tooltipHtml?: string;
}

// vis-timeline用の内部型（nullが除外された状態）
interface ValidGanttItem {
  id: number | string;
  group: number | string;
  subgroup?: number | string;
  subgroupOrder?: number;
  content: string;
  start: string | Date;
  end?: string | Date;
  type?: 'range' | 'point' | 'box' | 'background';
  className?: string;
  title?: string; // vis-timeline の hover ツールチップ用プロパティ
  style?: string; // vis-timeline用: CSS文字列
}

export interface GanttGroup {
  id: number | string;
  content: string;
  className?: string; // allow styling of specific group rows
}

export interface GanttChartProps {
  items?: GanttItem[];
  groups?: GanttGroup[];
  options?: TimelineOptions;
  height?: string | number;
  onItemRightClick?: (itemId: number | string, itemName: string, event: MouseEvent) => void;
  // アイテムからツールチップ (HTML 文字列) を生成するコールバック。item.tooltipHtml が優先される。
  getItemTooltip?: (item: GanttItem) => string | undefined;
  // グループ（左列ラベル）のクリック/右クリックイベント
  onGroupClick?: (groupId: number | string, group: GanttGroup, event: MouseEvent) => void;
  onGroupRightClick?: (groupId: number | string, group: GanttGroup, event: MouseEvent) => void;
}

export function getTooltipHtml(items: [string, any][]): string {
  const MAX_LINE_LENGTH = 40;
  function wrapValue(text: string | number | null | undefined): string {
    if (typeof text !== 'string') return String(text ?? '');
    let result = '';
    let i = 0;
    while (i < text.length) {
      result += text.slice(i, i + MAX_LINE_LENGTH);
      if (i + MAX_LINE_LENGTH < text.length) {
        result += '<br />';
      }
      i += MAX_LINE_LENGTH;
    }
    return result;
  }

  return `<div>${items.map(([title, value]) => {
    const valueStr = value == null ? '' : String(value);
    const totalLen = title.length + valueStr.length;
    if (totalLen > MAX_LINE_LENGTH) {
      // タイトルの下にvalueを表示（先頭に改行）
      return `<div><strong>${title}:</strong><br />${wrapValue(valueStr)}<br /></div>`;
    } else {
      // タイトルの横にvalueを表示
      return `<div><strong>${title}:</strong> ${valueStr}<br /></div>`;
    }
  }).join('')}</div>`;
}

const GanttChart: React.FC<GanttChartProps> = ({
  items = [],
  groups,
  options,
  height = 500,
  onItemRightClick,
  getItemTooltip,
  onGroupClick,
  onGroupRightClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const eventListenerRef = useRef<((event: MouseEvent) => void) | null>(null);
  const dataSetRef = useRef<DataSet<ValidGanttItem, 'id'> | null>(null);
  const groupSetRef = useRef<DataSet<GanttGroup> | undefined>(undefined);

  // データセットをメモ化して不要な再描画を防ぐ
  // start/endがnullやundefinedのアイテムを除外し、vis-timeline互換の型に変換
  // options.stackがfalseならsubgroup/subgroupOrderを除去
  const memoizedItems = useMemo(() => {
    const stackOption = options?.stack;
    const validItems: ValidGanttItem[] = items
      .filter(item => {
        if (!item.start) return false;
        if (item.type === 'point') return true;
        if (!item.end) return false;
        return true;
      })
      .map(item => {
        const base = {
          id: item.id,
          group: item.group,
          content: item.content,
          start: item.start!,
          end: item.end || undefined,
          type: item.type,
          className: item.className,
          title: item.tooltipHtml || getItemTooltip?.(item),
          ...(item.style ? { style: item.style } : {}),
        };
        if (stackOption === false) {
          return base;
        } else {
          return {
            ...base,
            subgroup: item.subgroup,
            subgroupOrder: item.subgroupOrder,
          };
        }
      });
    return validItems;
  }, [JSON.stringify(items), getItemTooltip, options?.stack]);
  
  const memoizedGroups = useMemo(() => groups, [JSON.stringify(groups)]);
  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)]);

  // 初期化: containerRefがセットされた時のみTimeline生成
  useEffect(() => {
    if (!containerRef.current || timelineRef.current) return;
    // 初期データセット
    dataSetRef.current = new DataSet<ValidGanttItem, 'id'>(memoizedItems);
    if (memoizedGroups) {
      groupSetRef.current = new DataSet(memoizedGroups);
    }
    // オプション生成
    const stackValue = memoizedOptions?.stack ?? true;
    const defaultOptions: TimelineOptions = {
      orientation: "top",
      stack: stackValue,
      maxHeight: typeof height === 'string' ? height : `${height}px`,
      verticalScroll: true,
      margin: { item: { horizontal: 0, vertical: 8 }, axis: 5 },
      tooltip: { followMouse: true },
      ...(stackValue ? { subgroupOrder: 'subgroupOrder' } : {}),
      ...memoizedOptions,
    } as TimelineOptions;
    // グループラベルクリック/右クリック
    if ((onGroupClick || onGroupRightClick)) {
      (defaultOptions as any).groupTemplate = (group: any, element: HTMLElement) => {
        if (element) {
          element.textContent = group?.content ?? '';
          element.style.cursor = (onGroupClick || onGroupRightClick) ? 'pointer' : '';
          const elAny = element as any;
          if (!elAny.__hasGroupHandlers) {
            if (onGroupClick) {
              element.addEventListener('click', (ev: Event) => {
                onGroupClick(group.id, group as GanttGroup, ev as MouseEvent);
              });
            }
            if (onGroupRightClick) {
              element.addEventListener('contextmenu', (ev: Event) => {
                ev.preventDefault();
                onGroupRightClick(group.id, group as GanttGroup, ev as MouseEvent);
              });
            }
            elAny.__hasGroupHandlers = true;
          }
          return element;
        }
        const div = document.createElement('div');
        div.textContent = group?.content ?? '';
        div.style.cursor = (onGroupClick || onGroupRightClick) ? 'pointer' : '';
        if (onGroupClick) {
          div.addEventListener('click', (ev: Event) => {
            onGroupClick(group.id, group as GanttGroup, ev as MouseEvent);
          });
        }
        if (onGroupRightClick) {
          div.addEventListener('contextmenu', (ev: Event) => {
            ev.preventDefault();
            onGroupRightClick(group.id, group as GanttGroup, ev as MouseEvent);
          });
        }
        return div;
      };
    }
    // Timeline生成
    if (memoizedGroups && memoizedGroups.length > 0 && groupSetRef.current) {
      timelineRef.current = new Timeline(containerRef.current, dataSetRef.current, groupSetRef.current, defaultOptions);
    } else {
      timelineRef.current = new Timeline(containerRef.current, dataSetRef.current, defaultOptions);
    }
    // 右クリックイベントリスナー
    if (onItemRightClick && timelineRef.current && containerRef.current) {
      const timeline = timelineRef.current;
      setTimeout(() => {
        if (containerRef.current) {
          if (eventListenerRef.current && containerRef.current) {
            containerRef.current.removeEventListener('contextmenu', eventListenerRef.current);
          }
          eventListenerRef.current = (event: MouseEvent) => {
            event.preventDefault();
            try {
              const itemId = timeline.getEventProperties(event).item;
              if (itemId !== null && itemId !== undefined) {
                const itemData = dataSetRef.current?.get(itemId);
                if (itemData && itemData.type !== 'background') {
                  onItemRightClick(itemId, itemData.content, event);
                }
              }
            } catch (err) {
              console.warn("Error handling right click:", err);
            }
          };
          containerRef.current.addEventListener('contextmenu', eventListenerRef.current);
        }
      }, 100);
    }
    // クリーンアップ
    return () => {
      if (eventListenerRef.current && containerRef.current) {
        containerRef.current.removeEventListener('contextmenu', eventListenerRef.current);
        eventListenerRef.current = null;
      }
      if (timelineRef.current) {
        try {
          timelineRef.current.destroy();
          timelineRef.current = null;
        } catch (error) {
          console.warn("Error destroying timeline in cleanup:", error);
          timelineRef.current = null;
        }
      }
      dataSetRef.current = null;
      groupSetRef.current = undefined;
    };
  }, [containerRef.current]);

  // データ更新: items/groups/options/heightが変わった時はsetItems/setGroups/setOptions
  useEffect(() => {
    if (!timelineRef.current) return;
    // items
    if (dataSetRef.current) {
      dataSetRef.current.clear();
      dataSetRef.current.add(memoizedItems);
      timelineRef.current.setItems(dataSetRef.current);
    }
    // groups
    if (memoizedGroups && groupSetRef.current) {
      groupSetRef.current.clear();
      groupSetRef.current.add(memoizedGroups);
      timelineRef.current.setGroups(groupSetRef.current);
    }
    // options
    const stackValue = memoizedOptions?.stack ?? true;
    const defaultOptions: TimelineOptions = {
      orientation: "top",
      stack: stackValue,
      maxHeight: typeof height === 'string' ? height : `${height}px`,
      verticalScroll: true,
      margin: { item: { horizontal: 0, vertical: 8 }, axis: 5 },
      tooltip: { followMouse: true },
      ...(stackValue ? { subgroupOrder: 'subgroupOrder' } : {}),
      ...memoizedOptions,
    } as TimelineOptions;
    timelineRef.current.setOptions(defaultOptions);
  }, [memoizedItems, memoizedGroups, memoizedOptions, height]);

  return (
    <GanttContainer h={height}>
      {memoizedItems.length === 0 && <NoDataBox>No data</NoDataBox>}
      <TimelineBox ref={containerRef} />
    </GanttContainer>
  );
};

export default GanttChart;

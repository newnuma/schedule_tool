import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
// import type { FilterConfig, FilterContextType } from "../types/filter.types";
import { sendFilterConfig } from "../api/bridgeApi";
export interface FilterConfig {
  dropdown: Record<string, any[]>; // プロパティ名 -> 選択された値の配列
  dateRange: {
    start?: string;
    end?: string;
    startProperty?: string;
    endProperty?: string;
  } | null;
}

export interface FilterContextType {
  // フィルター状態
  filters: Record<string, FilterConfig>; // ページ/タブキー -> フィルター設定
  setFilters: React.Dispatch<React.SetStateAction<Record<string, FilterConfig>>>;
  // フィルター操作
  setDropdownFilter: (pageKey: string, property: string, selectedValues: any[]) => void;
  setDateRangeFilter: (pageKey: string, start?: string, end?: string, startProp?: string, endProp?: string) => void;
  clearFilters: (pageKey: string) => void;
  
  // フィルタリング実行
  getFilteredData: <T>(pageKey: string, data: T[]) => T[];
}


const defaultFilterConfig: FilterConfig = {
  dropdown: {},
  dateRange: null,
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return context;
};

// 最小変更で操作系のみを提供しつつ、必要に応じて派生情報を返すフック
export const useFilterActions = (pageKey?: string | string[]) => {
  const ctx = useFilterContext();
  const { setFilters, setDropdownFilter, setDateRangeFilter, clearFilters, filters } = ctx;

  // filters の変更トリガーだけを露出するためのローカルバージョン
  const [filtersVersion, setFiltersVersion] = React.useState(0);
  React.useEffect(() => {
    setFiltersVersion(v => v + 1);
  }, [filters]);

  const computeActiveCount = React.useCallback((keys: string | string[]) => {
    const list = Array.isArray(keys) ? keys : [keys];
    let total = 0;
    list.forEach(key => {
      const pageFilters = filters[key];
      if (!pageFilters) return;
      if (pageFilters.dropdown) {
        Object.values(pageFilters.dropdown).forEach(values => {
          if (Array.isArray(values) && values.length > 0) total++;
        });
      }
      if (pageFilters.dateRange && (pageFilters.dateRange.start || pageFilters.dateRange.end)) {
        total++;
      }
    });
    return total;
  }, [filters]);

  const activeFilterCount = pageKey !== undefined ? computeActiveCount(pageKey) : undefined;

  return {
    setFilters,
    setDropdownFilter,
    setDateRangeFilter,
    clearFilters,
    // オプションの派生値
    activeFilterCount,
    filtersVersion,
  } as const;
};

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<Record<string, FilterConfig>>({});
  const getByPath = useCallback((obj: any, path?: string) => {
    if (!obj || !path) return undefined;
    return path.split(".").reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), obj);
  }, []);

  // ドロップダウンフィルターの設定
  const setDropdownFilter = useCallback((pageKey: string, property: string, selectedValues: any[]) => {
    setFilters(prev => {
      const updated = {
        ...prev,
        [pageKey]: {
          ...prev[pageKey] || defaultFilterConfig,
          dropdown: {
            ...prev[pageKey]?.dropdown || {},
            [property]: selectedValues,
          },
        },
      };
      // フィルター変更時に即送信
      sendFilterConfig(pageKey, updated[pageKey]);
      return updated;
    });
  }, []);

  // 日付範囲フィルターの設定
  const setDateRangeFilter = useCallback((
    pageKey: string, 
    start?: string, 
    end?: string, 
    startProp?: string, 
    endProp?: string
  ) => {
    setFilters(prev => {
      const updated = {
        ...prev,
        [pageKey]: {
          ...prev[pageKey] || defaultFilterConfig,
          dateRange: start || end ? {
            start,
            end,
            startProperty: startProp,
            endProperty: endProp,
          } : null,
        },
      };
      // フィルター変更時に即送信
      sendFilterConfig(pageKey, updated[pageKey]);
      return updated;
    });
  }, []);

  // フィルターのクリア
  const clearFilters = useCallback((pageKey: string) => {
    setFilters(prev => ({
      ...prev,
      [pageKey]: defaultFilterConfig,
    }));
  }, []);

  // データのフィルタリング実行
  const getFilteredData = useCallback(<T,>(pageKey: string, data: T[]): T[] => {
    const filterConfig = filters[pageKey];
    if (!filterConfig) return data;

    let filteredData = [...data];

    // ドロップダウンフィルター適用
    Object.entries(filterConfig.dropdown).forEach(([property, selectedValues]) => {
      if (selectedValues.length > 0) {
        filteredData = filteredData.filter(item => {
          const v = getByPath(item as any, property);
          if (v === undefined || v === null) return false;
          return (selectedValues as any[]).map(String).includes(String(v));
        });
      }
    });

    // 日付範囲フィルター適用（オーバーラップ判定: start_date <= end AND end_date >= start）
    if (filterConfig.dateRange) {
      const { start, end, startProperty = 'start_date', endProperty = 'end_date' } = filterConfig.dateRange;
      // ISO(YYYY-MM-DD) 前提のため、文字列比較でも大小関係は正しく扱える
      if (start && end) {
        filteredData = filteredData.filter(item => {
          const s = getByPath(item as any, startProperty);
          const e = getByPath(item as any, endProperty);
          if (!s || !e) return false;
          return String(s) <= String(end) && String(e) >= String(start);
        });
      } else if (start) {
        // start のみ指定: 期間の終端が start 以降
        filteredData = filteredData.filter(item => {
          const e = getByPath(item as any, endProperty);
          return e && String(e) >= String(start);
        });
      } else if (end) {
        // end のみ指定: 期間の始端が end 以前
        filteredData = filteredData.filter(item => {
          const s = getByPath(item as any, startProperty);
          return s && String(s) <= String(end);
        });
      }
    }

    return filteredData;
  }, [filters, getByPath]);

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        setDropdownFilter,
        setDateRangeFilter,
        clearFilters,
        getFilteredData,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

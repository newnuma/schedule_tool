import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { FilterConfig, FilterContextType } from "../types/filter.types";

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

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<Record<string, FilterConfig>>({});

  // ドロップダウンフィルターの設定
  const setDropdownFilter = useCallback((pageKey: string, property: string, selectedValues: any[]) => {
    setFilters(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey] || defaultFilterConfig,
        dropdown: {
          ...prev[pageKey]?.dropdown || {},
          [property]: selectedValues,
        },
      },
    }));
  }, []);

  // 日付範囲フィルターの設定
  const setDateRangeFilter = useCallback((
    pageKey: string, 
    start?: string, 
    end?: string, 
    startProp?: string, 
    endProp?: string
  ) => {
    setFilters(prev => ({
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
    }));
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
        filteredData = filteredData.filter(item => 
          selectedValues.includes((item as any)[property])
        );
      }
    });

    // 日付範囲フィルター適用
    if (filterConfig.dateRange) {
      const { start, end, startProperty = 'start_date', endProperty = 'end_date' } = filterConfig.dateRange;
      
      if (start) {
        filteredData = filteredData.filter(item => {
          const itemStartDate = (item as any)[startProperty];
          return itemStartDate && itemStartDate >= start;
        });
      }
      
      if (end) {
        filteredData = filteredData.filter(item => {
          const itemEndDate = (item as any)[endProperty];
          return itemEndDate && itemEndDate <= end;
        });
      }
    }

    return filteredData;
  }, [filters]);

  return (
    <FilterContext.Provider
      value={{
        filters,
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

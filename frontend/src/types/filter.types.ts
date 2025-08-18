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
  
  // フィルター操作
  setDropdownFilter: (pageKey: string, property: string, selectedValues: any[]) => void;
  setDateRangeFilter: (pageKey: string, start?: string, end?: string, startProp?: string, endProp?: string) => void;
  clearFilters: (pageKey: string) => void;
  
  // フィルタリング実行
  getFilteredData: <T>(pageKey: string, data: T[]) => T[];
}

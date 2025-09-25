import React, { useMemo } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Typography,
  Box,
} from "@mui/material";
import { useFilterContext } from "../../context/FilterContext";

interface DropdownFilterProps<T> {
  pageKey: string;
  data: T[];
  property: keyof T | string; // support dot-path like "department.name"
  label: string;
  hideTitle?: boolean;
}

const getByPath = (obj: any, path: string) => {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), obj);
};

const DropdownFilter = <T,>({ pageKey, data, property, label, hideTitle = false }: DropdownFilterProps<T>) => {
  const { filters, setDropdownFilter } = useFilterContext();
  const propertyKey = String(property);
  
  // 現在の選択値を取得（単一選択なので最初の要素）
  const currentSelectedValue = filters[pageKey]?.dropdown[propertyKey]?.[0] || "";
  
  // データから選択可能な値を抽出（重複除去）
  const availableOptions = useMemo(() => {
    const values = data
      .map(item => getByPath(item as any, propertyKey))
      .filter((v) => v !== undefined && v !== null && v !== "");
    return Array.from(new Set(values.map(v => String(v))));
  }, [data, propertyKey]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    // 単一選択なので、選択された値を配列にして格納（空文字の場合は空配列）
    setDropdownFilter(pageKey, propertyKey, value ? [value] : []);
  };

  // データ更新等で現在の選択値が候補に存在しなくなった場合は自動的に解除
  React.useEffect(() => {
    if (currentSelectedValue && !availableOptions.includes(String(currentSelectedValue))) {
      setDropdownFilter(pageKey, propertyKey, []);
    }
  }, [availableOptions, currentSelectedValue, pageKey, propertyKey, setDropdownFilter]);

  return (
    <Box sx={{ margin: "8px 0" }}>
      {!hideTitle && (
        <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
          {label}
        </Typography>
      )}
      <FormControl fullWidth margin="dense" size="small">
        <Select
          value={currentSelectedValue}
          onChange={handleChange}
          displayEmpty
        >
          <MenuItem value="">
            <em>All</em>
          </MenuItem>
          {availableOptions.map((option) => (
            <MenuItem key={String(option)} value={String(option)}>
              {String(option)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default DropdownFilter;

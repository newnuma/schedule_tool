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
  property: keyof T;
  label: string;
  hideTitle?: boolean;
}

const DropdownFilter = <T,>({ pageKey, data, property, label, hideTitle = false }: DropdownFilterProps<T>) => {
  const { filters, setDropdownFilter } = useFilterContext();
  
  // 現在の選択値を取得（単一選択なので最初の要素）
  const currentSelectedValue = filters[pageKey]?.dropdown[property as string]?.[0] || "";
  
  // データから選択可能な値を抽出（重複除去）
  const availableOptions = useMemo(() => {
    const values = data.map(item => (item as any)[property]).filter(Boolean);
    return Array.from(new Set(values));
  }, [data, property]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    // 単一選択なので、選択された値を配列にして格納（空文字の場合は空配列）
    setDropdownFilter(pageKey, property as string, value ? [value] : []);
  };

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

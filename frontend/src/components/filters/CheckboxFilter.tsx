import React, { useMemo } from "react";
import {
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
} from "@mui/material";
import { useFilterContext } from "../../context/FilterContext";

interface CheckboxFilterProps<T> {
  pageKey: string;
  data: T[];
  property: keyof T;
  label: string;
  hideTitle?: boolean;
}

const CheckboxFilter = <T,>({ pageKey, data, property, label, hideTitle = false }: CheckboxFilterProps<T>) => {
  const { filters, setDropdownFilter } = useFilterContext();
  
  // 現在の選択値を取得
  const currentSelectedValues = filters[pageKey]?.dropdown[property as string] || [];
  
  // データから選択可能な値を抽出（重複除去）
  const availableOptions = useMemo(() => {
    const values = data.map(item => (item as any)[property]).filter(Boolean);
    return Array.from(new Set(values));
  }, [data, property]);

  const handleChange = (value: string, checked: boolean) => {
    let newValues: string[];
    if (checked) {
      // チェックされた場合、値を追加
      newValues = [...currentSelectedValues, value];
    } else {
      // チェックが外された場合、値を削除
      newValues = currentSelectedValues.filter((v: string) => v !== value);
    }
    setDropdownFilter(pageKey, property as string, newValues);
  };

  return (
    <Box sx={{ margin: "8px 0" }}>
      <FormControl component="fieldset" size="small">
        {!hideTitle && (
          <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: 1 }}>
            {label}
          </FormLabel>
        )}
        <FormGroup>
          {availableOptions.map((option) => (
            <FormControlLabel
              key={String(option)}
              control={
                <Checkbox
                  checked={currentSelectedValues.includes(String(option))}
                  onChange={(event) => handleChange(String(option), event.target.checked)}
                  size="small"
                />
              }
              label={String(option)}
              sx={{ fontSize: '0.875rem' }}
            />
          ))}
        </FormGroup>
      </FormControl>
    </Box>
  );
};

export default CheckboxFilter;

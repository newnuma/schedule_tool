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
  property: keyof T | string; // support dot-path like "department.name"
  label: string;
  hideTitle?: boolean;
}

const getByPath = (obj: any, path: string) => {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), obj);
};

const CheckboxFilter = <T,>({ pageKey, data, property, label, hideTitle = false }: CheckboxFilterProps<T>) => {
  const { filters, setDropdownFilter } = useFilterContext();
  const propertyKey = String(property);
  
  // 現在の選択値を取得
  const currentSelectedValues = filters[pageKey]?.dropdown[propertyKey] || [];
  
  // データから選択可能な値を抽出（重複除去）
  const availableOptions = useMemo(() => {
    const values = data
      .map(item => getByPath(item as any, propertyKey))
      .filter((v) => v !== undefined && v !== null && v !== "");
    const unique = Array.from(new Set(values.map(v => String(v))));
    // アルファベット順（大文字小文字を区別しない、ロケール依存）でソート
    return unique.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [data, propertyKey]);

  const handleChange = (value: string, checked: boolean) => {
    let newValues: string[];
    if (checked) {
      // チェックされた場合、値を追加
      newValues = [...currentSelectedValues, value];
    } else {
      // チェックが外された場合、値を削除
      newValues = currentSelectedValues.filter((v: string) => v !== value);
    }
    setDropdownFilter(pageKey, propertyKey, newValues);
  };

  // データ更新等で現在の選択値群に候補外の値が含まれる場合は自動的に除去
  React.useEffect(() => {
    if (!currentSelectedValues || currentSelectedValues.length === 0) return;
    // Guard: Avoid cleaning before options are ready (e.g., data not loaded yet).
    // If we run cleanup with empty options, we'd incorrectly clear cached selections
    // and effectively disable the filter. Wait until we actually have options.
    if (!availableOptions || availableOptions.length === 0) return;
    const normalized = new Set(availableOptions.map(String));
    const cleaned = currentSelectedValues.filter((v: string) => normalized.has(String(v)));
    if (cleaned.length !== currentSelectedValues.length) {
      setDropdownFilter(pageKey, propertyKey, cleaned);
    }
  }, [availableOptions, currentSelectedValues, pageKey, propertyKey, setDropdownFilter]);

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

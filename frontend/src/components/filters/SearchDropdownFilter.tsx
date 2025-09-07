import React, { useMemo, useEffect } from "react";
import { Autocomplete, TextField, Box, Typography } from "@mui/material";
import { useFilterContext } from "../../context/FilterContext";

interface SearchDropdownFilterProps<T> {
  pageKey: string;
  data: T[];
  property: keyof T | string; // dot-path like "work_category.id"
  label: string;
  hideTitle?: boolean;
  defaultValue?: string; // 追加: 初期値
}

const getByPath = (obj: any, path: string) => {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), obj);
};

const SearchDropdownFilter = <T,>({
  pageKey,
  data,
  property,
  label,
  hideTitle = false,
  defaultValue,
}: SearchDropdownFilterProps<T>) => {
  const { filters, setDropdownFilter } = useFilterContext();
  const propertyKey = String(property);

  // 候補リスト（重複除去、表示名はString化）
  const options = useMemo(() => {
    const values = data
      .map(item => getByPath(item as any, propertyKey))
      .filter((v) => v !== undefined && v !== null && v !== "");
    return Array.from(new Set(values.map(v => String(v)))).map(v => ({ value: v, label: v }));
  }, [data, propertyKey]);

  // 初期値の決定
  const initialValue =
    defaultValue && options.find(opt => String(opt.value) === String(defaultValue))
      ? defaultValue
      : options.length > 0
        ? options[0].value
        : "";

  // 現在選択されている値
  const selectedValue = filters[pageKey]?.dropdown?.[propertyKey]?.[0] || "";

  // 初期値がセットされていない場合は初期値をセット
  useEffect(() => {
    if (!selectedValue && initialValue) {
      setDropdownFilter(pageKey, propertyKey, [initialValue]);
    }
  }, [selectedValue, initialValue, setDropdownFilter, pageKey, propertyKey]);

  const valueObj = options.find(opt => String(opt.value) === String(selectedValue)) || null;

  return (
    <Box sx={{ minWidth: 220, margin: "8px 0" }}>
      {!hideTitle && (
        <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
          {label}
        </Typography>
      )}
      <Autocomplete
        options={options}
        getOptionLabel={opt => opt.label}
        value={valueObj}
        onChange={(_, newValue) => {
          setDropdownFilter(pageKey, propertyKey, newValue ? [newValue.value] : []);
        }}
        renderInput={params => <TextField {...params} label={label} size="small" />}
        isOptionEqualToValue={(opt, val) => String(opt.value) === String(val.value)}
        clearOnEscape
      />
    </Box>
  );
};

export default SearchDropdownFilter;

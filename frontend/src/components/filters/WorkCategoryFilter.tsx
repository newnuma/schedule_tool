import React, { useMemo } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { useFilterContext } from "../../context/FilterContext";
import { useAppContext } from "../../context/AppContext";

interface WorkCategoryFilterProps {
  pageKey: string;
  label?: string;
}

const WorkCategoryFilter: React.FC<WorkCategoryFilterProps> = ({ pageKey, label = "Work Category" }) => {
  const { workCategories } = useAppContext();
  const { filters, setDropdownFilter } = useFilterContext();
  const selectedId = filters[pageKey]?.dropdown?.["work_category.id"]?.[0] ?? "";

  // name一意なのでname表示
  const options = useMemo(() => (workCategories ?? []).map(wc => ({ id: wc.id, name: wc.name })), [workCategories]);
  const value = options.find(opt => String(opt.id) === String(selectedId)) || null;

  return (
    <Autocomplete
      options={options}
      getOptionLabel={opt => opt.name}
      value={value}
      onChange={(_, newValue) => {
        setDropdownFilter(pageKey, "work_category.id", newValue ? [newValue.id] : []);
      }}
      renderInput={params => <TextField {...params} label={label} size="small" />}
      isOptionEqualToValue={(opt, val) => String(opt.id) === String(val.id)}
      sx={{ minWidth: 220 }}
    />
  );
};

export default WorkCategoryFilter;

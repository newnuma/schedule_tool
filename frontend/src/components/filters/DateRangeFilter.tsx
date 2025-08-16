import React from "react";
import {
  Box,
  TextField,
  Typography,
} from "@mui/material";
import { useFilterContext } from "../../context/FilterContext";

interface DateRangeFilterProps {
  pageKey: string;
  label: string;
  startProperty?: string;
  endProperty?: string;
  hideTitle?: boolean;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  pageKey,
  label,
  startProperty = "start_date",
  endProperty = "end_date",
  hideTitle = false,
}) => {
  const { filters, setDateRangeFilter } = useFilterContext();
  
  // 現在の日付範囲設定を取得
  const currentDateRange = filters[pageKey]?.dateRange;
  const startValue = currentDateRange?.start || "";
  const endValue = currentDateRange?.end || "";

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const start = event.target.value;
    setDateRangeFilter(pageKey, start, endValue, startProperty, endProperty);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const end = event.target.value;
    setDateRangeFilter(pageKey, startValue, end, startProperty, endProperty);
  };

  return (
    <Box sx={{ margin: "8px 0" }}>
      {!hideTitle && (
        <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
          {label}
        </Typography>
      )}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <TextField
          type="date"
          label="Start Date"
          value={startValue}
          onChange={handleStartDateChange}
          size="small"
          sx={{ flex: 1 }}
          InputLabelProps={{
            shrink: true,
          }}
          inputProps={{
            lang: "en-US"
          }}
        />
        <Typography variant="body2">to</Typography>
        <TextField
          type="date"
          label="End Date"
          value={endValue}
          onChange={handleEndDateChange}
          size="small"
          sx={{ flex: 1 }}
          InputLabelProps={{
            shrink: true,
          }}
          inputProps={{
            lang: "en-US"
          }}
        />
      </Box>
    </Box>
  );
};

export default DateRangeFilter;

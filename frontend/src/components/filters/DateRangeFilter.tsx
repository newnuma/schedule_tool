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
  compact?: boolean;
  alignStartToMonday?: boolean;
  alignEndToFriday?: boolean;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  pageKey,
  label,
  startProperty = "start_date",
  endProperty = "end_date",
  hideTitle = false,
  compact = false,
  alignStartToMonday = false,
  alignEndToFriday = false,
}) => {
  const { filters, setDateRangeFilter } = useFilterContext();
  
  // 現在の日付範囲設定を取得
  const currentDateRange = filters[pageKey]?.dateRange;
  const startValue = currentDateRange?.start || "";
  const endValue = currentDateRange?.end || "";

  // utils
  const parseISO = (v?: string) => {
    if (!v) return null;
    const [y, m, d] = v.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };
  const fmtISO = (dt: Date) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const floorToMonday = (dt: Date) => {
    // JS: 0=Sun..6=Sat; Monday offset
    const day = dt.getDay();
    const delta = (day + 6) % 7; // 0 when Monday
    const out = new Date(dt);
    out.setDate(dt.getDate() - delta);
    return out;
  };
  const toFridayOfWeek = (dt: Date) => {
    const mon = floorToMonday(dt);
    const out = new Date(mon);
    out.setDate(mon.getDate() + 4); // Friday
    return out;
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let start = event.target.value;
    if (start && alignStartToMonday) {
      const dt = parseISO(start);
      if (dt) start = fmtISO(floorToMonday(dt));
    }
    setDateRangeFilter(pageKey, start, endValue, startProperty, endProperty);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let end = event.target.value;
    if (end && alignEndToFriday) {
      const dt = parseISO(end);
      if (dt) end = fmtISO(toFridayOfWeek(dt));
    }
    setDateRangeFilter(pageKey, startValue, end, startProperty, endProperty);
  };

  return (
    <Box sx={{ margin: compact || hideTitle ? 0 : "8px 0" }}>
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

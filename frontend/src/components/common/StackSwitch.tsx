import React from "react";
import { Box, Typography, Switch } from "@mui/material";

export interface StackSwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  labelPosition?: "left" | "top";
  disabled?: boolean;
  sx?: object;
}

const StackSwitch: React.FC<StackSwitchProps> = ({
  value,
  onChange,
  label = "Stack",
  labelPosition = "left",
  disabled = false,
  sx = {}
}) => {
  if (!label) {
    return (
      <Switch
        checked={value}
        onChange={e => onChange(e.target.checked)}
        color="primary"
        disabled={disabled}
        sx={sx}
      />
    );
  }
  if (labelPosition === "top") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography variant="caption" sx={{ mb: 0.0001, fontSize: '0.9rem' }}>{label}</Typography>
        <Switch
          checked={value}
          onChange={e => onChange(e.target.checked)}
          color="primary"
          disabled={disabled}
          sx={sx}
        />
      </Box>
    );
  }
  // left
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Typography variant="caption" sx={{ mr: 1, fontSize: '0.75rem' }}>{label}</Typography>
      <Switch
        checked={value}
        onChange={e => onChange(e.target.checked)}
        color="primary"
        disabled={disabled}
        sx={sx}
      />
    </Box>
  );
};

export default StackSwitch;

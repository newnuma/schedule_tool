import React, { useState } from "react";
import { Box, Accordion, AccordionSummary, AccordionDetails, MenuItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import { Add as AddIcon, ExpandMore as ExpandMoreIcon } from "@mui/icons-material";

export interface AddButtonItem {
  label: string;
  icon: React.ReactElement;
  action: () => void;
}

interface AddButtonProps {
  items: AddButtonItem[];
  disabled?: boolean;
}

const AddButton: React.FC<AddButtonProps> = ({ items, disabled = false }) => {
  const [menuExpanded, setMenuExpanded] = useState<boolean>(false);

  const handleClick = () => {
    if (!disabled) {
      setMenuExpanded(!menuExpanded);
    }
  };

  const handleItemClick = (action: () => void) => {
    action();
    setMenuExpanded(false);
  };

  return (
    <Box sx={{ position: 'relative', minWidth: 120, maxWidth: 180, mr: 2 }}>
      <Accordion 
        expanded={menuExpanded}
        onChange={handleClick}
        disabled={disabled}
        sx={{ 
          backgroundColor: !disabled ? 'primary.main' : 'action.disabled',
          border: 'none',
          boxShadow: 2,
          '&:before': {
            display: 'none',
          },
          '&.Mui-disabled': {
            backgroundColor: 'action.disabled',
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: !disabled ? 'white' : 'action.disabled' }} />}
          aria-controls="add-panel-content"
          id="add-panel-header"
          sx={{
            minHeight: 36,
            height: 36,
            padding: '0 12px',
            '&.Mui-expanded': {
              minHeight: 36,
              height: 36,
            },
            '& .MuiAccordionSummary-content': {
              margin: '6px 0',
              alignItems: 'center',
              gap: 1,
              '&.Mui-expanded': {
                margin: '6px 0',
              },
            },
          }}
        >
          <AddIcon fontSize="small" sx={{ color: !disabled ? 'white' : 'action.disabled' }} />
          <Typography variant="button" fontWeight="bold" sx={{ color: !disabled ? 'white' : 'action.disabled' }}>
            Add
          </Typography>
        </AccordionSummary>
        {menuExpanded && (
          <AccordionDetails
            sx={{
              padding: 0,
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderTop: 'none',
              boxShadow: 3,
            }}
          >
            {items.map((item, index) => (
              <MenuItem 
                key={index} 
                onClick={() => handleItemClick(item.action)} 
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText>{item.label}</ListItemText>
              </MenuItem>
            ))}
          </AccordionDetails>
        )}
      </Accordion>
    </Box>
  );
};

export default AddButton;

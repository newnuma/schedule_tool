
import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  action?: () => void;
  disable?: boolean;
  dividerBefore?: boolean;
  color?: string; // e.g. 'error.main' for delete
}

export interface ContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  items: ContextMenuItem[];
  header?: React.ReactNode; // optional header (e.g. item name)
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  anchorEl,
  open,
  onClose,
  items,
  header,
}) => {
  const handleMenuItemClick = (action?: () => void) => {
    if (action) action();
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      PaperProps={{
        elevation: 3,
        sx: {
          minWidth: 180,
          '& .MuiMenuItem-root': {
            px: 2,
            py: 1,
          },
        },
      }}
    >
      {header && (
        <>
          <MenuItem disabled sx={{ fontWeight: 'bold', opacity: 1 }}>
            {header}
          </MenuItem>
          <Divider />
        </>
      )}
      {items.map((item, idx) => (
        <React.Fragment key={item.label + idx}>
          {item.dividerBefore && <Divider />}
          <MenuItem
            onClick={() => handleMenuItemClick(item.action)}
            disabled={item.disable}
            sx={item.color ? { color: item.color } : undefined}
          >
            {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
            <ListItemText primary={item.label} />
          </MenuItem>
        </React.Fragment>
      ))}
    </Menu>
  );
};

export default ContextMenu;

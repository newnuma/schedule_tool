
import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import WebIcon from '@mui/icons-material/Web';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';

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

    const defaultIcons: Record<string, React.ReactNode> = {
      'Jump to Flow-PT': <WebIcon fontSize="small" />,
      'Edit': <EditIcon fontSize="small" />,
      'Copy': <ContentCopyIcon fontSize="small" />,
      'Delete': <DeleteIcon fontSize="small" color="error" />,
    };

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
        {items.map((item, idx) => {
          const iconToShow = item.icon ?? defaultIcons[item.label] ?? null;
          return (
            <React.Fragment key={item.label + idx}>
              {item.dividerBefore && <Divider />}
              <MenuItem
                onClick={() => handleMenuItemClick(item.action)}
                disabled={item.disable}
                sx={item.color ? { color: item.color } : undefined}
              >
                {iconToShow && <ListItemIcon>{iconToShow}</ListItemIcon>}
                <ListItemText primary={item.label} />
              </MenuItem>
            </React.Fragment>
          );
        })}
      </Menu>
    );
  };

export default ContextMenu;

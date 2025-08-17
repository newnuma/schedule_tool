import React, { useState, useEffect } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Info as DetailIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

export interface ContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onDetail?: () => void;
  onEdit?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  itemName?: string;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onDetail,
  onEdit,
  onCopy,
  onDelete,
  itemName,
}) => {
  const handleMenuItemClick = (callback?: () => void) => {
    if (callback) {
      callback();
    }
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
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
      {itemName && (
        <>
          <MenuItem disabled sx={{ fontWeight: 'bold', opacity: 1 }}>
            {itemName}
          </MenuItem>
          <Divider />
        </>
      )}
      
      <MenuItem onClick={() => handleMenuItemClick(onDetail)}>
        <ListItemIcon>
          <DetailIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Detail" />
      </MenuItem>
      
      <MenuItem onClick={() => handleMenuItemClick(onEdit)}>
        <ListItemIcon>
          <EditIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Edit" />
      </MenuItem>
      
      <MenuItem onClick={() => handleMenuItemClick(onCopy)}>
        <ListItemIcon>
          <CopyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Copy" />
      </MenuItem>
      
      <Divider />
      
      <MenuItem 
        onClick={() => handleMenuItemClick(onDelete)}
        sx={{ color: 'error.main' }}
      >
        <ListItemIcon>
          <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
        </ListItemIcon>
        <ListItemText primary="Delete" />
      </MenuItem>
    </Menu>
  );
};

export default ContextMenu;

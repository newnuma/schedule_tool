import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  submitDisabled?: boolean;
}

const FormModal: React.FC<FormModalProps> = ({
  open,
  onClose,
  title,
  children,
  onSubmit,
  onCancel,
  submitText = 'Save',
  cancelText = 'Cancel',
  submitDisabled = false,
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '400px',
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title}
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="secondary">
          {cancelText}
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          color="primary"
          disabled={submitDisabled}
        >
          {submitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormModal;

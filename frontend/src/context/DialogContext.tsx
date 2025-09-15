import React, { createContext, useContext, useState, ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

export interface DialogOptions {
  title: string;
  message: string|React.ReactNode;
  okText?: string;
  cancelText?: string;
  onOk?: () => void;
  onCancel?: () => void;
}

interface DialogContextType {
  openDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialogContext = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('DialogContext not found');
  return ctx;
};

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialogOptions, setDialogOptions] = useState<DialogOptions | null>(null);
  const [open, setOpen] = useState(false);

  const openDialog = (options: DialogOptions) => {
    setDialogOptions(options);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setTimeout(() => setDialogOptions(null), 200);
  };

  const handleOk = () => {
    dialogOptions?.onOk?.();
    closeDialog();
  };

  const handleCancel = () => {
    dialogOptions?.onCancel?.();
    closeDialog();
  };

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      <Dialog open={open} onClose={handleCancel}>
        {dialogOptions && (
          <>
            <DialogTitle>{dialogOptions.title}</DialogTitle>
            <DialogContent>{dialogOptions.message}</DialogContent>
            <DialogActions>
              <Button onClick={handleCancel} color="primary">
                {dialogOptions.cancelText || 'Cancel'}
              </Button>
              <Button onClick={handleOk} color="error" variant="contained">
                {dialogOptions.okText || 'OK'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </DialogContext.Provider>
  );
};

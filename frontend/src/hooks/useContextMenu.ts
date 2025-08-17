import { useState, useCallback } from 'react';

export interface ContextMenuState {
  anchorEl: HTMLElement | null;
  open: boolean;
  itemId?: number;
  itemName?: string;
  itemType?: 'phase' | 'asset' | 'task';
}

export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    anchorEl: null,
    open: false,
  });

  const handleContextMenu = useCallback((
    event: React.MouseEvent<HTMLElement>,
    itemId: number,
    itemName: string,
    itemType: 'phase' | 'asset' | 'task'
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      anchorEl: event.currentTarget,
      open: true,
      itemId,
      itemName,
      itemType,
    });
  }, []);

  const handleClose = useCallback(() => {
    setContextMenu({
      anchorEl: null,
      open: false,
    });
  }, []);

  const handleDetail = useCallback(() => {
    console.log('Detail clicked for:', contextMenu.itemType, contextMenu.itemId);
    // TODO: Implement detail functionality
    handleClose();
  }, [contextMenu, handleClose]);

  const handleEdit = useCallback(() => {
    console.log('Edit clicked for:', contextMenu.itemType, contextMenu.itemId);
    // TODO: Implement edit functionality
    handleClose();
  }, [contextMenu, handleClose]);

  const handleCopy = useCallback(() => {
    console.log('Copy clicked for:', contextMenu.itemType, contextMenu.itemId);
    // TODO: Implement copy functionality
    handleClose();
  }, [contextMenu, handleClose]);

  const handleDelete = useCallback(() => {
    console.log('Delete clicked for:', contextMenu.itemType, contextMenu.itemId);
    // TODO: Implement delete functionality
    handleClose();
  }, [contextMenu, handleClose]);

  return {
    contextMenu,
    handleContextMenu,
    handleClose,
    handleDetail,
    handleEdit,
    handleCopy,
    handleDelete,
  };
};

export default useContextMenu;

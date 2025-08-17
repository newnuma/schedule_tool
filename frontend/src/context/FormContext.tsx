import React, { createContext, useContext, useState, useCallback } from 'react';
import { Phase, Asset, Task } from '../types/filter.types';

type FormType = 'phase' | 'asset' | 'task';
type FormMode = 'create' | 'edit';

interface FormState {
  isOpen: boolean;
  type: FormType | null;
  mode: FormMode;
  data?: Phase | Asset | Task;
}

interface FormContextType {
  formState: FormState;
  openCreateForm: (type: FormType) => void;
  openEditForm: (type: FormType, data: Phase | Asset | Task) => void;
  closeForm: () => void;
  handleFormSubmit: (data: any) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

interface FormProviderProps {
  children: React.ReactNode;
  onPhaseSubmit?: (phase: Omit<Phase, 'id'>) => void;
  onAssetSubmit?: (asset: Omit<Asset, 'id'>) => void;
  onTaskSubmit?: (task: Omit<Task, 'id'>) => void;
  onPhaseUpdate?: (id: number, phase: Partial<Phase>) => void;
  onAssetUpdate?: (id: number, asset: Partial<Asset>) => void;
  onTaskUpdate?: (id: number, task: Partial<Task>) => void;
}

export const FormProvider: React.FC<FormProviderProps> = ({
  children,
  onPhaseSubmit,
  onAssetSubmit,
  onTaskSubmit,
  onPhaseUpdate,
  onAssetUpdate,
  onTaskUpdate,
}) => {
  const [formState, setFormState] = useState<FormState>({
    isOpen: false,
    type: null,
    mode: 'create',
  });

  const openCreateForm = useCallback((type: FormType) => {
    setFormState({
      isOpen: true,
      type,
      mode: 'create',
    });
  }, []);

  const openEditForm = useCallback((type: FormType, data: Phase | Asset | Task) => {
    setFormState({
      isOpen: true,
      type,
      mode: 'edit',
      data,
    });
  }, []);

  const closeForm = useCallback(() => {
    setFormState({
      isOpen: false,
      type: null,
      mode: 'create',
    });
  }, []);

  const handleFormSubmit = useCallback((data: any) => {
    const { type, mode } = formState;
    
    if (mode === 'create') {
      switch (type) {
        case 'phase':
          onPhaseSubmit?.(data);
          break;
        case 'asset':
          onAssetSubmit?.(data);
          break;
        case 'task':
          onTaskSubmit?.(data);
          break;
      }
    } else if (mode === 'edit' && formState.data) {
      const id = formState.data.id;
      switch (type) {
        case 'phase':
          onPhaseUpdate?.(id, data);
          break;
        case 'asset':
          onAssetUpdate?.(id, data);
          break;
        case 'task':
          onTaskUpdate?.(id, data);
          break;
      }
    }
    
    closeForm();
  }, [
    formState,
    onPhaseSubmit,
    onAssetSubmit,
    onTaskSubmit,
    onPhaseUpdate,
    onAssetUpdate,
    onTaskUpdate,
    closeForm,
  ]);

  const contextValue: FormContextType = {
    formState,
    openCreateForm,
    openEditForm,
    closeForm,
    handleFormSubmit,
  };

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  );
};

export default FormProvider;

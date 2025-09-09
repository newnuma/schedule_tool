
import React, { createContext, useContext, useState, useCallback } from 'react';
import { IPhase, IAsset, ITask } from '../context/AppContext';


export type FormType = 'phase' | 'asset' | 'task';
export type FormMode = 'create' | 'edit' | 'copy';

// FormState: initialValuesはPartial型で拡張可能
export interface FormState {
  isOpen: boolean;
  type: FormType | null;
  mode: FormMode;
  initialValues?: Partial<IPhase> | Partial<IAsset> | Partial<ITask>;
  candidates?: Record<string, any[]>; // 各Formで使う候補リスト
}

export interface FormContextType {
  formState: FormState;
  openForm: (params: {
    type: FormType;
    mode: FormMode;
    initialValues?: Partial<IPhase> | Partial<IAsset> | Partial<ITask>;
    candidates?: Record<string, any[]>;
  }) => void;
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
  onPhaseSubmit?: (phase: Omit<IPhase, 'id'>) => void;
  onAssetSubmit?: (asset: Omit<IAsset, 'id'>) => void;
  onTaskSubmit?: (task: Omit<ITask, 'id'>) => void;
  onPhaseUpdate?: (id: number, phase: Partial<IPhase>) => void;
  onAssetUpdate?: (id: number, asset: Partial<IAsset>) => void;
  onTaskUpdate?: (id: number, task: Partial<ITask>) => void;
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
    initialValues: undefined,
    candidates: undefined,
  });

  // 汎用Form起動関数
  const openForm = useCallback((params: {
    type: FormType;
    mode: FormMode;
    initialValues?: Partial<IPhase | IAsset | ITask>;
    candidates?: Record<string, any[]>;
  }) => {
    setFormState({
      isOpen: true,
      type: params.type,
      mode: params.mode,
      initialValues: params.initialValues,
      candidates: params.candidates,
    });
  }, []);

  const closeForm = useCallback(() => {
    setFormState({
      isOpen: false,
      type: null,
      mode: 'create',
      initialValues: undefined,
      candidates: undefined,
    });
  }, []);


  // Python側APIは未定なので空関数
  const submitPhase = (data: Omit<IPhase, 'id'>) => {
    // TODO: Python API連携
  };
  const updatePhase = (id: number, data: Partial<IPhase>) => {
    // TODO: Python API連携
  };
  const submitAsset = (data: Omit<IAsset, 'id'>) => {
    console.log('Submitting asset:', data);
    // TODO: Python API連携
  };
  const updateAsset = (id: number, data: Partial<IAsset>) => {
    // TODO: Python API連携
  };
  const submitTask = (data: Omit<ITask, 'id'>) => {
    // TODO: Python API連携
  };
  const updateTask = (id: number, data: Partial<ITask>) => {
    // TODO: Python API連携
  };

  // mode分岐でsubmit
  const handleFormSubmit = useCallback((data: any) => {
    const { type, mode, initialValues } = formState;
    if (type === 'phase') {
      if (mode === 'create' || mode === 'copy') {
        submitPhase(data);
      } else if (mode === 'edit' && initialValues?.id) {
        updatePhase(initialValues.id, data);
      }
    } else if (type === 'asset') {
      if (mode === 'create' || mode === 'copy') {
        submitAsset(data);
      } else if (mode === 'edit' && initialValues?.id) {
        updateAsset(initialValues.id, data);
      }
    } else if (type === 'task') {
      if (mode === 'create' || mode === 'copy') {
        submitTask(data);
      } else if (mode === 'edit' && initialValues?.id) {
        updateTask(initialValues.id, data);
      }
    }
    closeForm();
  }, [formState, closeForm]);

  const contextValue: FormContextType = {
    formState,
    openForm,
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

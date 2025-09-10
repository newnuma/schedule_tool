
import React, { createContext, useContext, useState, useCallback } from 'react';
import { IPhase, IAsset, ITask, IPerson, useAppContext } from '../context/AppContext';
import { createEntity, updateEntity } from '../api/bridgeApi';

export type FormType = 'phase' | 'asset' | 'task';
export type FormMode = 'create' | 'edit' | 'copy';

export interface AssetCandidates {
  phases: IPhase[];
}

export interface TaskCandidates {
  assets: IAsset[];
  people: IPerson[];
}

// FormState: initialValuesはPartial型で拡張可能
export interface FormState {
  isOpen: boolean;
  type: FormType | null;
  mode: FormMode;
  initialValues?: Partial<IPhase> | Partial<IAsset> | Partial<ITask>;
  candidates?: TaskCandidates | AssetCandidates | undefined; // 各Formで使う候補リスト
}


export interface FormContextType {
  formState: FormState;
  openForm: (params: {
    type: FormType;
    mode: FormMode;
    initialValues?: Partial<IPhase> | Partial<IAsset> | Partial<ITask>;
    candidates?: TaskCandidates | AssetCandidates | undefined;
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
}

export const FormProvider: React.FC<FormProviderProps> = (props) => {
  const { children } = props;
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
    candidates?: TaskCandidates | AssetCandidates | undefined;
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

  const { addAssets, addPhases, addTasks, updateAssets, updatePhases, updateTasks } = useAppContext();

  // 共通のcreate関数
  const createDataFromForm = (data: Partial<IAsset | IPhase | ITask>) => {
    createEntity(data).then((result) => {
      if (result && result.id && result.type) {
        console.log('Created entity:', result);
        if (result.type === 'Asset') {
          addAssets([result as IAsset]);
        } else if (result.type === 'Phase') {
          addPhases([result as IPhase]);
        } else if (result.type === 'Task') {
          addTasks([result as ITask]);
        }
      }
    }).catch((error) => {
      console.error('Failed to create entity:', error);
    });
  };

  // 共通のupdate関数（API連携は未実装）
  const updateDataFromForm = (id: number, data: Partial<IAsset | IPhase | ITask>) => {
    updateEntity(id, data).then((result) => {
      if (result && result.id && result.type) {
        console.log('Updated entity:', result);
        if (result.type === 'Asset') {
          updateAssets([result as IAsset]);
        } else if (result.type === 'Phase') {
          updatePhases([result as IPhase]);
        } else if (result.type === 'Task') {
          updateTasks([result as ITask]);
        }
      }
    }).catch((error) => {
      console.error('Failed to create entity:', error);
    });
  };
  
  // mode分岐でsubmit
  const handleFormSubmit = useCallback((data: any) => {
    const { type, mode, initialValues } = formState;
    if (mode === 'create' || mode === 'copy') {
      createDataFromForm(data);
    } else if (mode === 'edit' && initialValues?.id) {
      updateDataFromForm(initialValues.id, data);
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

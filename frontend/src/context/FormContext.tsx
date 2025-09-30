
import React, { createContext, useContext, useState, useCallback } from 'react';
import { IPhase, IAsset, ITask, IMilestoneTask, IPerson, IForignKey, useAppContext } from '../context/AppContext';
import { createEntity, updateEntity } from '../api/bridgeApi';
import { useDialogContext } from "../context/DialogContext";

export type FormType = 'phase' | 'asset' | 'task' | 'milestonetask';
export interface MilestoneTaskCandidates {
  assets: IForignKey[];
  subprojects?: IForignKey[];
}
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
  initialValues?: Partial<IPhase> | Partial<IAsset> | Partial<ITask> | Partial<IMilestoneTask>;
  candidates?: TaskCandidates | AssetCandidates | MilestoneTaskCandidates | undefined; // 各Formで使う候補リスト
}


export interface FormContextType {
  formState: FormState;
  openForm: (params: {
    type: FormType;
    mode: FormMode;
    initialValues?: Partial<IPhase> | Partial<IAsset> | Partial<ITask> | Partial<IMilestoneTask>;
    candidates?: TaskCandidates | AssetCandidates | MilestoneTaskCandidates | undefined;
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

  // Keys that should not be included in update payloads
  const EXCLUDED_UPDATE_KEYS = new Set(['id', 'type', 'created_at', 'updated_at']);

  // Deep equality check for primitives, arrays, and plain objects
  const isDeepEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return a === b;

    // Handle Date objects
    if (a instanceof Date || b instanceof Date) {
      const aTime = a instanceof Date ? a.getTime() : new Date(a).getTime();
      const bTime = b instanceof Date ? b.getTime() : new Date(b).getTime();
      return aTime === bTime;
    }

    // Arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!isDeepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    // Plain objects
    if (typeof a === 'object' && typeof b === 'object') {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) return false;
      for (const key of aKeys) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
        if (!isDeepEqual(a[key], b[key])) return false;
      }
      return true;
    }

    return false;
  };

  // Build a minimal patch containing only fields present in `updated` that changed from `original`.
  // Note: For nested objects, if changed, we include the entire object value from `updated`.
  const buildUpdatePatch = <T extends Record<string, any>>(
    original: Partial<T> | undefined,
    updated: Partial<T>
  ): Partial<T> => {
    if (!original) return { ...updated };
    const patch: Record<string, any> = {type : updated.type}; // typeは必須
    for (const key of Object.keys(updated)) {
      if (EXCLUDED_UPDATE_KEYS.has(key)) continue;
      const newVal = (updated as any)[key];
      const oldVal = (original as any)[key];
      if (!isDeepEqual(newVal, oldVal)) {
        patch[key] = newVal;
      }
    }
    return patch as Partial<T>;
  };

  // 汎用Form起動関数
  const openForm = useCallback((params: {
    type: FormType;
    mode: FormMode;
    initialValues?: Partial<IPhase | IAsset | ITask | IMilestoneTask>;
    candidates?: TaskCandidates | AssetCandidates | MilestoneTaskCandidates | undefined;
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

  const { addAssets, addPhases, addTasks, addMilestoneTasks } = useAppContext();
  const { openDialog } = useDialogContext();

  // 共通のcreate関数
  const createDataFromForm = (data: Partial<IAsset | IPhase | ITask | IMilestoneTask>) => {
    createEntity(data as any).then((result) => {
      if (result && result.id && result.type) {
        console.log('Created entity:', result);
        if (result.type === 'Asset') {
          addAssets([result as IAsset]);
        } else if (result.type === 'Phase') {
          addPhases([result as IPhase]);
        } else if (result.type === 'Task') {
          addTasks([result as ITask]);
        } else if (result.type === 'MilestoneTask') {
          addMilestoneTasks([result as IMilestoneTask]);
        }
      }
    }).catch((error) => {
      openDialog({
        title: "Create Failed",
        message: `Failed to create '${data?.name || ''}'.\n${error.message}`,
        okText: "OK",
      });
      console.error('Failed to create entity:', error);
    });
  };

  // 共通のupdate関数：変更されたフィールドのみ送信
  const updateDataFromForm = (
    id: number,
    original: Partial<IAsset | IPhase | ITask | IMilestoneTask> | undefined,
    updated: Partial<IAsset | IPhase | ITask | IMilestoneTask>
  ) => {
    const patch = buildUpdatePatch(original, updated);
    if (!patch || Object.keys(patch).length === 0) {
      // 変更がない場合はAPI呼び出しをスキップ
      openDialog({
        title: "No changes",
        message: "変更がありません。更新はスキップされました。",
        okText: "OK",
      });
      return;
    }

    updateEntity(id, patch as any).then((result) => {
      if (result && result.id && result.type) {
        console.log('Updated entity:', result);
        if (result.type === 'Asset') {
          addAssets([result as IAsset]);
        } else if (result.type === 'Phase') {
          addPhases([result as IPhase]);
        } else if (result.type === 'Task') {
          addTasks([result as ITask]);
        } else if (result.type === 'MilestoneTask') {
          addMilestoneTasks([result as IMilestoneTask]);
        }
      }
    }).catch((error) => {
      openDialog({
        title: "Update Failed",
        message: `Failed to update '${updated?.name || ''}'.\n${error.message}`,
        okText: "OK",
      });
      console.error('Failed to update entity:', error);
    });
  };

  // mode分岐でsubmit
  const handleFormSubmit = useCallback((data: any) => {
    const { type, mode, initialValues } = formState;
    if (mode === 'create' || mode === 'copy') {
      createDataFromForm(data);
    } else if (mode === 'edit' && initialValues?.id) {
      updateDataFromForm(initialValues.id, initialValues, data);
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

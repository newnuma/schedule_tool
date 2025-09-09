import React, { useState } from 'react';
import { FormModal, PhaseForm, AssetForm, TaskForm } from '../forms';
import { useFormContext, AssetCandidates, TaskCandidates } from '../../context/FormContext';
import { IPhase, IAsset, ITask } from '../../context/AppContext';

const FormManager: React.FC = () => {
  const { formState, closeForm, handleFormSubmit } = useFormContext();
  // submit関連のstateは不要

  const getFormTitle = () => {
    let action = '';
    switch (formState.mode) {
      case 'create':
        action = 'Create';
        break;
      case 'edit':
        action = 'Edit';
        break;
      case 'copy':
        action = 'Copy';
        break;
      default:
        action = '';
    }
    const entityName = formState.type 
      ? formState.type.charAt(0).toUpperCase() + formState.type.slice(1)
      : '';
    return `${action} ${entityName}`;
  };

  // submitは各Form側で制御

  const getFormComponent = () => {
    const { initialValues, candidates, mode } = formState;
    switch (formState.type) {
      case 'phase':
        return (
          <PhaseForm
            initialValues={initialValues as Partial<IPhase>}
            mode={mode}
            onSubmit={handleFormSubmit}
            onClose={closeForm}
          />
        );
      case 'asset':
        return (
          <AssetForm
            initialValues={initialValues as Partial<IAsset>}
            candidates={candidates as AssetCandidates}
            mode={mode}
            onSubmit={handleFormSubmit}
            onClose={closeForm}
          />
        );
      case 'task':
        return (
          <TaskForm
            initialValues={initialValues as Partial<ITask>}
            candidates={candidates as TaskCandidates}
            mode={mode}
            onSubmit={handleFormSubmit}
            onClose={closeForm}
          />
        );
      default:
        return null;
    }
  };

  // submitTriggerリセット不要

  if (!formState.isOpen || !formState.type) {
    return null;
  }

  // submitText不要

  return (
    <FormModal
      open={formState.isOpen}
      onClose={closeForm}
      title={getFormTitle()}
    >
      {getFormComponent()}
    </FormModal>
  );
};

export default FormManager;

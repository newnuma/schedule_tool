import React, { useState } from 'react';
import { FormModal, PhaseForm, AssetForm, TaskForm } from '../forms';
import { useFormContext, IPhaseForm, IAssetForm, ITaskForm } from '../../context/FormContext';

const FormManager: React.FC = () => {
  const { formState, closeForm, handleFormSubmit } = useFormContext();
  const [isFormValid, setIsFormValid] = useState(false);
  const [submitTrigger, setSubmitTrigger] = useState(0);

  const getFormTitle = () => {
    const action = formState.mode === 'create' ? 'Create' : 'Edit';
    const entityName = formState.type 
      ? formState.type.charAt(0).toUpperCase() + formState.type.slice(1)
      : '';
    return `${action} ${entityName}`;
  };

  const handleFormModalSubmit = () => {
    setSubmitTrigger(prev => prev + 1);
  };

  const getFormComponent = () => {
    switch (formState.type) {
      case 'phase':
        return (
          <PhaseForm
            phase={formState.mode === 'edit' ? formState.data as IPhaseForm : undefined}
            onSubmit={(data) => {
              handleFormSubmit(data);
            }}
            onValidationChange={setIsFormValid}
            submitTrigger={submitTrigger}
          />
        );
      case 'asset':
        return (
          <AssetForm
            asset={formState.mode === 'edit' ? formState.data as IAssetForm : undefined}
            onSubmit={(data) => {
              handleFormSubmit(data);
            }}
            onValidationChange={setIsFormValid}
            submitTrigger={submitTrigger}
          />
        );
      case 'task':
        return (
          <TaskForm
            task={formState.mode === 'edit' ? formState.data as ITaskForm : undefined}
            onSubmit={(data) => {
              handleFormSubmit(data);
            }}
            onValidationChange={setIsFormValid}
            submitTrigger={submitTrigger}
          />
        );
      default:
        return null;
    }
  };

  if (!formState.isOpen || !formState.type) {
    return null;
  }

  return (
    <FormModal
      open={formState.isOpen}
      onClose={closeForm}
      title={getFormTitle()}
      onSubmit={handleFormModalSubmit}
      submitDisabled={!isFormValid}
      submitText={formState.mode === 'create' ? 'Create' : 'Update'}
    >
      {getFormComponent()}
    </FormModal>
  );
};

export default FormManager;

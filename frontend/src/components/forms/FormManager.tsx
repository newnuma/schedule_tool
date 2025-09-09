import React, { useState } from 'react';
import { FormModal, PhaseForm, AssetForm, TaskForm } from '../forms';
import { useFormContext, IPhaseForm, IAssetForm, ITaskForm, FormMode, FormType } from '../../context/FormContext';

const FormManager: React.FC = () => {
  const { formState, closeForm, handleFormSubmit } = useFormContext();
  const [isFormValid, setIsFormValid] = useState(false);
  const [submitTrigger, setSubmitTrigger] = useState(0);

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

  const handleFormModalSubmit = () => {
    setSubmitTrigger(prev => prev + 1);
  };

  const getFormComponent = () => {
    const { initialValues, candidates, mode } = formState;
    switch (formState.type) {
      case 'phase':
        return (
          <PhaseForm
            initialValues={initialValues as Partial<IPhaseForm>}
            candidates={candidates}
            mode={mode}
            onSubmit={handleFormSubmit}
            onValidationChange={setIsFormValid}
            submitTrigger={submitTrigger}
          />
        );
      case 'asset':
        return (
          <AssetForm
            initialValues={initialValues as Partial<IAssetForm>}
            candidates={candidates}
            mode={mode}
            onSubmit={handleFormSubmit}
            onValidationChange={setIsFormValid}
            submitTrigger={submitTrigger}
          />
        );
      case 'task':
        return (
          <TaskForm
            initialValues={initialValues as Partial<ITaskForm>}
            candidates={candidates}
            mode={mode}
            onSubmit={handleFormSubmit}
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

  // ボタンラベル分岐
  let submitText = '';
  switch (formState.mode) {
    case 'create':
      submitText = 'Create';
      break;
    case 'edit':
      submitText = 'Update';
      break;
    case 'copy':
      submitText = 'Copy & Create';
      break;
    default:
      submitText = 'Submit';
  }

  return (
    <FormModal
      open={formState.isOpen}
      onClose={closeForm}
      title={getFormTitle()}
      onSubmit={handleFormModalSubmit}
      submitDisabled={!isFormValid}
      submitText={submitText}
    >
      {getFormComponent()}
    </FormModal>
  );
};

export default FormManager;

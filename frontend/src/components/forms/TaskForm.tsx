import React, { useState, useEffect } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stack,
  Autocomplete
} from '@mui/material';
import { ITask } from '../../context/AppContext';
import { FormMode,TaskCandidates} from '../../context/FormContext';
import { useAppContext, IForignKey, TaskStatusArray } from '../../context/AppContext';

interface TaskFormProps {
  initialValues?: Partial<ITask>;
  candidates?: TaskCandidates;
  mode: FormMode;
  onSubmit: (task: Omit<ITask, 'id'>) => void;
  onValidationChange?: (isValid: boolean) => void;
  onClose?: () => void;
}


const TaskForm: React.FC<TaskFormProps> = ({ initialValues, candidates, mode, onSubmit, onValidationChange, onClose}) => {
  // Nameに[Type]を付与
  const candidatesAssets: IForignKey[] = (candidates?.assets ?? []).map((a: any) => (
    { type: 'Asset', id: a.id, name: `${a.name} [${a.type}]` }
  ));
  const candidatesPeople: IForignKey[] = (candidates?.people ?? []).map((p: any) => ({ type: 'Person', id: p.id, name: p.name }));

  const [formData, setFormData] = useState<Omit<ITask, 'id' | 'subproject' | 'work_category'>>({
    type: 'Task',
    name: initialValues?.name ?? '',
    asset: initialValues?.asset ?? { type: 'Asset', id: 0, name: '' },
    start_date: initialValues?.start_date ?? '',
    end_date: initialValues?.end_date ?? '',
    assignees: initialValues?.assignees ?? [],
    status: initialValues?.status ?? TaskStatusArray[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    setFormData({
      type: 'Task',
      name: initialValues?.name ?? '',
      asset: initialValues?.asset ?? { type: 'Asset', id: 0, name: '' },
      start_date: initialValues?.start_date ?? '',
      end_date: initialValues?.end_date ?? '',
      assignees: initialValues?.assignees ?? [],
      status: initialValues?.status ?? TaskStatusArray[0],
    });
  }, [initialValues]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Task name is required';
    }
    if (!formData.asset || !formData.asset.id) {
      newErrors.asset = 'Asset selection is required';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    if (onValidationChange) {
      onValidationChange(isValid);
    }
    return isValid;
  };

  useEffect(() => {
    const valid = validateForm();
    setIsFormValid(valid);
  }, [formData]);

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        type: 'Task',
        name: formData.name.trim(),
        asset: formData.asset,
        start_date: formData.start_date,
        end_date: formData.end_date,
        assignees: formData.assignees,
        status: formData.status,
      });
    }
  };


  const handleFieldChange = (field: keyof Omit<ITask, 'id'>, value: any) => {
    setFormData(prev => {
      if (field === 'asset') {
        return { ...prev, asset: value };
      }
      return { ...prev, [field]: value };
    });
  };

  return (
    <Box component="form" noValidate>
      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Task Name"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          required
        />

        {/* Asset Selection */}
        <Autocomplete
          options={candidatesAssets}
          getOptionLabel={(option: IForignKey) => option.name ?? ''}
          value={formData.asset}
          onChange={(_event: any, newValue: IForignKey | null) => handleFieldChange('asset', newValue || { id: 0, name: '', type: 'asset' })}
          renderInput={(params: any) => (
            <TextField
              {...params}
              label="Asset"
              error={!!errors.asset}
              helperText={errors.asset}
              required
            />
          )}
          isOptionEqualToValue={(opt: IForignKey, val: IForignKey) => opt.id === val.id}
        />

        {/* Date Fields */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={formData.start_date}
            onChange={(e) => handleFieldChange('start_date', e.target.value)}
            InputLabelProps={{ shrink: true }}
            error={!!errors.start_date}
            helperText={errors.start_date}
          />

          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={formData.end_date}
            onChange={(e) => handleFieldChange('end_date', e.target.value)}
            InputLabelProps={{ shrink: true }}
            error={!!errors.end_date}
            helperText={errors.end_date}
          />
        </Box>

        {/* Assignees (multiple Autocomplete) */}
        <Autocomplete
          multiple
          options={candidatesPeople}
          getOptionLabel={(option: IForignKey) => option.name ?? ''}
          value={formData.assignees}
          onChange={(_event: any, newValue: IForignKey[]) => handleFieldChange('assignees', newValue)}
          renderInput={(params: any) => (
            <TextField
              {...params}
              label="Assign To"
              required
            />
          )}
          isOptionEqualToValue={(opt: IForignKey, val: IForignKey) => opt.id === val.id}
        />

        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={formData.status}
            label="Status"
            onChange={(e) => handleFieldChange('status', e.target.value as ITask['status'])}
            required
          >
            {TaskStatusArray.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '8px 24px', fontSize: '1rem', background: '#888', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid}
                style={{ padding: '8px 24px', fontSize: '1rem', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: !isFormValid ? 0.5 : 1 }}
              >
                {mode === 'create' || mode === 'copy' ? 'Create Task' : 'Edit Task'}
              </button>
            </Box>
      </Stack>
    </Box>
  );
};

export default TaskForm;

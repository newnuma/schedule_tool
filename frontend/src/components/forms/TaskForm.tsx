import React, { useState, useEffect } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stack,
} from '@mui/material';
import { ITask } from '../../context/AppContext';
import { FormMode } from '../../context/FormContext';
import { useAppContext } from '../../context/AppContext';

interface TaskFormProps {
  initialValues?: Partial<ITask>;
  candidates?: Record<string, any[]>;
  mode: FormMode;
  onSubmit: (task: Omit<ITask, 'id'>) => void;
  onValidationChange?: (isValid: boolean) => void;
  onClose?: () => void;
}


const TaskForm: React.FC<TaskFormProps> = ({ initialValues, candidates, mode, onSubmit, onValidationChange, onClose}) => {
  // assets候補はcandidatesから取得（なければAppContext）
  const appContext = useAppContext();
  const assetsList = candidates?.assets ?? appContext.assets;
  const defaultAssetObj = initialValues?.asset ?? (assetsList.length > 0 ? assetsList[0] : { id: 0, name: '', type: 'asset' });
  const [formData, setFormData] = useState<Omit<ITask, 'id'>>({
    name: initialValues?.name ?? '',
    asset: defaultAssetObj,
    start_date: initialValues?.start_date ?? '',
    end_date: initialValues?.end_date ?? '',
    assignees: initialValues?.assignees ?? [],
    status: initialValues?.status ?? 'wtg',
    subproject: initialValues?.subproject ?? undefined,
    work_category: initialValues?.work_category ?? null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const assetObj = initialValues?.asset ?? (assetsList.length > 0 ? assetsList[0] : { id: 0, name: '', type: 'asset' });
    setFormData({
      name: initialValues?.name ?? '',
      asset: assetObj,
      start_date: initialValues?.start_date ?? '',
      end_date: initialValues?.end_date ?? '',
      assignees: initialValues?.assignees ?? [],
      status: initialValues?.status ?? 'wtg',
      subproject: initialValues?.subproject ?? undefined,
      work_category: initialValues?.work_category ?? null,
    });
  }, [initialValues, assetsList]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Task name is required';
    }
    if (!formData.asset || !formData.asset.id) {
      newErrors.asset = 'Asset selection is required';
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
        name: formData.name.trim(),
        asset: formData.asset,
        start_date: formData.start_date,
        end_date: formData.end_date,
        assignees: formData.assignees,
        status: formData.status,
        subproject: formData.subproject,
        work_category: formData.work_category,
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

        <FormControl fullWidth error={!!errors.asset}>
          <InputLabel>Asset</InputLabel>
          <Select
            value={formData.asset.id}
            label="Asset"
            onChange={(e) => {
              const assetObj = assetsList.find(a => a.id === e.target.value) || { id: e.target.value, name: '', type: 'asset' };
              handleFieldChange('asset', assetObj);
            }}
            required
          >
            {assetsList.map((asset) => (
              <MenuItem key={asset.id} value={asset.id}>
                {asset.name}
              </MenuItem>
            ))}
          </Select>
          {errors.asset && (
            <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.75 }}>
              {errors.asset}
            </Box>
          )}
        </FormControl>

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

        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={formData.status}
            label="Status"
            onChange={(e) => handleFieldChange('status', e.target.value as ITask['status'])}
            required
          >
            <MenuItem value="wtg">Waiting</MenuItem>
            <MenuItem value="ip">In Progress</MenuItem>
            <MenuItem value="fin">Finished</MenuItem>
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

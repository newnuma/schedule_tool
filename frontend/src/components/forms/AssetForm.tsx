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
import { IAssetForm } from '../../context/FormContext';
import { useAppContext } from '../../context/AppContext';

import { FormMode } from '../../context/FormContext';

interface AssetFormProps {
  initialValues?: Partial<IAssetForm>;
  candidates?: Record<string, any[]>;
  mode: FormMode;
  onSubmit: (asset: Omit<IAssetForm, 'id'>) => void;
  onValidationChange?: (isValid: boolean) => void;
  submitTrigger?: number;
}

const AssetForm: React.FC<AssetFormProps> = ({ initialValues, candidates, mode, onSubmit, onValidationChange, submitTrigger }) => {
  // 候補リストはprops優先、なければAppContext
  const { phases: contextPhases } = useAppContext();
  const phases = candidates?.phases ?? contextPhases;

  const [formData, setFormData] = useState({
    name: initialValues?.name ?? '',
    description: initialValues?.description ?? '',
    start_date: initialValues?.start_date ?? '',
    end_date: initialValues?.end_date ?? '',
    status: initialValues?.status ?? 'Not Started',
    priority: initialValues?.priority ?? 'Medium',
    phase_id: initialValues?.phase_id ?? (phases.length > 0 ? phases[0].id : 0),
    assignee: initialValues?.assignee ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // initialValuesが変わったら再セット
    setFormData({
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      start_date: initialValues?.start_date ?? '',
      end_date: initialValues?.end_date ?? '',
      status: initialValues?.status ?? 'Not Started',
      priority: initialValues?.priority ?? 'Medium',
      phase_id: initialValues?.phase_id ?? (phases.length > 0 ? phases[0].id : 0),
      assignee: initialValues?.assignee ?? '',
    });
  }, [initialValues, phases]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required';
    }

    if (!formData.phase_id) {
      newErrors.phase_id = 'Phase selection is required';
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
    validateForm();
  }, [formData]);

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim(),
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        status: formData.status,
        priority: formData.priority,
        phase_id: formData.phase_id,
        assignee: formData.assignee.trim() || undefined,
      });
    }
  };

  // submitTriggerが変更されたときにフォームを送信
  useEffect(() => {
    if (submitTrigger && submitTrigger > 0) {
      handleSubmit();
    }
  }, [submitTrigger]);

  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Box component="form" noValidate>
      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Asset Name"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          required
        />

        <FormControl fullWidth error={!!errors.phase_id}>
          <InputLabel>Phase</InputLabel>
          <Select
            value={formData.phase_id}
            label="Phase"
            onChange={(e) => handleFieldChange('phase_id', e.target.value as number)}
            required
          >
            {phases.map((phase) => (
              <MenuItem key={phase.id} value={phase.id}>
                {phase.name}
              </MenuItem>
            ))}
          </Select>
          {errors.phase_id && (
            <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.75 }}>
              {errors.phase_id}
            </Box>
          )}
        </FormControl>

        <TextField
          fullWidth
          label="Description"
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          multiline
          rows={3}
        />

        <TextField
          fullWidth
          label="Assignee"
          value={formData.assignee}
          onChange={(e) => handleFieldChange('assignee', e.target.value)}
        />

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

        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) => handleFieldChange('status', e.target.value as IAssetForm['status'])}
            >
              <MenuItem value="Not Started">Not Started</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="On Hold">On Hold</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={formData.priority}
              label="Priority"
              onChange={(e) => handleFieldChange('priority', e.target.value as IAssetForm['priority'])}
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Critical">Critical</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Stack>
    </Box>
  );
};

export default AssetForm;

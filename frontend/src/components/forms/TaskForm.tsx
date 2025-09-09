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
import { ITaskForm } from '../../context/FormContext';
import { FormMode } from '../../context/FormContext';
import { useAppContext } from '../../context/AppContext';

interface TaskFormProps {
  initialValues?: Partial<ITaskForm>;
  candidates?: Record<string, any[]>;
  mode: FormMode;
  onSubmit: (task: Omit<ITaskForm, 'id'>) => void;
  onValidationChange?: (isValid: boolean) => void;
  submitTrigger?: number;
}

const TaskForm: React.FC<TaskFormProps> = ({ initialValues, candidates, mode, onSubmit, onValidationChange, submitTrigger }) => {
  // useAppContextは必ずトップレベルで呼び出す
  const appContext = useAppContext();
  // assets候補はcandidatesから取得（なければAppContext）
  const assetsList = candidates?.assets ?? appContext.assets;

  const [formData, setFormData] = useState({
    name: initialValues?.name ?? '',
    description: initialValues?.description ?? '',
    start_date: initialValues?.start_date ?? '',
    end_date: initialValues?.end_date ?? '',
    status: initialValues?.status ?? 'Not Started',
    priority: initialValues?.priority ?? 'Medium',
    asset_id: initialValues?.asset_id ?? (assetsList.length > 0 ? assetsList[0].id : 0),
    assignee: initialValues?.assignee ?? '',
    estimated_hours: initialValues?.estimated_hours?.toString() ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      start_date: initialValues?.start_date ?? '',
      end_date: initialValues?.end_date ?? '',
      status: initialValues?.status ?? 'Not Started',
      priority: initialValues?.priority ?? 'Medium',
      asset_id: initialValues?.asset_id ?? (assetsList.length > 0 ? assetsList[0].id : 0),
      assignee: initialValues?.assignee ?? '',
      estimated_hours: initialValues?.estimated_hours?.toString() ?? '',
    });
  }, [initialValues, assetsList]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Task name is required';
    }

    if (!formData.asset_id) {
      newErrors.asset_id = 'Asset selection is required';
    }

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (formData.estimated_hours && isNaN(Number(formData.estimated_hours))) {
      newErrors.estimated_hours = 'Estimated hours must be a valid number';
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
        asset_id: formData.asset_id,
        assignee: formData.assignee.trim() || undefined,
        estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : undefined,
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
          label="Task Name"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          required
        />

        <FormControl fullWidth error={!!errors.asset_id}>
          <InputLabel>Asset</InputLabel>
          <Select
            value={formData.asset_id}
            label="Asset"
            onChange={(e) => handleFieldChange('asset_id', e.target.value as number)}
            required
          >
            {assetsList.map((asset) => (
              <MenuItem key={asset.id} value={asset.id}>
                {asset.name}
              </MenuItem>
            ))}
          </Select>
          {errors.asset_id && (
            <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.75 }}>
              {errors.asset_id}
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

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Assignee"
            value={formData.assignee}
            onChange={(e) => handleFieldChange('assignee', e.target.value)}
          />

          <TextField
            fullWidth
            label="Estimated Hours"
            type="number"
            value={formData.estimated_hours}
            onChange={(e) => handleFieldChange('estimated_hours', e.target.value)}
            error={!!errors.estimated_hours}
            helperText={errors.estimated_hours}
            inputProps={{ min: 0, step: 0.5 }}
          />
        </Box>

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
              onChange={(e) => handleFieldChange('status', e.target.value as ITaskForm['status'])}
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
              onChange={(e) => handleFieldChange('priority', e.target.value as ITaskForm['priority'])}
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

export default TaskForm;

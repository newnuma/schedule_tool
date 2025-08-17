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
import { Phase } from '../../types/filter.types';
import { useAppContext } from '../../context/AppContext';

interface PhaseFormProps {
  phase?: Phase;
  onSubmit: (phase: Omit<Phase, 'id'>) => void;
  onValidationChange?: (isValid: boolean) => void;
  submitTrigger?: number; // 外部からの送信トリガー
}

const PhaseForm: React.FC<PhaseFormProps> = ({ phase, onSubmit, onValidationChange, submitTrigger }) => {
  const { selectedSubprojectId } = useAppContext();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'Not Started' as Phase['status'],
    priority: 'Medium' as Phase['priority'],
    subproject_id: selectedSubprojectId || 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (phase) {
      setFormData({
        name: phase.name,
        description: phase.description || '',
        start_date: phase.start_date || '',
        end_date: phase.end_date || '',
        status: phase.status,
        priority: phase.priority,
        subproject_id: phase.subproject_id,
      });
    }
  }, [phase]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Phase name is required';
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
        subproject_id: formData.subproject_id,
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
          label="Phase Name"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          required
        />

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
              onChange={(e) => handleFieldChange('status', e.target.value as Phase['status'])}
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
              onChange={(e) => handleFieldChange('priority', e.target.value as Phase['priority'])}
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

export default PhaseForm;

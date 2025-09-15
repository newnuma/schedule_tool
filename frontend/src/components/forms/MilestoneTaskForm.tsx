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
import { IMilestoneTask, IForignKey, AssetTypeArray, MilestoneTaskTypeArray } from '../../context/AppContext';
import { FormMode } from '../../context/FormContext';

interface MilestoneTaskCandidates {
  assets: IForignKey[];
  subprojects?: IForignKey[];
}

interface MilestoneTaskFormProps {
  initialValues?: Partial<IMilestoneTask>;
  candidates?: MilestoneTaskCandidates;
  mode: FormMode;
  onSubmit: (task: Omit<IMilestoneTask, 'id'>) => void;
  onValidationChange?: (isValid: boolean) => void;
  onClose?: () => void;
}

const MilestoneTaskForm: React.FC<MilestoneTaskFormProps> = ({ initialValues, candidates, mode, onSubmit, onValidationChange, onClose }) => {
  const candidatesAssets: IForignKey[] = candidates?.assets ?? [];
  const candidatesSubprojects: IForignKey[] = candidates?.subprojects ?? [];

  const [formData, setFormData] = useState<Omit<IMilestoneTask, 'id'>>({
    type: 'MilestoneTask',
    name: initialValues?.name ?? '',
    asset: initialValues?.asset ?? { type: 'Asset', id: 0, name: '' },
    start_date: initialValues?.start_date ?? '',
    end_date: initialValues?.end_date ?? '',
    milestone_type: initialValues?.milestone_type ?? MilestoneTaskTypeArray[0],
    subproject: initialValues?.subproject ?? undefined,
    asset_type: initialValues?.asset_type ?? undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    setFormData({
      type: 'MilestoneTask',
      name: initialValues?.name ?? '',
      asset: initialValues?.asset ?? { type: 'Asset', id: 0, name: '' },
      start_date: initialValues?.start_date ?? '',
      end_date: initialValues?.end_date ?? '',
      milestone_type: initialValues?.milestone_type ?? MilestoneTaskTypeArray[0],
      subproject: initialValues?.subproject ?? undefined,
      asset_type: initialValues?.asset_type ?? undefined,
    });
  }, [initialValues]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Milestone name is required';
    }
    if (!formData.asset || !formData.asset.id) {
      newErrors.asset = 'Asset selection is required';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    if (!formData.milestone_type) {
      newErrors.milestone_type = 'Milestone type is required';
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
        type: 'MilestoneTask',
        name: formData.name.trim(),
        asset: formData.asset,
        start_date: formData.start_date,
        end_date: formData.start_date,
        milestone_type: formData.milestone_type,
      });
    }
  };

  const handleFieldChange = (field: keyof Omit<IMilestoneTask, 'id'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box component="form" noValidate>
      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Milestone Name"
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
          onChange={(_event: any, newValue: IForignKey | null) => handleFieldChange('asset', newValue || { id: 0, name: '', type: 'Asset' })}
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
        </Box>

        {/* Milestone Type */}
        <FormControl fullWidth>
          <InputLabel>Milestone Type</InputLabel>
          <Select
            value={formData.milestone_type}
            label="Milestone Type"
            onChange={(e) => handleFieldChange('milestone_type', e.target.value as IMilestoneTask['milestone_type'])}
            required
          >
            {MilestoneTaskTypeArray.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
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
            {mode === 'create' || mode === 'copy' ? 'Create Milestone' : 'Edit Milestone'}
          </button>
        </Box>
      </Stack>
    </Box>
  );
};

export default MilestoneTaskForm;

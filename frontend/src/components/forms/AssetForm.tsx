import React, { useState, useEffect } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stack,
  Autocomplete,
} from '@mui/material';
import { IAsset, IForignKey } from '../../context/AppContext';
import { useAppContext, AssetTypeArray } from '../../context/AppContext';
import { AssetCandidates, FormMode } from '../../context/FormContext';


interface AssetFormProps {
  initialValues?: Partial<IAsset>;
  candidates: AssetCandidates;
  mode: FormMode;
  onSubmit: (asset: Omit<IAsset, 'id'>) => void;
  onValidationChange?: (isValid: boolean) => void;
  onClose?: () => void;
}

const AssetForm: React.FC<AssetFormProps> = ({ initialValues, candidates, mode, onSubmit, onValidationChange, onClose }) => {
  // IPhase[] → IForignKey[]（nameあり）に変換
  const { steps, workCategories } = useAppContext();
  const candidatesPhases: IForignKey[] = (candidates?.phases ?? []).map((p: any) => ({ type: 'Phase', id: p.id, name: p.name }));
  const candidatesSteps: IForignKey[] = (steps ?? []).map((s: any) => ({ type: 'Step', id: s.id, name: s.name }));
  const candidatesWorkCategories: IForignKey[] = (workCategories ?? []).map((wc: any) => ({ type: 'WorkCategory', id: wc.id, name: wc.name }));

  const [formData, setFormData] = useState<Omit<IAsset, 'id' | 'color'>>({
    name: initialValues?.name ?? '',
    phase: initialValues?.phase ?? { type: 'Phase', id: 0, name: '' },
    start_date: initialValues?.start_date ?? '',
    end_date: initialValues?.end_date ?? '',
    type: initialValues?.type ?? 'EXT',
    work_category: initialValues?.work_category ?? null,
    step: initialValues?.step ?? null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    // initialValuesが変わったら再セット
    setFormData({
      name: initialValues?.name ?? '',
      phase: initialValues?.phase ?? { type: 'Phase', id: 0, name: '' },
      start_date: initialValues?.start_date ?? '',
      end_date: initialValues?.end_date ?? '',
      type: initialValues?.type ?? AssetTypeArray[0],
      work_category: initialValues?.work_category ?? null,
      step: initialValues?.step ?? null,
    });
  }, [initialValues]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required';
    }
    if (!formData.phase || !formData.phase.id) {
      newErrors.phase = 'Phase selection is required';
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
    if (!formData.work_category || !formData.work_category.id) {
      newErrors.work_category = 'Work category selection is required';
    }
    if (!formData.type) {
      newErrors.type = 'Type selection is required';
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
    onSubmit({
      name: formData.name.trim(),
      phase: formData.phase,
      start_date: formData.start_date,
      end_date: formData.end_date,
      type: formData.type,
      work_category: formData.work_category,
      step: formData.step,
    });
  };

  const handleFieldChange = (field: keyof Omit<IAsset, 'id'>, value: any) => {
    setFormData(prev => {
      if (field === 'phase') {
        // valueはIForignKey型
        return { ...prev, phase: value };
      }
      return { ...prev, [field]: value };
    });
  };

  return (
    <Box component="form" noValidate>
      <Stack spacing={3}>
        {/* Asset Name */}
        <TextField
          fullWidth
          label="Asset Name"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          required
        />

        {/* Phase */}
        <Autocomplete
          options={candidatesPhases}
          getOptionLabel={(option: IForignKey) => option.name ?? ''}
          value={formData.phase}
          onChange={(_event: any, newValue: IForignKey | null) => handleFieldChange('phase', newValue || { id: 0, name: '', type: 'phase' })}
          renderInput={(params: any) => (
            <TextField
              {...params}
              label="Phase"
              error={!!errors.phase}
              helperText={errors.phase}
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

        {/* Work Category */}
        <Autocomplete
          options={candidatesWorkCategories}
          getOptionLabel={(option: IForignKey) => option.name ?? ''}
          value={formData.work_category}
          onChange={(_event: any, newValue: IForignKey | null) => handleFieldChange('work_category', newValue || { id: 0, name: '', type: 'work_category' })}
          renderInput={(params: any) => (
            <TextField
              {...params}
              label="Work Category"
              error={!!errors.work_category}
              helperText={errors.work_category}
              required
            />
          )}
          isOptionEqualToValue={(opt: IForignKey, val: IForignKey) => opt.id === val.id}
        />

        {/* Type Select */}
        <Autocomplete
          options={AssetTypeArray}
          getOptionLabel={(option) => option}
          value={formData.type}
          onChange={(_event: any, newValue: string | null) => handleFieldChange('type', newValue || '')}
          renderInput={(params: any) => (
            <TextField
              {...params}
              label="Type"
              error={!!errors.type}
              helperText={errors.type}
              required
            />
          )}
          isOptionEqualToValue={(opt: string, val: string) => opt === val}
        />

        {/* Step */}
        <Autocomplete
          options={candidatesSteps}
          getOptionLabel={(option: IForignKey) => option.name ?? ''}
          value={formData.step}
          onChange={(_event: any, newValue: IForignKey | null) => handleFieldChange('step', newValue || { id: 0, name: '', type: 'step' })}
          renderInput={(params: any) => (
            <TextField
              {...params}
              label="Step"
              error={!!errors.step}
              helperText={errors.step}
              required
            />
          )}
          isOptionEqualToValue={(opt: IForignKey, val: IForignKey) => opt.id === val.id}
        />
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
            {mode === 'create' || mode === 'copy' ? 'Create Asset' : 'Edit Asset'}
          </button>
        </Box>
      </Stack>
    </Box>
  );
};

export default AssetForm;

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
import { IAsset } from '../../context/AppContext';
import { useAppContext } from '../../context/AppContext';

import { FormMode } from '../../context/FormContext';

import { IForignKey } from '../../context/AppContext';


interface AssetFormProps {
  initialValues?: Partial<IAsset>;
  candidates?: Record<string, any[]>;
  mode: FormMode;
  onSubmit: (asset: Omit<IAsset, 'id'>) => void;
  onValidationChange?: (isValid: boolean) => void;
  onClose?: () => void;
}


const AssetForm: React.FC<AssetFormProps> = ({ initialValues, candidates, mode, onSubmit, onValidationChange, onClose }) => {
  // 候補リストはprops優先、なければAppContext
  const { phases: contextPhases } = useAppContext();
  const phases = candidates?.phases ?? contextPhases;

  const defaultPhaseObj = initialValues?.phase ?? (phases.length > 0 ? phases[0] : { id: 0, name: '', type: 'phase' });
  const [formData, setFormData] = useState<Omit<IAsset, 'id'>>({
    name: initialValues?.name ?? '',
    phase: defaultPhaseObj,
    start_date: initialValues?.start_date ?? '',
    end_date: initialValues?.end_date ?? '',
    type: initialValues?.type ?? 'EXT',
    work_category: initialValues?.work_category ?? null,
    step: initialValues?.step ?? null,
    color: initialValues?.color ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    // initialValuesが変わったら再セット
    const phaseObj = initialValues?.phase ?? (phases.length > 0 ? phases[0] : { id: 0, name: '', type: 'phase' });
    setFormData({
      name: initialValues?.name ?? '',
      phase: phaseObj,
      start_date: initialValues?.start_date ?? '',
      end_date: initialValues?.end_date ?? '',
      type: initialValues?.type ?? 'EXT',
      work_category: initialValues?.work_category ?? null,
      step: initialValues?.step ?? null,
      color: initialValues?.color ?? '',
    });
  }, [initialValues, phases]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required';
    }
    if (!formData.phase || !formData.phase.id) {
      newErrors.phase = 'Phase selection is required';
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
    onSubmit({
      name: formData.name.trim(),
      phase: formData.phase,
      start_date: formData.start_date,
      end_date: formData.end_date,
      type: formData.type,
      work_category: formData.work_category,
      step: formData.step,
      color: formData.color,
    });
  };

  // submitTrigger関連のuseEffectは不要

  const handleFieldChange = (field: keyof Omit<IAsset, 'id'>, value: any) => {
    setFormData(prev => {
      if (field === 'phase') {
        return { ...prev, phase: value };
      }
      return { ...prev, [field]: value };
    });
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

        <FormControl fullWidth error={!!errors.phase}>
          <InputLabel>Phase</InputLabel>
          <Select
            value={formData.phase.id}
            label="Phase"
            onChange={(e) => {
              const phaseObj = phases.find(p => p.id === e.target.value) || { id: e.target.value, name: '', type: 'phase' };
              handleFieldChange('phase', phaseObj);
            }}
            required
          >
            {phases.map((phase) => (
              <MenuItem key={phase.id} value={phase.id}>
                {phase.name}
              </MenuItem>
            ))}
          </Select>
          {errors.phase && (
            <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.75 }}>
              {errors.phase}
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

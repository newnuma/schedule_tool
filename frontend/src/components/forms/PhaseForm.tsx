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
import { IPhase } from '../../context/AppContext';
import { FormMode } from '../../context/FormContext';

interface PhaseFormProps {
  initialValues?: Partial<IPhase>;
  candidates?: Record<string, any[]>;
  mode: FormMode;
  onSubmit: (phase: Omit<IPhase, 'id'>) => void;
  onValidationChange?: (isValid: boolean) => void;
  onClose?: () => void;
  cancelText?: string;
}


const PhaseForm: React.FC<PhaseFormProps> = ({ initialValues, candidates, mode, onSubmit, onValidationChange, onClose, cancelText }) => {
  // サブプロジェクト候補はcandidatesから取得（なければ空）
  const subprojects = candidates?.subprojects ?? [];
  const defaultSubprojectObj = initialValues?.subproject ?? (subprojects.length > 0 ? subprojects[0] : { id: 1, name: '', type: 'subproject' });
  const [formData, setFormData] = useState<Omit<IPhase, 'id'>>({
    name: initialValues?.name ?? '',
    subproject: defaultSubprojectObj,
    start_date: initialValues?.start_date ?? '',
    end_date: initialValues?.end_date ?? '',
    milestone: initialValues?.milestone ?? false,
    type: initialValues?.type ?? 'DESIGN',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const subprojectObj = initialValues?.subproject ?? (subprojects.length > 0 ? subprojects[0] : { id: 1, name: '', type: 'subproject' });
    setFormData({
      name: initialValues?.name ?? '',
      subproject: subprojectObj,
      start_date: initialValues?.start_date ?? '',
      end_date: initialValues?.end_date ?? '',
      milestone: initialValues?.milestone ?? false,
      type: initialValues?.type ?? 'DESIGN',
    });
  }, [initialValues, subprojects]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Phase name is required';
    }
    if (!formData.subproject || !formData.subproject.id) {
      newErrors.subproject = 'Subproject selection is required';
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
        subproject: formData.subproject,
        start_date: formData.start_date,
        end_date: formData.end_date,
        milestone: formData.milestone,
        type: formData.type,
      });
    }
  };

  // submitTrigger関連のuseEffectは不要

  const handleFieldChange = (field: keyof Omit<IPhase, 'id'>, value: any) => {
    setFormData(prev => {
      if (field === 'subproject') {
        return { ...prev, subproject: value };
      }
      return { ...prev, [field]: value };
    });
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

        <FormControl fullWidth error={!!errors.subproject}>
          <InputLabel>Subproject</InputLabel>
          <Select
            value={formData.subproject.id}
            label="Subproject"
            onChange={(e) => {
              const subObj = subprojects.find(s => s.id === e.target.value) || { id: e.target.value, name: '', type: 'subproject' };
              handleFieldChange('subproject', subObj);
            }}
            required
          >
            {subprojects.map((subproject) => (
              <MenuItem key={subproject.id} value={subproject.id}>
                {subproject.name}
              </MenuItem>
            ))}
          </Select>
          {errors.subproject && (
            <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.75 }}>
              {errors.subproject}
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
          <InputLabel>Type</InputLabel>
          <Select
            value={formData.type}
            label="Type"
            onChange={(e) => handleFieldChange('type', e.target.value as IPhase['type'])}
            required
          >
            <MenuItem value="DESIGN">DESIGN</MenuItem>
            <MenuItem value="PRODT">PRODT</MenuItem>
            <MenuItem value="ENG">ENG</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Milestone</InputLabel>
          <Select
            value={formData.milestone ? 'true' : 'false'}
            label="Milestone"
            onChange={(e) => handleFieldChange('milestone', e.target.value === 'true')}
            required
          >
            <MenuItem value="true">True</MenuItem>
            <MenuItem value="false">False</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 24px', fontSize: '1rem', background: '#888', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {cancelText || 'キャンセル'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid}
            style={{ padding: '8px 24px', fontSize: '1rem', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: !isFormValid ? 0.5 : 1 }}
          >
            保存
          </button>
        </Box>
      </Stack>
    </Box>
  );
};

export default PhaseForm;

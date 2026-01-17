/**
 * TemplateEditDialog Component
 * Dialog for editing budget template properties
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControlLabel,
  Checkbox,
  Grid,
  InputAdornment,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { BudgetTemplate } from '../../types/budget.types';
import { useUpdateTemplate } from '../../hooks/useBudgetTemplates';

interface TemplateEditDialogProps {
  open: boolean;
  onClose: () => void;
  template: BudgetTemplate | null;
}

export const TemplateEditDialog: React.FC<TemplateEditDialogProps> = ({
  open,
  onClose,
  template,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [includeSubcategories, setIncludeSubcategories] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [updateInstances, setUpdateInstances] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const updateMutation = useUpdateTemplate();

  // Initialize form with template data
  useEffect(() => {
    if (template) {
      setAmount(template.amount.toString());
      setIncludeSubcategories(template.includeSubcategories);
      setName(template.name);
      setNotes(template.notes || '');
      setEndDate(template.endDate ? new Date(template.endDate) : null);
      setIsActive(template.isActive);
      setUpdateInstances(true);
    }
    setError('');
  }, [template, open]);

  const handleSubmit = async () => {
    if (!template) return;

    // Validation
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    if (name.trim().length > 100) {
      setError('Template name must be 100 characters or less');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (amountNum > 1000000000) {
      setError('Amount must be less than 1,000,000,000');
      return;
    }

    setError('');

    try {
      await updateMutation.mutateAsync({
        id: template.id,
        data: {
          amount: amountNum,
          includeSubcategories,
          name: name.trim(),
          notes: notes.trim() || null,
          endDate: endDate ? endDate.toISOString() : null,
          isActive,
        },
        updateInstances,
      });

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Template: {template.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Template Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                inputProps={{ maxLength: 100 }}
                helperText="Name for this recurring budget template"
              />
            </Grid>

            {/* Budget Amount */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Budget Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{
                  min: 0.01,
                  max: 1000000000,
                  step: 0.01,
                }}
              />
            </Grid>

            {/* Include Subcategories */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeSubcategories}
                    onChange={(e) => setIncludeSubcategories(e.target.checked)}
                  />
                }
                label="Include subcategories in budget"
                sx={{ mt: 1 }}
              />
            </Grid>

            {/* End Date */}
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date (Optional)"
                  value={endDate}
                  onChange={(newValue: Date | null) => setEndDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: 'Leave empty for ongoing recurring budget, or set an end date',
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* Active Status */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                }
                label="Template is active (generates new budgets)"
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                inputProps={{ maxLength: 500 }}
              />
            </Grid>

            {/* Update instances checkbox */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={updateInstances}
                      onChange={(e) => setUpdateInstances(e.target.checked)}
                    />
                  }
                  label="Update all non-customized budget instances with these changes"
                />
              </Alert>
            </Grid>
          </Grid>

          {/* Info about template changes */}
          <Alert severity="info" sx={{ mt: 2 }}>
            Category and period type cannot be changed. Create a new template if you need different settings.
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Updating...' : 'Update Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateEditDialog;

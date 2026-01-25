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
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { BudgetTemplate, BudgetType } from '../../types/budget.types';
import { useUpdateTemplate } from '../../hooks/useBudgetTemplates';
import { useAccounts } from '../../hooks/useAccounts';

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
  const [type, setType] = useState<BudgetType>('EXPENSE');
  const [interval, setInterval] = useState<number>(1);
  const [includeSubcategories, setIncludeSubcategories] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [firstStartDate, setFirstStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [accountId, setAccountId] = useState<string>('');
  const [error, setError] = useState<string>('');

  const { data: accounts = [] } = useAccounts();
  const updateMutation = useUpdateTemplate();

  // Initialize form with template data
  useEffect(() => {
    if (template) {
      setAmount(template.amount.toString());
      setType(template.type || 'EXPENSE');
      setInterval(template.interval);
      setIncludeSubcategories(template.includeSubcategories);
      setName(template.name);
      setNotes(template.notes || '');
      setFirstStartDate(new Date(template.firstStartDate));
      setEndDate(template.endDate ? new Date(template.endDate) : null);
      setIsActive(template.isActive);
      setAccountId(template.accountId || '');
    }
    setError('');
  }, [template, open]);

  const handleSubmit = async () => {
    if (!template) return;

    // Validation
    if (!accountId) {
      setError('Please select an account');
      return;
    }

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

    if (interval < 1 || interval > 365) {
      setError('Interval must be between 1 and 365');
      return;
    }

    if (!firstStartDate) {
      setError('Start date is required');
      return;
    }

    setError('');

    try {
      await updateMutation.mutateAsync({
        id: template.id,
        data: {
          accountId: accountId || undefined,
          amount: amountNum,
          interval,
          includeSubcategories,
          name: name.trim(),
          notes: notes.trim() || null,
          firstStartDate: firstStartDate.toISOString(),
          endDate: endDate ? endDate.toISOString() : null,
          isActive,
        },
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
            <Grid item xs={12} sm={6}>
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

            {/* Account Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!accountId}>
                <InputLabel id="template-account-select-label">Account</InputLabel>
                <Select
                  labelId="template-account-select-label"
                  value={accountId}
                  label="Account"
                  onChange={(e: SelectChangeEvent) => setAccountId(e.target.value)}
                >
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </Select>
                {!accountId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    Please select an account for this template
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Budget Type (Read-Only) */}
            <Grid item xs={12}>
              <FormLabel>Budget Type</FormLabel>
              <RadioGroup value={type} row>
                <FormControlLabel
                  value="EXPENSE"
                  control={<Radio disabled />}
                  label="Expense Budget"
                  disabled
                />
                <FormControlLabel
                  value="INCOME"
                  control={<Radio disabled />}
                  label="Income Budget"
                  disabled
                />
              </RadioGroup>
              <Typography variant="caption" color="text.secondary">
                Budget type cannot be changed after creation
              </Typography>
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

            {/* Interval */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Interval"
                type="number"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                required
                inputProps={{
                  min: 1,
                  max: 365,
                }}
                helperText={`Repeats every ${interval} ${template?.periodType.toLowerCase()}${interval > 1 ? 's' : ''}`}
              />
            </Grid>

            {/* Include Subcategories */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeSubcategories}
                    onChange={(e) => setIncludeSubcategories(e.target.checked)}
                  />
                }
                label="Include subcategories in budget"
              />
            </Grid>

            {/* First Start Date */}
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={firstStartDate}
                  onChange={(newValue: Date | null) => setFirstStartDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      helperText: 'The date when this recurring budget template starts',
                    },
                  }}
                />
              </LocalizationProvider>
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

          </Grid>

          {/* Info about template changes */}
          <Alert severity="info" sx={{ mt: 2 }}>
            Changes apply to all future periods automatically. Customized periods keep their custom values.
            Category and period type cannot be changed - create a new template if needed.
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

/**
 * BudgetForm Component
 * Form for creating and editing budgets
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
import { CategorySelect } from '../categories/CategorySelect';
import PeriodSelector from './PeriodSelector';
import { useCreateBudget, useUpdateBudget } from '../../hooks/useBudgets';
import { useCreateTemplate } from '../../hooks/useBudgetTemplates';
import {
  BudgetWithStatus,
  CreateBudgetDto,
  UpdateBudgetDto,
  CreateBudgetTemplateDto,
  BudgetPeriod,
} from '../../types/budget.types';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface BudgetFormProps {
  open: boolean;
  onClose: () => void;
  budget?: BudgetWithStatus; // If provided, we're editing
}

/**
 * Get current period for a given period type
 */
const getCurrentPeriod = (periodType: BudgetPeriod): { year: number; periodNumber: number } => {
  const now = new Date();
  const year = now.getFullYear();

  switch (periodType) {
    case 'MONTHLY':
      return { year, periodNumber: now.getMonth() + 1 }; // 1-12
    case 'QUARTERLY':
      return { year, periodNumber: Math.floor(now.getMonth() / 3) + 1 }; // 1-4
    case 'WEEKLY':
      // Simple ISO week calculation
      const target = new Date(now.valueOf());
      const dayNumber = (now.getDay() + 6) % 7;
      target.setDate(target.getDate() - dayNumber + 3);
      const firstThursday = target.valueOf();
      target.setMonth(0, 1);
      if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
      }
      return { year, periodNumber: 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000) };
    case 'ANNUALLY':
      return { year, periodNumber: 1 };
    default:
      return { year, periodNumber: 1 };
  }
};

export const BudgetForm: React.FC<BudgetFormProps> = ({ open, onClose, budget }) => {
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [periodType, setPeriodType] = useState<BudgetPeriod>('MONTHLY');
  const [periodYear, setPeriodYear] = useState<number>(new Date().getFullYear());
  const [periodNumber, setPeriodNumber] = useState<number>(new Date().getMonth() + 1);
  const [includeSubcategories, setIncludeSubcategories] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Recurring budget fields
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const createTemplateMutation = useCreateTemplate();

  const isEditing = !!budget;

  // Initialize form with budget data if editing
  useEffect(() => {
    if (budget) {
      setCategoryId(budget.categoryId);
      setAmount(budget.amount.toString());
      setPeriodType(budget.periodType);
      setPeriodYear(budget.periodYear);
      setPeriodNumber(budget.periodNumber);
      setIncludeSubcategories(budget.includeSubcategories);
      setName(budget.name || '');
      setNotes(budget.notes || '');
    } else {
      // Reset form for new budget
      const current = getCurrentPeriod(periodType);
      setCategoryId('');
      setAmount('');
      setPeriodType('MONTHLY');
      setPeriodYear(current.year);
      setPeriodNumber(current.periodNumber);
      setIncludeSubcategories(false);
      setName('');
      setNotes('');
      setIsRecurring(false);
      setEndDate(null);
    }
    setError('');
  }, [budget, open]);

  const handlePeriodTypeChange = (newPeriodType: BudgetPeriod) => {
    setPeriodType(newPeriodType);
    // Update to current period for new period type
    if (!isEditing) {
      const current = getCurrentPeriod(newPeriodType);
      setPeriodYear(current.year);
      setPeriodNumber(current.periodNumber);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!categoryId) {
      setError('Please select a category');
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

    // Additional validation for recurring budgets
    if (isRecurring && !isEditing) {
      if (!name.trim()) {
        setError('Template name is required for recurring budgets');
        return;
      }
      if (name.trim().length > 100) {
        setError('Template name must be 100 characters or less');
        return;
      }
    }

    setError('');

    try {
      if (isEditing) {
        // Update existing budget (only amount, includeSubcategories, name, notes)
        const updateData: UpdateBudgetDto = {
          amount: amountNum,
          includeSubcategories,
          name: name.trim() || null,
          notes: notes.trim() || null,
        };

        await updateMutation.mutateAsync({ id: budget.id, data: updateData });
      } else if (isRecurring) {
        // Create recurring budget template
        const templateData: CreateBudgetTemplateDto = {
          categoryId,
          amount: amountNum,
          periodType,
          startYear: periodYear,
          startNumber: periodNumber,
          includeSubcategories,
          name: name.trim(),
          notes: notes.trim() || undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
        };

        await createTemplateMutation.mutateAsync(templateData);
      } else {
        // Create one-time budget
        const createData: CreateBudgetDto = {
          categoryId,
          amount: amountNum,
          periodType,
          periodYear,
          periodNumber,
          includeSubcategories,
          name: name.trim() || undefined,
          notes: notes.trim() || undefined,
        };

        await createMutation.mutateAsync(createData);
      }

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Category Selection */}
            <Grid item xs={12}>
              <CategorySelect
                value={categoryId}
                onChange={setCategoryId}
                label="Category"
                disabled={isEditing} // Cannot change category when editing
              />
            </Grid>

            {/* Period Selection */}
            {!isEditing && (
              <Grid item xs={12}>
                <PeriodSelector
                  periodType={periodType}
                  periodYear={periodYear}
                  periodNumber={periodNumber}
                  onPeriodTypeChange={handlePeriodTypeChange}
                  onPeriodYearChange={setPeriodYear}
                  onPeriodNumberChange={setPeriodNumber}
                />
              </Grid>
            )}

            {/* Show period info when editing (read-only) */}
            {isEditing && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Period"
                  value={`${periodType} - ${periodYear} - Period ${periodNumber}`}
                  disabled
                  helperText="Period cannot be changed when editing a budget"
                />
              </Grid>
            )}

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

            {/* Recurring Budget Toggle */}
            {!isEditing && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                    />
                  }
                  label="Make this recurring"
                  sx={{ mt: 1 }}
                />
              </Grid>
            )}

            {/* Name - Required for recurring, optional for one-time */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={isRecurring ? 'Template Name (Required)' : 'Budget Name (Optional)'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                inputProps={{ maxLength: 100 }}
                required={isRecurring}
                helperText={
                  isRecurring
                    ? 'Name for this recurring budget template (e.g., "Monthly Groceries")'
                    : 'Custom name for this budget (e.g., "Holiday Shopping Fund")'
                }
              />
            </Grid>

            {/* End Date - Only for recurring budgets */}
            {isRecurring && !isEditing && (
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date (Optional)"
                    value={endDate}
                    onChange={(newValue: Date | null) => setEndDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText:
                          'Leave empty for ongoing recurring budget, or set an end date',
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            )}

            {/* Notes (optional) */}
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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            createMutation.isPending ||
            updateMutation.isPending ||
            createTemplateMutation.isPending
          }
        >
          {isEditing ? 'Update' : isRecurring ? 'Create Recurring' : 'Create'} Budget
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BudgetForm;

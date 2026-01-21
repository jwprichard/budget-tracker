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
  MenuItem,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { CategorySelect } from '../categories/CategorySelect';
import { useCreateBudget, useUpdateBudget } from '../../hooks/useBudgets';
import { useCreateTemplate } from '../../hooks/useBudgetTemplates';
import {
  BudgetWithStatus,
  CreateBudgetDto,
  UpdateBudgetDto,
  CreateBudgetTemplateDto,
  BudgetPeriod,
  BudgetType,
} from '../../types/budget.types';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

/**
 * Initial values for pre-populating the form (e.g., from a transaction)
 */
export interface BudgetFormInitialValues {
  categoryId?: string;
  amount?: number;
  budgetType?: BudgetType;
  name?: string;
  startDate?: Date;
}

interface BudgetFormProps {
  open: boolean;
  onClose: () => void;
  budget?: BudgetWithStatus; // If provided, we're editing
  initialValues?: BudgetFormInitialValues; // For pre-populating form (e.g., from transaction)
}

const PERIOD_TYPES: { value: BudgetPeriod; label: string; singular: string; plural: string }[] = [
  { value: 'DAILY', label: 'Daily', singular: 'day', plural: 'days' },
  { value: 'WEEKLY', label: 'Weekly', singular: 'week', plural: 'weeks' },
  { value: 'FORTNIGHTLY', label: 'Fortnightly', singular: 'fortnight', plural: 'fortnights' },
  { value: 'MONTHLY', label: 'Monthly', singular: 'month', plural: 'months' },
  { value: 'ANNUALLY', label: 'Annually', singular: 'year', plural: 'years' },
];

export const BudgetForm: React.FC<BudgetFormProps> = ({ open, onClose, budget, initialValues }) => {
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [budgetType, setBudgetType] = useState<BudgetType>('EXPENSE');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [includeSubcategories, setIncludeSubcategories] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Recurring budget fields
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [periodType, setPeriodType] = useState<BudgetPeriod>('MONTHLY');
  const [interval, setInterval] = useState<number>(1);
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
      setBudgetType(budget.type || 'EXPENSE');
      setStartDate(new Date(budget.startDate));
      setIncludeSubcategories(budget.includeSubcategories);
      setName(budget.name || '');
      setNotes(budget.notes || '');

      // Check if it's a recurring budget
      if (budget.periodType) {
        setIsRecurring(true);
        setPeriodType(budget.periodType);
        setInterval(budget.interval || 1);
      } else {
        setIsRecurring(false);
      }
    } else {
      // Reset form for new budget, with optional initial values (e.g., from transaction)
      setCategoryId(initialValues?.categoryId || '');
      setAmount(initialValues?.amount?.toString() || '');
      setBudgetType(initialValues?.budgetType || 'EXPENSE');
      setStartDate(initialValues?.startDate || new Date());
      setIncludeSubcategories(false);
      setName(initialValues?.name || '');
      setNotes('');
      setIsRecurring(false);
      setPeriodType('MONTHLY');
      setInterval(1);
      setEndDate(null);
    }
    setError('');
  }, [budget, open, initialValues]);

  const getPeriodLabel = () => {
    const periodInfo = PERIOD_TYPES.find((p) => p.value === periodType);
    if (!periodInfo) return '';
    return interval === 1 ? periodInfo.singular : periodInfo.plural;
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
      if (interval < 1 || interval > 365) {
        setError('Interval must be between 1 and 365');
        return;
      }
    }

    setError('');

    try {
      if (isEditing) {
        // Update existing budget (only amount, type, includeSubcategories, name, notes)
        const updateData: UpdateBudgetDto = {
          amount: amountNum,
          type: budgetType,
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
          type: budgetType,
          periodType,
          interval,
          firstStartDate: startDate.toISOString(),
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
          type: budgetType,
          startDate: startDate.toISOString(),
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

            {/* Budget Type Selection */}
            <Grid item xs={12}>
              <FormLabel id="budget-type-label">Budget Type</FormLabel>
              <RadioGroup
                aria-labelledby="budget-type-label"
                value={budgetType}
                onChange={(e) => setBudgetType(e.target.value as BudgetType)}
                row
              >
                <FormControlLabel
                  value="EXPENSE"
                  control={<Radio />}
                  label="Expense Budget (spending limit)"
                />
                <FormControlLabel
                  value="INCOME"
                  control={<Radio />}
                  label="Income Budget (expected income)"
                />
              </RadioGroup>
            </Grid>

            {/* Start Date */}
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue: Date | null) => {
                    if (newValue) setStartDate(newValue);
                  }}
                  disabled={isEditing} // Cannot change start date when editing
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      helperText: isEditing
                        ? 'Start date cannot be changed'
                        : isRecurring
                        ? 'This budget will start on this date and repeat based on your settings'
                        : 'This budget will track spending starting from this date',
                    },
                  }}
                />
              </LocalizationProvider>
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
                label="Include subcategories"
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
                />
              </Grid>
            )}

            {/* Recurring Budget Settings */}
            {isRecurring && !isEditing && (
              <>
                <Grid item xs={12}>
                  <FormLabel sx={{ mb: 1, display: 'block' }}>Repeat every:</FormLabel>
                </Grid>

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
                    helperText={`Every ${interval} ${getPeriodLabel()}`}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Period Type"
                    value={periodType}
                    onChange={(e) => setPeriodType(e.target.value as BudgetPeriod)}
                    required
                  >
                    {PERIOD_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date (Optional)"
                      value={endDate}
                      onChange={(newValue: Date | null) => setEndDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          helperText: 'Leave empty for ongoing recurring budget',
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
              </>
            )}

            {/* Name - Required for recurring, optional for one-time */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={isRecurring ? 'Template Name (Required)' : 'Budget Name (Optional)'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                inputProps={{ maxLength: 100 }}
                required={isRecurring && !isEditing}
                helperText={
                  isRecurring
                    ? 'Name for this recurring budget (e.g., "Monthly Groceries")'
                    : 'Custom name for this budget (e.g., "Holiday Shopping Fund")'
                }
              />
            </Grid>

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

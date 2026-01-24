/**
 * PlannedTransactionForm Component
 * Form for creating and editing planned transaction templates
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
  RadioGroup,
  Radio,
  Typography,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { CategorySelect } from '../categories/CategorySelect';
import { useAccounts } from '../../hooks/useAccounts';
import {
  useCreatePlannedTransactionTemplate,
  useUpdatePlannedTransactionTemplate,
  useCreatePlannedTransaction,
  useUpdatePlannedTransaction,
} from '../../hooks/usePlannedTransactions';
import {
  PlannedTransactionTemplate,
  PlannedTransaction,
  CreatePlannedTransactionTemplateDto,
  CreatePlannedTransactionDto,
  UpdatePlannedTransactionDto,
  BudgetPeriod,
  DayOfMonthType,
} from '../../types/plannedTransaction.types';
import { TransactionType } from '../../types';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export interface PlannedTransactionFormInitialValues {
  name?: string;
  type?: TransactionType;
  amount?: number;
  accountId?: string;
  categoryId?: string;
  description?: string;
}

interface PlannedTransactionFormProps {
  open: boolean;
  onClose: () => void;
  template?: PlannedTransactionTemplate;
  oneOffTransaction?: PlannedTransaction;
  initialValues?: PlannedTransactionFormInitialValues;
}

const PERIOD_TYPES: { value: BudgetPeriod; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'FORTNIGHTLY', label: 'Fortnightly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'ANNUALLY', label: 'Annually' },
];

const DAY_OF_MONTH_TYPES: { value: DayOfMonthType; label: string }[] = [
  { value: 'FIXED', label: 'Fixed day of month' },
  { value: 'LAST_DAY', label: 'Last day of month' },
  { value: 'FIRST_WEEKDAY', label: 'First weekday of month' },
  { value: 'LAST_WEEKDAY', label: 'Last weekday of month' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const PlannedTransactionForm: React.FC<PlannedTransactionFormProps> = ({
  open,
  onClose,
  template,
  oneOffTransaction,
  initialValues,
}) => {
  // Basic fields
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Transfer fields
  const [isTransfer, setIsTransfer] = useState(false);
  const [transferToAccountId, setTransferToAccountId] = useState('');

  // One-time vs Recurring
  const [isOneTime, setIsOneTime] = useState(false);
  const [expectedDate, setExpectedDate] = useState<Date>(new Date());

  // Recurrence fields
  const [periodType, setPeriodType] = useState<BudgetPeriod>('MONTHLY');
  const [interval, setInterval] = useState(1);
  const [firstOccurrence, setFirstOccurrence] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dayOfMonth, setDayOfMonth] = useState<number | null>(null);
  const [dayOfMonthType, setDayOfMonthType] = useState<DayOfMonthType>('FIXED');
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);

  // Matching fields
  const [showMatchingOptions, setShowMatchingOptions] = useState(false);
  const [autoMatchEnabled, setAutoMatchEnabled] = useState(true);
  const [skipReview, setSkipReview] = useState(false);
  const [matchTolerance, setMatchTolerance] = useState('');
  const [matchWindowDays, setMatchWindowDays] = useState(7);

  const [error, setError] = useState('');

  const { data: accounts } = useAccounts();
  const createTemplateMutation = useCreatePlannedTransactionTemplate();
  const updateTemplateMutation = useUpdatePlannedTransactionTemplate();
  const createOneTimeMutation = useCreatePlannedTransaction();
  const updateOneTimeMutation = useUpdatePlannedTransaction();

  const isEditingTemplate = !!template;
  const isEditingOneOff = !!oneOffTransaction;
  const isEditing = isEditingTemplate || isEditingOneOff;

  // Initialize form with template, one-off transaction, or initial values
  useEffect(() => {
    if (template) {
      // Editing a recurring template
      setName(template.name);
      setType(template.type);
      setAmount(Math.abs(template.amount).toString());
      setAccountId(template.accountId);
      setCategoryId(template.categoryId || '');
      setDescription(template.description || '');
      setNotes(template.notes || '');
      setIsTransfer(template.isTransfer);
      setTransferToAccountId(template.transferToAccountId || '');
      setIsOneTime(false);
      setPeriodType(template.periodType);
      setInterval(template.interval);
      setFirstOccurrence(new Date(template.firstOccurrence));
      setEndDate(template.endDate ? new Date(template.endDate) : null);
      setDayOfMonth(template.dayOfMonth);
      setDayOfMonthType(template.dayOfMonthType || 'FIXED');
      setDayOfWeek(template.dayOfWeek);
      setAutoMatchEnabled(template.autoMatchEnabled);
      setSkipReview(template.skipReview);
      setMatchTolerance(template.matchTolerance?.toString() || '');
      setMatchWindowDays(template.matchWindowDays);
    } else if (oneOffTransaction) {
      // Editing a one-off transaction
      setName(oneOffTransaction.name);
      setType(oneOffTransaction.type);
      setAmount(Math.abs(oneOffTransaction.amount).toString());
      setAccountId(oneOffTransaction.accountId);
      setCategoryId(oneOffTransaction.categoryId || '');
      setDescription(oneOffTransaction.description || '');
      setNotes(oneOffTransaction.notes || '');
      setIsTransfer(oneOffTransaction.isTransfer);
      setTransferToAccountId(oneOffTransaction.transferToAccountId || '');
      setIsOneTime(true);
      setExpectedDate(new Date(oneOffTransaction.expectedDate));
      setAutoMatchEnabled(oneOffTransaction.autoMatchEnabled);
      setSkipReview(oneOffTransaction.skipReview);
      setMatchTolerance(oneOffTransaction.matchTolerance?.toString() || '');
      setMatchWindowDays(oneOffTransaction.matchWindowDays);
    } else if (initialValues) {
      // Pre-populate from initial values (e.g., from existing transaction)
      resetForm();
      if (initialValues.name) setName(initialValues.name);
      if (initialValues.type) setType(initialValues.type);
      if (initialValues.amount) setAmount(initialValues.amount.toString());
      if (initialValues.accountId) setAccountId(initialValues.accountId);
      if (initialValues.categoryId) setCategoryId(initialValues.categoryId);
      if (initialValues.description) setDescription(initialValues.description);
    } else {
      resetForm();
    }
  }, [template, oneOffTransaction, initialValues, open]);

  const resetForm = () => {
    setName('');
    setType('EXPENSE');
    setAmount('');
    setAccountId('');
    setCategoryId('');
    setDescription('');
    setNotes('');
    setIsTransfer(false);
    setTransferToAccountId('');
    setIsOneTime(false);
    setExpectedDate(new Date());
    setPeriodType('MONTHLY');
    setInterval(1);
    setFirstOccurrence(new Date());
    setEndDate(null);
    setDayOfMonth(null);
    setDayOfMonthType('FIXED');
    setDayOfWeek(null);
    setAutoMatchEnabled(true);
    setSkipReview(false);
    setMatchTolerance('');
    setMatchWindowDays(7);
    setError('');
    setShowMatchingOptions(false);
  };

  const handleSubmit = async () => {
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!accountId) {
      setError('Please select an account');
      return;
    }
    if (isTransfer && !transferToAccountId) {
      setError('Please select a destination account for the transfer');
      return;
    }

    const parsedAmount = parseFloat(amount);
    const finalAmount = type === 'EXPENSE' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);

    try {
      if (isEditingOneOff && oneOffTransaction) {
        // Update a one-off transaction
        const updateData: UpdatePlannedTransactionDto = {
          name: name.trim(),
          type: isTransfer ? 'TRANSFER' : type,
          amount: finalAmount,
          accountId,
          categoryId: categoryId || null,
          description: description.trim() || null,
          notes: notes.trim() || null,
          isTransfer,
          transferToAccountId: isTransfer ? transferToAccountId : null,
          expectedDate: expectedDate.toISOString(),
          autoMatchEnabled,
          skipReview,
          matchTolerance: matchTolerance ? parseFloat(matchTolerance) : null,
          matchWindowDays,
        };
        await updateOneTimeMutation.mutateAsync({ id: oneOffTransaction.id, data: updateData });
      } else if (isOneTime && !isEditing) {
        // Create a one-time planned transaction
        const oneTimeData: CreatePlannedTransactionDto = {
          name: name.trim(),
          type: isTransfer ? 'TRANSFER' : type,
          amount: finalAmount,
          accountId,
          categoryId: categoryId || undefined,
          description: description.trim() || undefined,
          notes: notes.trim() || undefined,
          isTransfer,
          transferToAccountId: isTransfer ? transferToAccountId : undefined,
          expectedDate: expectedDate.toISOString(),
          autoMatchEnabled,
          skipReview,
          matchTolerance: matchTolerance ? parseFloat(matchTolerance) : undefined,
          matchWindowDays,
        };
        await createOneTimeMutation.mutateAsync(oneTimeData);
      } else {
        // Create or update a recurring template
        const templateData: CreatePlannedTransactionTemplateDto = {
          name: name.trim(),
          type: isTransfer ? 'TRANSFER' : type,
          amount: finalAmount,
          accountId,
          categoryId: categoryId || undefined,
          description: description.trim() || undefined,
          notes: notes.trim() || undefined,
          isTransfer,
          transferToAccountId: isTransfer ? transferToAccountId : undefined,
          periodType,
          interval,
          firstOccurrence: firstOccurrence.toISOString(),
          endDate: endDate?.toISOString(),
          dayOfMonth: periodType === 'MONTHLY' && dayOfMonthType === 'FIXED' ? dayOfMonth ?? undefined : undefined,
          dayOfMonthType: periodType === 'MONTHLY' ? dayOfMonthType : undefined,
          dayOfWeek: periodType === 'WEEKLY' ? dayOfWeek ?? undefined : undefined,
          autoMatchEnabled,
          skipReview,
          matchTolerance: matchTolerance ? parseFloat(matchTolerance) : undefined,
          matchWindowDays,
        };

        if (isEditing && template) {
          await updateTemplateMutation.mutateAsync({ id: template.id, data: templateData });
        } else {
          await createTemplateMutation.mutateAsync(templateData);
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save planned transaction');
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Planned Transaction' : 'Create Planned Transaction'}
      </DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              {/* Name */}
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  required
                  placeholder="e.g., Monthly Rent, Salary"
                />
              </Grid>

              {/* Type */}
              <Grid item xs={12}>
                <FormLabel>Type</FormLabel>
                <RadioGroup
                  row
                  value={isTransfer ? 'TRANSFER' : type}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'TRANSFER') {
                      setIsTransfer(true);
                      setType('EXPENSE');
                    } else {
                      setIsTransfer(false);
                      setType(val as TransactionType);
                    }
                  }}
                >
                  <FormControlLabel value="EXPENSE" control={<Radio />} label="Expense" />
                  <FormControlLabel value="INCOME" control={<Radio />} label="Income" />
                  <FormControlLabel value="TRANSFER" control={<Radio />} label="Transfer" />
                </RadioGroup>
              </Grid>

              {/* Amount */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  fullWidth
                  required
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Account */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label={isTransfer ? 'From Account' : 'Account'}
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  fullWidth
                  required
                >
                  {accounts?.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Transfer To Account */}
              {isTransfer && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="To Account"
                    value={transferToAccountId}
                    onChange={(e) => setTransferToAccountId(e.target.value)}
                    fullWidth
                    required
                  >
                    {accounts
                      ?.filter((a) => a.id !== accountId)
                      .map((account) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.name}
                        </MenuItem>
                      ))}
                  </TextField>
                </Grid>
              )}

              {/* Category */}
              {!isTransfer && (
                <Grid item xs={12} sm={6}>
                  <CategorySelect
                    value={categoryId}
                    onChange={setCategoryId}
                    label="Category"
                  />
                </Grid>
              )}

              {/* One-time vs Recurring Toggle - only show when creating new */}
              {!isEditing && (
                <Grid item xs={12}>
                  <FormLabel>Schedule</FormLabel>
                  <RadioGroup
                    row
                    value={isOneTime ? 'one-time' : 'recurring'}
                    onChange={(e) => setIsOneTime(e.target.value === 'one-time')}
                  >
                    <FormControlLabel value="one-time" control={<Radio />} label="One-time" />
                    <FormControlLabel value="recurring" control={<Radio />} label="Recurring" />
                  </RadioGroup>
                </Grid>
              )}

              {/* Expected Date - for one-time transactions (creating or editing) */}
              {isOneTime && (
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Expected Date"
                    value={expectedDate}
                    onChange={(date) => date && setExpectedDate(date)}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
              )}

              {/* Recurring transaction fields */}
              {!isOneTime && (
                <>
                  {/* Period Type */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Frequency"
                      value={periodType}
                      onChange={(e) => setPeriodType(e.target.value as BudgetPeriod)}
                      fullWidth
                    >
                      {PERIOD_TYPES.map((pt) => (
                        <MenuItem key={pt.value} value={pt.value}>
                          {pt.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Interval */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Every"
                      value={interval}
                      onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                      fullWidth
                      type="number"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {periodType.toLowerCase().replace('ly', interval === 1 ? '' : 's')}
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* Day of Month Type (for Monthly) */}
                  {periodType === 'MONTHLY' && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        label="Day Selection"
                        value={dayOfMonthType}
                        onChange={(e) => setDayOfMonthType(e.target.value as DayOfMonthType)}
                        fullWidth
                      >
                        {DAY_OF_MONTH_TYPES.map((d) => (
                          <MenuItem key={d.value} value={d.value}>
                            {d.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  )}

                  {/* Fixed Day of Month */}
                  {periodType === 'MONTHLY' && dayOfMonthType === 'FIXED' && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Day of Month"
                        value={dayOfMonth ?? ''}
                        onChange={(e) => setDayOfMonth(parseInt(e.target.value) || null)}
                        fullWidth
                        type="number"
                        inputProps={{ min: 1, max: 31 }}
                      />
                    </Grid>
                  )}

                  {/* Day of Week (for Weekly) */}
                  {periodType === 'WEEKLY' && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        label="Day of Week"
                        value={dayOfWeek ?? ''}
                        onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                        fullWidth
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <MenuItem key={d.value} value={d.value}>
                            {d.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  )}

                  {/* First Occurrence */}
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="First Occurrence"
                      value={firstOccurrence}
                      onChange={(date) => date && setFirstOccurrence(date)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>

                  {/* End Date */}
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="End Date (Optional)"
                      value={endDate}
                      onChange={(date) => setEndDate(date)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                </>
              )}

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>

              {/* Matching Options Toggle */}
              <Grid item xs={12}>
                <Button
                  onClick={() => setShowMatchingOptions(!showMatchingOptions)}
                  endIcon={showMatchingOptions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  <Typography variant="subtitle2">
                    Matching Options
                  </Typography>
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Collapse in={showMatchingOptions}>
                  <Box sx={{ pl: 2, pr: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={autoMatchEnabled}
                              onChange={(e) => setAutoMatchEnabled(e.target.checked)}
                            />
                          }
                          label="Enable auto-matching with actual transactions"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={skipReview}
                              onChange={(e) => setSkipReview(e.target.checked)}
                              disabled={!autoMatchEnabled}
                            />
                          }
                          label="Skip review for high-confidence matches"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Amount Tolerance"
                          value={matchTolerance}
                          onChange={(e) => setMatchTolerance(e.target.value)}
                          fullWidth
                          type="number"
                          disabled={!autoMatchEnabled}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                          helperText="Allow matches within this amount difference"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Match Window (Days)"
                          value={matchWindowDays}
                          onChange={(e) => setMatchWindowDays(parseInt(e.target.value) || 7)}
                          fullWidth
                          type="number"
                          disabled={!autoMatchEnabled}
                          helperText="Days before/after expected date to match"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
              </Grid>
            </Grid>
          </Box>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending || createOneTimeMutation.isPending || updateOneTimeMutation.isPending}
        >
          {isEditing ? 'Save Changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlannedTransactionForm;

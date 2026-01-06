import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import { Transaction, CreateTransactionDto, UpdateTransactionDto, TransactionType, TransactionStatus } from '../../types';
import { AmountInput } from '../common/AmountInput';
import { DatePicker } from '../common/DatePicker';
import { CategorySelect } from '../categories/CategorySelect';
import { useAccounts } from '../../hooks/useAccounts';

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransactionDto | UpdateTransactionDto) => void;
  transaction?: Transaction | null;
  defaultAccountId?: string;
  isSubmitting?: boolean;
}

const transactionTypes: { value: TransactionType; label: string }[] = [
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'TRANSFER', label: 'Transfer' },
];

const transactionStatuses: { value: TransactionStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CLEARED', label: 'Cleared' },
  { value: 'RECONCILED', label: 'Reconciled' },
];

export const TransactionForm = ({
  open,
  onClose,
  onSubmit,
  transaction,
  defaultAccountId,
  isSubmitting = false,
}: TransactionFormProps) => {
  const isEditing = !!transaction;
  const { data: accounts = [] } = useAccounts();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTransactionDto>({
    defaultValues: {
      accountId: defaultAccountId || '',
      categoryId: '',
      type: 'EXPENSE',
      amount: 0,
      date: today,
      description: '',
      notes: '',
      status: 'CLEARED',
    },
  });

  // Reset form when transaction or dialog open state changes
  useEffect(() => {
    if (open && transaction) {
      // Editing existing transaction
      reset({
        accountId: transaction.accountId,
        categoryId: transaction.categoryId || '',
        type: transaction.type !== 'TRANSFER' ? transaction.type : 'EXPENSE',
        amount: Math.abs(parseFloat(transaction.amount)),
        date: transaction.date.split('T')[0],
        description: transaction.description,
        notes: transaction.notes || '',
        status: transaction.status,
      });
    } else if (open && !transaction) {
      // Creating new transaction
      reset({
        accountId: defaultAccountId || '',
        categoryId: '',
        type: 'EXPENSE',
        amount: 0,
        date: today,
        description: '',
        notes: '',
        status: 'CLEARED',
      });
    }
  }, [open, transaction, defaultAccountId, today, reset]);

  const handleFormSubmit = (data: CreateTransactionDto) => {
    // Convert date to ISO string
    const submitData = {
      ...data,
      date: new Date(data.date).toISOString(),
    };
    onSubmit(submitData);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Transaction' : 'Create Transaction'}</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="accountId"
                control={control}
                rules={{ required: 'Account is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Account"
                    fullWidth
                    required
                    error={!!errors.accountId}
                    helperText={errors.accountId?.message}
                    disabled={isSubmitting}
                  >
                    {accounts.filter((acc) => acc.isActive).map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name} ({account.type.replace('_', ' ')})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="type"
                control={control}
                rules={{ required: 'Type is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Type"
                    fullWidth
                    required
                    error={!!errors.type}
                    helperText={errors.type?.message}
                    disabled={isSubmitting}
                  >
                    {transactionTypes.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Status"
                    fullWidth
                    error={!!errors.status}
                    helperText={errors.status?.message}
                    disabled={isSubmitting}
                  >
                    {transactionStatuses.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="amount"
                control={control}
                rules={{ required: 'Amount is required', min: { value: 0.01, message: 'Amount must be greater than 0' } }}
                render={({ field: { onChange, value, ...field } }) => (
                  <AmountInput
                    {...field}
                    label="Amount"
                    value={value}
                    onChange={onChange}
                    required
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="date"
                control={control}
                rules={{ required: 'Date is required' }}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Date"
                    required
                    error={!!errors.date}
                    helperText={errors.date?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                rules={{ required: 'Description is required', minLength: { value: 1, message: 'Description is required' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    required
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <CategorySelect
                    value={field.value || ''}
                    onChange={field.onChange}
                    label="Category (Optional)"
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes (Optional)"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

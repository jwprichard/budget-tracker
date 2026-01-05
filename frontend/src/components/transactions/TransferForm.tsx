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
import { CreateTransferDto } from '../../types';
import { AmountInput } from '../common/AmountInput';
import { DatePicker } from '../common/DatePicker';
import { useAccounts } from '../../hooks/useAccounts';

interface TransferFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransferDto) => void;
  isSubmitting?: boolean;
}

export const TransferForm = ({ open, onClose, onSubmit, isSubmitting = false }: TransferFormProps) => {
  const { data: accounts = [] } = useAccounts();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateTransferDto>({
    defaultValues: {
      fromAccountId: '',
      toAccountId: '',
      amount: 0,
      date: today,
      description: '',
    },
  });

  const fromAccountId = watch('fromAccountId');

  const handleFormSubmit = (data: CreateTransferDto) => {
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
      <DialogTitle>Create Transfer</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="fromAccountId"
                control={control}
                rules={{ required: 'From account is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="From Account"
                    fullWidth
                    required
                    error={!!errors.fromAccountId}
                    helperText={errors.fromAccountId?.message}
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

            <Grid item xs={12}>
              <Controller
                name="toAccountId"
                control={control}
                rules={{
                  required: 'To account is required',
                  validate: (value) => value !== fromAccountId || 'Cannot transfer to the same account',
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="To Account"
                    fullWidth
                    required
                    error={!!errors.toAccountId}
                    helperText={errors.toAccountId?.message}
                    disabled={isSubmitting}
                  >
                    {accounts
                      .filter((acc) => acc.isActive && acc.id !== fromAccountId)
                      .map((account) => (
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Transfer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

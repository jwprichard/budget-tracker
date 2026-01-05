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
import { Account, CreateAccountDto, UpdateAccountDto, AccountType } from '../../types';
import { AmountInput } from '../common/AmountInput';

interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAccountDto | UpdateAccountDto, balanceChanged?: number) => void;
  account?: Account | null;
  currentBalance?: number;
  isSubmitting?: boolean;
}

const accountTypes: { value: AccountType; label: string }[] = [
  { value: 'CHECKING', label: 'Checking' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'CASH', label: 'Cash' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'OTHER', label: 'Other' },
];

export const AccountForm = ({
  open,
  onClose,
  onSubmit,
  account,
  currentBalance,
  isSubmitting = false
}: AccountFormProps) => {
  const isEditing = !!account;
  const balanceForForm = isEditing && currentBalance !== undefined
    ? parseFloat(currentBalance.toFixed(2))
    : (account ? parseFloat(parseFloat(account.initialBalance).toFixed(2)) : 0);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAccountDto>({
    defaultValues: {
      name: account?.name || '',
      type: account?.type || 'CHECKING',
      category: account?.category || '',
      currency: account?.currency || 'USD',
      initialBalance: balanceForForm,
    },
  });

  const handleFormSubmit = (data: CreateAccountDto) => {
    let balanceChanged: number | undefined;

    if (isEditing && currentBalance !== undefined) {
      // Calculate balance difference for adjustment transaction
      balanceChanged = data.initialBalance - currentBalance;
      // Don't include initialBalance in update (we'll use adjustment transaction)
      const { initialBalance, ...updateData } = data;
      onSubmit(updateData as UpdateAccountDto, balanceChanged);
    } else {
      onSubmit(data);
    }
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Account' : 'Create Account'}</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required', minLength: { value: 1, message: 'Name is required' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Account Name"
                    fullWidth
                    required
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    disabled={isSubmitting}
                  />
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
                    label="Account Type"
                    fullWidth
                    required
                    error={!!errors.type}
                    helperText={errors.type?.message}
                    disabled={isSubmitting}
                  >
                    {accountTypes.map((option) => (
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
                name="category"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Category (Optional)"
                    fullWidth
                    error={!!errors.category}
                    helperText={errors.category?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Currency"
                    fullWidth
                    error={!!errors.currency}
                    helperText={errors.currency?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="initialBalance"
                control={control}
                rules={{ required: isEditing ? 'Current balance is required' : 'Initial balance is required' }}
                render={({ field: { onChange, value, ...field } }) => (
                  <AmountInput
                    {...field}
                    label={isEditing ? "Current Balance" : "Initial Balance"}
                    value={value}
                    onChange={onChange}
                    required
                    error={!!errors.initialBalance}
                    helperText={errors.initialBalance?.message}
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

import { Box, TextField, MenuItem, Grid } from '@mui/material';
import { TransactionType, TransactionStatus, TransactionQuery } from '../../types';
import { useAccounts } from '../../hooks/useAccounts';
import { DatePicker } from '../common/DatePicker';

interface TransactionFiltersProps {
  filters: TransactionQuery;
  onFiltersChange: (filters: TransactionQuery) => void;
}

const transactionTypes: { value: TransactionType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'TRANSFER', label: 'Transfer' },
];

const transactionStatuses: { value: TransactionStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CLEARED', label: 'Cleared' },
  { value: 'RECONCILED', label: 'Reconciled' },
];

export const TransactionFilters = ({ filters, onFiltersChange }: TransactionFiltersProps) => {
  const { data: accounts = [] } = useAccounts();

  const handleFilterChange = (key: keyof TransactionQuery, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            label="Account"
            fullWidth
            value={filters.accountId || ''}
            onChange={(e) => handleFilterChange('accountId', e.target.value)}
          >
            <MenuItem value="">All Accounts</MenuItem>
            {accounts.filter((acc) => acc.isActive).map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            label="Type"
            fullWidth
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            {transactionTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            label="Status"
            fullWidth
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            {transactionStatuses.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <DatePicker
            label="Start Date"
            value={filters.startDate || ''}
            onChange={(value) => handleFilterChange('startDate', value)}
            maxDate={filters.endDate || undefined}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <DatePicker
            label="End Date"
            value={filters.endDate || ''}
            onChange={(value) => handleFilterChange('endDate', value)}
            minDate={filters.startDate || undefined}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

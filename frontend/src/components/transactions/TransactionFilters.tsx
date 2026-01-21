import { Box, TextField, MenuItem, Grid } from '@mui/material';
import { TransactionType, TransactionStatus, TransactionQuery } from '../../types';
import { useAccounts } from '../../hooks/useAccounts';
import { DatePicker } from '../common/DatePicker';

export type BudgetStatusFilter = '' | 'budgeted' | 'not_budgeted';

interface TransactionFiltersProps {
  filters: TransactionQuery;
  onFiltersChange: (filters: TransactionQuery) => void;
  compact?: boolean;
  budgetStatusFilter?: BudgetStatusFilter;
  onBudgetStatusChange?: (status: BudgetStatusFilter) => void;
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

const budgetStatusOptions: { value: BudgetStatusFilter; label: string }[] = [
  { value: '', label: 'All Transactions' },
  { value: 'budgeted', label: 'Budgeted' },
  { value: 'not_budgeted', label: 'Not Budgeted' },
];

export const TransactionFilters = ({
  filters,
  onFiltersChange,
  compact = false,
  budgetStatusFilter = '',
  onBudgetStatusChange,
}: TransactionFiltersProps) => {
  const { data: accounts = [] } = useAccounts();

  const handleFilterChange = (key: keyof TransactionQuery, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  // Compact mode for sidebar - stacked vertically
  if (compact) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Search"
          fullWidth
          size="small"
          placeholder="Search description..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />

        <TextField
          select
          label="Account"
          fullWidth
          size="small"
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

        <TextField
          select
          label="Type"
          fullWidth
          size="small"
          value={filters.type || ''}
          onChange={(e) => handleFilterChange('type', e.target.value)}
        >
          {transactionTypes.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Status"
          fullWidth
          size="small"
          value={filters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          {transactionStatuses.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        {onBudgetStatusChange && (
          <TextField
            select
            label="Budget Status"
            fullWidth
            size="small"
            value={budgetStatusFilter}
            onChange={(e) => onBudgetStatusChange(e.target.value as BudgetStatusFilter)}
          >
            {budgetStatusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )}

        <DatePicker
          label="Start Date"
          value={filters.startDate || ''}
          onChange={(value) => handleFilterChange('startDate', value)}
          maxDate={filters.endDate || undefined}
        />

        <DatePicker
          label="End Date"
          value={filters.endDate || ''}
          onChange={(value) => handleFilterChange('endDate', value)}
          minDate={filters.startDate || undefined}
        />
      </Box>
    );
  }

  // Standard mode for inline display
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

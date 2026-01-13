import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import { CalendarView } from '../components/analytics/CalendarView';
import { useAccounts } from '../hooks/useAccounts';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

/**
 * Calendar Page
 * Displays daily balances and transactions in a calendar view
 */
export const Calendar: React.FC = () => {
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const { data: accounts } = useAccounts();

  // Handle account selection change
  const handleAccountChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setAccountIds(typeof value === 'string' ? value.split(',') : value);
  };

  // Get selected account names for display
  const getSelectedAccountNames = (): string => {
    if (accountIds.length === 0) return 'All Accounts';
    if (!accounts) return '';
    const selectedAccounts = accounts.filter((acc) => accountIds.includes(acc.id));
    return selectedAccounts.map((acc) => acc.name).join(', ');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Calendar
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your daily balances and transactions in a calendar format
        </Typography>
      </Box>

      {/* Account Filter */}
      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth>
            <InputLabel id="account-filter-label">Filter by Accounts</InputLabel>
            <Select
              labelId="account-filter-label"
              id="account-filter"
              multiple
              value={accountIds}
              onChange={handleAccountChange}
              input={<OutlinedInput label="Filter by Accounts" />}
              renderValue={getSelectedAccountNames}
              MenuProps={MenuProps}
            >
              {accounts?.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  <Checkbox checked={accountIds.includes(account.id)} />
                  <ListItemText primary={account.name} />
                </MenuItem>
              ))}
            </Select>
            {accountIds.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {accounts
                  ?.filter((acc) => accountIds.includes(acc.id))
                  .map((account) => (
                    <Chip
                      key={account.id}
                      label={account.name}
                      size="small"
                      onDelete={() => {
                        setAccountIds(accountIds.filter((id) => id !== account.id));
                      }}
                    />
                  ))}
              </Box>
            )}
          </FormControl>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <CalendarView
            accountIds={accountIds.length > 0 ? accountIds : undefined}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Calendar;

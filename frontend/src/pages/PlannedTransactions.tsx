/**
 * PlannedTransactions Page
 * Main page for managing planned transaction templates
 */

import React, { useState, useMemo } from 'react';
import {
  Container,
  Box,
  Button,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { PlannedTransactionList } from '../components/planned/PlannedTransactionList';
import { PlannedTransactionForm } from '../components/planned/PlannedTransactionForm';
import { useSidebar } from '../hooks/useSidebar';
import { useAccounts } from '../hooks/useAccounts';

export const PlannedTransactions: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [accountFilter, setAccountFilter] = useState<string>('ALL');

  const { data: accounts = [] } = useAccounts();

  // Sidebar tools - action buttons
  const sidebarTools = useMemo(
    () => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
        >
          Create Planned Transaction
        </Button>
      </Box>
    ),
    []
  );

  // Sidebar config - filters
  const sidebarConfig = useMemo(
    () => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Account</InputLabel>
          <Select
            value={accountFilter}
            label="Account"
            onChange={(e: SelectChangeEvent) => setAccountFilter(e.target.value)}
          >
            <MenuItem value="ALL">All Accounts</MenuItem>
            {accounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    ),
    [accountFilter, accounts]
  );

  useSidebar({
    tools: sidebarTools,
    config: sidebarConfig,
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Planned Transactions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage recurring transactions and forecast your future cash flow.
          Create templates for bills, subscriptions, salaries, and other regular transactions.
        </Typography>
      </Box>

      {/* Planned Transactions List */}
      <Paper sx={{ p: 3 }}>
        <PlannedTransactionList
          accountId={accountFilter === 'ALL' ? undefined : accountFilter}
        />
      </Paper>

      {/* Create Form Dialog */}
      <PlannedTransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </Container>
  );
};

export default PlannedTransactions;

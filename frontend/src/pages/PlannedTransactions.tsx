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
  Badge,
} from '@mui/material';
import { Add as AddIcon, SwapHoriz as TransferIcon } from '@mui/icons-material';
import { PlannedTransactionList } from '../components/planned/PlannedTransactionList';
import { PlannedTransactionForm } from '../components/planned/PlannedTransactionForm';
import { TransferReviewDialog } from '../components/transfers/TransferReviewDialog';
import { useSidebar } from '../hooks/useSidebar';
import { useAccounts } from '../hooks/useAccounts';
import { usePendingTransfersCount } from '../hooks/usePotentialTransfers';

export const PlannedTransactions: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [transferReviewOpen, setTransferReviewOpen] = useState(false);
  const [accountFilter, setAccountFilter] = useState<string>('ALL');

  const { data: accounts = [] } = useAccounts();
  const { data: pendingTransfersCount = 0 } = usePendingTransfersCount();

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
        <Badge
          badgeContent={pendingTransfersCount}
          color="warning"
          sx={{ '& .MuiBadge-badge': { right: 16, top: 8 } }}
        >
          <Button
            variant="outlined"
            fullWidth
            startIcon={<TransferIcon />}
            onClick={() => setTransferReviewOpen(true)}
          >
            Review Transfers
          </Button>
        </Badge>
      </Box>
    ),
    [pendingTransfersCount]
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

      {/* Transfer Review Dialog */}
      <TransferReviewDialog
        open={transferReviewOpen}
        onClose={() => setTransferReviewOpen(false)}
      />
    </Container>
  );
};

export default PlannedTransactions;

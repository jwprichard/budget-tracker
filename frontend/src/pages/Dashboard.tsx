import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  Fab,
} from '@mui/material';
import { Add as AddIcon, AccountBalance as AccountIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAccounts, useAccountBalance } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { BalanceDisplay } from '../components/common/BalanceDisplay';
import { AccountCard } from '../components/accounts/AccountCard';
import { TransactionList } from '../components/transactions/TransactionList';
import { AccountForm } from '../components/accounts/AccountForm';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { useCreateAccount } from '../hooks/useAccounts';
import { useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '../hooks/useTransactions';
import { Account, CreateAccountDto, CreateTransactionDto, UpdateTransactionDto, Transaction } from '../types';
import { DeleteTransactionDialog } from '../components/transactions/DeleteTransactionDialog';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);

  // Fetch data
  const { data: accounts = [], isLoading: accountsLoading, error: accountsError } = useAccounts();
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useTransactions({ page: 1, pageSize: 10 });

  // Mutations
  const createAccountMutation = useCreateAccount();
  const createTransactionMutation = useCreateTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  // Calculate total balance
  const TotalBalance = () => {
    const activeAccounts = accounts.filter((acc) => acc.isActive);
    let total = 0;
    let loaded = 0;

    const balances = activeAccounts.map((account) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { data } = useAccountBalance(account.id);
      if (data) {
        total += data.currentBalance;
        loaded++;
      }
      return data;
    });

    if (loaded < activeAccounts.length) {
      return <LoadingSpinner message="" size={20} />;
    }

    return <BalanceDisplay amount={total} variant="h3" color="white" />;
  };

  const handleAccountClick = (account: Account) => {
    navigate(`/accounts/${account.id}`);
  };

  const handleCreateAccount = async (data: CreateAccountDto) => {
    try {
      await createAccountMutation.mutateAsync(data);
      setAccountFormOpen(false);
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };

  const handleCreateTransaction = async (data: CreateTransactionDto) => {
    try {
      await createTransactionMutation.mutateAsync(data);
      setTransactionFormOpen(false);
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const handleUpdateTransaction = async (data: UpdateTransactionDto) => {
    if (!editTransaction) return;
    try {
      await updateTransactionMutation.mutateAsync({ id: editTransaction.id, data });
      setEditTransaction(null);
    } catch (error) {
      console.error('Failed to update transaction:', error);
    }
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditTransaction(transaction);
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setDeleteTransaction(transaction);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTransaction) return;
    try {
      await deleteTransactionMutation.mutateAsync(deleteTransaction.id);
      setDeleteTransaction(null);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  if (accountsLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LoadingSpinner message="Loading dashboard..." />
      </Container>
    );
  }

  if (accountsError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <ErrorAlert error={accountsError} title="Failed to load accounts" />
      </Container>
    );
  }

  const activeAccounts = accounts.filter((acc) => acc.isActive);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of your accounts and recent transactions
        </Typography>
      </Box>

      {/* Total Balance Card */}
      <Card
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <CardContent sx={{ position: 'relative', zIndex: 1, py: 4 }}>
          <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 2 }}>
            Total Balance
          </Typography>
          <Box sx={{ my: 2 }}>
            <TotalBalance />
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Across {activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''}
          </Typography>
        </CardContent>
      </Card>

      {/* Accounts Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Accounts</Typography>
          <Button
            variant="outlined"
            startIcon={<AccountIcon />}
            onClick={() => setAccountFormOpen(true)}
          >
            Add Account
          </Button>
        </Box>

        {activeAccounts.length === 0 ? (
          <EmptyState
            icon={<AccountIcon />}
            title="No accounts yet"
            description="Create your first account to start tracking your finances"
            actionLabel="Create Account"
            onAction={() => setAccountFormOpen(true)}
          />
        ) : (
          <Grid container spacing={3}>
            {activeAccounts.slice(0, 6).map((account) => (
              <Grid item xs={12} sm={6} md={4} key={account.id}>
                <AccountCard account={account} onClick={handleAccountClick} />
              </Grid>
            ))}
          </Grid>
        )}

        {activeAccounts.length > 6 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button onClick={() => navigate('/accounts')}>
              View All Accounts ({activeAccounts.length})
            </Button>
          </Box>
        )}
      </Box>

      {/* Recent Transactions Section */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Recent Transactions</Typography>
          <Button
            variant="outlined"
            startIcon={<ReceiptIcon />}
            onClick={() => setTransactionFormOpen(true)}
            disabled={activeAccounts.length === 0}
          >
            Add Transaction
          </Button>
        </Box>

        {transactionsLoading ? (
          <LoadingSpinner message="Loading transactions..." />
        ) : transactionsError ? (
          <ErrorAlert error={transactionsError} title="Failed to load transactions" />
        ) : transactionsData && transactionsData.transactions.length > 0 ? (
          <>
            <TransactionList
              transactions={transactionsData.transactions}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button onClick={() => navigate('/transactions')}>
                View All Transactions ({transactionsData.pagination.totalItems})
              </Button>
            </Box>
          </>
        ) : (
          <EmptyState
            icon={<ReceiptIcon />}
            title="No transactions yet"
            description="Create your first transaction to start tracking your spending"
            actionLabel={activeAccounts.length > 0 ? 'Create Transaction' : undefined}
            onAction={activeAccounts.length > 0 ? () => setTransactionFormOpen(true) : undefined}
          />
        )}
      </Box>

      {/* Floating Action Buttons */}
      {activeAccounts.length > 0 && (
        <Fab
          color="primary"
          aria-label="add transaction"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setTransactionFormOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Dialogs */}
      <AccountForm
        open={accountFormOpen}
        onClose={() => setAccountFormOpen(false)}
        onSubmit={handleCreateAccount}
        isSubmitting={createAccountMutation.isPending}
      />

      <TransactionForm
        open={transactionFormOpen}
        onClose={() => setTransactionFormOpen(false)}
        onSubmit={handleCreateTransaction}
        isSubmitting={createTransactionMutation.isPending}
      />

      <TransactionForm
        open={!!editTransaction}
        onClose={() => setEditTransaction(null)}
        onSubmit={handleUpdateTransaction}
        transaction={editTransaction}
        isSubmitting={updateTransactionMutation.isPending}
      />

      <DeleteTransactionDialog
        open={!!deleteTransaction}
        transaction={deleteTransaction}
        onClose={() => setDeleteTransaction(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteTransactionMutation.isPending}
      />
    </Container>
  );
};

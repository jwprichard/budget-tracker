import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Fab,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack as BackIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useAccount,
  useAccountBalance,
  useAvailableBalance,
  useAccountTransactions,
  useUpdateAccount,
  useDeleteAccount,
} from '../hooks/useAccounts';
import { useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '../hooks/useTransactions';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { BalanceDisplay } from '../components/common/BalanceDisplay';
import { TransactionList } from '../components/transactions/TransactionList';
import { AccountForm } from '../components/accounts/AccountForm';
import { DeleteAccountDialog } from '../components/accounts/DeleteAccountDialog';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { TransactionImportDialog } from '../components/transactions/TransactionImportDialog';
import { DeleteTransactionDialog } from '../components/transactions/DeleteTransactionDialog';
import { UpdateAccountDto, CreateTransactionDto, UpdateTransactionDto, Transaction } from '../types';
import { AccountTypeIcon } from '../components/accounts/AccountTypeIcon';

export const AccountDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);

  // Queries
  const { data: account, isLoading: accountLoading, error: accountError } = useAccount(id);
  const { data: balance, isLoading: balanceLoading } = useAccountBalance(id);
  const { data: availableBalance } = useAvailableBalance(
    account?.isLinkedToBank ? id : undefined
  );
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useAccountTransactions(id, page, pageSize);

  // Mutations
  const updateAccountMutation = useUpdateAccount();
  const deleteAccountMutation = useDeleteAccount();
  const createTransactionMutation = useCreateTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  const handleUpdateAccount = async (data: UpdateAccountDto, balanceChanged?: number) => {
    if (!id) return;
    try {
      // Update account properties
      await updateAccountMutation.mutateAsync({ id, data });

      // If balance was changed, create adjustment transaction
      if (balanceChanged && balanceChanged !== 0) {
        const adjustmentTransaction: CreateTransactionDto = {
          accountId: id,
          type: balanceChanged > 0 ? 'INCOME' : 'EXPENSE',
          amount: Math.abs(balanceChanged),
          date: new Date().toISOString(),
          description: 'Balance Adjustment',
          notes: `Balance adjusted by ${account?.currency} ${balanceChanged.toFixed(2)}`,
          status: 'CLEARED',
        };
        await createTransactionMutation.mutateAsync(adjustmentTransaction);
      }

      setEditFormOpen(false);
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!id) return;
    try {
      await deleteAccountMutation.mutateAsync(id);
      setDeleteDialogOpen(false);
      navigate('/accounts');
    } catch (error) {
      console.error('Failed to delete account:', error);
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

  if (accountLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LoadingSpinner message="Loading account details..." />
      </Container>
    );
  }

  if (accountError || !account) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <ErrorAlert error={accountError || new Error('Account not found')} title="Failed to load account" />
        <Box sx={{ mt: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/accounts')}>
            Back to Accounts
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/accounts')}
        sx={{ mb: 2 }}
      >
        Back to Accounts
      </Button>

      {/* Account Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <AccountTypeIcon type={account.type} sx={{ fontSize: 40 }} color="primary" />
              <Box>
                <Typography variant="h4" gutterBottom>
                  {account.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip label={account.type.replace('_', ' ')} size="small" />
                  {account.category && <Chip label={account.category} size="small" variant="outlined" />}
                  {!account.isActive && <Chip label="Inactive" size="small" color="default" />}
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Balance
            </Typography>
            {balanceLoading ? (
              <LoadingSpinner message="" size={20} />
            ) : (
              <BalanceDisplay amount={balance?.currentBalance || 0} currency={account.currency} variant="h4" />
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Initial Balance: {account.currency} {parseFloat(account.initialBalance).toFixed(2)}
            </Typography>
            {availableBalance && availableBalance.available !== null && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Available: {account.currency} {availableBalance.available.toFixed(2)}
                {account.type === 'CREDIT_CARD' && ' (Credit Available)'}
              </Typography>
            )}
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setEditFormOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </Box>
      </Paper>

      {/* Transactions Section */}
      <Box>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h5">Transactions</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setImportDialogOpen(true)}
            >
              Import CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setTransactionFormOpen(true)}
            >
              Add Transaction
            </Button>
          </Box>
        </Box>

        {transactionsLoading ? (
          <LoadingSpinner message="Loading transactions..." />
        ) : transactionsError ? (
          <ErrorAlert error={transactionsError} title="Failed to load transactions" />
        ) : (
          <TransactionList
            transactions={transactionsData?.transactions || []}
            pagination={transactionsData?.pagination}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        )}
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add transaction"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setTransactionFormOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Dialogs */}
      <AccountForm
        open={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        onSubmit={handleUpdateAccount}
        account={account}
        currentBalance={balance?.currentBalance}
        isSubmitting={updateAccountMutation.isPending || createTransactionMutation.isPending}
      />

      <DeleteAccountDialog
        open={deleteDialogOpen}
        account={account}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={deleteAccountMutation.isPending}
      />

      <TransactionForm
        open={transactionFormOpen}
        onClose={() => setTransactionFormOpen(false)}
        onSubmit={handleCreateTransaction}
        defaultAccountId={id}
        isSubmitting={createTransactionMutation.isPending}
      />

      <TransactionImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        accountId={id || ''}
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

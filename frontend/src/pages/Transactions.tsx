import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  ButtonGroup,
  Fab,
} from '@mui/material';
import { Add as AddIcon, SwapHoriz as TransferIcon } from '@mui/icons-material';
import {
  useTransactions,
  useCreateTransaction,
  useCreateTransfer,
  useUpdateTransaction,
  useDeleteTransaction,
} from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { TransactionList } from '../components/transactions/TransactionList';
import { TransactionFilters } from '../components/transactions/TransactionFilters';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { TransferForm } from '../components/transactions/TransferForm';
import { DeleteTransactionDialog } from '../components/transactions/DeleteTransactionDialog';
import { Transaction, TransactionQuery, CreateTransactionDto, UpdateTransactionDto, CreateTransferDto } from '../types';
import { Receipt as ReceiptIcon } from '@mui/icons-material';

export const Transactions = () => {
  const [filters, setFilters] = useState<TransactionQuery>({ page: 1, pageSize: 50 });
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [transferFormOpen, setTransferFormOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);

  // Queries
  const { data: accounts = [] } = useAccounts();
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useTransactions(filters);

  // Mutations
  const createTransactionMutation = useCreateTransaction();
  const createTransferMutation = useCreateTransfer();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  const handleFiltersChange = (newFilters: TransactionQuery) => {
    setFilters({ ...newFilters, page: 1, pageSize: filters.pageSize });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters({ ...filters, page: 1, pageSize });
  };

  const handleCreateTransaction = async (data: CreateTransactionDto) => {
    try {
      await createTransactionMutation.mutateAsync(data);
      setTransactionFormOpen(false);
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const handleCreateTransfer = async (data: CreateTransferDto) => {
    try {
      await createTransferMutation.mutateAsync(data);
      setTransferFormOpen(false);
    } catch (error) {
      console.error('Failed to create transfer:', error);
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
      await deleteTransactionMutation.mutateAsync({
        id: deleteTransaction.id,
        accountId: deleteTransaction.accountId,
        transferAccountId: deleteTransaction.transferToAccountId,
      });
      setDeleteTransaction(null);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const activeAccounts = accounts.filter((acc) => acc.isActive);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Transactions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage all transactions
          </Typography>
        </Box>
        <ButtonGroup variant="contained">
          <Button
            startIcon={<AddIcon />}
            onClick={() => setTransactionFormOpen(true)}
            disabled={activeAccounts.length === 0}
          >
            Add Transaction
          </Button>
          <Button
            startIcon={<TransferIcon />}
            onClick={() => setTransferFormOpen(true)}
            disabled={activeAccounts.length < 2}
          >
            Create Transfer
          </Button>
        </ButtonGroup>
      </Box>

      {/* Filters */}
      <TransactionFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Transaction List */}
      {transactionsLoading ? (
        <LoadingSpinner message="Loading transactions..." />
      ) : transactionsError ? (
        <ErrorAlert error={transactionsError} title="Failed to load transactions" />
      ) : transactionsData && transactionsData.transactions.length > 0 ? (
        <TransactionList
          transactions={transactionsData.transactions}
          pagination={transactionsData.pagination}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      ) : (
        <EmptyState
          icon={<ReceiptIcon />}
          title="No transactions found"
          description={
            activeAccounts.length === 0
              ? 'Create an account first to start tracking transactions'
              : 'Create your first transaction or adjust your filters'
          }
          actionLabel={activeAccounts.length > 0 ? 'Create Transaction' : undefined}
          onAction={activeAccounts.length > 0 ? () => setTransactionFormOpen(true) : undefined}
        />
      )}

      {/* Floating Action Button */}
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

      <TransferForm
        open={transferFormOpen}
        onClose={() => setTransferFormOpen(false)}
        onSubmit={handleCreateTransfer}
        isSubmitting={createTransferMutation.isPending}
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

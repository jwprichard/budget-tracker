/**
 * PlannedTransactionList Component
 * Displays a list of planned transaction templates
 */

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';
import {
  usePlannedTransactionTemplates,
  useDeletePlannedTransactionTemplate,
  usePlannedTransactions,
  useDeletePlannedTransaction,
} from '../../hooks/usePlannedTransactions';
import { PlannedTransactionTemplate, PlannedTransaction } from '../../types/plannedTransaction.types';
import { PlannedTransactionCard } from './PlannedTransactionCard';
import { PlannedTransactionForm } from './PlannedTransactionForm';

interface PlannedTransactionListProps {
  accountId?: string;
}

export const PlannedTransactionList: React.FC<PlannedTransactionListProps> = ({
  accountId,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [editingTemplate, setEditingTemplate] = useState<PlannedTransactionTemplate | null>(null);
  const [editingOneOff, setEditingOneOff] = useState<PlannedTransaction | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<PlannedTransactionTemplate | null>(null);
  const [deletingOneOff, setDeletingOneOff] = useState<PlannedTransaction | null>(null);

  // Fetch recurring templates
  const { data: templates, isLoading: templatesLoading, error: templatesError } = usePlannedTransactionTemplates({
    accountId,
    isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
  });

  // Fetch one-off planned transactions (those without a template)
  const { data: oneOffTransactions, isLoading: oneOffLoading, error: oneOffError } = usePlannedTransactions({
    accountId,
  });

  // Filter to only show true one-offs (no templateId) that haven't been matched yet
  const filteredOneOffs = oneOffTransactions?.filter((tx) => !tx.templateId && !tx.isVirtual);

  const deleteTemplateMutation = useDeletePlannedTransactionTemplate();
  const deleteOneOffMutation = useDeletePlannedTransaction();

  const isLoading = templatesLoading || oneOffLoading;
  const error = templatesError || oneOffError;

  // Filter templates
  const filteredTemplates = templates?.filter((template) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        template.name.toLowerCase().includes(searchLower) ||
        template.description?.toLowerCase().includes(searchLower) ||
        template.accountName.toLowerCase().includes(searchLower) ||
        template.categoryName?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      if (typeFilter === 'TRANSFER' && !template.isTransfer) return false;
      if (typeFilter === 'INCOME' && (template.type !== 'INCOME' || template.isTransfer)) return false;
      if (typeFilter === 'EXPENSE' && (template.type !== 'EXPENSE' || template.isTransfer)) return false;
    }

    return true;
  });

  // Split templates into income, expense, and transfer sections
  const incomeTemplates = filteredTemplates?.filter((t) => t.type === 'INCOME' && !t.isTransfer) || [];
  const expenseTemplates = filteredTemplates?.filter((t) => t.type === 'EXPENSE' && !t.isTransfer) || [];
  const transferTemplates = filteredTemplates?.filter((t) => t.isTransfer || t.type === 'TRANSFER') || [];

  // Filter one-off transactions
  const displayedOneOffs = filteredOneOffs?.filter((tx) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        tx.name.toLowerCase().includes(searchLower) ||
        tx.description?.toLowerCase().includes(searchLower) ||
        tx.accountName.toLowerCase().includes(searchLower) ||
        tx.categoryName?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      if (typeFilter === 'TRANSFER' && !tx.isTransfer) return false;
      if (typeFilter === 'INCOME' && (tx.type !== 'INCOME' || tx.isTransfer)) return false;
      if (typeFilter === 'EXPENSE' && (tx.type !== 'EXPENSE' || tx.isTransfer)) return false;
    }

    return true;
  });

  const handleEdit = (template: PlannedTransactionTemplate) => {
    setEditingTemplate(template);
  };

  const handleDelete = (template: PlannedTransactionTemplate) => {
    setDeletingTemplate(template);
  };

  const handleDeleteOneOff = (tx: PlannedTransaction) => {
    setDeletingOneOff(tx);
  };

  const handleEditOneOff = (tx: PlannedTransaction) => {
    setEditingOneOff(tx);
  };

  const confirmDelete = async () => {
    if (deletingTemplate) {
      try {
        await deleteTemplateMutation.mutateAsync(deletingTemplate.id);
        setDeletingTemplate(null);
      } catch (err) {
        console.error('Failed to delete template:', err);
      }
    }
  };

  const confirmDeleteOneOff = async () => {
    if (deletingOneOff) {
      try {
        await deleteOneOffMutation.mutateAsync(deletingOneOff.id);
        setDeletingOneOff(null);
      } catch (err) {
        console.error('Failed to delete one-off transaction:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load planned transactions: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          label="Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="ALL">All Types</MenuItem>
          <MenuItem value="EXPENSE">Expenses</MenuItem>
          <MenuItem value="INCOME">Income</MenuItem>
          <MenuItem value="TRANSFER">Transfers</MenuItem>
        </TextField>
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
        </TextField>
      </Box>

      {/* Recurring Income Section */}
      {incomeTemplates.length > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrendingUpIcon sx={{ color: 'success.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Recurring Income
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {incomeTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <PlannedTransactionCard
                  template={template}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Recurring Expenses Section */}
      {expenseTemplates.length > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: incomeTemplates.length > 0 ? 4 : 0 }}>
            <TrendingDownIcon sx={{ color: 'error.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Recurring Expenses
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {expenseTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <PlannedTransactionCard
                  template={template}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Recurring Transfers Section */}
      {transferTemplates.length > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: (incomeTemplates.length > 0 || expenseTemplates.length > 0) ? 4 : 0 }}>
            <SwapHorizIcon sx={{ color: 'info.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Recurring Transfers
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {transferTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <PlannedTransactionCard
                  template={template}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* One-off Transactions Section */}
      {displayedOneOffs && displayedOneOffs.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
            One-time Transactions
          </Typography>
          <Grid container spacing={2}>
            {displayedOneOffs.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const isTransfer = tx.isTransfer;
              const getTypeIcon = () => {
                if (isTransfer) return <SwapHorizIcon sx={{ color: 'info.main' }} />;
                if (isIncome) return <TrendingUpIcon sx={{ color: 'success.main' }} />;
                return <TrendingDownIcon sx={{ color: 'error.main' }} />;
              };
              const getAmountColor = () => {
                if (isTransfer) return 'info.main';
                if (isIncome) return 'success.main';
                return 'error.main';
              };
              const formatAmount = (amount: number) => new Intl.NumberFormat('en-NZ', {
                style: 'currency',
                currency: 'NZD',
              }).format(Math.abs(amount));

              return (
                <Grid item xs={12} sm={6} md={4} key={tx.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTypeIcon()}
                          <Typography variant="h6" component="div" noWrap sx={{ maxWidth: 200 }}>
                            {tx.name}
                          </Typography>
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{ color: getAmountColor(), fontWeight: 'bold' }}
                        >
                          {isIncome ? '+' : isTransfer ? '' : '-'}{formatAmount(tx.amount)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <EventIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(tx.expectedDate), 'MMM d, yyyy')}
                        </Typography>
                        <Chip label="One-time" size="small" variant="outlined" />
                      </Box>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Account: {tx.accountName}
                        {isTransfer && tx.transferToAccountName && (
                          <> → {tx.transferToAccountName}</>
                        )}
                      </Typography>

                      {tx.categoryName && (
                        <Chip
                          label={tx.categoryName}
                          size="small"
                          sx={{
                            bgcolor: tx.categoryColor || 'grey.300',
                            color: 'white',
                            mt: 1,
                          }}
                        />
                      )}

                      {tx.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1, fontStyle: 'italic' }}
                          noWrap
                        >
                          {tx.description}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEditOneOff(tx)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDeleteOneOff(tx)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}

      {/* Empty State */}
      {incomeTemplates.length === 0 && expenseTemplates.length === 0 && transferTemplates.length === 0 && (!displayedOneOffs || displayedOneOffs.length === 0) && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {(templates?.length === 0 && (!filteredOneOffs || filteredOneOffs.length === 0))
              ? 'No planned transactions yet. Create one to get started!'
              : 'No planned transactions match your filters.'}
          </Typography>
        </Box>
      )}

      {/* Edit Template Dialog */}
      <PlannedTransactionForm
        open={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        template={editingTemplate || undefined}
      />

      {/* Edit One-off Dialog */}
      <PlannedTransactionForm
        open={!!editingOneOff}
        onClose={() => setEditingOneOff(null)}
        oneOffTransaction={editingOneOff || undefined}
      />

      {/* Delete Template Confirmation Dialog */}
      <Dialog open={!!deletingTemplate} onClose={() => setDeletingTemplate(null)}>
        <DialogTitle>Delete Recurring Transaction</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deletingTemplate?.name}"? This will also
            delete all future occurrences. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingTemplate(null)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            disabled={deleteTemplateMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete One-off Confirmation Dialog */}
      <Dialog open={!!deletingOneOff} onClose={() => setDeletingOneOff(null)}>
        <DialogTitle>Delete One-time Transaction</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deletingOneOff?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingOneOff(null)}>Cancel</Button>
          <Button
            onClick={confirmDeleteOneOff}
            color="error"
            disabled={deleteOneOffMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlannedTransactionList;

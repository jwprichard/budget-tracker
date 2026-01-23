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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { usePlannedTransactionTemplates, useDeletePlannedTransactionTemplate } from '../../hooks/usePlannedTransactions';
import { PlannedTransactionTemplate } from '../../types/plannedTransaction.types';
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
  const [deletingTemplate, setDeletingTemplate] = useState<PlannedTransactionTemplate | null>(null);

  const { data: templates, isLoading, error } = usePlannedTransactionTemplates({
    accountId,
    isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
  });

  const deleteMutation = useDeletePlannedTransactionTemplate();

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

  const handleEdit = (template: PlannedTransactionTemplate) => {
    setEditingTemplate(template);
  };

  const handleDelete = (template: PlannedTransactionTemplate) => {
    setDeletingTemplate(template);
  };

  const confirmDelete = async () => {
    if (deletingTemplate) {
      try {
        await deleteMutation.mutateAsync(deletingTemplate.id);
        setDeletingTemplate(null);
      } catch (err) {
        console.error('Failed to delete template:', err);
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

      {/* Templates Grid */}
      {filteredTemplates && filteredTemplates.length > 0 ? (
        <Grid container spacing={2}>
          {filteredTemplates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <PlannedTransactionCard
                template={template}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {templates?.length === 0
              ? 'No planned transactions yet. Create one to get started!'
              : 'No planned transactions match your filters.'}
          </Typography>
        </Box>
      )}

      {/* Edit Dialog */}
      <PlannedTransactionForm
        open={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        template={editingTemplate || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingTemplate} onClose={() => setDeletingTemplate(null)}>
        <DialogTitle>Delete Planned Transaction</DialogTitle>
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
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlannedTransactionList;

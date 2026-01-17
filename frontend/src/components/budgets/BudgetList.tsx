/**
 * BudgetList Component
 * Grid display of budget cards with filtering, sorting, and actions
 * Supports both recurring budget templates and one-time budgets
 */

import React, { useState, useMemo } from 'react';
import {
  Grid,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Divider,
} from '@mui/material';
import { BudgetWithStatus, BudgetStatus, BudgetPeriod, BudgetTemplate } from '../../types/budget.types';
import { BudgetCard } from './BudgetCard';
import { TemplateCard } from './TemplateCard';
import { BudgetForm } from './BudgetForm';
import { TemplateEditDialog } from './TemplateEditDialog';
import { useDeleteBudget } from '../../hooks/useBudgets';
import { useBudgetTemplates, useDeleteTemplate } from '../../hooks/useBudgetTemplates';

interface BudgetListProps {
  budgets: BudgetWithStatus[];
  isLoading?: boolean;
  error?: Error | null;
}

type SortOption = 'amount' | 'spent' | 'percentage' | 'name' | 'period';
type FilterStatus = 'ALL' | BudgetStatus;
type FilterPeriodType = 'ALL' | BudgetPeriod;

export const BudgetList: React.FC<BudgetListProps> = ({ budgets, isLoading, error }) => {
  const [sortBy, setSortBy] = useState<SortOption>('period');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [filterPeriodType, setFilterPeriodType] = useState<FilterPeriodType>('ALL');
  const [editingBudget, setEditingBudget] = useState<BudgetWithStatus | undefined>();
  const [budgetFormOpen, setBudgetFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<BudgetTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<BudgetTemplate | null>(null);
  const [templateEditOpen, setTemplateEditOpen] = useState(false);

  const deleteBudgetMutation = useDeleteBudget();
  const deleteTemplateMutation = useDeleteTemplate();

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useBudgetTemplates();

  // Filter budgets
  const filteredBudgets = budgets.filter((budget) => {
    if (filterStatus !== 'ALL' && budget.status !== filterStatus) return false;
    if (filterPeriodType !== 'ALL' && budget.periodType !== filterPeriodType) return false;
    return true;
  });

  // Group budgets by template and separate one-time budgets
  const { templateBudgetsMap, oneTimeBudgets } = useMemo(() => {
    const templateMap = new Map<string, BudgetWithStatus[]>();
    const oneTime: BudgetWithStatus[] = [];

    filteredBudgets.forEach((budget) => {
      if (budget.templateId) {
        if (!templateMap.has(budget.templateId)) {
          templateMap.set(budget.templateId, []);
        }
        templateMap.get(budget.templateId)!.push(budget);
      } else {
        oneTime.push(budget);
      }
    });

    // Sort budgets within each template by start date (newest first)
    templateMap.forEach((budgets) => {
      budgets.sort((a, b) => {
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      });
    });

    return { templateBudgetsMap: templateMap, oneTimeBudgets: oneTime };
  }, [filteredBudgets]);

  // Sort one-time budgets
  const sortedOneTimeBudgets = [...oneTimeBudgets].sort((a, b) => {
    switch (sortBy) {
      case 'amount':
        return b.amount - a.amount;
      case 'spent':
        return b.spent - a.spent;
      case 'percentage':
        return b.percentage - a.percentage;
      case 'name':
        return (a.name || a.categoryName).localeCompare(b.name || b.categoryName);
      case 'period':
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      default:
        return 0;
    }
  });

  // Filter templates to only show those with budgets in the current filter
  const activeTemplates = templates.filter((template) =>
    templateBudgetsMap.has(template.id)
  );

  const handleEdit = (budget: BudgetWithStatus) => {
    setEditingBudget(budget);
    setBudgetFormOpen(true);
  };

  const handleDeleteClick = (budgetId: string) => {
    setBudgetToDelete(budgetId);
    setDeleteConfirmOpen(true);
  };

  const handleTemplateDeleteClick = (template: BudgetTemplate) => {
    setTemplateToDelete(template);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (budgetToDelete) {
      await deleteBudgetMutation.mutateAsync(budgetToDelete);
      setBudgetToDelete(null);
    } else if (templateToDelete) {
      await deleteTemplateMutation.mutateAsync(templateToDelete.id);
      setTemplateToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const handleFormClose = () => {
    setBudgetFormOpen(false);
    setEditingBudget(undefined);
  };

  const handleTemplateEdit = (template: BudgetTemplate) => {
    setEditingTemplate(template);
    setTemplateEditOpen(true);
  };

  const handleTemplateEditClose = () => {
    setTemplateEditOpen(false);
    setEditingTemplate(null);
  };

  // Loading state
  if (isLoading || templatesLoading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error">
        Error loading budgets: {error.message}
      </Alert>
    );
  }

  // Empty state (no budgets at all)
  if (budgets.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          px: 2,
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No budgets yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create your first budget to start tracking your spending
        </Typography>
      </Box>
    );
  }

  // Empty state after filtering
  if (activeTemplates.length === 0 && sortedOneTimeBudgets.length === 0) {
    return (
      <Box>
        {/* Filter Controls */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Period Type</InputLabel>
              <Select
                value={filterPeriodType}
                label="Period Type"
                onChange={(e: SelectChangeEvent) => setFilterPeriodType(e.target.value as FilterPeriodType)}
              >
                <MenuItem value="ALL">All Periods</MenuItem>
                <MenuItem value="MONTHLY">Monthly</MenuItem>
                <MenuItem value="WEEKLY">Weekly</MenuItem>
                <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                <MenuItem value="ANNUALLY">Annually</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e: SelectChangeEvent) => setFilterStatus(e.target.value as FilterStatus)}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="UNDER_BUDGET">Under Budget</MenuItem>
                <MenuItem value="ON_TRACK">On Track</MenuItem>
                <MenuItem value="WARNING">Warning</MenuItem>
                <MenuItem value="EXCEEDED">Exceeded</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e: SelectChangeEvent) => setSortBy(e.target.value as SortOption)}
              >
                <MenuItem value="period">Period (Newest)</MenuItem>
                <MenuItem value="amount">Amount (Highest)</MenuItem>
                <MenuItem value="spent">Spent (Highest)</MenuItem>
                <MenuItem value="percentage">Percentage (Highest)</MenuItem>
                <MenuItem value="name">Name (A-Z)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No budgets match your filters
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Filter and Sort Controls */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Period Type</InputLabel>
            <Select
              value={filterPeriodType}
              label="Period Type"
              onChange={(e: SelectChangeEvent) => setFilterPeriodType(e.target.value as FilterPeriodType)}
            >
              <MenuItem value="ALL">All Periods</MenuItem>
              <MenuItem value="MONTHLY">Monthly</MenuItem>
              <MenuItem value="WEEKLY">Weekly</MenuItem>
              <MenuItem value="QUARTERLY">Quarterly</MenuItem>
              <MenuItem value="ANNUALLY">Annually</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e: SelectChangeEvent) => setFilterStatus(e.target.value as FilterStatus)}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="UNDER_BUDGET">Under Budget</MenuItem>
              <MenuItem value="ON_TRACK">On Track</MenuItem>
              <MenuItem value="WARNING">Warning</MenuItem>
              <MenuItem value="EXCEEDED">Exceeded</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e: SelectChangeEvent) => setSortBy(e.target.value as SortOption)}
            >
              <MenuItem value="period">Period (Newest)</MenuItem>
              <MenuItem value="amount">Amount (Highest)</MenuItem>
              <MenuItem value="spent">Spent (Highest)</MenuItem>
              <MenuItem value="percentage">Percentage (Highest)</MenuItem>
              <MenuItem value="name">Name (A-Z)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Recurring Budget Templates */}
      {activeTemplates.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Recurring Budgets
          </Typography>
          <Grid container spacing={3}>
            {activeTemplates.map((template) => (
              <Grid item xs={12} sm={6} lg={4} key={template.id}>
                <TemplateCard
                  template={template}
                  budgets={templateBudgetsMap.get(template.id) || []}
                  onEdit={handleTemplateEdit}
                  onDelete={handleTemplateDeleteClick}
                  onEditBudget={handleEdit}
                  onDeleteBudget={(budget) => handleDeleteClick(budget.id)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Divider between sections */}
      {activeTemplates.length > 0 && sortedOneTimeBudgets.length > 0 && (
        <Divider sx={{ my: 4 }} />
      )}

      {/* One-Time Budget Cards */}
      {sortedOneTimeBudgets.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            One-Time Budgets
          </Typography>
          <Grid container spacing={3}>
            {sortedOneTimeBudgets.map((budget) => (
              <Grid item xs={12} sm={6} lg={4} key={budget.id}>
                <BudgetCard
                  budget={budget}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Budget Form Dialog */}
      <BudgetForm
        open={budgetFormOpen}
        onClose={handleFormClose}
        budget={editingBudget}
      />

      {/* Template Edit Dialog */}
      <TemplateEditDialog
        open={templateEditOpen}
        onClose={handleTemplateEditClose}
        template={editingTemplate}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>
          {templateToDelete ? 'Delete Recurring Budget?' : 'Delete Budget?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {templateToDelete ? (
              <>
                Are you sure you want to delete the <strong>{templateToDelete.name}</strong> recurring
                budget template? This will delete the template and all future budget instances.
                Past and current period budgets will be preserved. This action cannot be undone.
              </>
            ) : (
              'Are you sure you want to delete this budget? This action cannot be undone.'
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false);
              setBudgetToDelete(null);
              setTemplateToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetList;

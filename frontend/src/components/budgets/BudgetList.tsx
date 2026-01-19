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

export type SortOption = 'amount' | 'spent' | 'percentage' | 'name' | 'period';
export type FilterStatus = 'ALL' | BudgetStatus;
export type FilterPeriodType = 'ALL' | BudgetPeriod;

interface BudgetListProps {
  budgets: BudgetWithStatus[];
  isLoading?: boolean;
  error?: Error | null;
  sortBy: SortOption;
  filterStatus: FilterStatus;
  filterPeriodType: FilterPeriodType;
}

export const BudgetList: React.FC<BudgetListProps> = ({
  budgets,
  isLoading,
  error,
  sortBy,
  filterStatus,
  filterPeriodType,
}) => {
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
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No budgets match your filters
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
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

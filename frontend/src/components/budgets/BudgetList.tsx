/**
 * BudgetList Component
 * Grid display of budget cards with filtering, sorting, and actions
 * Supports both recurring budget templates and one-time budgets
 */

import React, { useState, useMemo } from 'react';
import {
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
  Grid,
} from '@mui/material';
import { BudgetWithStatus, BudgetStatus, BudgetPeriod, BudgetTemplate } from '../../types/budget.types';
import { BudgetSection } from './BudgetSection';
import { BudgetForm } from './BudgetForm';
import { TemplateEditDialog } from './TemplateEditDialog';
import { useDeleteBudget } from '../../hooks/useBudgets';
import { useBudgetTemplates, useDeleteTemplate } from '../../hooks/useBudgetTemplates';

export type SortOption = 'amount' | 'spent' | 'percentage' | 'name' | 'period';
export type FilterStatus = 'ALL' | BudgetStatus;
export type FilterPeriodType = BudgetPeriod;

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

  // Filter budgets (only by status - period type filter is used for totals only)
  const filteredBudgets = budgets.filter((budget) => {
    if (filterStatus !== 'ALL' && budget.status !== filterStatus) return false;
    return true;
  });

  // Sort function for budgets
  const sortBudgets = (budgetsToSort: BudgetWithStatus[]) => {
    return [...budgetsToSort].sort((a, b) => {
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
  };

  // Group budgets by type (INCOME/EXPENSE), then by template vs one-time
  const { incomeBudgets, expenseBudgets, incomeTemplateMap, expenseTemplateMap, incomeOneTime, expenseOneTime } = useMemo(() => {
    const income: BudgetWithStatus[] = [];
    const expense: BudgetWithStatus[] = [];
    const incomeTemplates = new Map<string, BudgetWithStatus[]>();
    const expenseTemplates = new Map<string, BudgetWithStatus[]>();
    const incomeOT: BudgetWithStatus[] = [];
    const expenseOT: BudgetWithStatus[] = [];

    filteredBudgets.forEach((budget) => {
      const isIncome = budget.type === 'INCOME';
      const targetArray = isIncome ? income : expense;
      const targetTemplateMap = isIncome ? incomeTemplates : expenseTemplates;
      const targetOneTime = isIncome ? incomeOT : expenseOT;

      targetArray.push(budget);

      if (budget.templateId) {
        if (!targetTemplateMap.has(budget.templateId)) {
          targetTemplateMap.set(budget.templateId, []);
        }
        targetTemplateMap.get(budget.templateId)!.push(budget);
      } else {
        targetOneTime.push(budget);
      }
    });

    // Sort budgets within each template by start date (newest first)
    [incomeTemplates, expenseTemplates].forEach((templateMap) => {
      templateMap.forEach((budgets) => {
        budgets.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      });
    });

    return {
      incomeBudgets: income,
      expenseBudgets: expense,
      incomeTemplateMap: incomeTemplates,
      expenseTemplateMap: expenseTemplates,
      incomeOneTime: sortBudgets(incomeOT),
      expenseOneTime: sortBudgets(expenseOT),
    };
  }, [filteredBudgets, sortBy]);

  // Filter templates by type
  const incomeTemplates = templates.filter((t) => t.type === 'INCOME' && incomeTemplateMap.has(t.id));
  const expenseTemplates = templates.filter((t) => t.type === 'EXPENSE' && expenseTemplateMap.has(t.id));

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

  // Check if there's any content to display
  const hasIncomeContent = incomeTemplates.length > 0 || incomeOneTime.length > 0;
  const hasExpenseContent = expenseTemplates.length > 0 || expenseOneTime.length > 0;

  // Empty state after filtering
  if (!hasIncomeContent && !hasExpenseContent) {
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
      {/* Income Section */}
      <BudgetSection
        title="Income"
        type="INCOME"
        budgets={incomeBudgets}
        templates={incomeTemplates}
        templateBudgetsMap={incomeTemplateMap}
        oneTimeBudgets={incomeOneTime}
        defaultExpanded={true}
        filterPeriodType={filterPeriodType}
        onEditBudget={handleEdit}
        onDeleteBudget={handleDeleteClick}
        onEditTemplate={handleTemplateEdit}
        onDeleteTemplate={handleTemplateDeleteClick}
      />

      {/* Expenses Section */}
      <BudgetSection
        title="Expenses"
        type="EXPENSE"
        budgets={expenseBudgets}
        templates={expenseTemplates}
        templateBudgetsMap={expenseTemplateMap}
        oneTimeBudgets={expenseOneTime}
        defaultExpanded={true}
        filterPeriodType={filterPeriodType}
        onEditBudget={handleEdit}
        onDeleteBudget={handleDeleteClick}
        onEditTemplate={handleTemplateEdit}
        onDeleteTemplate={handleTemplateDeleteClick}
      />

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

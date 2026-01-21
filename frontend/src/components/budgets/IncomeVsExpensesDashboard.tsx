/**
 * IncomeVsExpensesDashboard Component
 * Displays a comparison of budgeted income vs budgeted expenses
 * with side-by-side bars and net difference
 */

import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  CircularProgress,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import { useBudgetSummary } from '../../hooks/useBudgets';
import { BudgetPeriod, BudgetWithStatus } from '../../types/budget.types';
import { formatCurrency } from '../../utils/formatters';

type FilterPeriodType = BudgetPeriod;

interface IncomeVsExpensesDashboardProps {
  filterPeriodType?: FilterPeriodType;
}

/**
 * Number of periods per year for each budget period type
 */
const PERIODS_PER_YEAR: Record<BudgetPeriod, number> = {
  DAILY: 365,
  WEEKLY: 52,
  FORTNIGHTLY: 26,
  MONTHLY: 12,
  ANNUALLY: 1,
};

/**
 * Normalize a budget's amount to the target period
 */
const normalizeAmount = (
  budget: BudgetWithStatus,
  targetPeriod: BudgetPeriod
): number => {
  if (!budget.periodType) {
    return budget.amount;
  }
  const factor = PERIODS_PER_YEAR[budget.periodType] / PERIODS_PER_YEAR[targetPeriod];
  return budget.amount * factor;
};

export const IncomeVsExpensesDashboard: React.FC<IncomeVsExpensesDashboardProps> = ({
  filterPeriodType = 'ANNUALLY',
}) => {
  const { data: summary, isLoading, error } = useBudgetSummary();

  // Category breakdown type
  interface CategoryBreakdown {
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    amount: number;
  }

  // Calculate normalized totals and category breakdowns for income and expenses
  const { totalIncome, totalExpenses, netDifference, incomeCategories, expenseCategories } = useMemo(() => {
    if (!summary?.budgets) {
      return { totalIncome: 0, totalExpenses: 0, netDifference: 0, incomeCategories: [], expenseCategories: [] };
    }

    let income = 0;
    let expenses = 0;
    const seenTemplates = new Set<string>();
    const incomeCategoryMap = new Map<string, CategoryBreakdown>();
    const expenseCategoryMap = new Map<string, CategoryBreakdown>();

    summary.budgets.forEach((budget) => {
      // Only count ONE budget per recurring template
      if (budget.templateId) {
        if (seenTemplates.has(budget.templateId)) {
          return;
        }
        seenTemplates.add(budget.templateId);
      }

      const normalizedAmount = normalizeAmount(budget, filterPeriodType);
      const categoryMap = budget.type === 'INCOME' ? incomeCategoryMap : expenseCategoryMap;

      if (budget.type === 'INCOME') {
        income += normalizedAmount;
      } else {
        expenses += normalizedAmount;
      }

      // Aggregate by category
      const existing = categoryMap.get(budget.categoryId);
      if (existing) {
        existing.amount += normalizedAmount;
      } else {
        categoryMap.set(budget.categoryId, {
          categoryId: budget.categoryId,
          categoryName: budget.categoryName,
          categoryColor: budget.categoryColor,
          amount: normalizedAmount,
        });
      }
    });

    // Sort categories by amount descending
    const sortedIncomeCategories = Array.from(incomeCategoryMap.values())
      .sort((a, b) => b.amount - a.amount);
    const sortedExpenseCategories = Array.from(expenseCategoryMap.values())
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netDifference: income - expenses,
      incomeCategories: sortedIncomeCategories,
      expenseCategories: sortedExpenseCategories,
    };
  }, [summary?.budgets, filterPeriodType]);

  // Calculate percentages for the bars
  const maxValue = Math.max(totalIncome, totalExpenses, 1);
  const incomePercent = (totalIncome / maxValue) * 100;
  const expensesPercent = (totalExpenses / maxValue) * 100;

  // Determine if surplus or deficit
  const isSurplus = netDifference >= 0;

  if (isLoading) {
    return (
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Alert severity="error">
            Error loading budget data: {error.message}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Income vs Expenses
        </Typography>

        <Box sx={{ mt: 2 }}>
          {/* Income Bar */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" fontWeight={500}>
                Income
              </Typography>
              <Typography variant="body2" fontWeight={600} color="success.main">
                {formatCurrency(totalIncome)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={incomePercent}
              sx={{
                height: 24,
                borderRadius: 2,
                backgroundColor: '#E8F5E9',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#4CAF50',
                  borderRadius: 2,
                },
              }}
            />
            {/* Income Category Breakdown */}
            {incomeCategories.length > 0 && totalIncome > 0 && (
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                {incomeCategories.slice(0, 5).map((cat) => (
                  <Chip
                    key={cat.categoryId}
                    size="small"
                    label={`${cat.categoryName}: ${formatCurrency(cat.amount)} (${((cat.amount / totalIncome) * 100).toFixed(0)}%)`}
                    sx={{
                      bgcolor: cat.categoryColor + '20',
                      borderLeft: `3px solid ${cat.categoryColor}`,
                      fontSize: '0.75rem',
                    }}
                  />
                ))}
                {incomeCategories.length > 5 && (
                  <Chip
                    size="small"
                    label={`+${incomeCategories.length - 5} more`}
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}
              </Stack>
            )}
          </Box>

          {/* Expenses Bar */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" fontWeight={500}>
                Expenses
              </Typography>
              <Typography variant="body2" fontWeight={600} color="secondary.main">
                {formatCurrency(totalExpenses)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={expensesPercent}
              sx={{
                height: 24,
                borderRadius: 2,
                backgroundColor: '#F3E5F5',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#9C27B0',
                  borderRadius: 2,
                },
              }}
            />
            {/* Expenses Category Breakdown */}
            {expenseCategories.length > 0 && totalExpenses > 0 && (
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                {expenseCategories.slice(0, 5).map((cat) => (
                  <Chip
                    key={cat.categoryId}
                    size="small"
                    label={`${cat.categoryName}: ${formatCurrency(cat.amount)} (${((cat.amount / totalExpenses) * 100).toFixed(0)}%)`}
                    sx={{
                      bgcolor: cat.categoryColor + '20',
                      borderLeft: `3px solid ${cat.categoryColor}`,
                      fontSize: '0.75rem',
                    }}
                  />
                ))}
                {expenseCategories.length > 5 && (
                  <Chip
                    size="small"
                    label={`+${expenseCategories.length - 5} more`}
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}
              </Stack>
            )}
          </Box>

          {/* Net Difference */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderRadius: 2,
              bgcolor: isSurplus ? '#E8F5E9' : '#FFEBEE',
            }}
          >
            <Typography variant="body1" fontWeight={500}>
              {isSurplus ? 'Surplus' : 'Deficit'}
            </Typography>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ color: isSurplus ? 'success.main' : 'error.main' }}
            >
              {isSurplus ? '+' : ''}{formatCurrency(netDifference)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default IncomeVsExpensesDashboard;

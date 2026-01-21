/**
 * BudgetSection Component
 * Collapsible accordion section for grouping budgets by type (Income/Expenses)
 * Displays section header with totals and mini progress bar
 * Groups budgets by period type (Annually, Quarterly, Monthly, etc.)
 */

import React, { useState, useMemo } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Grid,
  LinearProgress,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { BudgetWithStatus, BudgetTemplate, BudgetStatus, BudgetType, BudgetPeriod } from '../../types/budget.types';
import { BudgetCard } from './BudgetCard';
import { TemplateCard } from './TemplateCard';
import { formatCurrency } from '../../utils/formatters';

// Period type display order (from longest to shortest)
const PERIOD_ORDER: (BudgetPeriod | null)[] = [
  'ANNUALLY',
  'MONTHLY',
  'FORTNIGHTLY',
  'WEEKLY',
  'DAILY',
  null, // One-time budgets
];

// Period type labels
const PERIOD_LABELS: Record<string, string> = {
  ANNUALLY: 'Annually',
  MONTHLY: 'Monthly',
  FORTNIGHTLY: 'Fortnightly',
  WEEKLY: 'Weekly',
  DAILY: 'Daily',
  ONE_TIME: 'One-Time',
};

/**
 * Number of periods per year for each budget period type
 * Used for normalizing budget amounts across different periods
 */
const PERIODS_PER_YEAR: Record<BudgetPeriod, number> = {
  DAILY: 365,
  WEEKLY: 52,
  FORTNIGHTLY: 26,
  MONTHLY: 12,
  ANNUALLY: 1,
};

/**
 * Normalize a budget's amounts (budgeted, spent, remaining) to the target period
 * One-time budgets (null periodType) are not normalized - they return raw values
 */
const normalizeBudget = (
  budget: BudgetWithStatus,
  targetPeriod: BudgetPeriod
): { amount: number; spent: number; remaining: number } => {
  // One-time budgets (null periodType) cannot be normalized - return as-is
  if (!budget.periodType) {
    return {
      amount: budget.amount,
      spent: budget.spent,
      remaining: budget.remaining,
    };
  }

  const factor = PERIODS_PER_YEAR[budget.periodType] / PERIODS_PER_YEAR[targetPeriod];
  return {
    amount: budget.amount * factor,
    spent: budget.spent * factor,
    remaining: budget.remaining * factor,
  };
};

type FilterPeriodType = BudgetPeriod;

interface BudgetSectionProps {
  title: string;
  type: BudgetType;
  budgets: BudgetWithStatus[];
  templates: BudgetTemplate[];
  templateBudgetsMap: Map<string, BudgetWithStatus[]>;
  oneTimeBudgets: BudgetWithStatus[];
  defaultExpanded?: boolean;
  filterPeriodType?: FilterPeriodType;
  onEditBudget: (budget: BudgetWithStatus) => void;
  onDeleteBudget: (budgetId: string) => void;
  onEditTemplate: (template: BudgetTemplate) => void;
  onDeleteTemplate: (template: BudgetTemplate) => void;
}

/**
 * Get color based on budget status
 */
const getStatusColor = (status: BudgetStatus): string => {
  switch (status) {
    case 'UNDER_BUDGET':
      return '#4CAF50'; // Green
    case 'ON_TRACK':
      return '#2196F3'; // Blue
    case 'WARNING':
      return '#FF9800'; // Orange
    case 'EXCEEDED':
      return '#F44336'; // Red
    default:
      return '#757575'; // Gray
  }
};

/**
 * Get background color (lighter version) based on status
 */
const getStatusBackgroundColor = (status: BudgetStatus): string => {
  switch (status) {
    case 'UNDER_BUDGET':
      return '#E8F5E9'; // Light green
    case 'ON_TRACK':
      return '#E3F2FD'; // Light blue
    case 'WARNING':
      return '#FFF3E0'; // Light orange
    case 'EXCEEDED':
      return '#FFEBEE'; // Light red
    default:
      return '#F5F5F5'; // Light gray
  }
};

/**
 * Calculate overall status based on percentage
 */
const calculateOverallStatus = (spent: number, budgeted: number): BudgetStatus => {
  if (budgeted <= 0) return 'ON_TRACK';
  const percentage = (spent / budgeted) * 100;
  if (percentage >= 100) return 'EXCEEDED';
  if (percentage >= 80) return 'WARNING';
  if (percentage >= 50) return 'ON_TRACK';
  return 'UNDER_BUDGET';
};

/**
 * Get section accent color based on budget type
 */
const getSectionAccentColor = (type: BudgetType): string => {
  return type === 'INCOME' ? '#4caf50' : '#9c27b0';
};

export const BudgetSection: React.FC<BudgetSectionProps> = ({
  title,
  type,
  budgets,
  templates,
  templateBudgetsMap,
  oneTimeBudgets,
  defaultExpanded = true,
  filterPeriodType = 'ANNUALLY',
  onEditBudget,
  onDeleteBudget,
  onEditTemplate,
  onDeleteTemplate,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Calculate section totals - normalize to target period
  // For recurring budgets, only count ONE budget per template (the first/current one)
  const { totalBudgeted, totalSpent, percentage, status } = useMemo(() => {
    let budgeted = 0;
    let spent = 0;

    // For recurring budgets: iterate over templateBudgetsMap directly
    // Use the first budget per template (most recent, as they're sorted by date desc)
    templateBudgetsMap.forEach((templateBudgets) => {
      const representativeBudget = templateBudgets[0];
      if (representativeBudget) {
        const normalized = normalizeBudget(representativeBudget, filterPeriodType);
        budgeted += normalized.amount;
        spent += normalized.spent;
      }
    });

    // For one-time budgets: include each one (they don't normalize anyway)
    oneTimeBudgets.forEach((budget) => {
      const normalized = normalizeBudget(budget, filterPeriodType);
      budgeted += normalized.amount;
      spent += normalized.spent;
    });

    const pct = budgeted > 0 ? (spent / budgeted) * 100 : 0;
    const st = calculateOverallStatus(spent, budgeted);
    return { totalBudgeted: budgeted, totalSpent: spent, percentage: pct, status: st };
  }, [templateBudgetsMap, oneTimeBudgets, filterPeriodType]);

  const accentColor = getSectionAccentColor(type);
  const statusColor = getStatusColor(status);
  const statusBgColor = getStatusBackgroundColor(status);
  const displayPercentage = Math.min(percentage, 100);

  // Group budgets by period type
  const budgetsByPeriod = useMemo(() => {
    const groups = new Map<BudgetPeriod | null, {
      budgets: BudgetWithStatus[];
      templates: BudgetTemplate[];
      templateBudgets: Map<string, BudgetWithStatus[]>;
    }>();

    // Initialize groups for each period type
    PERIOD_ORDER.forEach((period) => {
      groups.set(period, { budgets: [], templates: [], templateBudgets: new Map() });
    });

    // Group budgets by period type
    budgets.forEach((budget) => {
      const period = budget.periodType;
      const group = groups.get(period);
      if (group) {
        group.budgets.push(budget);
      }
    });

    // Group templates by period type
    templates.forEach((template) => {
      if (templateBudgetsMap.has(template.id)) {
        const period = template.periodType;
        const group = groups.get(period);
        if (group) {
          group.templates.push(template);
          group.templateBudgets.set(template.id, templateBudgetsMap.get(template.id) || []);
        }
      }
    });

    // Note: One-time budgets are already added in the first loop above
    // (they have periodType = null and go into the null group)

    return groups;
  }, [budgets, templates, templateBudgetsMap]);

  // Check if there's any content
  const hasContent = budgets.length > 0 || oneTimeBudgets.length > 0;

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{
        mb: 2,
        borderLeft: `4px solid ${accentColor}`,
        '&:before': { display: 'none' },
        boxShadow: 1,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          minHeight: 64,
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            gap: 2,
          },
        }}
      >
        {/* Section Title */}
        <Typography variant="h6" sx={{ fontWeight: 600, minWidth: 100 }}>
          {title}
        </Typography>

        {/* Totals Display */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {formatCurrency(totalSpent)} / {formatCurrency(totalBudgeted)}
          </Typography>
        </Box>

        {/* Mini Progress Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 180 }}>
          <Box sx={{ flexGrow: 1, position: 'relative' }}>
            <LinearProgress
              variant="determinate"
              value={displayPercentage}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: statusBgColor,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: statusColor,
                  borderRadius: 5,
                },
              }}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, minWidth: 45, textAlign: 'right', color: statusColor }}
          >
            {percentage.toFixed(0)}%
          </Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
        {!hasContent ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No {title.toLowerCase()} budgets
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Render budgets grouped by period type */}
            {PERIOD_ORDER.map((period) => {
              const group = budgetsByPeriod.get(period);
              if (!group) return null;

              const hasTemplates = group.templates.length > 0;
              const hasOneTime = period === null && group.budgets.length > 0;
              const hasBudgets = hasTemplates || hasOneTime;

              if (!hasBudgets) return null;

              const periodLabel = period ? PERIOD_LABELS[period] : PERIOD_LABELS['ONE_TIME'];

              return (
                <Box key={period || 'one-time'} sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 2,
                      color: 'text.secondary',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {periodLabel}
                  </Typography>
                  <Grid container spacing={3}>
                    {/* Render templates for this period */}
                    {group.templates.map((template) => (
                      <Grid item xs={12} sm={6} lg={4} key={template.id}>
                        <TemplateCard
                          template={template}
                          budgets={group.templateBudgets.get(template.id) || []}
                          onEdit={onEditTemplate}
                          onDelete={onDeleteTemplate}
                          onEditBudget={onEditBudget}
                          onDeleteBudget={(budget) => onDeleteBudget(budget.id)}
                        />
                      </Grid>
                    ))}
                    {/* Render one-time budgets (only for null period) */}
                    {period === null &&
                      group.budgets.map((budget) => (
                        <Grid item xs={12} sm={6} lg={4} key={budget.id}>
                          <BudgetCard
                            budget={budget}
                            onEdit={onEditBudget}
                            onDelete={onDeleteBudget}
                          />
                        </Grid>
                      ))}
                  </Grid>
                </Box>
              );
            })}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default BudgetSection;

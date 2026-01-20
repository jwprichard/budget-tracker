/**
 * BudgetSummaryDashboard Component
 * Displays budget overview with health status, period comparison, and category breakdown
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  SelectChangeEvent,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useBudgetSummary, useBudgetHistorical } from '../../hooks/useBudgets';
import {
  BudgetStatus,
  HistoricalComparisonType,
  CategoryBudgetSummary,
} from '../../types/budget.types';
import { formatCurrency } from '../../utils/formatters';

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
 * Get status label
 */
const getStatusLabel = (status: BudgetStatus): string => {
  switch (status) {
    case 'UNDER_BUDGET':
      return 'Under Budget';
    case 'ON_TRACK':
      return 'On Track';
    case 'WARNING':
      return 'Warning';
    case 'EXCEEDED':
      return 'Exceeded';
    default:
      return 'Unknown';
  }
};

/**
 * Trend indicator component
 */
const TrendIndicator: React.FC<{ change: number; label: string }> = ({ change, label }) => {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  // For spending: positive change is bad (spending more), negative is good
  const color = isNeutral ? 'text.secondary' : isPositive ? 'error.main' : 'success.main';
  const Icon = isNeutral ? TrendingFlatIcon : isPositive ? TrendingUpIcon : TrendingDownIcon;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Icon sx={{ fontSize: 16, color }} />
      <Typography variant="caption" sx={{ color }}>
        {isPositive ? '+' : ''}{change.toFixed(1)}% {label}
      </Typography>
    </Box>
  );
};

export const BudgetSummaryDashboard: React.FC = () => {
  const [comparisonType, setComparisonType] = useState<HistoricalComparisonType>(() => {
    const saved = localStorage.getItem('budgetComparisonType');
    return (saved as HistoricalComparisonType) || 'previous';
  });

  // Fetch summary data
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useBudgetSummary();

  // Fetch historical comparison data
  const { data: historical, isLoading: historicalLoading, error: historicalError } = useBudgetHistorical({
    type: comparisonType,
    periodType: 'MONTHLY',
  });

  // Save comparison type preference
  useEffect(() => {
    localStorage.setItem('budgetComparisonType', comparisonType);
  }, [comparisonType]);

  const handleComparisonTypeChange = (event: SelectChangeEvent<HistoricalComparisonType>) => {
    setComparisonType(event.target.value as HistoricalComparisonType);
  };

  const isLoading = summaryLoading || historicalLoading;
  const error = summaryError || historicalError;

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
            Error loading budget summary: {error.message}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!summary || !historical) {
    return null;
  }

  const { totalBudgeted, totalSpent, totalRemaining } = summary;
  const percentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const overallStatus = historical.current.status;

  // Prepare category data for chart
  const categoryData = historical.current.categories
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 6)
    .map((cat: CategoryBudgetSummary) => ({
      name: cat.categoryName,
      spent: cat.spent,
      budgeted: cat.budgeted,
      color: cat.categoryColor,
      percentage: cat.percentage,
    }));

  // Prepare trend data for mini chart
  const trendData = historical.trend?.map((period) => ({
    name: period.period.split(' ')[0]?.substring(0, 3) || period.period,
    spent: period.totalSpent,
    budgeted: period.totalBudgeted,
    percentage: period.percentage,
  }));

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {data.name}
          </Typography>
          <Typography variant="body2" color="primary">
            {formatCurrency(data.value)} spent
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {data.payload.percentage.toFixed(1)}% of budget
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={3}>
          {/* Overall Health Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Overall Budget Health
              </Typography>
              <Typography variant="h6" gutterBottom>
                {historical.current.period}
              </Typography>

              {/* Status Chip */}
              <Chip
                label={getStatusLabel(overallStatus)}
                sx={{
                  bgcolor: getStatusBackgroundColor(overallStatus),
                  color: getStatusColor(overallStatus),
                  fontWeight: 600,
                  mb: 2,
                }}
              />

              {/* Main totals */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Spent
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(totalSpent)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Budgeted
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(totalBudgeted)}
                  </Typography>
                </Box>

                {/* Progress bar */}
                <Box sx={{ position: 'relative' }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(percentage, 100)}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: getStatusBackgroundColor(overallStatus),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getStatusColor(overallStatus),
                        borderRadius: 6,
                      },
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: percentage > 50 ? '#fff' : getStatusColor(overallStatus),
                        fontWeight: 600,
                        textShadow: percentage > 50 ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                      }}
                    >
                      {percentage.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>

                {/* Remaining */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Remaining
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{ color: totalRemaining >= 0 ? 'success.main' : 'error.main' }}
                  >
                    {formatCurrency(totalRemaining)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Period Comparison Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Period Comparison
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Compare</InputLabel>
                  <Select
                    value={comparisonType}
                    onChange={handleComparisonTypeChange}
                    label="Compare"
                  >
                    <MenuItem value="previous">Previous Period</MenuItem>
                    <MenuItem value="trend">6-Month Trend</MenuItem>
                    <MenuItem value="yoy">Year over Year</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Comparison data */}
              {historical.comparison && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    vs {historical.comparison.period}
                  </Typography>

                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Spending Change
                      </Typography>
                      <TrendIndicator change={historical.comparison.spentChange} label="vs last period" />
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Budget Allocation Change
                      </Typography>
                      <TrendIndicator change={historical.comparison.budgetedChange} label="vs last period" />
                    </Box>

                    <Box sx={{ pt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Previous Period Spent
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(historical.comparison.totalSpent)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}

              {/* Trend mini chart */}
              {comparisonType === 'trend' && trendData && trendData.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={trendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis hide />
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Bar dataKey="spent" fill="#2196F3" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Category Breakdown Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Category Breakdown
              </Typography>

              {categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="spent"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Category legend */}
                  <Stack spacing={0.5}>
                    {categoryData.slice(0, 4).map((cat) => (
                      <Box
                        key={cat.name}
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              bgcolor: cat.color,
                            }}
                          />
                          <Typography variant="caption" noWrap sx={{ maxWidth: 100 }}>
                            {cat.name}
                          </Typography>
                        </Box>
                        <Typography variant="caption" fontWeight="bold">
                          {formatCurrency(cat.spent)}
                        </Typography>
                      </Box>
                    ))}
                    {categoryData.length > 4 && (
                      <Typography variant="caption" color="text.secondary">
                        +{categoryData.length - 4} more categories
                      </Typography>
                    )}
                  </Stack>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No budget data available
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default BudgetSummaryDashboard;

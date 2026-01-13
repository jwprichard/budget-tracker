import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  Divider,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useIncomeVsExpense } from '../../hooks/useAnalytics';
import { GroupByPeriod } from '../../types/analytics.types';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface IncomeVsExpenseChartProps {
  startDate: string;
  endDate: string;
  accountIds?: string[];
  categoryIds?: string[];
  defaultGroupBy?: GroupByPeriod;
}

/**
 * IncomeVsExpenseChart Component
 * Side-by-side comparison of income vs expenses over time
 * Shows net change and savings rate
 */
export const IncomeVsExpenseChart: React.FC<IncomeVsExpenseChartProps> = ({
  startDate,
  endDate,
  accountIds,
  categoryIds,
  defaultGroupBy = 'month',
}) => {
  const [groupBy, setGroupBy] = useState<GroupByPeriod>(defaultGroupBy);

  // Fetch income vs expense data
  const { data, isLoading, error } = useIncomeVsExpense({
    startDate,
    endDate,
    accountIds,
    categoryIds,
    groupBy,
  });

  // Handle groupBy change
  const handleGroupByChange = (
    _event: React.MouseEvent<HTMLElement>,
    newGroupBy: GroupByPeriod | null
  ) => {
    if (newGroupBy !== null) {
      setGroupBy(newGroupBy);
    }
  };

  // Format period label for display
  const formatPeriodLabel = (period: string): string => {
    if (groupBy === 'day') {
      // YYYY-MM-DD -> MM/DD
      const [, month, day] = period.split('-');
      return `${month}/${day}`;
    } else if (groupBy === 'week') {
      // YYYY-WXX -> Week XX
      const week = period.split('-W')[1];
      return `W${week}`;
    } else {
      // YYYY-MM -> MMM YYYY or MMM
      const [year, month] = period.split('-');
      const date = new Date(`${year}-${month}-01`);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        ...(data && data.trends.length > 6 ? {} : { year: 'numeric' }),
      });
    }
  };

  // Prepare chart data
  const chartData = data?.trends.map((trend) => ({
    period: formatPeriodLabel(trend.period),
    fullPeriod: trend.period,
    income: trend.income,
    expense: trend.expense,
    net: trend.net,
    count: trend.transactionCount,
  }));

  // Calculate savings rate
  const calculateSavingsRate = (): number => {
    if (!data || data.summary.totalIncome === 0) return 0;
    return (data.summary.netChange / data.summary.totalIncome) * 100;
  };

  const savingsRate = calculateSavingsRate();

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      dataKey: string;
      value: number;
      color: string;
      payload: { fullPeriod: string; net: number; count: number };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const income = payload.find((p) => p.dataKey === 'income');
      const expense = payload.find((p) => p.dataKey === 'expense');
      const periodSavingsRate = income && expense && income.value > 0
        ? ((income.value - expense.value) / income.value) * 100
        : 0;

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
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {data.fullPeriod}
          </Typography>
          {payload.map((entry, index) => (
            <Box
              key={index}
              sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.5 }}
            >
              <Typography variant="caption" sx={{ color: entry.color }}>
                {entry.dataKey === 'income' ? 'Income' : 'Expenses'}:
              </Typography>
              <Typography variant="caption" fontWeight="bold" sx={{ color: entry.color }}>
                {formatCurrency(entry.value)}
              </Typography>
            </Box>
          ))}
          <Divider sx={{ my: 0.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Net:
            </Typography>
            <Typography
              variant="caption"
              fontWeight="bold"
              color={data.net >= 0 ? 'success.main' : 'error.main'}
            >
              {formatCurrency(data.net)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Savings Rate:
            </Typography>
            <Typography
              variant="caption"
              fontWeight="bold"
              color={periodSavingsRate >= 0 ? 'success.main' : 'error.main'}
            >
              {formatPercentage(periodSavingsRate / 100)}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: 'block' }}
          >
            {data.count} transactions
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card elevation={2}>
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
      <Card elevation={2}>
        <CardContent>
          <Alert severity="error">Error loading income vs expense data: {error.message}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.trends.length === 0) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Alert severity="info">No transaction data found for this period.</Alert>
        </CardContent>
      </Card>
    );
  }

  const { summary } = data;

  return (
    <Card elevation={2}>
      <CardContent>
        <Stack spacing={2}>
          {/* Header with controls */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography variant="h6">Income vs Expenses</Typography>
            <ToggleButtonGroup
              value={groupBy}
              exclusive
              onChange={handleGroupByChange}
              size="small"
            >
              <ToggleButton value="day">Daily</ToggleButton>
              <ToggleButton value="week">Weekly</ToggleButton>
              <ToggleButton value="month">Monthly</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Summary metrics */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Income
              </Typography>
              <Typography variant="h6" color="success.main">
                {formatCurrency(summary.totalIncome)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Expenses
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatCurrency(summary.totalExpense)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Net Savings
              </Typography>
              <Typography
                variant="h6"
                color={summary.netChange >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(summary.netChange)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Savings Rate
              </Typography>
              <Typography
                variant="h6"
                color={savingsRate >= 0 ? 'success.main' : 'error.main'}
              >
                {formatPercentage(savingsRate / 100)}
              </Typography>
            </Box>
          </Box>

          {/* Bar Chart */}
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <Bar dataKey="income" fill="#4caf50" name="Income" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" fill="#f44336" name="Expenses" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Insights */}
          <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Insights:
            </Typography>
            <Stack spacing={0.5}>
              {savingsRate >= 20 && (
                <Typography variant="body2" color="success.main">
                  • Great job! You're saving {formatPercentage(savingsRate / 100)} of your income.
                </Typography>
              )}
              {savingsRate > 0 && savingsRate < 20 && (
                <Typography variant="body2" color="warning.main">
                  • You're saving {formatPercentage(savingsRate / 100)}. Consider increasing to 20%+ for better financial health.
                </Typography>
              )}
              {savingsRate <= 0 && (
                <Typography variant="body2" color="error.main">
                  • Your expenses exceed your income. Review spending to get back on track.
                </Typography>
              )}
              {summary.averageDaily !== 0 && (
                <Typography variant="body2">
                  • Average daily net change: {formatCurrency(summary.averageDaily)}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

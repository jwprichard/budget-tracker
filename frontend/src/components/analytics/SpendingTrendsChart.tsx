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
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useSpendingTrends } from '../../hooks/useAnalytics';
import { GroupByPeriod } from '../../types/analytics.types';
import { formatCurrency } from '../../utils/formatters';

interface SpendingTrendsChartProps {
  startDate: string;
  endDate: string;
  accountIds?: string[];
  categoryIds?: string[];
  defaultGroupBy?: GroupByPeriod;
  chartType?: 'line' | 'area';
}

/**
 * SpendingTrendsChart Component
 * Displays spending trends over time with income, expense, and net change
 * Supports day/week/month grouping
 */
export const SpendingTrendsChart: React.FC<SpendingTrendsChartProps> = ({
  startDate,
  endDate,
  accountIds,
  categoryIds,
  defaultGroupBy = 'day',
  chartType = 'line',
}) => {
  const [groupBy, setGroupBy] = useState<GroupByPeriod>(defaultGroupBy);

  // Fetch spending trends
  const { data, isLoading, error } = useSpendingTrends({
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
      // YYYY-MM -> MMM
      const [year, month] = period.split('-');
      const date = new Date(`${year}-${month}-01`);
      return date.toLocaleDateString('en-US', { month: 'short' });
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

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
      payload: { fullPeriod: string; count: number };
    }>;
  }) => {
    if (active && payload && payload.length && payload[0]) {
      const data = payload[0].payload;
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
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="caption" sx={{ color: entry.color }}>
                {entry.name}:
              </Typography>
              <Typography variant="caption" fontWeight="bold" sx={{ color: entry.color }}>
                {formatCurrency(entry.value)}
              </Typography>
            </Box>
          ))}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
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
          <Alert severity="error">Error loading trend data: {error.message}</Alert>
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
            <Typography variant="h6">Spending Trends</Typography>
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

          {/* Summary cards */}
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography variant="caption" color="text.secondary">
                Total Income
              </Typography>
              <Typography variant="h6" color="success.main">
                {formatCurrency(summary.totalIncome)}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography variant="caption" color="text.secondary">
                Total Expenses
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatCurrency(summary.totalExpense)}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography variant="caption" color="text.secondary">
                Net Change
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="h6"
                  color={summary.netChange >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(summary.netChange)}
                </Typography>
                {summary.netChange >= 0 ? (
                  <TrendingUpIcon color="success" fontSize="small" />
                ) : (
                  <TrendingDownIcon color="error" fontSize="small" />
                )}
              </Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography variant="caption" color="text.secondary">
                Avg. Daily
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(summary.averageDaily)}
              </Typography>
            </Box>
          </Stack>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={350}>
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4caf50" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4caf50" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f44336" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f44336" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2196f3" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#4caf50"
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name="Income"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f44336"
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  name="Expense"
                />
                <Area
                  type="monotone"
                  dataKey="net"
                  stroke="#2196f3"
                  fillOpacity={1}
                  fill="url(#colorNet)"
                  name="Net"
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#4caf50"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Income"
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#f44336"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Expense"
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#2196f3"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Net"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </Stack>
      </CardContent>
    </Card>
  );
};

/**
 * BalanceTrendChart Component
 * Displays account balance progression over time with a line chart
 */

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Paper,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';
import { useDailyBalances } from '../../hooks/useAnalytics';
import { formatCurrency } from '../../utils/formatters';

interface BalanceTrendChartProps {
  startDate: string;
  endDate: string;
  accountIds?: string[];
}

/**
 * Custom tooltip for balance chart
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];
  const date = data.payload.date;
  const balance = data.value as number;

  return (
    <Paper sx={{ p: 1.5, border: 1, borderColor: 'divider' }} elevation={3}>
      <Typography variant="caption" color="text.secondary" display="block">
        {new Date(date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: balance >= 0 ? 'success.main' : 'error.main' }}>
        Balance: {formatCurrency(balance)}
      </Typography>
    </Paper>
  );
};

export const BalanceTrendChart: React.FC<BalanceTrendChartProps> = ({ startDate, endDate, accountIds }) => {
  // Fetch daily balances
  const { data, isLoading, error } = useDailyBalances({
    startDate,
    endDate,
    accountIds,
  });

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data?.dailyBalances) return [];

    return data.dailyBalances.map((item) => ({
      date: item.date,
      balance: item.balance,
    }));
  }, [data]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        startingBalance: 0,
        endingBalance: 0,
        change: 0,
        averageBalance: 0,
        minBalance: 0,
        maxBalance: 0,
      };
    }

    const balances = chartData.map((d) => d.balance);
    const startingBalance = balances[0] || 0;
    const endingBalance = balances[balances.length - 1] || 0;
    const change = endingBalance - startingBalance;
    const averageBalance = balances.reduce((sum, val) => sum + val, 0) / balances.length;
    const minBalance = Math.min(...balances);
    const maxBalance = Math.max(...balances);

    return {
      startingBalance,
      endingBalance,
      change,
      averageBalance,
      minBalance,
      maxBalance,
    };
  }, [chartData]);

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Account Balance Trend
        </Typography>

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load balance data. Please try again.
          </Alert>
        )}

        {/* Chart */}
        {!isLoading && !error && chartData.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => {
                    if (value >= 1000 || value <= -1000) {
                      return `$${(value / 1000).toFixed(0)}k`;
                    }
                    return `$${value}`;
                  }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" strokeWidth={1} />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#1976d2"
                  strokeWidth={2}
                  dot={false}
                  name="Balance"
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Summary Statistics */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6} sm={4} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Starting Balance
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(summary.startingBalance)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Ending Balance
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(summary.endingBalance)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Change
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: summary.change >= 0 ? 'success.main' : 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5,
                    }}
                  >
                    {summary.change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    {summary.change >= 0 ? '+' : ''}
                    {formatCurrency(summary.change)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Average Balance
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(summary.averageBalance)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Lowest
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                    {formatCurrency(summary.minBalance)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Highest
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {formatCurrency(summary.maxBalance)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </>
        )}

        {/* No Data State */}
        {!isLoading && !error && chartData.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No balance data available for the selected period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BalanceTrendChart;

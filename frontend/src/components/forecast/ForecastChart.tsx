/**
 * ForecastChart Component
 * Displays projected account balances over time with a line/area chart
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
  Chip,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useForecast } from '../../hooks/useForecast';
import { formatCurrency } from '../../utils/formatters';
import { format } from 'date-fns';

interface ForecastChartProps {
  days?: number;
  accountIds?: string[];
  lowBalanceThreshold?: number;
}

/**
 * Custom tooltip for forecast chart
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const balance = data.totalBalance as number;
  const hasLowBalance = data.hasLowBalance;

  return (
    <Paper sx={{ p: 1.5, border: 1, borderColor: hasLowBalance ? 'warning.main' : 'divider' }} elevation={3}>
      <Typography variant="caption" color="text.secondary" display="block">
        {format(new Date(data.date), 'EEE, MMM d, yyyy')}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: hasLowBalance ? 'warning.main' : balance >= 0 ? 'success.main' : 'error.main',
        }}
      >
        Projected: {formatCurrency(balance)}
      </Typography>
      {data.plannedCount > 0 && (
        <Typography variant="caption" color="text.secondary">
          {data.plannedCount} planned transaction{data.plannedCount > 1 ? 's' : ''}
        </Typography>
      )}
      {hasLowBalance && (
        <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <WarningIcon sx={{ fontSize: 14, color: 'warning.main' }} />
          <Typography variant="caption" color="warning.main">
            Low balance warning
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export const ForecastChart: React.FC<ForecastChartProps> = ({
  days = 90,
  accountIds,
  lowBalanceThreshold = 0,
}) => {
  // Calculate date range
  const startDate = useMemo(() => new Date().toISOString(), []);
  const endDate = useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() + days);
    return end.toISOString();
  }, [days]);

  // Fetch forecast data
  const { data, isLoading, error } = useForecast({
    startDate,
    endDate,
    accountIds: accountIds?.join(','),
  });

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data?.dailyForecasts) return [];

    return data.dailyForecasts.map((day) => ({
      date: day.date,
      totalBalance: day.totalBalance,
      hasLowBalance: day.hasLowBalance || day.totalBalance < lowBalanceThreshold,
      plannedCount: day.plannedTransactions.length,
    }));
  }, [data, lowBalanceThreshold]);

  // Calculate gradient stop position for low balance
  const gradientOffset = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    const dataMax = Math.max(...chartData.map((d) => d.totalBalance));
    const dataMin = Math.min(...chartData.map((d) => d.totalBalance));

    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;

    return dataMax / (dataMax - dataMin);
  }, [chartData]);

  // Count low balance days
  const lowBalanceDays = useMemo(() => {
    return chartData.filter((d) => d.hasLowBalance).length;
  }, [chartData]);

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Cash Flow Forecast
          </Typography>
          {lowBalanceDays > 0 && (
            <Chip
              icon={<WarningIcon />}
              label={`${lowBalanceDays} low balance day${lowBalanceDays > 1 ? 's' : ''}`}
              color="warning"
              size="small"
            />
          )}
        </Box>

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load forecast data. Please try again.
          </Alert>
        )}

        {/* Chart */}
        {!isLoading && !error && chartData.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset={gradientOffset} stopColor="#4caf50" stopOpacity={0.8} />
                    <stop offset={gradientOffset} stopColor="#f44336" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="colorBalanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset={gradientOffset} stopColor="#4caf50" stopOpacity={0.3} />
                    <stop offset={gradientOffset} stopColor="#f44336" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), 'MMM d')}
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
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" strokeWidth={1} />
                {lowBalanceThreshold !== 0 && (
                  <ReferenceLine
                    y={lowBalanceThreshold}
                    stroke="#ff9800"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ value: 'Threshold', position: 'right', fill: '#ff9800' }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="totalBalance"
                  stroke="url(#colorBalance)"
                  fill="url(#colorBalanceFill)"
                  strokeWidth={2}
                  name="Projected Balance"
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Summary Statistics */}
            {data?.summary && (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Current Balance
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatCurrency(data.currentBalances.reduce((sum, acc) => sum + acc.balance, 0))}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Projected Income
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                      <TrendingUpIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      +{formatCurrency(data.summary.totalIncome)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Projected Expenses
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                      <TrendingDownIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      {formatCurrency(data.summary.totalExpenses)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Net Change
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: data.summary.netChange >= 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      {data.summary.netChange >= 0 ? '+' : ''}
                      {formatCurrency(data.summary.netChange)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Lowest Balance
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: data.summary.lowestBalance < 0 ? 'error.main' : 'warning.main',
                      }}
                    >
                      {formatCurrency(data.summary.lowestBalance)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Lowest On
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {format(new Date(data.summary.lowestBalanceDate), 'MMM d')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {data.summary.lowestBalanceAccount}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
          </>
        )}

        {/* No Data State */}
        {!isLoading && !error && chartData.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No forecast data available. Create planned transactions to see your projected cash flow.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ForecastChart;

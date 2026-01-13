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
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { useCategoryTotals } from '../../hooks/useAnalytics';
import { TransactionTypeFilter } from '../../types/analytics.types';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface CategoryBarChartProps {
  startDate: string;
  endDate: string;
  accountIds?: string[];
  defaultType?: TransactionTypeFilter;
  maxCategories?: number;
}

/**
 * CategoryBarChart Component
 * Displays category totals in a horizontal bar chart
 * with percentage comparison and optional subcategory view
 */
export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({
  startDate,
  endDate,
  accountIds,
  defaultType = 'EXPENSE',
  maxCategories = 10,
}) => {
  const [transactionType, setTransactionType] = useState<TransactionTypeFilter>(defaultType);
  const [showPercentage, setShowPercentage] = useState(false);

  // Fetch category totals
  const { data, isLoading, error } = useCategoryTotals({
    startDate,
    endDate,
    accountIds,
    type: transactionType,
    includeSubcategories: false,
  });

  // Handle type change
  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: TransactionTypeFilter | null
  ) => {
    if (newType !== null) {
      setTransactionType(newType);
    }
  };

  // Prepare data for bar chart (top N categories)
  const getBarChartData = () => {
    if (!data?.categories) return [];

    return data.categories
      .slice(0, maxCategories)
      .map((cat) => ({
        name: cat.categoryName,
        amount: cat.total,
        percentage: cat.percentage,
        color: cat.color,
        count: cat.transactionCount,
      }));
  };

  const barData = getBarChartData();

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload: { name: string; percentage: number; count: number };
    }>;
  }) => {
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
            {data.payload.name}
          </Typography>
          <Typography variant="body2" color="primary">
            {formatCurrency(data.value)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatPercentage(data.payload.percentage / 100)} • {data.payload.count}{' '}
            transactions
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Custom Y-axis tick (truncate long category names)
  const CustomYAxisTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
    const maxLength = 15;
    const text = payload.value;
    const displayText = text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={4} textAnchor="end" fill="#666" fontSize={12}>
          {displayText}
        </text>
      </g>
    );
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
          <Alert severity="error">Error loading category data: {error.message}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.categories.length === 0) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Alert severity="info">
            No {transactionType.toLowerCase()} transactions found for this period.
          </Alert>
        </CardContent>
      </Card>
    );
  }

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
            <Typography variant="h6">Top Categories</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={showPercentage}
                    onChange={(e) => setShowPercentage(e.target.checked)}
                    size="small"
                  />
                }
                label="Show %"
              />
              <ToggleButtonGroup
                value={transactionType}
                exclusive
                onChange={handleTypeChange}
                size="small"
              >
                <ToggleButton value="EXPENSE">Expenses</ToggleButton>
                <ToggleButton value="INCOME">Income</ToggleButton>
                <ToggleButton value="ALL">All</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Box>

          {/* Total amount */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total {transactionType === 'ALL' ? '' : transactionType.toLowerCase()}
            </Typography>
            <Typography variant="h5" color="primary">
              {formatCurrency(data.totalAmount)}
            </Typography>
          </Box>

          {/* Bar Chart */}
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(value) =>
                  showPercentage ? `${value.toFixed(0)}%` : formatCurrency(value)
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={<CustomYAxisTick x={0} y={0} payload={{ value: '' }} />}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={showPercentage ? 'percentage' : 'amount'}
                radius={[0, 8, 8, 0]}
              >
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Summary info */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Showing top {Math.min(maxCategories, data.categories.length)} of{' '}
              {data.categories.length} categories
            </Typography>
            {data.uncategorizedAmount > 0 && (
              <Typography variant="caption" color="warning.main">
                {formatCurrency(data.uncategorizedAmount)} uncategorized
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

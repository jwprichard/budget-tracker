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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Circle as CircleIcon } from '@mui/icons-material';
import { useCategoryTotals } from '../../hooks/useAnalytics';
import { CategoryTotal, TransactionTypeFilter } from '../../types/analytics.types';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface CategoryPieChartProps {
  startDate: string;
  endDate: string;
  accountIds?: string[];
  defaultType?: TransactionTypeFilter;
}

/**
 * CategoryPieChart Component
 * Displays spending/income breakdown by category in a pie chart
 * with interactive legend and subcategory support
 */
export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  startDate,
  endDate,
  accountIds,
  defaultType = 'EXPENSE',
}) => {
  const [transactionType, setTransactionType] = useState<TransactionTypeFilter>(defaultType);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch category totals
  const { data, isLoading, error } = useCategoryTotals({
    startDate,
    endDate,
    accountIds,
    type: transactionType,
    includeSubcategories: true,
  });

  // Handle type change
  const handleTypeChange = (_event: React.MouseEvent<HTMLElement>, newType: TransactionTypeFilter | null) => {
    if (newType !== null) {
      setTransactionType(newType);
      setSelectedCategory(null); // Reset selection on type change
    }
  };

  // Handle category selection for subcategory drill-down
  const handleCategoryClick = (categoryId: string | null) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null); // Deselect if clicking same category
    } else {
      setSelectedCategory(categoryId);
    }
  };

  // Prepare data for pie chart
  const getPieChartData = () => {
    if (!data?.categories) return [];

    // If a category is selected and has subcategories, show subcategories
    const selected = data.categories.find((cat) => cat.categoryId === selectedCategory);
    if (selected && selected.subcategories && selected.subcategories.length > 0) {
      return selected.subcategories.map((cat) => ({
        name: cat.categoryName,
        value: cat.total,
        color: cat.color,
        percentage: cat.percentage,
        count: cat.transactionCount,
        categoryId: cat.categoryId,
      }));
    }

    // Otherwise show top-level categories
    return data.categories.map((cat) => ({
      name: cat.categoryName,
      value: cat.total,
      color: cat.color,
      percentage: cat.percentage,
      count: cat.transactionCount,
      categoryId: cat.categoryId,
    }));
  };

  const pieData = getPieChartData();

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percentage: number; count: number } }> }) => {
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
            {formatCurrency(data.value)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatPercentage(data.payload.percentage / 100)} • {data.payload.count} transactions
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
          <Alert severity="error">
            Error loading category data: {error.message}
          </Alert>
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

  const selectedCategoryData = data.categories.find((cat) => cat.categoryId === selectedCategory);

  return (
    <Card elevation={2}>
      <CardContent>
        <Stack spacing={2}>
          {/* Header with type toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Category Breakdown
              {selectedCategoryData && ` - ${selectedCategoryData.categoryName}`}
            </Typography>
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
          </Box>

          {/* Total amount */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total {transactionType === 'ALL' ? '' : transactionType.toLowerCase()}
            </Typography>
            <Typography variant="h4" color="primary">
              {formatCurrency(data.totalAmount)}
            </Typography>
            {data.uncategorizedAmount > 0 && (
              <Typography variant="caption" color="warning.main">
                {formatCurrency(data.uncategorizedAmount)} uncategorized
              </Typography>
            )}
          </Box>

          {/* Pie Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <Divider />

          {/* Category List */}
          <List dense>
            {data.categories.map((category) => (
              <ListItem
                key={category.categoryId || 'uncategorized'}
                sx={{
                  cursor: category.subcategories && category.subcategories.length > 0 ? 'pointer' : 'default',
                  bgcolor: selectedCategory === category.categoryId ? 'action.selected' : 'transparent',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: category.subcategories && category.subcategories.length > 0 ? 'action.hover' : 'transparent',
                  },
                }}
                onClick={() => category.subcategories && category.subcategories.length > 0 && handleCategoryClick(category.categoryId)}
              >
                <ListItemIcon>
                  <CircleIcon sx={{ color: category.color, fontSize: 16 }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        {category.categoryName}
                        {category.subcategories && category.subcategories.length > 0 && (
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            ({category.subcategories.length} subcategories)
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(category.total)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {category.transactionCount} transactions
                      </Typography>
                      <Typography variant="caption" color="primary">
                        {formatPercentage(category.percentage / 100)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>

          {/* Back button when viewing subcategories */}
          {selectedCategoryData && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="caption"
                color="primary"
                sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setSelectedCategory(null)}
              >
                ← Back to all categories
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

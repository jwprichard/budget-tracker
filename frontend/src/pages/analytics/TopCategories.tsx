/**
 * TopCategories Page
 * Displays top spending categories in a sortable table with rank, amount, percentage, and transaction count
 */

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  Chip,
} from '@mui/material';
import { AnalyticsFilters, AnalyticsFiltersState } from '../../components/analytics/AnalyticsFilters';
import { useCategoryTotals } from '../../hooks/useAnalytics';
import { TransactionTypeFilter } from '../../types/analytics.types';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { getDefaultDateRange } from '../../utils/analyticsHelpers';

export const TopCategories: React.FC = () => {
  const [filters, setFilters] = useState<AnalyticsFiltersState>({
    dateRange: getDefaultDateRange(30), // Last 30 days by default
    accountIds: [],
    categoryIds: [], // Not used on this page
  });

  const [transactionType, setTransactionType] = useState<TransactionTypeFilter>('EXPENSE');

  // Fetch category totals
  const { data, isLoading, error } = useCategoryTotals({
    startDate: filters.dateRange.startDate,
    endDate: filters.dateRange.endDate,
    accountIds: filters.accountIds.length > 0 ? filters.accountIds : undefined,
    type: transactionType,
    includeSubcategories: false,
  });

  // Handle type change
  const handleTypeChange = (_event: React.MouseEvent<HTMLElement>, newType: TransactionTypeFilter | null) => {
    if (newType !== null) {
      setTransactionType(newType);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Top Categories
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ranked list of your top spending categories with detailed statistics
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <AnalyticsFilters
          value={filters}
          onChange={setFilters}
          showCategoryFilter={false}
        />
      </Box>

      {/* Table */}
      <Paper elevation={2}>
        {/* Transaction Type Toggle */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Category Rankings</Typography>
            <ToggleButtonGroup
              value={transactionType}
              exclusive
              onChange={handleTypeChange}
              size="small"
              aria-label="transaction type"
            >
              <ToggleButton value="EXPENSE" aria-label="expense">
                Expenses
              </ToggleButton>
              <ToggleButton value="INCOME" aria-label="income">
                Income
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">Failed to load category data</Alert>
          </Box>
        )}

        {/* Table Content */}
        {!isLoading && !error && data && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="80px" align="center" sx={{ fontWeight: 600 }}>
                    Rank
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Amount
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    % of Total
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Transactions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No transactions found for the selected period
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.categories.slice(0, 20).map((category, index) => (
                    <TableRow
                      key={category.categoryId}
                      hover
                      sx={{
                        '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                      }}
                    >
                      <TableCell align="center">
                        <Chip
                          label={`#${index + 1}`}
                          size="small"
                          color={index < 3 ? 'primary' : 'default'}
                          sx={{ fontWeight: index < 3 ? 'bold' : 'normal' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              bgcolor: category.color,
                              borderRadius: '50%',
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {category.categoryName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(category.total)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {formatPercentage(category.percentage)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {category.transactionCount}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Summary Footer */}
        {!isLoading && !error && data && data.categories.length > 0 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
            <Stack direction="row" spacing={3} justifyContent="flex-end">
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total {transactionType === 'EXPENSE' ? 'Spent' : 'Received'}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatCurrency(data.totalAmount)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Categories
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {Math.min(data.categories.length, 20)} / {data.categories.length}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default TopCategories;

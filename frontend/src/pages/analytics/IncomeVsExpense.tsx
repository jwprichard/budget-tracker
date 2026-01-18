/**
 * IncomeVsExpense Page
 * Compare income and expenses side-by-side with savings rate insights
 */

import React, { useState } from 'react';
import { Container, Typography, Grid, Box } from '@mui/material';
import { AnalyticsFilters, AnalyticsFiltersState } from '../../components/analytics/AnalyticsFilters';
import { IncomeVsExpenseChart } from '../../components/analytics/IncomeVsExpenseChart';
import { getDefaultDateRange } from '../../utils/analyticsHelpers';

export const IncomeVsExpense: React.FC = () => {
  const [filters, setFilters] = useState<AnalyticsFiltersState>({
    dateRange: getDefaultDateRange(365), // Last 12 months by default
    accountIds: [],
    categoryIds: [],
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Income vs Expense
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Compare your income and expenses side-by-side with savings rate insights
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <AnalyticsFilters
          value={filters}
          onChange={setFilters}
          showCategoryFilter={true}
        />
      </Box>

      {/* Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <IncomeVsExpenseChart
            startDate={filters.dateRange.startDate}
            endDate={filters.dateRange.endDate}
            accountIds={filters.accountIds.length > 0 ? filters.accountIds : undefined}
            categoryIds={filters.categoryIds.length > 0 ? filters.categoryIds : undefined}
            defaultGroupBy="month"
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default IncomeVsExpense;

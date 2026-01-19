/**
 * SpendingTrends Page
 * Track spending patterns over time with detailed trend analysis
 */

import React, { useState, useMemo } from 'react';
import { Container, Typography, Grid, Box } from '@mui/material';
import { AnalyticsFilters, AnalyticsFiltersState } from '../../components/analytics/AnalyticsFilters';
import { SpendingTrendsChart } from '../../components/analytics/SpendingTrendsChart';
import { getDefaultDateRange } from '../../utils/analyticsHelpers';
import { useSidebar } from '../../hooks/useSidebar';

export const SpendingTrends: React.FC = () => {
  const [filters, setFilters] = useState<AnalyticsFiltersState>({
    dateRange: getDefaultDateRange(90), // Last 90 days by default for trends
    accountIds: [],
    categoryIds: [],
  });

  // Sidebar config - filters
  const sidebarConfig = useMemo(
    () => (
      <AnalyticsFilters
        value={filters}
        onChange={setFilters}
        showCategoryFilter={true}
        compact
      />
    ),
    [filters]
  );

  useSidebar({
    config: sidebarConfig,
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Spending Trends
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your spending patterns over time with detailed trend analysis
        </Typography>
      </Box>

      {/* Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <SpendingTrendsChart
            startDate={filters.dateRange.startDate}
            endDate={filters.dateRange.endDate}
            accountIds={filters.accountIds.length > 0 ? filters.accountIds : undefined}
            categoryIds={filters.categoryIds.length > 0 ? filters.categoryIds : undefined}
            defaultGroupBy="day"
            chartType="area"
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default SpendingTrends;

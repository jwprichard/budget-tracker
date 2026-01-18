/**
 * BalanceTrend Page
 * Track account balance progression over time with detailed statistics
 */

import React, { useState } from 'react';
import { Container, Typography, Grid, Box } from '@mui/material';
import { AnalyticsFilters, AnalyticsFiltersState } from '../../components/analytics/AnalyticsFilters';
import { BalanceTrendChart } from '../../components/analytics/BalanceTrendChart';
import { getDefaultDateRange } from '../../utils/analyticsHelpers';

export const BalanceTrend: React.FC = () => {
  const [filters, setFilters] = useState<AnalyticsFiltersState>({
    dateRange: getDefaultDateRange(90), // Last 90 days by default
    accountIds: [],
    categoryIds: [], // Not used for balance trend
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Balance Trend
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your account balance progression over time with detailed statistics
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

      {/* Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <BalanceTrendChart
            startDate={filters.dateRange.startDate}
            endDate={filters.dateRange.endDate}
            accountIds={filters.accountIds.length > 0 ? filters.accountIds : undefined}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default BalanceTrend;

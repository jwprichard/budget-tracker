/**
 * SpendingByCategory Page
 * Compare spending across categories with a ranked horizontal bar chart
 */

import React, { useState } from 'react';
import { Container, Typography, Grid, Box } from '@mui/material';
import { AnalyticsFilters, AnalyticsFiltersState } from '../../components/analytics/AnalyticsFilters';
import { CategoryBarChart } from '../../components/analytics/CategoryBarChart';
import { getDefaultDateRange } from '../../utils/analyticsHelpers';

export const SpendingByCategory: React.FC = () => {
  const [filters, setFilters] = useState<AnalyticsFiltersState>({
    dateRange: getDefaultDateRange(30), // Last 30 days by default
    accountIds: [],
    categoryIds: [], // Not used on this page
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Spending by Category
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Compare spending across categories with a ranked bar chart
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
          <CategoryBarChart
            startDate={filters.dateRange.startDate}
            endDate={filters.dateRange.endDate}
            accountIds={filters.accountIds.length > 0 ? filters.accountIds : undefined}
            defaultType="EXPENSE"
            maxCategories={10}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default SpendingByCategory;

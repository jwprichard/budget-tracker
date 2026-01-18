/**
 * TrendsPatterns Page
 * Unified trends analysis with multiple visualization options via tabs
 */

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ShowChart as ShowChartIcon,
  Compare as CompareIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { AnalyticsFilters, AnalyticsFiltersState } from '../../components/analytics/AnalyticsFilters';
import { SpendingTrendsChart } from '../../components/analytics/SpendingTrendsChart';
import { IncomeVsExpenseChart } from '../../components/analytics/IncomeVsExpenseChart';
import { BalanceTrendChart } from '../../components/analytics/BalanceTrendChart';
import { getDefaultDateRange } from '../../utils/analyticsHelpers';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const TrendsPatterns: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [filters, setFilters] = useState<AnalyticsFiltersState>({
    dateRange: getDefaultDateRange(90), // Last 90 days by default for trends
    accountIds: [],
    categoryIds: [],
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Trends & Patterns
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your financial trends over time with multiple visualization options
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

      {/* Tabs for Different Visualizations */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            icon={<ShowChartIcon />}
            label="Spending Trends"
            iconPosition="start"
          />
          <Tab
            icon={<CompareIcon />}
            label="Income vs Expense"
            iconPosition="start"
          />
          <Tab
            icon={<TimelineIcon />}
            label="Balance Trend"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab 1: Spending Trends */}
      <TabPanel value={currentTab} index={0}>
        <SpendingTrendsChart
          startDate={filters.dateRange.startDate}
          endDate={filters.dateRange.endDate}
          accountIds={filters.accountIds.length > 0 ? filters.accountIds : undefined}
          categoryIds={filters.categoryIds.length > 0 ? filters.categoryIds : undefined}
          defaultGroupBy="day"
          chartType="area"
        />
      </TabPanel>

      {/* Tab 2: Income vs Expense */}
      <TabPanel value={currentTab} index={1}>
        <IncomeVsExpenseChart
          startDate={filters.dateRange.startDate}
          endDate={filters.dateRange.endDate}
          accountIds={filters.accountIds.length > 0 ? filters.accountIds : undefined}
          categoryIds={filters.categoryIds.length > 0 ? filters.categoryIds : undefined}
          defaultGroupBy="month"
        />
      </TabPanel>

      {/* Tab 3: Balance Trend */}
      <TabPanel value={currentTab} index={2}>
        <BalanceTrendChart
          startDate={filters.dateRange.startDate}
          endDate={filters.dateRange.endDate}
          accountIds={filters.accountIds.length > 0 ? filters.accountIds : undefined}
        />
      </TabPanel>
    </Container>
  );
};

export default TrendsPatterns;

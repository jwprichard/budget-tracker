import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Tab,
  Tabs,
  Paper,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { AnalyticsFilters, AnalyticsFiltersState } from '../components/analytics/AnalyticsFilters';
import { CalendarView } from '../components/analytics/CalendarView';
import { CategoryPieChart } from '../components/analytics/CategoryPieChart';
import { CategoryBarChart } from '../components/analytics/CategoryBarChart';
import { SpendingTrendsChart } from '../components/analytics/SpendingTrendsChart';
import { IncomeVsExpenseChart } from '../components/analytics/IncomeVsExpenseChart';
import { formatDateForInput } from '../utils/formatters';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

/**
 * Analytics Page
 * Comprehensive financial analytics dashboard with multiple views
 */
export const Analytics: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  // Initialize filters with last 30 days
  const getInitialDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
      startDate: formatDateForInput(thirtyDaysAgo),
      endDate: formatDateForInput(today),
    };
  };

  const [filters, setFilters] = useState<AnalyticsFiltersState>({
    dateRange: getInitialDateRange(),
    accountIds: [],
    categoryIds: [],
  });

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Handle filter change
  const handleFiltersChange = (newFilters: AnalyticsFiltersState) => {
    setFilters(newFilters);
  };

  const { dateRange, accountIds, categoryIds } = filters;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visualize your financial data with interactive charts and insights
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <AnalyticsFilters
          value={filters}
          onChange={handleFiltersChange}
          showCategoryFilter={currentTab === 2} // Only show for trends tab
        />
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="analytics tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<CalendarIcon />}
            iconPosition="start"
            label="Calendar"
            id="analytics-tab-0"
            aria-controls="analytics-tabpanel-0"
          />
          <Tab
            icon={<PieChartIcon />}
            iconPosition="start"
            label="Categories"
            id="analytics-tab-1"
            aria-controls="analytics-tabpanel-1"
          />
          <Tab
            icon={<TrendingUpIcon />}
            iconPosition="start"
            label="Trends"
            id="analytics-tab-2"
            aria-controls="analytics-tabpanel-2"
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      {/* Calendar View */}
      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <CalendarView
              accountIds={accountIds.length > 0 ? accountIds : undefined}
            />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Category View */}
      <TabPanel value={currentTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <CategoryPieChart
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              accountIds={accountIds.length > 0 ? accountIds : undefined}
              defaultType="EXPENSE"
            />
          </Grid>
          <Grid item xs={12} lg={6}>
            <CategoryBarChart
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              accountIds={accountIds.length > 0 ? accountIds : undefined}
              defaultType="EXPENSE"
              maxCategories={10}
            />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Trends View */}
      <TabPanel value={currentTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <IncomeVsExpenseChart
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              accountIds={accountIds.length > 0 ? accountIds : undefined}
              categoryIds={categoryIds.length > 0 ? categoryIds : undefined}
              defaultGroupBy="month"
            />
          </Grid>
          <Grid item xs={12}>
            <SpendingTrendsChart
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              accountIds={accountIds.length > 0 ? accountIds : undefined}
              categoryIds={categoryIds.length > 0 ? categoryIds : undefined}
              defaultGroupBy="day"
              chartType="area"
            />
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default Analytics;

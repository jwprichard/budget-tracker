/**
 * SpendingAnalysis Page
 * Unified spending analysis with multiple visualization options via tabs
 */

import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';
import { AnalyticsFilters, AnalyticsFiltersState } from '../../components/analytics/AnalyticsFilters';
import { CategoryPieChart } from '../../components/analytics/CategoryPieChart';
import { CategoryBarChart } from '../../components/analytics/CategoryBarChart';
import { useCategoryTotals } from '../../hooks/useAnalytics';
import { TransactionTypeFilter } from '../../types/analytics.types';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { getDefaultDateRange } from '../../utils/analyticsHelpers';
import { useSidebar } from '../../hooks/useSidebar';

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

export const SpendingAnalysis: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [filters, setFilters] = useState<AnalyticsFiltersState>({
    dateRange: getDefaultDateRange(30), // Last 30 days by default
    accountIds: [],
    categoryIds: [], // Not used for spending analysis overview
  });
  const [transactionType, setTransactionType] = useState<TransactionTypeFilter>('EXPENSE');

  // Fetch data for table view
  const { data: tableData, isLoading, error } = useCategoryTotals({
    startDate: filters.dateRange.startDate,
    endDate: filters.dateRange.endDate,
    accountIds: filters.accountIds.length > 0 ? filters.accountIds : undefined,
    type: transactionType,
    includeSubcategories: false,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleTypeChange = (_event: React.MouseEvent<HTMLElement>, newType: TransactionTypeFilter | null) => {
    if (newType !== null) {
      setTransactionType(newType);
    }
  };

  // Sidebar tools - transaction type toggle
  const sidebarTools = useMemo(
    () => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Transaction Type
        </Typography>
        <ToggleButtonGroup
          value={transactionType}
          exclusive
          onChange={handleTypeChange}
          size="small"
          fullWidth
          aria-label="transaction type"
        >
          <ToggleButton value="EXPENSE" aria-label="expense">
            Expenses
          </ToggleButton>
          <ToggleButton value="INCOME" aria-label="income">
            Income
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    ),
    [transactionType]
  );

  // Sidebar config - filters
  const sidebarConfig = useMemo(
    () => (
      <AnalyticsFilters
        value={filters}
        onChange={setFilters}
        showCategoryFilter={false}
        compact
      />
    ),
    [filters]
  );

  useSidebar({
    tools: sidebarTools,
    config: sidebarConfig,
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Spending Analysis
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Analyze your spending patterns across categories with multiple visualization options
        </Typography>
      </Box>

      {/* Tabs for Different Visualizations */}
      <Paper elevation={2}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<PieChartIcon />}
            label="Category Breakdown"
            iconPosition="start"
          />
          <Tab
            icon={<BarChartIcon />}
            label="Bar Chart"
            iconPosition="start"
          />
          <Tab
            icon={<TableChartIcon />}
            label="Detailed Table"
            iconPosition="start"
          />
        </Tabs>

        {/* Tab 1: Category Breakdown (Pie Chart) */}
        <TabPanel value={currentTab} index={0}>
          <CategoryPieChart
            startDate={filters.dateRange.startDate}
            endDate={filters.dateRange.endDate}
            accountIds={filters.accountIds.length > 0 ? filters.accountIds : undefined}
            defaultType={transactionType}
          />
        </TabPanel>

        {/* Tab 2: Bar Chart */}
        <TabPanel value={currentTab} index={1}>
          <CategoryBarChart
            startDate={filters.dateRange.startDate}
            endDate={filters.dateRange.endDate}
            accountIds={filters.accountIds.length > 0 ? filters.accountIds : undefined}
            defaultType={transactionType}
            maxCategories={10}
          />
        </TabPanel>

        {/* Tab 3: Detailed Table */}
        <TabPanel value={currentTab} index={2}>
          <Box sx={{ p: 2 }}>
            {/* Loading State */}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Error State */}
            {error && (
              <Alert severity="error">Failed to load category data</Alert>
            )}

            {/* Table Content */}
            {!isLoading && !error && tableData && (
              <>
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
                      {tableData.categories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No transactions found for the selected period
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        tableData.categories.slice(0, 20).map((category, index) => (
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

                {/* Summary Footer */}
                {tableData.categories.length > 0 && (
                  <Box sx={{ p: 2, mt: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Stack direction="row" spacing={3} justifyContent="flex-end">
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Total {transactionType === 'EXPENSE' ? 'Spent' : 'Received'}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {formatCurrency(tableData.totalAmount)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Categories
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {Math.min(tableData.categories.length, 20)} / {tableData.categories.length}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
              </>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default SpendingAnalysis;

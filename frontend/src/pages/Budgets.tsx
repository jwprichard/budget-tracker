/**
 * Budgets Page
 * Main page for budget management
 */

import React, { useState, useMemo } from 'react';
import {
  Container,
  Box,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { BudgetList, SortOption, FilterStatus, FilterPeriodType } from '../components/budgets/BudgetList';
import { BudgetForm } from '../components/budgets/BudgetForm';
import { BudgetSummaryDashboard } from '../components/budgets/BudgetSummaryDashboard';
import { IncomeVsExpensesDashboard } from '../components/budgets/IncomeVsExpensesDashboard';
import { useBudgetsForRange } from '../hooks/useBudgets';
import { useSidebar } from '../hooks/useSidebar';

// Calculate date range for fetching budgets (current year with padding)
const getDateRange = () => {
  const now = new Date();
  // Start from beginning of current year
  const startDate = new Date(now.getFullYear(), 0, 1);
  // End at the end of current year
  const endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

export const Budgets: React.FC = () => {
  const [budgetFormOpen, setBudgetFormOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('period');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [filterPeriodType, setFilterPeriodType] = useState<FilterPeriodType>('ANNUALLY');

  // Use memoized date range to prevent unnecessary re-fetches
  const dateRange = useMemo(() => getDateRange(), []);
  const { data: budgets = [], isLoading, error } = useBudgetsForRange(dateRange);

  // Sidebar tools - action buttons
  const sidebarTools = useMemo(
    () => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => setBudgetFormOpen(true)}
        >
          Create Budget
        </Button>
      </Box>
    ),
    []
  );

  // Sidebar config - filters
  const sidebarConfig = useMemo(
    () => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Period Type</InputLabel>
          <Select
            value={filterPeriodType}
            label="Period Type"
            onChange={(e: SelectChangeEvent) => setFilterPeriodType(e.target.value as FilterPeriodType)}
          >
            <MenuItem value="ANNUALLY">Annually</MenuItem>
            <MenuItem value="MONTHLY">Monthly</MenuItem>
            <MenuItem value="FORTNIGHTLY">Fortnightly</MenuItem>
            <MenuItem value="WEEKLY">Weekly</MenuItem>
            <MenuItem value="DAILY">Daily</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e: SelectChangeEvent) => setFilterStatus(e.target.value as FilterStatus)}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="UNDER_BUDGET">Under Budget</MenuItem>
            <MenuItem value="ON_TRACK">On Track</MenuItem>
            <MenuItem value="WARNING">Warning</MenuItem>
            <MenuItem value="EXCEEDED">Exceeded</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e: SelectChangeEvent) => setSortBy(e.target.value as SortOption)}
          >
            <MenuItem value="period">Period (Newest)</MenuItem>
            <MenuItem value="amount">Amount (Highest)</MenuItem>
            <MenuItem value="spent">Spent (Highest)</MenuItem>
            <MenuItem value="percentage">Percentage (Highest)</MenuItem>
            <MenuItem value="name">Name (A-Z)</MenuItem>
          </Select>
        </FormControl>
      </Box>
    ),
    [filterPeriodType, filterStatus, sortBy]
  );

  useSidebar({
    tools: sidebarTools,
    config: sidebarConfig,
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>

      {/* Budget Summary Dashboard */}
      <BudgetSummaryDashboard filterPeriodType={filterPeriodType} />

      {/* Income vs Expenses Comparison */}
      <IncomeVsExpensesDashboard filterPeriodType={filterPeriodType} />

      {/* Budget List */}
      <Paper sx={{ p: 3 }}>
        <BudgetList
          budgets={budgets}
          isLoading={isLoading}
          error={error || undefined}
          sortBy={sortBy}
          filterStatus={filterStatus}
          filterPeriodType={filterPeriodType}
        />
      </Paper>

      {/* Create Budget Dialog */}
      <BudgetForm
        open={budgetFormOpen}
        onClose={() => setBudgetFormOpen(false)}
      />
    </Container>
  );
};

export default Budgets;

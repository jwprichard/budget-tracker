/**
 * Budgets Page
 * Main page for budget management
 */

import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { BudgetList } from '../components/budgets/BudgetList';
import { BudgetForm } from '../components/budgets/BudgetForm';
import { useBudgets } from '../hooks/useBudgets';

export const Budgets: React.FC = () => {
  const [budgetFormOpen, setBudgetFormOpen] = useState(false);
  const { data: budgets = [], isLoading, error } = useBudgets();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography variant="h4" component="h1" gutterBottom>
            Budgets
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your spending against category budgets
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setBudgetFormOpen(true)}
        >
          Create Budget
        </Button>
      </Box>

      {/* Budget List */}
      <Paper sx={{ p: 3 }}>
        <BudgetList budgets={budgets} isLoading={isLoading} error={error || undefined} />
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

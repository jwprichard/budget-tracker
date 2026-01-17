/**
 * BudgetCard Component
 * Individual budget display card with progress, status, and actions
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  Grid,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { BudgetWithStatus, BudgetStatus } from '../../types/budget.types';
import { BudgetProgress } from './BudgetProgress';
import { CategoryColorBadge } from '../categories/CategoryColorBadge';

interface BudgetCardProps {
  budget: BudgetWithStatus;
  onEdit: (budget: BudgetWithStatus) => void;
  onDelete: (budgetId: string) => void;
}

/**
 * Get status label and color
 */
const getStatusInfo = (status: BudgetStatus): { label: string; color: 'success' | 'info' | 'warning' | 'error' } => {
  switch (status) {
    case 'UNDER_BUDGET':
      return { label: 'Under Budget', color: 'success' };
    case 'ON_TRACK':
      return { label: 'On Track', color: 'info' };
    case 'WARNING':
      return { label: 'Warning', color: 'warning' };
    case 'EXCEEDED':
      return { label: 'Exceeded', color: 'error' };
    default:
      return { label: 'Unknown', color: 'info' };
  }
};

/**
 * Format period for display
 */
const formatPeriod = (periodType: string, year: number, periodNumber: number): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  switch (periodType) {
    case 'MONTHLY':
      return `${monthNames[periodNumber - 1]} ${year}`;
    case 'QUARTERLY':
      return `Q${periodNumber} ${year}`;
    case 'WEEKLY':
      return `Week ${periodNumber} ${year}`;
    case 'ANNUALLY':
      return `${year}`;
    default:
      return `${periodType} ${periodNumber} ${year}`;
  }
};

/**
 * Format currency
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  }).format(amount);
};

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const statusInfo = getStatusInfo(budget.status);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.3s',
        '&:hover': {
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header: Category and Period */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryColorBadge color={budget.categoryColor} />
            <Typography variant="h6" component="div">
              {budget.categoryName}
            </Typography>
          </Box>
          <Chip
            label={statusInfo.label}
            color={statusInfo.color}
            size="small"
          />
        </Box>

        {/* Period Display */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {formatPeriod(budget.periodType, budget.periodYear, budget.periodNumber)}
        </Typography>

        {/* Budget Name (if exists) */}
        {budget.name && (
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontStyle: 'italic' }}>
            {budget.name}
          </Typography>
        )}

        {/* Progress Bar */}
        <Box sx={{ my: 2 }}>
          <BudgetProgress percentage={budget.percentage} status={budget.status} />
        </Box>

        {/* Budget Summary */}
        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              Budget
            </Typography>
            <Typography variant="body2" fontWeight="600">
              {formatCurrency(budget.amount)}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              Spent
            </Typography>
            <Typography variant="body2" fontWeight="600" color={budget.percentage > 100 ? 'error.main' : 'inherit'}>
              {formatCurrency(budget.spent)}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              Remaining
            </Typography>
            <Typography variant="body2" fontWeight="600" color={budget.remaining < 0 ? 'error.main' : 'success.main'}>
              {formatCurrency(budget.remaining)}
            </Typography>
          </Grid>
        </Grid>

        {/* Expandable Details */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Period Dates
            </Typography>
            <Typography variant="body2">
              {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
            </Typography>

            {budget.includeSubcategories && (
              <Box sx={{ mt: 1 }}>
                <Chip label="Includes subcategories" size="small" variant="outlined" />
              </Box>
            )}

            {budget.notes && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Notes
                </Typography>
                <Typography variant="body2">{budget.notes}</Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
        <Box>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
        <Box>
          <IconButton size="small" color="primary" onClick={() => onEdit(budget)} title="Edit budget">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(budget.id)} title="Delete budget">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );
};

export default BudgetCard;

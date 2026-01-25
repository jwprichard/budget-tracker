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
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { BudgetWithStatus, BudgetStatus, BudgetType } from '../../types/budget.types';
import { BudgetProgress } from './BudgetProgress';
import { CategoryColorBadge } from '../categories/CategoryColorBadge';

// Pulse animation for warning status
const pulseWarning = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(255, 152, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0);
  }
`;

// Pulse animation for exceeded status
const pulseExceeded = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(244, 67, 54, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
  }
`;

/**
 * Get alert styles based on status
 */
const getAlertStyles = (status: BudgetStatus) => {
  switch (status) {
    case 'WARNING':
      return {
        animation: `${pulseWarning} 2s ease-in-out infinite`,
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.03)',
      };
    case 'EXCEEDED':
      return {
        animation: `${pulseExceeded} 1.5s ease-in-out infinite`,
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.05)',
      };
    default:
      return {};
  }
};

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
 * Get color based on budget type
 */
const getBudgetTypeColor = (type: BudgetType): string => {
  return type === 'INCOME' ? '#4caf50' : '#9c27b0'; // Green for income, purple for expense
};

/**
 * Format start date for display
 */
const formatBudgetPeriod = (startDate: string, periodType: string | null): string => {
  const date = new Date(startDate);
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (!periodType) {
    return `One-time budget (${formatted})`;
  }

  return `Starting ${formatted}`;
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
  const budgetTypeColor = getBudgetTypeColor(budget.type);
  const alertStyles = getAlertStyles(budget.status);
  const isAlertStatus = budget.status === 'WARNING' || budget.status === 'EXCEEDED';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.3s',
        borderLeft: `4px solid ${isAlertStatus ? alertStyles.borderColor : budgetTypeColor}`,
        ...(isAlertStatus && {
          ...alertStyles,
          border: `2px solid ${alertStyles.borderColor}`,
          borderLeft: `4px solid ${alertStyles.borderColor}`,
        }),
        '&:hover': {
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1, position: 'relative' }}>
        {/* Alert Badge for WARNING/EXCEEDED */}
        {budget.status === 'EXCEEDED' && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              backgroundColor: '#F44336',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 2,
            }}
          >
            <ErrorIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
        )}
        {budget.status === 'WARNING' && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              backgroundColor: '#FF9800',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 2,
            }}
          >
            <WarningIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
        )}

        {/* Header: Category and Period */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryColorBadge color={budget.categoryColor} />
            <Typography variant="h6" component="div">
              {budget.categoryName}
            </Typography>
            {/* Budget Type Chip */}
            <Chip
              label={budget.type}
              size="small"
              sx={{
                backgroundColor: budgetTypeColor,
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          </Box>
          <Chip
            label={statusInfo.label}
            color={statusInfo.color}
            size="small"
            sx={isAlertStatus ? { fontWeight: 'bold' } : undefined}
          />
        </Box>

        {/* Period and Account Display */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {formatBudgetPeriod(budget.startDate, budget.periodType)}
          {budget.accountName && ` • ${budget.accountName}`}
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
              {budget.type === 'INCOME' ? 'Received' : 'Spent'}
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
              {new Date(budget.startDate).toLocaleDateString()}
              {budget.endDate ? ` - ${new Date(budget.endDate).toLocaleDateString()}` : ' (ongoing)'}
            </Typography>

            {budget.periodType && budget.interval && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Recurrence
                </Typography>
                <Typography variant="body2">
                  Every {budget.interval} {budget.interval === 1 ? budget.periodType.toLowerCase() : `${budget.periodType.toLowerCase()}s`}
                </Typography>
              </Box>
            )}

            {budget.accountName && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Account
                </Typography>
                <Typography variant="body2">{budget.accountName}</Typography>
              </Box>
            )}

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

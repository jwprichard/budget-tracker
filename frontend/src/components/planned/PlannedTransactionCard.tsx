/**
 * PlannedTransactionCard Component
 * Displays a planned transaction template as a card
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RepeatIcon from '@mui/icons-material/Repeat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { PlannedTransactionTemplate, BudgetPeriod } from '../../types/plannedTransaction.types';
import { format } from 'date-fns';

interface PlannedTransactionCardProps {
  template: PlannedTransactionTemplate;
  onEdit: (template: PlannedTransactionTemplate) => void;
  onDelete: (template: PlannedTransactionTemplate) => void;
}

const formatFrequency = (periodType: BudgetPeriod, interval: number): string => {
  const periodLabels: Record<BudgetPeriod, [string, string]> = {
    DAILY: ['day', 'days'],
    WEEKLY: ['week', 'weeks'],
    FORTNIGHTLY: ['fortnight', 'fortnights'],
    MONTHLY: ['month', 'months'],
    ANNUALLY: ['year', 'years'],
  };
  const [singular, plural] = periodLabels[periodType];
  if (interval === 1) {
    return periodType === 'DAILY' ? 'Daily' :
           periodType === 'WEEKLY' ? 'Weekly' :
           periodType === 'FORTNIGHTLY' ? 'Fortnightly' :
           periodType === 'MONTHLY' ? 'Monthly' : 'Annually';
  }
  return `Every ${interval} ${interval === 1 ? singular : plural}`;
};

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  }).format(Math.abs(amount));
};

export const PlannedTransactionCard: React.FC<PlannedTransactionCardProps> = ({
  template,
  onEdit,
  onDelete,
}) => {
  const isIncome = template.type === 'INCOME';
  const isTransfer = template.type === 'TRANSFER';

  const getTypeIcon = () => {
    if (isTransfer) return <SwapHorizIcon sx={{ color: 'info.main' }} />;
    if (isIncome) return <TrendingUpIcon sx={{ color: 'success.main' }} />;
    return <TrendingDownIcon sx={{ color: 'error.main' }} />;
  };

  const getAmountColor = () => {
    if (isTransfer) return 'info.main';
    if (isIncome) return 'success.main';
    return 'error.main';
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getTypeIcon()}
            <Typography variant="h6" component="div" noWrap sx={{ maxWidth: 200 }}>
              {template.name}
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{ color: getAmountColor(), fontWeight: 'bold' }}
          >
            {isIncome ? '+' : isTransfer ? '' : '-'}{formatAmount(template.amount)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <RepeatIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {formatFrequency(template.periodType, template.interval)}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Account: {template.accountName}
          {isTransfer && template.transferToAccountName && (
            <> → {template.transferToAccountName}</>
          )}
        </Typography>

        {template.categoryName && (
          <Chip
            label={template.categoryName}
            size="small"
            sx={{
              bgcolor: template.categoryColor || 'grey.300',
              color: 'white',
              mt: 1,
            }}
          />
        )}

        {template.nextOccurrence && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Next: {format(new Date(template.nextOccurrence), 'MMM d, yyyy')}
          </Typography>
        )}

        {template.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, fontStyle: 'italic' }}
            noWrap
          >
            {template.description}
          </Typography>
        )}

        <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
          {!template.isActive && (
            <Chip label="Inactive" size="small" color="warning" />
          )}
          {template.autoMatchEnabled && (
            <Chip label="Auto-match" size="small" variant="outlined" />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(template)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => onDelete(template)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default PlannedTransactionCard;

/**
 * MatchReviewQueue Component
 * Displays pending match suggestions for user review
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  LinearProgress,
  Collapse,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  SwapHoriz as TransferIcon,
  Event as EventIcon,
  AccountBalance as AccountIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { usePendingMatches, useConfirmMatch, useDismissMatch } from '../../hooks/useMatching';
import { PendingMatch } from '../../types/matching.types';
import { formatCurrency } from '../../utils/formatters';
import { format } from 'date-fns';

interface MatchReviewQueueProps {
  limit?: number;
  onEmpty?: () => void;
}

interface MatchCardProps {
  match: PendingMatch;
  onConfirm: () => void;
  onDismiss: () => void;
  isConfirming: boolean;
  isDismissing: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onConfirm,
  onDismiss,
  isConfirming,
  isDismissing,
}) => {
  const [expanded, setExpanded] = useState(false);

  const { transaction, plannedTransaction, confidence, reasons } = match;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INCOME':
        return <IncomeIcon sx={{ color: 'success.main' }} />;
      case 'EXPENSE':
        return <ExpenseIcon sx={{ color: 'error.main' }} />;
      case 'TRANSFER':
        return <TransferIcon sx={{ color: 'info.main' }} />;
      default:
        return null;
    }
  };

  const getConfidenceColor = (conf: number): 'error' | 'warning' | 'success' => {
    if (conf >= 90) return 'success';
    if (conf >= 75) return 'warning';
    return 'error';
  };

  return (
    <Card elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        {/* Confidence Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Match Confidence
            </Typography>
            <Chip
              label={`${confidence}%`}
              size="small"
              color={getConfidenceColor(confidence)}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={confidence}
            color={getConfidenceColor(confidence)}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* Transaction Details */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {/* Actual Transaction */}
          <Box sx={{ flex: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="overline" color="text.secondary" display="block">
              Actual Transaction
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {getTypeIcon(transaction.type)}
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {transaction.description}
              </Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: transaction.type === 'INCOME' ? 'success.main' : 'error.main',
                fontWeight: 700,
              }}
            >
              {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EventIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(transaction.date), 'MMM d, yyyy')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccountIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {transaction.account.name}
                </Typography>
              </Box>
              {transaction.category && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CategoryIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Chip
                    label={transaction.category.name}
                    size="small"
                    sx={{
                      height: 20,
                      bgcolor: transaction.category.color,
                      color: 'white',
                      '& .MuiChip-label': { px: 1, fontSize: '0.7rem' },
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>

          {/* Planned Transaction */}
          <Box sx={{ flex: 1, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
            <Typography variant="overline" color="text.secondary" display="block">
              Planned Transaction
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {getTypeIcon(plannedTransaction.type)}
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {plannedTransaction.name}
              </Typography>
              {plannedTransaction.isVirtual && (
                <Chip label="Virtual" size="small" variant="outlined" sx={{ height: 20 }} />
              )}
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: plannedTransaction.type === 'INCOME' ? 'success.main' : 'error.main',
                fontWeight: 700,
              }}
            >
              {plannedTransaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(plannedTransaction.amount))}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EventIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Expected: {format(new Date(plannedTransaction.expectedDate), 'MMM d, yyyy')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccountIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {plannedTransaction.accountName}
                </Typography>
              </Box>
              {plannedTransaction.categoryName && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CategoryIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {plannedTransaction.categoryName}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Match Reasons (collapsible) */}
        <Box sx={{ mb: 2 }}>
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ textTransform: 'none' }}
          >
            {expanded ? 'Hide' : 'Show'} match reasons ({reasons.length})
          </Button>
          <Collapse in={expanded}>
            <List dense sx={{ mt: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              {reasons.map((reason, idx) => (
                <ListItem key={idx}>
                  <ListItemText
                    primary={reason}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Tooltip title="Dismiss this match suggestion">
            <span>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={onDismiss}
                disabled={isDismissing || isConfirming}
              >
                {isDismissing ? 'Dismissing...' : 'Dismiss'}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Confirm this match">
            <span>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={onConfirm}
                disabled={isConfirming || isDismissing}
              >
                {isConfirming ? 'Confirming...' : 'Confirm Match'}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

export const MatchReviewQueue: React.FC<MatchReviewQueueProps> = ({
  limit = 10,
  onEmpty,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: pendingMatches, isLoading, error, refetch } = usePendingMatches({ limit });
  const confirmMutation = useConfirmMatch();
  const dismissMutation = useDismissMatch();

  const handleConfirm = async (match: PendingMatch) => {
    setProcessingId(match.id);
    try {
      await confirmMutation.mutateAsync({
        transactionId: match.transactionId,
        plannedTransactionId: match.plannedTransactionId,
      });
    } catch (err) {
      console.error('Failed to confirm match:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (match: PendingMatch) => {
    setProcessingId(match.id);
    try {
      await dismissMutation.mutateAsync({
        transactionId: match.transactionId,
        plannedTransactionId: match.plannedTransactionId,
      });
    } catch (err) {
      console.error('Failed to dismiss match:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // Call onEmpty when queue is empty
  React.useEffect(() => {
    if (!isLoading && pendingMatches && pendingMatches.length === 0 && onEmpty) {
      onEmpty();
    }
  }, [isLoading, pendingMatches, onEmpty]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load pending matches: {error.message}
      </Alert>
    );
  }

  if (!pendingMatches || pendingMatches.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          All Caught Up!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No pending match suggestions to review. New suggestions will appear here
          when transactions match your planned transactions.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {pendingMatches.length} match{pendingMatches.length !== 1 ? 'es' : ''} to review
        </Typography>
        <Button size="small" onClick={() => refetch()}>
          Refresh
        </Button>
      </Box>

      {pendingMatches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          onConfirm={() => handleConfirm(match)}
          onDismiss={() => handleDismiss(match)}
          isConfirming={processingId === match.id && confirmMutation.isPending}
          isDismissing={processingId === match.id && dismissMutation.isPending}
        />
      ))}
    </Box>
  );
};

export default MatchReviewQueue;

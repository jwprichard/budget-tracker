import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LinkIcon from '@mui/icons-material/Link';
import {
  getReviewTransactions,
  approveTransaction,
  rejectTransaction,
  type ExternalTransaction,
} from '../../services/sync.service';

interface TransactionReviewDialogProps {
  open: boolean;
  onClose: () => void;
  connectionId: string;
  onReviewComplete?: () => void;
}

/**
 * TransactionReviewDialog Component
 *
 * Shows transactions that need manual review for duplicate detection.
 * User can approve (import as new), reject (mark as duplicate), or link to existing transaction.
 *
 * @param open - Whether dialog is open
 * @param onClose - Close dialog callback
 * @param connectionId - Bank connection ID
 * @param onReviewComplete - Callback when all reviews are complete
 */
export const TransactionReviewDialog: React.FC<TransactionReviewDialogProps> = ({
  open,
  onClose,
  connectionId,
  onReviewComplete,
}) => {
  const [transactions, setTransactions] = useState<ExternalTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && connectionId) {
      fetchTransactions();
    }
  }, [open, connectionId]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await getReviewTransactions(connectionId);
      setTransactions(items);
    } catch (err) {
      console.error('Failed to fetch review transactions:', err);
      setError('Failed to load transactions for review');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transactionId: string) => {
    try {
      setProcessingId(transactionId);
      await approveTransaction(transactionId);
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));

      if (transactions.length === 1 && onReviewComplete) {
        onReviewComplete();
      }
    } catch (err) {
      console.error('Failed to approve transaction:', err);
      setError('Failed to approve transaction');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (transactionId: string) => {
    try {
      setProcessingId(transactionId);
      await rejectTransaction(transactionId);
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));

      if (transactions.length === 1 && onReviewComplete) {
        onReviewComplete();
      }
    } catch (err) {
      console.error('Failed to reject transaction:', err);
      setError('Failed to reject transaction');
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Review Transactions ({transactions.length})
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && transactions.length === 0 && (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography color="text.secondary">
              No transactions need review
            </Typography>
          </Box>
        )}

        {!loading && transactions.length > 0 && (
          <List>
            {transactions.map((transaction) => (
              <React.Fragment key={transaction.id}>
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    py: 2,
                  }}
                >
                  {/* Transaction Info */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1">
                        {transaction.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(transaction.date)} • {transaction.account.externalName}
                      </Typography>
                      {transaction.merchant && (
                        <Typography variant="caption" color="text.secondary">
                          {transaction.merchant}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" color={transaction.amount < 0 ? 'error.main' : 'success.main'}>
                        {formatCurrency(transaction.amount)}
                      </Typography>
                      {transaction.duplicateConfidence && (
                        <Chip
                          label={`${transaction.duplicateConfidence}% match`}
                          size="small"
                          color={transaction.duplicateConfidence >= 90 ? 'error' : 'warning'}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Potential Duplicate Info */}
                  {transaction.potentialDuplicate && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Possible duplicate found:</strong>
                      </Typography>
                      <Typography variant="body2">
                        {transaction.potentialDuplicate.description} •{' '}
                        {formatDate(transaction.potentialDuplicate.date)}
                      </Typography>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleApprove(transaction.id)}
                      disabled={processingId === transaction.id}
                    >
                      {processingId === transaction.id ? 'Processing...' : 'Import as New'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<CancelIcon />}
                      onClick={() => handleReject(transaction.id)}
                      disabled={processingId === transaction.id}
                    >
                      Mark as Duplicate
                    </Button>
                  </Box>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

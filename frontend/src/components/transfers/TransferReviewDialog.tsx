/**
 * TransferReviewDialog Component
 * Dialog for reviewing and confirming potential transfer pairs detected from bank sync
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
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
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  SwapHoriz as TransferIcon,
  Event as EventIcon,
  AccountBalance as AccountIcon,
  ArrowForward as ArrowIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  usePendingTransfers,
  useConfirmTransfer,
  useDismissTransfer,
  useDetectTransfers,
} from '../../hooks/usePotentialTransfers';
import { PotentialTransfer } from '../../types/potentialTransfer.types';
import { formatCurrency } from '../../utils/formatters';
import { format } from 'date-fns';

interface TransferReviewDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TransferCardProps {
  transfer: PotentialTransfer;
  onConfirm: () => void;
  onDismiss: () => void;
  isConfirming: boolean;
  isDismissing: boolean;
}

const TransferCard: React.FC<TransferCardProps> = ({
  transfer,
  onConfirm,
  onDismiss,
  isConfirming,
  isDismissing,
}) => {
  const { sourceTransaction, targetTransaction, confidence, amount, date } = transfer;

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
              Transfer Confidence
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

        {/* Transfer Summary */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TransferIcon sx={{ color: 'info.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {formatCurrency(amount)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            on {format(new Date(date), 'MMM d, yyyy')}
          </Typography>
        </Box>

        {/* Transaction Details */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'stretch' }}>
          {/* Source Transaction (Outgoing) */}
          <Box sx={{ flex: 1, p: 2, bgcolor: 'error.50', borderRadius: 1 }}>
            <Typography variant="overline" color="error.main" display="block" sx={{ fontWeight: 600 }}>
              From (Outgoing)
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              {sourceTransaction.description}
            </Typography>
            {sourceTransaction.merchant && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {sourceTransaction.merchant}
              </Typography>
            )}
            <Typography
              variant="h6"
              sx={{ color: 'error.main', fontWeight: 700 }}
            >
              {formatCurrency(sourceTransaction.amount)}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EventIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(sourceTransaction.date), 'MMM d, yyyy')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccountIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {sourceTransaction.accountName}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Arrow */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ArrowIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
          </Box>

          {/* Target Transaction (Incoming) */}
          <Box sx={{ flex: 1, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
            <Typography variant="overline" color="success.main" display="block" sx={{ fontWeight: 600 }}>
              To (Incoming)
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              {targetTransaction.description}
            </Typography>
            {targetTransaction.merchant && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {targetTransaction.merchant}
              </Typography>
            )}
            <Typography
              variant="h6"
              sx={{ color: 'success.main', fontWeight: 700 }}
            >
              {formatCurrency(targetTransaction.amount)}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EventIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(targetTransaction.date), 'MMM d, yyyy')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccountIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {targetTransaction.accountName}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Tooltip title="Keep as separate transactions">
            <span>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={onDismiss}
                disabled={isDismissing || isConfirming}
              >
                {isDismissing ? 'Dismissing...' : 'Not a Transfer'}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Combine into a single transfer transaction">
            <span>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={onConfirm}
                disabled={isConfirming || isDismissing}
              >
                {isConfirming ? 'Confirming...' : 'Confirm Transfer'}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

export const TransferReviewDialog: React.FC<TransferReviewDialogProps> = ({
  open,
  onClose,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [daysBack, setDaysBack] = useState<number>(30);

  const { data: pendingTransfers, isLoading, error, refetch } = usePendingTransfers(open);
  const confirmMutation = useConfirmTransfer();
  const dismissMutation = useDismissTransfer();
  const detectMutation = useDetectTransfers();

  const [isConfirmingAll, setIsConfirmingAll] = useState(false);

  const handleDetect = async () => {
    try {
      const result = await detectMutation.mutateAsync({ daysBack });
      if (result.detected > 0) {
        refetch();
      }
    } catch (err) {
      console.error('Failed to detect transfers:', err);
    }
  };

  const handleConfirmAll = async () => {
    if (!pendingTransfers || pendingTransfers.length === 0) return;

    setIsConfirmingAll(true);
    try {
      for (const transfer of pendingTransfers) {
        await confirmMutation.mutateAsync(transfer.id);
      }
    } catch (err) {
      console.error('Failed to confirm all transfers:', err);
    } finally {
      setIsConfirmingAll(false);
    }
  };

  const handleConfirm = async (transfer: PotentialTransfer) => {
    setProcessingId(transfer.id);
    try {
      await confirmMutation.mutateAsync(transfer.id);
    } catch (err) {
      console.error('Failed to confirm transfer:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (transfer: PotentialTransfer) => {
    setProcessingId(transfer.id);
    try {
      await dismissMutation.mutateAsync(transfer.id);
    } catch (err) {
      console.error('Failed to dismiss transfer:', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh', maxHeight: '90vh' },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TransferIcon color="primary" />
          <Typography variant="h6">Review Potential Transfers</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Scan for Transfers Section */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Scan for Transfers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Scan your existing transactions to detect potential transfer pairs.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={daysBack}
                label="Time Period"
                onChange={(e: SelectChangeEvent<number>) => setDaysBack(Number(e.target.value))}
              >
                <MenuItem value={7}>Last 7 days</MenuItem>
                <MenuItem value={14}>Last 14 days</MenuItem>
                <MenuItem value={30}>Last 30 days</MenuItem>
                <MenuItem value={60}>Last 60 days</MenuItem>
                <MenuItem value={90}>Last 90 days</MenuItem>
                <MenuItem value={180}>Last 6 months</MenuItem>
                <MenuItem value={365}>Last year</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={detectMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
              onClick={handleDetect}
              disabled={detectMutation.isPending}
            >
              {detectMutation.isPending ? 'Scanning...' : 'Scan'}
            </Button>
            {detectMutation.isSuccess && (
              <Typography variant="body2" color="success.main">
                Found {detectMutation.data?.detected || 0} potential transfer{detectMutation.data?.detected !== 1 ? 's' : ''}
              </Typography>
            )}
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            Failed to load potential transfers: {error.message}
          </Alert>
        ) : !pendingTransfers || pendingTransfers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Transfers to Review
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No potential transfer pairs detected. When you sync your bank accounts,
              matching debit and credit transactions will appear here for review.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {pendingTransfers.length} potential transfer{pendingTransfers.length !== 1 ? 's' : ''} to review
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={isConfirmingAll ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
                  onClick={handleConfirmAll}
                  disabled={isConfirmingAll || processingId !== null}
                >
                  {isConfirmingAll ? 'Confirming...' : 'Accept All'}
                </Button>
                <Button size="small" onClick={() => refetch()}>
                  Refresh
                </Button>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              These transaction pairs look like transfers between your accounts.
              Confirming will combine them into a single transfer transaction.
            </Alert>

            {pendingTransfers.map((transfer) => (
              <TransferCard
                key={transfer.id}
                transfer={transfer}
                onConfirm={() => handleConfirm(transfer)}
                onDismiss={() => handleDismiss(transfer)}
                isConfirming={processingId === transfer.id && confirmMutation.isPending}
                isDismissing={processingId === transfer.id && dismissMutation.isPending}
              />
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransferReviewDialog;

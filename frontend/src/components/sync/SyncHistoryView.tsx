import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SyncIcon from '@mui/icons-material/Sync';
import PendingIcon from '@mui/icons-material/Pending';
import { getSyncHistory, getSyncTransactions, type SyncHistory, type ExternalTransaction } from '../../services/sync.service';
import { formatCurrency } from '../../utils/formatters';

interface SyncHistoryViewProps {
  connectionId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

/**
 * SyncHistoryView Component
 *
 * Displays sync history in a table with pagination.
 * Shows sync status, results, and timing information.
 *
 * @param connectionId - Filter by connection ID (optional)
 * @param autoRefresh - Enable auto-refresh
 * @param refreshInterval - Refresh interval in ms (default: 15000)
 */
export const SyncHistoryView: React.FC<SyncHistoryViewProps> = ({
  connectionId,
  autoRefresh = false,
  refreshInterval = 15000,
}) => {
  const [history, setHistory] = useState<SyncHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Dialog state for viewing transactions
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSyncId, setSelectedSyncId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<ExternalTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();

    if (autoRefresh) {
      // Auto-refresh history at specified interval (default 15s)
      // This is only enabled when a sync is in progress
      const intervalId = setInterval(fetchHistory, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [connectionId, page, pageSize, autoRefresh, refreshInterval]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSyncHistory(connectionId, page + 1, pageSize);
      setHistory(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to fetch sync history:', err);
      setError('Failed to load sync history');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowClick = async (syncHistoryId: string) => {
    setSelectedSyncId(syncHistoryId);
    setDialogOpen(true);
    setLoadingTransactions(true);
    setTransactionsError(null);

    try {
      const response = await getSyncTransactions(syncHistoryId);
      setTransactions(response.items);
    } catch (err) {
      console.error('Failed to fetch sync transactions:', err);
      setTransactionsError('Failed to load transactions');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSyncId(null);
    setTransactions([]);
    setTransactionsError(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'FAILED':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'IN_PROGRESS':
        return <SyncIcon color="primary" fontSize="small" />;
      case 'PENDING':
        return <PendingIcon color="action" fontSize="small" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'primary' | 'default' => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'IN_PROGRESS':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (startedAt: string, completedAt?: string) => {
    if (!completedAt) return '-';
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    return `${seconds}s`;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Sync History
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && history.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : history.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography color="text.secondary">
              No sync history available
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Started</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell align="right">Accounts</TableCell>
                    <TableCell align="right">Fetched</TableCell>
                    <TableCell align="right">Imported</TableCell>
                    <TableCell align="right">Duplicates</TableCell>
                    <TableCell align="right">Review</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                    <TableRow
                      key={item.id}
                      hover
                      onClick={() => handleRowClick(item.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(item.status)}
                          <Chip
                            label={item.status}
                            size="small"
                            color={getStatusColor(item.status)}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(item.startedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {calculateDuration(item.startedAt, item.completedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{item.accountsSynced}</TableCell>
                      <TableCell align="right">{item.transactionsFetched}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main">
                          {item.transactionsImported}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="warning.main">
                          {item.duplicatesDetected}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {item.needsReview > 0 ? (
                          <Typography variant="body2" color="error.main">
                            {item.needsReview}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            0
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={pageSize}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </>
        )}
      </CardContent>

      {/* Transactions Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Sync Transactions</DialogTitle>
        <DialogContent>
          {loadingTransactions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : transactionsError ? (
            <Alert severity="error">{transactionsError}</Alert>
          ) : transactions.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ p: 4 }}>
              No transactions found for this sync
            </Typography>
          ) : (
            <List>
              {transactions.map((tx, index) => (
                <React.Fragment key={tx.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1">{tx.description}</Typography>
                          <Typography
                            variant="body1"
                            fontWeight="bold"
                            color={tx.amount < 0 ? 'error.main' : 'success.main'}
                          >
                            {formatCurrency(tx.amount)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(tx.date).toLocaleDateString('en-NZ', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                            {' • '}
                            {tx.linkedAccount?.externalName}
                            {tx.merchant && ` • ${tx.merchant}`}
                          </Typography>
                          {tx.isDuplicate && (
                            <Chip
                              label="Duplicate"
                              size="small"
                              color="warning"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                          {tx.needsReview && (
                            <Chip
                              label="Needs Review"
                              size="small"
                              color="error"
                              sx={{ mt: 0.5, ml: 0.5 }}
                            />
                          )}
                          {tx.localTransaction && (
                            <Chip
                              label="Imported"
                              size="small"
                              color="success"
                              sx={{ mt: 0.5, ml: 0.5 }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < transactions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

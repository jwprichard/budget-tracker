/**
 * MatchReview Page
 * Page for reviewing and managing transaction matches
 */

import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Undo as UndoIcon,
  CheckCircle as CheckIcon,
  PersonOutline as ManualIcon,
  AutoAwesome as AutoIcon,
} from '@mui/icons-material';
import { MatchReviewQueue } from '../components/matching/MatchReviewQueue';
import { useMatchHistory, useUnmatch } from '../hooks/useMatching';
import { MatchMethod } from '../types/matching.types';
import { formatCurrency } from '../utils/formatters';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
      {value === index && children}
    </Box>
  );
};

export const MatchReview: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: historyData, isLoading: historyLoading, error: historyError } = useMatchHistory({
    limit: rowsPerPage,
    offset: page * rowsPerPage,
  });

  const unmatchMutation = useUnmatch();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleUnmatch = async (matchId: string) => {
    try {
      await unmatchMutation.mutateAsync(matchId);
    } catch (err) {
      console.error('Failed to unmatch:', err);
    }
  };

  const getMethodIcon = (method: MatchMethod) => {
    switch (method) {
      case MatchMethod.AUTO:
        return (
          <Tooltip title="Auto-matched">
            <AutoIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          </Tooltip>
        );
      case MatchMethod.AUTO_REVIEWED:
        return (
          <Tooltip title="Auto-suggested, user confirmed">
            <CheckIcon sx={{ fontSize: 18, color: 'success.main' }} />
          </Tooltip>
        );
      case MatchMethod.MANUAL:
        return (
          <Tooltip title="Manually matched">
            <ManualIcon sx={{ fontSize: 18, color: 'info.main' }} />
          </Tooltip>
        );
      default:
        return null;
    }
  };

  const getMethodLabel = (method: MatchMethod) => {
    switch (method) {
      case MatchMethod.AUTO:
        return 'Auto';
      case MatchMethod.AUTO_REVIEWED:
        return 'Reviewed';
      case MatchMethod.MANUAL:
        return 'Manual';
      default:
        return method;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Transaction Matching
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review suggested matches between your actual transactions and planned transactions.
          Confirm matches to track your planned spending against actual transactions.
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Pending Review" />
          <Tab label="Match History" />
        </Tabs>
      </Paper>

      {/* Pending Review Tab */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Pending Matches
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            These transactions have been matched with planned transactions but need your confirmation.
            Review each match and confirm or dismiss as appropriate.
          </Typography>
          <MatchReviewQueue limit={20} />
        </Paper>
      </TabPanel>

      {/* Match History Tab */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Match History
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            View all confirmed matches between actual and planned transactions.
            You can undo matches if needed.
          </Typography>

          {historyLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {historyError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load match history: {historyError.message}
            </Alert>
          )}

          {!historyLoading && !historyError && historyData && (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Transaction</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Expected Date</TableCell>
                      <TableCell>Expected Amount</TableCell>
                      <TableCell align="center">Confidence</TableCell>
                      <TableCell align="center">Method</TableCell>
                      <TableCell>Matched On</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyData.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No match history yet. Matches will appear here once you confirm them.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      historyData.items.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.transaction.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.transaction.accountName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {format(new Date(item.transaction.date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: item.transaction.amount >= 0 ? 'success.main' : 'error.main',
                              }}
                            >
                              {item.transaction.amount >= 0 ? '+' : ''}
                              {formatCurrency(item.transaction.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {format(new Date(item.plannedExpectedDate), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: item.plannedAmount >= 0 ? 'success.main' : 'error.main',
                              }}
                            >
                              {item.plannedAmount >= 0 ? '+' : ''}
                              {formatCurrency(item.plannedAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${item.matchConfidence}%`}
                              size="small"
                              color={
                                item.matchConfidence >= 90
                                  ? 'success'
                                  : item.matchConfidence >= 75
                                  ? 'warning'
                                  : 'default'
                              }
                              sx={{ minWidth: 50 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              {getMethodIcon(item.matchMethod)}
                              <Typography variant="caption">
                                {getMethodLabel(item.matchMethod)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {format(new Date(item.matchedAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Undo this match">
                              <IconButton
                                size="small"
                                onClick={() => handleUnmatch(item.id)}
                                disabled={unmatchMutation.isPending}
                              >
                                <UndoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {historyData.items.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[10, 25, 50]}
                  component="div"
                  count={historyData.pagination.total}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              )}
            </>
          )}
        </Paper>
      </TabPanel>
    </Container>
  );
};

export default MatchReview;

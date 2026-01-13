import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Chip,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DayCellContentArg } from '@fullcalendar/core';
import { DateClickArg } from '@fullcalendar/interaction';
import { useDailyBalances } from '../../hooks/useAnalytics';
import { DailyBalance, AccountDailyBalance } from '../../types/analytics.types';
import { formatCurrency } from '../../utils/formatters';

interface CalendarViewProps {
  startDate: string;
  endDate: string;
  accountIds?: string[];
}

/**
 * CalendarView Component
 * Displays daily balances in a calendar format with color-coded indicators
 */
export const CalendarView: React.FC<CalendarViewProps> = ({
  startDate,
  endDate,
  accountIds,
}) => {
  const [selectedDate, setSelectedDate] = useState<DailyBalance | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch daily balances
  const { data, isLoading, error } = useDailyBalances({
    startDate,
    endDate,
    accountIds,
  });

  // Create a map for quick date lookups
  const balanceMap = useMemo(() => {
    if (!data?.dailyBalances) return new Map<string, DailyBalance>();
    const map = new Map<string, DailyBalance>();
    data.dailyBalances.forEach((balance) => {
      map.set(balance.date, balance);
    });
    return map;
  }, [data]);

  // Handle date click
  const handleDateClick = useCallback(
    (arg: DateClickArg) => {
      const dateStr = arg.dateStr;
      const balance = balanceMap.get(dateStr);
      if (balance) {
        setSelectedDate(balance);
        setDialogOpen(true);
      }
    },
    [balanceMap]
  );

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedDate(null);
  };

  // Custom day cell content renderer
  const dayCellContent = useCallback(
    (arg: DayCellContentArg) => {
      const isoString = arg.date.toISOString();
      const dateStr = isoString.split('T')[0] || isoString;
      const balance = balanceMap.get(dateStr);

      if (!balance) {
        return (
          <Box sx={{ textAlign: 'center', p: 1 }}>
            <Typography variant="body2">{arg.dayNumberText || ''}</Typography>
          </Box>
        );
      }

      // Determine color based on balance thresholds
      const getBalanceColor = (amount: number): string => {
        if (amount >= 1000) return '#4caf50'; // Green
        if (amount >= 0) return '#ff9800'; // Orange
        return '#f44336'; // Red
      };

      const balanceColor = getBalanceColor(balance.balance);

      return (
        <Box
          sx={{
            textAlign: 'center',
            p: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: `${balanceColor}15`,
            borderLeft: `4px solid ${balanceColor}`,
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: `${balanceColor}25`,
            },
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {arg.dayNumberText || ''}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: balanceColor,
              fontWeight: 'bold',
              fontSize: '0.7rem',
            }}
          >
            {formatCurrency(balance.balance)}
          </Typography>
        </Box>
      );
    },
    [balanceMap]
  );

  // Get transaction type color
  const getTransactionColor = (type: string): 'success' | 'error' | 'info' => {
    switch (type) {
      case 'INCOME':
        return 'success';
      case 'EXPENSE':
        return 'error';
      case 'TRANSFER':
        return 'info';
      default:
        return 'info';
    }
  };

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
        Error loading calendar data: {error.message}
      </Alert>
    );
  }

  return (
    <>
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Balance Calendar
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Click on any date to view detailed transactions
          </Typography>

          <Box sx={{ mt: 2 }}>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek',
              }}
              dateClick={handleDateClick}
              dayCellContent={dayCellContent}
              height="auto"
              fixedWeekCount={false}
              validRange={{
                start: startDate,
                end: endDate,
              }}
            />
          </Box>

          {/* Legend */}
          <Stack direction="row" spacing={2} sx={{ mt: 2, justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: '#4caf50',
                  borderRadius: 0.5,
                }}
              />
              <Typography variant="caption">Healthy ≥ $1,000</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: '#ff9800',
                  borderRadius: 0.5,
                }}
              />
              <Typography variant="caption">Low $0-$999</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: '#f44336',
                  borderRadius: 0.5,
                }}
              />
              <Typography variant="caption">Negative &lt; $0</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Date Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        {selectedDate && (
          <>
            <DialogTitle>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6">
                  {new Date(selectedDate.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
                <IconButton onClick={handleDialogClose} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
              <Typography variant="h5" color="primary" sx={{ mt: 1 }}>
                Total Balance: {formatCurrency(selectedDate.balance)}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              {selectedDate.accounts.map((account: AccountDailyBalance) => (
                <Box key={account.accountId} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {account.accountName}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Balance: {formatCurrency(account.balance)}
                  </Typography>

                  {account.transactions.length > 0 ? (
                    <List dense>
                      {account.transactions.map((tx) => (
                        <ListItem
                          key={tx.id}
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1,
                          }}
                        >
                          <ListItemText
                            primary={tx.description}
                            secondary={
                              <Tooltip title={tx.type}>
                                <Chip
                                  label={formatCurrency(tx.amount)}
                                  color={getTransactionColor(tx.type)}
                                  size="small"
                                  sx={{ mt: 0.5 }}
                                />
                              </Tooltip>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontStyle: 'italic' }}
                    >
                      No transactions on this day
                    </Typography>
                  )}
                </Box>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDialogClose}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

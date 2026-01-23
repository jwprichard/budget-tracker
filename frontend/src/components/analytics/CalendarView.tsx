import { useState, useMemo, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
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
import { DayCellContentArg, DatesSetArg } from '@fullcalendar/core';
import { DateClickArg } from '@fullcalendar/interaction';
import { useDailyBalances } from '../../hooks/useAnalytics';
import { useForecast } from '../../hooks/useForecast';
import { DailyBalance, AccountDailyBalance } from '../../types/analytics.types';
import { ImplicitSpendSummary } from '../../types/forecast.types';
import { formatCurrency, formatDateForInput } from '../../utils/formatters';

// Helper to get today's date as YYYY-MM-DD in local timezone
const getTodayStr = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Combined data structure for calendar display
interface CalendarDayData {
  date: string;
  balance: number;
  isProjected: boolean;
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    type: string;
    isPlanned?: boolean;
    accountName?: string;
  }>;
  implicitSpend?: {
    totalAmount: number;
    items: ImplicitSpendSummary[];
  };
  hasLowBalance?: boolean;
}

interface CalendarViewProps {
  accountIds?: string[];
  hideToolbar?: boolean;
  onTitleChange?: (title: string) => void;
  onViewChange?: (view: string) => void;
}

export interface CalendarViewHandle {
  prev: () => void;
  next: () => void;
  today: () => void;
  changeView: (view: string) => void;
  getTitle: () => string;
  getView: () => string;
}

/**
 * CalendarView Component
 * Displays daily balances in a calendar format with color-coded indicators
 * Automatically loads transactions for the displayed month
 */
export const CalendarView = forwardRef<CalendarViewHandle, CalendarViewProps>(({
  accountIds,
  hideToolbar = false,
  onTitleChange,
  onViewChange,
}, ref) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedDate, setSelectedDate] = useState<DailyBalance | null>(null);
  const [selectedForecast, setSelectedForecast] = useState<CalendarDayData | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Expose navigation methods to parent via ref
  useImperativeHandle(ref, () => ({
    prev: () => {
      if (calendarRef.current) {
        const api = calendarRef.current.getApi();
        api.prev();
        onTitleChange?.(api.view.title);
      }
    },
    next: () => {
      if (calendarRef.current) {
        const api = calendarRef.current.getApi();
        api.next();
        onTitleChange?.(api.view.title);
      }
    },
    today: () => {
      if (calendarRef.current) {
        const api = calendarRef.current.getApi();
        api.today();
        onTitleChange?.(api.view.title);
      }
    },
    changeView: (view: string) => {
      if (calendarRef.current) {
        const api = calendarRef.current.getApi();
        api.changeView(view);
        onViewChange?.(view);
        onTitleChange?.(api.view.title);
      }
    },
    getTitle: () => {
      if (calendarRef.current) {
        return calendarRef.current.getApi().view.title;
      }
      return '';
    },
    getView: () => {
      if (calendarRef.current) {
        return calendarRef.current.getApi().view.type;
      }
      return 'dayGridMonth';
    },
  }), [onTitleChange, onViewChange]);

  // Track the current calendar date range
  const [calendarRange, setCalendarRange] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: formatDateForInput(firstDay),
      endDate: formatDateForInput(lastDay),
    };
  });

  // Handle calendar date range changes (when user navigates months)
  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setCalendarRange({
      startDate: formatDateForInput(arg.start),
      endDate: formatDateForInput(new Date(arg.end.getTime() - 1)), // Subtract 1 day since end is exclusive
    });

    // Notify parent of title change
    if (calendarRef.current && onTitleChange) {
      onTitleChange(calendarRef.current.getApi().view.title);
    }
  }, [onTitleChange]);

  const todayStr = useMemo(() => getTodayStr(), []);

  // Determine if the calendar range includes past/present dates and future dates
  const hasPastDates = useMemo(() => {
    return calendarRange.startDate <= todayStr;
  }, [calendarRange.startDate, todayStr]);

  const hasFutureDates = useMemo(() => {
    return calendarRange.endDate > todayStr;
  }, [calendarRange.endDate, todayStr]);

  // Calculate the actual end date for fetching past data (min of calendar end and today)
  const actualDataEndDate = useMemo(() => {
    if (calendarRange.endDate <= todayStr) {
      return calendarRange.endDate;
    }
    return todayStr;
  }, [calendarRange.endDate, todayStr]);

  // Fetch daily balances for actual transactions (past/present) - only if we have past dates
  const { data: actualData, isLoading: actualLoading, error: actualError } = useDailyBalances(
    {
      startDate: calendarRange.startDate,
      endDate: actualDataEndDate,
      accountIds,
    },
    hasPastDates // Only fetch if viewing past/present dates
  );

  // Fetch forecast data for future dates (lazy loading - only if viewing future)
  const forecastStartDate = useMemo(() => {
    // Start forecast from tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDateForInput(tomorrow);
    return calendarRange.startDate > tomorrowStr ? calendarRange.startDate : tomorrowStr;
  }, [calendarRange.startDate]);

  // Convert dates to ISO format for the forecast API
  const forecastQuery = useMemo(() => {
    const startDateISO = new Date(forecastStartDate).toISOString();
    const endDateISO = new Date(calendarRange.endDate + 'T23:59:59').toISOString();
    return {
      startDate: startDateISO,
      endDate: endDateISO,
      accountIds: accountIds?.join(','),
    };
  }, [forecastStartDate, calendarRange.endDate, accountIds]);

  const { data: forecastData, isLoading: forecastLoading } = useForecast(
    forecastQuery,
    hasFutureDates // Only fetch if viewing future dates
  );

  const isLoading = (hasPastDates && actualLoading) || (hasFutureDates && forecastLoading);
  const error = actualError;

  // Create a combined map for quick date lookups
  const calendarDataMap = useMemo(() => {
    const map = new Map<string, CalendarDayData>();

    // Add actual transaction data
    if (actualData?.dailyBalances) {
      actualData.dailyBalances.forEach((balance) => {
        const allTransactions = balance.accounts.flatMap((account) =>
          account.transactions.map((tx) => ({
            id: tx.id,
            description: tx.description,
            amount: tx.amount,
            type: tx.type,
            isPlanned: false,
            accountName: account.accountName,
          }))
        );

        map.set(balance.date, {
          date: balance.date,
          balance: balance.balance,
          isProjected: false,
          transactions: allTransactions,
        });
      });
    }

    // Add forecast data for future dates
    if (forecastData?.dailyForecasts) {
      forecastData.dailyForecasts.forEach((forecast) => {
        // Only add if it's a future date (after today)
        if (forecast.date > todayStr) {
          const plannedTransactions = forecast.plannedTransactions.map((pt) => ({
            id: pt.id,
            description: pt.name,
            amount: pt.type === 'INCOME' ? Math.abs(pt.amount) : -Math.abs(pt.amount),
            type: pt.type,
            isPlanned: true,
            accountName: pt.accountName,
          }));

          // Aggregate implicit spend
          const implicitSpendTotal = forecast.implicitSpend.reduce((sum, item) => sum + item.amount, 0);

          map.set(forecast.date, {
            date: forecast.date,
            balance: forecast.totalBalance,
            isProjected: true,
            transactions: plannedTransactions,
            implicitSpend: implicitSpendTotal > 0 ? {
              totalAmount: implicitSpendTotal,
              items: forecast.implicitSpend,
            } : undefined,
            hasLowBalance: forecast.hasLowBalance,
          });
        }
      });
    }

    return map;
  }, [actualData, forecastData, todayStr]);

  // Keep the old balanceMap for dialog compatibility
  const balanceMap = useMemo(() => {
    if (!actualData?.dailyBalances) return new Map<string, DailyBalance>();
    const map = new Map<string, DailyBalance>();
    actualData.dailyBalances.forEach((balance) => {
      map.set(balance.date, balance);
    });
    return map;
  }, [actualData]);

  // Handle date click
  const handleDateClick = useCallback(
    (arg: DateClickArg) => {
      // Format date as YYYY-MM-DD using local timezone
      const year = arg.date.getFullYear();
      const month = String(arg.date.getMonth() + 1).padStart(2, '0');
      const day = String(arg.date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayData = calendarDataMap.get(dateStr);
      const balance = balanceMap.get(dateStr);

      // Show dialog if there's data for this date
      if (dayData || balance) {
        setSelectedDate(balance || null);
        setSelectedForecast(dayData || null);
        setSelectedDateStr(dateStr);
        setDialogOpen(true);
      }
    },
    [balanceMap, calendarDataMap]
  );

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedDate(null);
    setSelectedForecast(null);
    setSelectedDateStr('');
  };

  // Custom day cell content renderer
  const dayCellContent = useCallback(
    (arg: DayCellContentArg) => {
      // Format date as YYYY-MM-DD using local timezone
      const year = arg.date.getFullYear();
      const month = String(arg.date.getMonth() + 1).padStart(2, '0');
      const day = String(arg.date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayData = calendarDataMap.get(dateStr);

      if (!dayData) {
        return (
          <Box sx={{
            textAlign: 'center',
            p: 0.5,
            height: '180px',
          }}>
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

      // Get transaction color based on type
      const getTransactionColor = (type: string): string => {
        switch (type) {
          case 'INCOME':
            return '#4caf50';
          case 'EXPENSE':
            return '#f44336';
          case 'TRANSFER':
            return '#2196f3';
          default:
            return '#757575';
        }
      };

      const balanceColor = getBalanceColor(dayData.balance);

      // Calculate how many transaction slots we have (reserve 1 for implicit spend if present)
      const maxTransactions = dayData.implicitSpend ? 3 : 4;
      const displayTransactions = dayData.transactions.slice(0, maxTransactions);
      const remainingCount = dayData.transactions.length - maxTransactions + (dayData.implicitSpend ? 1 : 0);

      return (
        <Box
          sx={{
            height: '180px',
            p: 0.5,
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          {/* Day number */}
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ textAlign: 'right', mb: 0.5, fontSize: '0.75rem', flexShrink: 0 }}
          >
            {arg.dayNumberText || ''}
          </Typography>

          {/* Transaction bars */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.25, overflow: 'auto', minHeight: 0 }}>
            {displayTransactions.map((tx, index) => {
              const txColor = getTransactionColor(tx.type);
              const isPlanned = tx.isPlanned;
              return (
                <Box
                  key={`tx-${index}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: `${txColor}${isPlanned ? '15' : '20'}`,
                    borderLeft: isPlanned ? `2px dashed ${txColor}` : `2px solid ${txColor}`,
                    opacity: isPlanned ? 0.85 : 1,
                    px: 0.5,
                    py: 0.2,
                    minHeight: '16px',
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      mr: 0.5,
                      fontStyle: isPlanned ? 'italic' : 'normal',
                    }}
                  >
                    {tx.description.length > 20
                      ? `${tx.description.substring(0, 19)}...`
                      : tx.description}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      color: txColor,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatCurrency(Math.abs(tx.amount))}
                  </Typography>
                </Box>
              );
            })}

            {/* Implicit budget spending (aggregated) */}
            {dayData.implicitSpend && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(156, 39, 176, 0.12)',
                  borderLeft: '2px dashed #9c27b0',
                  opacity: 0.85,
                  px: 0.5,
                  py: 0.2,
                  minHeight: '16px',
                  flexShrink: 0,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    mr: 0.5,
                    fontStyle: 'italic',
                  }}
                >
                  Budget spending
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    color: '#9c27b0',
                    whiteSpace: 'nowrap',
                  }}
                >
                  -{formatCurrency(dayData.implicitSpend.totalAmount)}
                </Typography>
              </Box>
            )}

            {/* Show "more" indicator if items exceed limit */}
            {remainingCount > 0 && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.6rem',
                  textAlign: 'center',
                  color: 'text.secondary',
                  fontStyle: 'italic',
                  flexShrink: 0,
                }}
              >
                +{remainingCount} more
              </Typography>
            )}
          </Box>

          {/* Balance at bottom */}
          <Box
            sx={{
              mt: 0.5,
              pt: 0.5,
              px: 0.5,
              pb: 0.5,
              textAlign: 'right',
              flexShrink: 0,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: balanceColor,
                fontWeight: 'bold',
                fontSize: '0.7rem',
                fontStyle: dayData.isProjected ? 'italic' : 'normal',
              }}
            >
              {dayData.isProjected ? '~' : ''}{formatCurrency(dayData.balance)}
            </Typography>
          </Box>
        </Box>
      );
    },
    [calendarDataMap, todayStr]
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

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading calendar data: {error.message}
      </Alert>
    );
  }

  return (
    <>
      <Card elevation={2} sx={{ position: 'relative' }}>
        {/* Loading overlay - doesn't unmount calendar */}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Balance Calendar
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Click on any date to view detailed transactions
          </Typography>

          <Box sx={{
            mt: 2,
            '& .fc-daygrid-day': {
              height: '180px !important',
            },
            '& .fc-daygrid-day-frame': {
              height: '180px !important',
              minHeight: '180px !important',
            },
            '& .fc-daygrid-event-harness': {
              display: 'none',
            },
            '& .fc-daygrid-day-bottom': {
              display: 'none',
            },
            // Future date background styling
            '& .fc-day-future-projected': {
              backgroundColor: 'rgba(33, 150, 243, 0.08) !important',
            },
            '& .fc-day-future-projected .fc-daygrid-day-frame': {
              backgroundColor: 'transparent !important',
            },
          }}>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={hideToolbar ? false : {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek',
              }}
              dateClick={handleDateClick}
              dayCellContent={dayCellContent}
              dayCellClassNames={(arg) => {
                const year = arg.date.getFullYear();
                const month = String(arg.date.getMonth() + 1).padStart(2, '0');
                const day = String(arg.date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                if (dateStr > todayStr) {
                  return ['fc-day-future-projected'];
                }
                return [];
              }}
              datesSet={handleDatesSet}
              height="auto"
              fixedWeekCount={false}
              dayMaxEvents={false}
              navLinks={false}
              selectable={false}
            />
          </Box>

          {/* Legend */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
              Balance Status:
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
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

            <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
              Transaction Types:
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: '#4caf50',
                    borderRadius: 0.5,
                  }}
                />
                <Typography variant="caption">Income</Typography>
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
                <Typography variant="caption">Expense</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: '#2196f3',
                    borderRadius: 0.5,
                  }}
                />
                <Typography variant="caption">Transfer</Typography>
              </Box>
            </Stack>

            <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
              Forecast Indicators:
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: 'rgba(33, 150, 243, 0.15)',
                    borderRadius: 0.5,
                  }}
                />
                <Typography variant="caption">Future Date</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderLeft: '3px dashed #757575',
                    backgroundColor: 'rgba(117, 117, 117, 0.15)',
                    borderRadius: 0.5,
                  }}
                />
                <Typography variant="caption">Planned (dashed)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderLeft: '3px dashed #9c27b0',
                    backgroundColor: 'rgba(156, 39, 176, 0.15)',
                    borderRadius: 0.5,
                  }}
                />
                <Typography variant="caption">Budget Spending</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ fontStyle: 'italic' }}>~$0.00</Typography>
                <Typography variant="caption">= Projected</Typography>
              </Box>
            </Stack>

          </Box>
        </CardContent>
      </Card>

      {/* Date Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        {selectedDateStr && (selectedDate || selectedForecast) && (
          <>
            <DialogTitle>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="h6">
                    {new Date(selectedDateStr).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                  {selectedForecast?.isProjected && (
                    <Chip label="Projected" size="small" color="info" sx={{ mt: 0.5 }} />
                  )}
                </Box>
                <IconButton onClick={handleDialogClose} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Typography variant="h5" color="primary" sx={{ fontStyle: selectedForecast?.isProjected ? 'italic' : 'normal' }}>
                  {selectedForecast?.isProjected ? '~' : ''}Total Balance: {formatCurrency(selectedForecast?.balance ?? selectedDate?.balance ?? 0)}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {/* Actual Transactions Section (for past/current dates) */}
              {selectedDate && selectedDate.accounts.map((account: AccountDailyBalance) => (
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

              {/* Forecast Section (for future dates) */}
              {selectedForecast?.isProjected && (
                <>
                  {/* Planned Transactions */}
                  {selectedForecast.transactions.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Planned Transactions
                      </Typography>
                      <List dense>
                        {selectedForecast.transactions.map((tx, index) => (
                          <ListItem
                            key={`planned-${index}`}
                            sx={{
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 1,
                              borderStyle: 'dashed',
                              mb: 1,
                              opacity: 0.9,
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography sx={{ fontStyle: 'italic' }}>{tx.description}</Typography>
                                  {tx.accountName && (
                                    <Typography variant="caption" color="text.secondary">
                                      ({tx.accountName})
                                    </Typography>
                                  )}
                                </Box>
                              }
                              secondary={
                                <Chip
                                  label={formatCurrency(tx.amount)}
                                  color={getTransactionColor(tx.type)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mt: 0.5 }}
                                />
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Implicit Budget Spending */}
                  {selectedForecast.implicitSpend && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Budget Spending (Projected)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Based on remaining budget amounts
                      </Typography>
                      <List dense>
                        {selectedForecast.implicitSpend.items.map((item, index) => (
                          <ListItem
                            key={`implicit-${index}`}
                            sx={{
                              border: 1,
                              borderColor: 'secondary.main',
                              borderRadius: 1,
                              borderStyle: 'dashed',
                              mb: 1,
                              opacity: 0.9,
                            }}
                          >
                            <ListItemText
                              primary={
                                <Typography sx={{ fontStyle: 'italic' }}>
                                  {item.categoryName}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  <Chip
                                    label={`-${formatCurrency(item.amount)}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderColor: '#9c27b0', color: '#9c27b0' }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    from {item.budgetName}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                        <ListItem
                          sx={{
                            backgroundColor: 'rgba(156, 39, 176, 0.08)',
                            borderRadius: 1,
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography fontWeight="bold">
                                Total Daily Budget Spending
                              </Typography>
                            }
                            secondary={
                              <Typography variant="h6" sx={{ color: '#9c27b0' }}>
                                -{formatCurrency(selectedForecast.implicitSpend.totalAmount)}
                              </Typography>
                            }
                          />
                        </ListItem>
                      </List>
                    </Box>
                  )}

                  {/* No forecast data message */}
                  {selectedForecast.transactions.length === 0 && !selectedForecast.implicitSpend && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontStyle: 'italic' }}
                    >
                      No planned transactions or budget spending projected for this day
                    </Typography>
                  )}
                </>
              )}

            </DialogContent>
            <DialogActions>
              <Button onClick={handleDialogClose}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
});

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
import { DayCellContentArg, DatesSetArg } from '@fullcalendar/core';
import { DateClickArg } from '@fullcalendar/interaction';
import { useDailyBalances } from '../../hooks/useAnalytics';
import { useBudgets } from '../../hooks/useBudgets';
import { DailyBalance, AccountDailyBalance } from '../../types/analytics.types';
import { BudgetWithStatus } from '../../types/budget.types';
import { formatCurrency, formatDateForInput } from '../../utils/formatters';

interface CalendarViewProps {
  accountIds?: string[];
}

/**
 * CalendarView Component
 * Displays daily balances in a calendar format with color-coded indicators
 * Automatically loads transactions for the displayed month
 */
export const CalendarView: React.FC<CalendarViewProps> = ({
  accountIds,
}) => {
  const [selectedDate, setSelectedDate] = useState<DailyBalance | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);

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
  }, []);

  // Fetch daily balances for the current calendar range
  const { data, isLoading, error } = useDailyBalances({
    startDate: calendarRange.startDate,
    endDate: calendarRange.endDate,
    accountIds,
  });

  // Fetch budgets for the current calendar range (only current/future)
  const today = formatDateForInput(new Date());
  const { data: budgetsData } = useBudgets({
    startDate: today, // Only fetch current/future budgets
    endDate: calendarRange.endDate,
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

  // Create a map of budgets by date (using startDate)
  const budgetsByDate = useMemo(() => {
    if (!budgetsData) return new Map<string, BudgetWithStatus[]>();
    const map = new Map<string, BudgetWithStatus[]>();
    budgetsData.forEach((budget) => {
      // Extract date from startDate in local timezone (not UTC)
      const date = new Date(budget.startDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      const existingBudgets = map.get(dateStr);
      if (existingBudgets) {
        existingBudgets.push(budget);
      }
    });
    return map;
  }, [budgetsData]);

  // Handle date click
  const handleDateClick = useCallback(
    (arg: DateClickArg) => {
      // Format date as YYYY-MM-DD using local timezone
      const year = arg.date.getFullYear();
      const month = String(arg.date.getMonth() + 1).padStart(2, '0');
      const day = String(arg.date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const balance = balanceMap.get(dateStr);
      const budgets = budgetsByDate.get(dateStr);
      // Show dialog if there's balance data or budgets
      if (balance || budgets) {
        setSelectedDate(balance || null);
        setSelectedDateStr(dateStr);
        setDialogOpen(true);
      }
    },
    [balanceMap, budgetsByDate]
  );

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedDate(null);
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
      const balance = balanceMap.get(dateStr);

      if (!balance) {
        return (
          <Box sx={{ textAlign: 'center', p: 0.5 }}>
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

      // Collect all transactions across all accounts for this day
      const allTransactions = balance.accounts.flatMap((account) =>
        account.transactions.map((tx) => ({
          ...tx,
          accountName: account.accountName,
        }))
      );

      // Get budgets for this day (to display on the day)
      const dayBudgets = budgetsByDate.get(dateStr) || [];

      // Calculate total budget amounts for ALL budgets that have started on or before this day
      const currentDate = new Date(dateStr);
      let cumulativeBudgetAmount = 0;
      budgetsByDate.forEach((budgets, budgetDateStr) => {
        const budgetDate = new Date(budgetDateStr);
        if (budgetDate <= currentDate) {
          budgets.forEach((budget) => {
            // INCOME budgets are ADDED to balance, EXPENSE budgets are SUBTRACTED
            if (budget.type === 'INCOME') {
              cumulativeBudgetAmount -= budget.amount; // Subtract so it adds to balance
            } else {
              cumulativeBudgetAmount += budget.amount; // Add so it subtracts from balance
            }
          });
        }
      });

      // Calculate adjusted balance (balance - cumulative expense budgets + cumulative income budgets)
      const adjustedBalance = balance.balance - cumulativeBudgetAmount;
      const adjustedBalanceColor = getBalanceColor(adjustedBalance);

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

          {/* Transaction and Budget bars */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.25, overflow: 'auto', minHeight: 0 }}>
            {/* Transaction bars */}
            {allTransactions.slice(0, 3).map((tx, index) => {
              const txColor = getTransactionColor(tx.type);
              return (
                <Box
                  key={`tx-${index}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: `${txColor}20`,
                    borderLeft: `2px solid ${txColor}`,
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

            {/* Budget bars */}
            {dayBudgets.slice(0, 2).map((budget, index) => {
              const budgetColor = budget.type === 'INCOME' ? '#4caf50' : '#9c27b0'; // Green for income, purple for expense
              const budgetName = budget.name || budget.categoryName;
              const budgetPrefix = budget.type === 'INCOME' ? '+' : '-'; // Show +/- prefix
              return (
                <Box
                  key={`budget-${index}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: `${budgetColor}20`,
                    borderLeft: `2px solid ${budgetColor}`,
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
                    {budgetName.length > 18
                      ? `${budgetName.substring(0, 17)}...`
                      : budgetName}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      color: budgetColor,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {budgetPrefix}{formatCurrency(budget.amount)}
                  </Typography>
                </Box>
              );
            })}

            {/* Show "more" indicator if items exceed limit */}
            {(allTransactions.length > 3 || dayBudgets.length > 2) && (
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
                +{Math.max(allTransactions.length - 3, 0) + Math.max(dayBudgets.length - 2, 0)} more
              </Typography>
            )}
          </Box>

          {/* Final balance at bottom (after budgets) */}
          <Box
            sx={{
              mt: 0.5,
              pt: 0.5,
              px: 0.5,
              pb: 0.5,
              textAlign: 'right',
              flexShrink: 0,
            //   backgroundColor: `${adjustedBalanceColor}20`,
            //   borderLeft: `3px solid ${adjustedBalanceColor}`,
            //   borderRadius: 0.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: adjustedBalanceColor,
                fontWeight: 'bold',
                fontSize: '0.7rem',
              }}
            >
              {formatCurrency(adjustedBalance)}
            </Typography>
          </Box>
        </Box>
      );
    },
    [balanceMap, budgetsByDate]
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
            Click on any date to view detailed transactions and budgets
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
          }}>
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
              Balance Status (after budgets):
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
              Budgets:
            </Typography>
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: '#4caf50',
                    borderRadius: 0.5,
                  }}
                />
                <Typography variant="caption">Income Budget (expected income)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: '#9c27b0',
                    borderRadius: 0.5,
                  }}
                />
                <Typography variant="caption">Expense Budget (spending limit)</Typography>
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
        {(selectedDate || selectedDateStr) && (
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
                  {new Date(selectedDateStr).toLocaleDateString('en-US', {
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
              {selectedDate && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="h5" color="primary">
                    Total Balance: {formatCurrency(selectedDate.balance)}
                  </Typography>
                  {budgetsByDate.get(selectedDateStr) && budgetsByDate.get(selectedDateStr)!.length > 0 && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Budgets: {formatCurrency(
                          budgetsByDate.get(selectedDateStr)!.reduce((sum, b) => {
                            // INCOME budgets add to balance (negative), EXPENSE budgets subtract (positive)
                            return sum + (b.type === 'INCOME' ? -b.amount : b.amount);
                          }, 0)
                        )}
                      </Typography>
                      <Typography variant="h6" color="secondary" sx={{ mt: 0.5 }}>
                        Available: {formatCurrency(
                          selectedDate.balance -
                          budgetsByDate.get(selectedDateStr)!.reduce((sum, b) => {
                            // INCOME budgets add to balance (negative), EXPENSE budgets subtract (positive)
                            return sum + (b.type === 'INCOME' ? -b.amount : b.amount);
                          }, 0)
                        )}
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </DialogTitle>
            <DialogContent dividers>
              {/* Transactions Section */}
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

              {/* Budgets Section */}
              {budgetsByDate.get(selectedDateStr) && budgetsByDate.get(selectedDateStr)!.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Budgets Starting on This Day
                  </Typography>
                  <List dense>
                    {budgetsByDate.get(selectedDateStr)!.map((budget) => (
                      <ListItem
                        key={budget.id}
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          backgroundColor: '#9c27b020',
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {budget.name || budget.categoryName}
                              </Typography>
                              {budget.periodType && (
                                <Chip
                                  label={budget.periodType}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Chip
                                label={`Budget: ${formatCurrency(budget.amount)}`}
                                size="small"
                                sx={{
                                  mr: 1,
                                  backgroundColor: budget.type === 'INCOME' ? '#4caf50' : '#9c27b0',
                                  color: 'white',
                                }}
                              />
                              <Chip
                                label={`Spent: ${formatCurrency(budget.spent)}`}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              <Chip
                                label={`${budget.percentage.toFixed(0)}%`}
                                size="small"
                                color={
                                  budget.status === 'UNDER_BUDGET'
                                    ? 'success'
                                    : budget.status === 'ON_TRACK'
                                    ? 'info'
                                    : budget.status === 'WARNING'
                                    ? 'warning'
                                    : 'error'
                                }
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
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
};

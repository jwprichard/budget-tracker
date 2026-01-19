import { useMemo, useState, useCallback, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Chip,
  SelectChangeEvent,
  Button,
  ButtonGroup,
  IconButton,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Today as TodayIcon,
  ViewWeek as WeekIcon,
  CalendarMonth as MonthIcon,
} from '@mui/icons-material';
import { CalendarView, CalendarViewHandle } from '../components/analytics/CalendarView';
import { useAccounts } from '../hooks/useAccounts';
import { useSidebar } from '../hooks/useSidebar';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

/**
 * Calendar Page
 * Displays daily balances and transactions in a calendar view
 */
export const Calendar: React.FC = () => {
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const calendarRef = useRef<CalendarViewHandle>(null);
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const [currentView, setCurrentView] = useState<string>('dayGridMonth');
  const { data: accounts } = useAccounts();

  // Navigation handlers - call methods on the CalendarView ref
  const handlePrev = useCallback(() => {
    calendarRef.current?.prev();
  }, []);

  const handleNext = useCallback(() => {
    calendarRef.current?.next();
  }, []);

  const handleToday = useCallback(() => {
    calendarRef.current?.today();
  }, []);

  const handleViewChange = useCallback((view: string) => {
    calendarRef.current?.changeView(view);
  }, []);

  // Handle account selection change
  const handleAccountChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setAccountIds(typeof value === 'string' ? value.split(',') : value);
  };

  // Get selected account names for display
  const getSelectedAccountNames = (): string => {
    if (accountIds.length === 0) return 'All Accounts';
    if (!accounts) return '';
    const selectedAccounts = accounts.filter((acc) => accountIds.includes(acc.id));
    return selectedAccounts.map((acc) => acc.name).join(', ');
  };

  // Sidebar tools - navigation controls
  const sidebarTools = useMemo(
    () => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Current month/title display */}
        <Typography variant="subtitle1" fontWeight="bold" textAlign="center">
          {currentTitle}
        </Typography>

        {/* Navigation buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <IconButton onClick={handlePrev} size="small">
            <PrevIcon />
          </IconButton>
          <Button variant="outlined" size="small" onClick={handleToday} startIcon={<TodayIcon />}>
            Today
          </Button>
          <IconButton onClick={handleNext} size="small">
            <NextIcon />
          </IconButton>
        </Box>

        {/* View toggle */}
        <ButtonGroup fullWidth size="small">
          <Button
            variant={currentView === 'dayGridMonth' ? 'contained' : 'outlined'}
            onClick={() => handleViewChange('dayGridMonth')}
            startIcon={<MonthIcon />}
          >
            Month
          </Button>
          <Button
            variant={currentView === 'dayGridWeek' ? 'contained' : 'outlined'}
            onClick={() => handleViewChange('dayGridWeek')}
            startIcon={<WeekIcon />}
          >
            Week
          </Button>
        </ButtonGroup>
      </Box>
    ),
    [currentTitle, currentView, handlePrev, handleNext, handleToday, handleViewChange]
  );

  // Sidebar config - account filter
  const sidebarConfig = useMemo(
    () => (
      <FormControl fullWidth size="small">
        <InputLabel id="account-filter-label">Accounts</InputLabel>
        <Select
          labelId="account-filter-label"
          id="account-filter"
          multiple
          value={accountIds}
          onChange={handleAccountChange}
          input={<OutlinedInput label="Accounts" />}
          renderValue={getSelectedAccountNames}
          MenuProps={MenuProps}
        >
          {accounts?.map((account) => (
            <MenuItem key={account.id} value={account.id}>
              <Checkbox checked={accountIds.includes(account.id)} size="small" />
              <ListItemText primary={account.name} />
            </MenuItem>
          ))}
        </Select>
        {accountIds.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
            {accounts
              ?.filter((acc) => accountIds.includes(acc.id))
              .map((account) => (
                <Chip
                  key={account.id}
                  label={account.name}
                  size="small"
                  onDelete={() => {
                    setAccountIds(accountIds.filter((id) => id !== account.id));
                  }}
                />
              ))}
          </Box>
        )}
      </FormControl>
    ),
    [accountIds, accounts]
  );

  useSidebar({
    tools: sidebarTools,
    config: sidebarConfig,
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Calendar
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your daily balances and transactions in a calendar format
        </Typography>
      </Box>

      {/* Calendar View */}
      <CalendarView
        ref={calendarRef}
        accountIds={accountIds.length > 0 ? accountIds : undefined}
        hideToolbar
        onTitleChange={setCurrentTitle}
        onViewChange={setCurrentView}
      />
    </Container>
  );
};

export default Calendar;

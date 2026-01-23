/**
 * Forecast Page
 * Main page for viewing cash flow forecasts and projections
 */

import React, { useState, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Event as EventIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { ForecastChart } from '../components/forecast/ForecastChart';
import { useSidebar } from '../hooks/useSidebar';
import { useLowBalanceWarnings } from '../hooks/useForecast';
import { useAccounts } from '../hooks/useAccounts';
import { formatCurrency } from '../utils/formatters';
import { format } from 'date-fns';

export const Forecast: React.FC = () => {
  const [days, setDays] = useState<number>(90);
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState<number>(100);

  const { data: accounts = [] } = useAccounts();
  const { data: warnings = [] } = useLowBalanceWarnings({
    threshold: lowBalanceThreshold,
    days,
  });

  // Get selected account IDs
  const selectedAccountIds = useMemo(() => {
    if (accountFilter === 'ALL') return undefined;
    return [accountFilter];
  }, [accountFilter]);

  // Sidebar config - filters
  const sidebarConfig = useMemo(
    () => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Forecast Period</InputLabel>
          <Select
            value={days.toString()}
            label="Forecast Period"
            onChange={(e: SelectChangeEvent) => setDays(parseInt(e.target.value))}
          >
            <MenuItem value="30">30 Days</MenuItem>
            <MenuItem value="60">60 Days</MenuItem>
            <MenuItem value="90">90 Days</MenuItem>
            <MenuItem value="180">6 Months</MenuItem>
            <MenuItem value="365">1 Year</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Account</InputLabel>
          <Select
            value={accountFilter}
            label="Account"
            onChange={(e: SelectChangeEvent) => setAccountFilter(e.target.value)}
          >
            <MenuItem value="ALL">All Accounts</MenuItem>
            {accounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          type="number"
          label="Low Balance Threshold"
          size="small"
          value={lowBalanceThreshold}
          onChange={(e) => setLowBalanceThreshold(Number(e.target.value))}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
        />
      </Box>
    ),
    [days, accountFilter, accounts, lowBalanceThreshold]
  );

  useSidebar({
    config: sidebarConfig,
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Cash Flow Forecast
        </Typography>
        <Typography variant="body1" color="text.secondary">
          See your projected account balances based on planned transactions and budgets.
          Identify potential cash flow issues before they happen.
        </Typography>
      </Box>

      {/* Low Balance Warnings */}
      {warnings.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          icon={<WarningIcon />}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Low Balance Warnings ({warnings.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {warnings.slice(0, 5).map((warning, idx) => (
              <Chip
                key={idx}
                label={`${warning.accountName}: ${formatCurrency(warning.projectedBalance)} on ${format(new Date(warning.date), 'MMM d')}`}
                size="small"
                color="warning"
                variant="outlined"
              />
            ))}
            {warnings.length > 5 && (
              <Chip
                label={`+${warnings.length - 5} more`}
                size="small"
                color="default"
              />
            )}
          </Box>
        </Alert>
      )}

      {/* Main Forecast Chart */}
      <Box sx={{ mb: 3 }}>
        <ForecastChart
          days={days}
          accountIds={selectedAccountIds}
          lowBalanceThreshold={lowBalanceThreshold}
        />
      </Box>

      {/* Detailed Warnings List */}
      {warnings.length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Upcoming Low Balance Days
                </Typography>
                <List dense>
                  {warnings.slice(0, 10).map((warning, idx) => (
                    <ListItem key={idx} divider={idx < warnings.length - 1}>
                      <ListItemIcon>
                        <EventIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={format(new Date(warning.date), 'EEEE, MMMM d, yyyy')}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <AccountBalanceIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption" component="span">
                              {warning.accountName}
                            </Typography>
                          </Box>
                        }
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: warning.projectedBalance < 0 ? 'error.main' : 'warning.main',
                        }}
                      >
                        {formatCurrency(warning.projectedBalance)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
                {warnings.length > 10 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    And {warnings.length - 10} more warnings...
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Recommendations
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Review planned expenses"
                      secondary="Consider postponing or reducing non-essential planned expenses during low balance periods."
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Set up automatic transfers"
                      secondary="Create planned transfers from savings to cover anticipated shortfalls."
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Increase income sources"
                      secondary="Look for opportunities to increase income before low balance dates."
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* No Warnings Message */}
      {warnings.length === 0 && (
        <Card elevation={2}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="success.main" gutterBottom>
              Looking Good!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No low balance warnings for the selected period. Your projected cash flow appears healthy.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default Forecast;

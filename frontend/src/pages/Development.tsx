import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  Divider,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  DeleteForever as DeleteIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';

interface DatabaseStats {
  accounts: number;
  transactions: number;
  categories: number;
  bankConnections: number;
  linkedAccounts: number;
  externalTransactions: number;
  syncHistory: number;
}

interface ResetDialogState {
  open: boolean;
  title: string;
  message: string;
  endpoint: string;
  buttonText: string;
}

export const Development = () => {
  const queryClient = useQueryClient();
  const [dialogState, setDialogState] = useState<ResetDialogState>({
    open: false,
    title: '',
    message: '',
    endpoint: '',
    buttonText: '',
  });

  // Fetch database statistics
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery<DatabaseStats>({
    queryKey: ['databaseStats'],
    queryFn: async () => {
      const response = await apiClient.get('/v1/dev/stats');
      return response.data.data;
    },
  });

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: async (endpoint: string) => {
      const response = await apiClient.post(`/v1/dev/${endpoint}`);
      return response.data;
    },
    onSuccess: () => {
      // Refetch stats after reset
      refetch();
      // Invalidate all queries to refresh UI
      queryClient.invalidateQueries();
    },
  });

  const handleOpenDialog = (
    title: string,
    message: string,
    endpoint: string,
    buttonText: string
  ) => {
    setDialogState({
      open: true,
      title,
      message,
      endpoint,
      buttonText,
    });
  };

  const handleCloseDialog = () => {
    setDialogState({
      ...dialogState,
      open: false,
    });
  };

  const handleConfirmReset = async () => {
    await resetMutation.mutateAsync(dialogState.endpoint);
    handleCloseDialog();
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LoadingSpinner message="Loading database statistics..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <ErrorAlert error={error} title="Failed to load database statistics" />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Development Tools
        </Typography>
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
          <strong>Warning:</strong> These tools are for development and testing only.
          All reset actions are permanent and cannot be undone.
        </Alert>
      </Box>

      {/* Database Statistics */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Database Statistics</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Accounts
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats?.accounts || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Transactions
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats?.transactions || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Bank Connections
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats?.bankConnections || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Linked Accounts
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats?.linkedAccounts || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  External Transactions
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats?.externalTransactions || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Sync History
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats?.syncHistory || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Categories
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats?.categories || 0}
                </Typography>
                <Chip label="Preserved" size="small" color="success" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Reset Actions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Reset Actions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Use these buttons to reset different parts of the database. All actions are permanent.
        </Typography>

        <Grid container spacing={2}>
          {/* Reset Transactions */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Reset Transactions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Deletes all manual and bank-synced transactions. Accounts and bank connections are preserved.
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Will delete:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip label={`${stats?.transactions || 0} Transactions`} size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip label={`${stats?.externalTransactions || 0} External Transactions`} size="small" sx={{ mb: 1 }} />
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() =>
                    handleOpenDialog(
                      'Reset Transactions',
                      'This will delete all transactions (both manual and bank-synced). Accounts and bank connections will be preserved. This action cannot be undone.',
                      'reset/transactions',
                      'Delete All Transactions'
                    )
                  }
                  fullWidth
                >
                  Reset Transactions
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Reset Accounts */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Reset Accounts
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Deletes all accounts and their transactions (cascades). Bank connections are preserved.
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Will delete:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip label={`${stats?.accounts || 0} Accounts`} size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="All Transactions" size="small" sx={{ mb: 1 }} />
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() =>
                    handleOpenDialog(
                      'Reset Accounts',
                      'This will delete all accounts and cascade to all transactions. Bank connections will be preserved. This action cannot be undone.',
                      'reset/accounts',
                      'Delete All Accounts'
                    )
                  }
                  fullWidth
                >
                  Reset Accounts
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Reset Bank Connections */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Reset Bank Connections
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Deletes all bank connections, linked accounts, and external transactions. Manual transactions and accounts are preserved.
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Will delete:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip label={`${stats?.bankConnections || 0} Bank Connections`} size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip label={`${stats?.linkedAccounts || 0} Linked Accounts`} size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip label={`${stats?.externalTransactions || 0} External Transactions`} size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip label={`${stats?.syncHistory || 0} Sync History`} size="small" sx={{ mb: 1 }} />
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() =>
                    handleOpenDialog(
                      'Reset Bank Connections',
                      'This will delete all bank connections and related data. Manual accounts and transactions will be preserved. This action cannot be undone.',
                      'reset/bank-connections',
                      'Delete All Bank Connections'
                    )
                  }
                  fullWidth
                >
                  Reset Bank Connections
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Reset Categories */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Reset Categories
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Deletes all auto-created categories (keeps Uncategorized). Transactions are reassigned to Uncategorized.
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Will delete:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip label={`${Math.max(0, (stats?.categories || 0) - 1)} Categories`} size="small" sx={{ mr: 1, mb: 1 }} />
                </Box>
                <Typography variant="caption" color="success.main" gutterBottom display="block" sx={{ mb: 2 }}>
                  Uncategorized will be preserved
                </Typography>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<DeleteIcon />}
                  onClick={() =>
                    handleOpenDialog(
                      'Reset Categories',
                      'This will delete all auto-created categories except Uncategorized. All transactions will be reassigned to Uncategorized. This action cannot be undone.',
                      'reset/categories',
                      'Delete All Categories'
                    )
                  }
                  fullWidth
                >
                  Reset Categories
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Reset Everything */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%', borderColor: 'error.main' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  Reset Everything (Nuclear)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Deletes ALL data except categories. This is a complete reset of the application.
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Will delete:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip label="All Accounts" size="small" color="error" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="All Transactions" size="small" color="error" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="All Bank Connections" size="small" color="error" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="All Sync Data" size="small" color="error" sx={{ mb: 1 }} />
                </Box>
                <Typography variant="caption" color="success.main" gutterBottom display="block" sx={{ mb: 2 }}>
                  Categories will be preserved
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() =>
                    handleOpenDialog(
                      'Reset Everything',
                      'This will delete ALL data including accounts, transactions, and bank connections. Only categories will be preserved. This action cannot be undone. Are you absolutely sure?',
                      'reset/everything',
                      'Delete Everything'
                    )
                  }
                  fullWidth
                >
                  Reset Everything
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={dialogState.open}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          {dialogState.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogState.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReset}
            color="error"
            variant="contained"
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? 'Deleting...' : dialogState.buttonText}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  getConnections,
  setupConnection,
  testConnection,
  getConnectedAccounts,
  linkAccount,
  type LinkedAccount,
  type BankConnection,
} from '../services/sync.service';
import { getAllAccounts } from '../services/account.service';
import { SyncButton } from '../components/sync/SyncButton';
import { SyncStatusIndicator } from '../components/sync/SyncStatusIndicator';
import { TransactionReviewDialog } from '../components/sync/TransactionReviewDialog';
import { SyncHistoryView } from '../components/sync/SyncHistoryView';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { Account } from '../types';

export const BankSync = () => {
  // Setup wizard state
  const [activeStep, setActiveStep] = useState(0);
  const [appToken, setAppToken] = useState('');
  const [userToken, setUserToken] = useState('');
  const [showAppToken, setShowAppToken] = useState(false);
  const [showUserToken, setShowUserToken] = useState(false);
  const [connection, setConnection] = useState<BankConnection | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Linked accounts state
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [localAccounts, setLocalAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedLinkedAccount, setSelectedLinkedAccount] = useState<LinkedAccount | null>(null);
  const [selectedLocalAccountId, setSelectedLocalAccountId] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  // Sync state
  const [currentSyncHistoryId, setCurrentSyncHistoryId] = useState<string | undefined>();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [daysBack, setDaysBack] = useState<number>(7);

  const steps = ['Enter Tokens', 'Test Connection', 'Link Accounts'];

  useEffect(() => {
    fetchLocalAccounts();
    fetchExistingConnections();
  }, []);

  const fetchExistingConnections = async () => {
    try {
      const connections = await getConnections();
      if (connections.length > 0) {
        // Use the most recent connection
        setConnection(connections[0]);
        setActiveStep(3); // Skip wizard, go to connected state
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  };

  useEffect(() => {
    if (connection?.connectionId) {
      fetchLinkedAccounts();
    }
  }, [connection]);

  const fetchLocalAccounts = async () => {
    try {
      const accounts = await getAllAccounts(true);
      setLocalAccounts(accounts);
    } catch (error) {
      console.error('Failed to fetch local accounts:', error);
    }
  };

  const fetchLinkedAccounts = useCallback(async () => {
    if (!connection?.connectionId) return;

    try {
      setLoadingAccounts(true);
      const accounts = await getConnectedAccounts(connection.connectionId);
      setLinkedAccounts(accounts);
    } catch (error) {
      console.error('Failed to fetch linked accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  }, [connection?.connectionId]);

  const handleSetupConnection = async () => {
    try {
      setIsSubmitting(true);
      setSetupError(null);

      const result = await setupConnection({
        provider: 'AKAHU_PERSONAL',
        appToken,
        userToken,
        metadata: {
          description: 'Budget Tracker Connection',
        },
      });

      setConnection(result);
      setActiveStep(1);
    } catch (error: any) {
      console.error('Failed to setup connection:', error);
      setSetupError(error.response?.data?.error?.message || 'Failed to setup connection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    if (!connection?.connectionId) return;

    try {
      setIsSubmitting(true);
      setSetupError(null);

      const result = await testConnection({ connectionId: connection.connectionId });
      setTestResult(result);
      setActiveStep(2);
    } catch (error: any) {
      console.error('Failed to test connection:', error);
      setSetupError(error.response?.data?.error?.message || 'Connection test failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenLinkDialog = (linkedAccount: LinkedAccount) => {
    setSelectedLinkedAccount(linkedAccount);
    setSelectedLocalAccountId(linkedAccount.localAccount?.id || '');
    setLinkError(null);
    setLinkDialogOpen(true);
  };

  const handleLinkAccount = async () => {
    if (!selectedLinkedAccount || !selectedLocalAccountId) return;

    try {
      setLinkError(null);
      await linkAccount({
        linkedAccountId: selectedLinkedAccount.id,
        localAccountId: selectedLocalAccountId,
      });

      setLinkDialogOpen(false);
      fetchLinkedAccounts();
    } catch (error: any) {
      console.error('Failed to link account:', error);
      const errorMessage = error.response?.data?.error?.message ||
        'Failed to link account. Please try again.';
      setLinkError(errorMessage);
    }
  };

  const handleSyncStart = useCallback((syncHistoryId: string) => {
    setCurrentSyncHistoryId(syncHistoryId);
  }, []);

  const handleSyncComplete = useCallback(() => {
    fetchLinkedAccounts();
    setReviewDialogOpen(true);
  }, [fetchLinkedAccounts]); // Stable reference via useCallback

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Bank Sync (Akahu)
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Connect your bank account via Akahu to automatically sync transactions.
      </Typography>

      {/* Setup Wizard */}
      {activeStep < 3 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {setupError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {setupError}
            </Alert>
          )}

          {/* Step 1: Enter Tokens */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Step 1: Enter Your Akahu Tokens
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                You'll need both an App Token and User Token from your Akahu Personal App.
              </Typography>

              <TextField
                fullWidth
                label="App Token"
                value={appToken}
                onChange={(e) => setAppToken(e.target.value)}
                type={showAppToken ? 'text' : 'password'}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowAppToken(!showAppToken)} edge="end">
                      {showAppToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="User Token"
                value={userToken}
                onChange={(e) => setUserToken(e.target.value)}
                type={showUserToken ? 'text' : 'password'}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowUserToken(!showUserToken)} edge="end">
                      {showUserToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  ),
                }}
              />

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleSetupConnection}
                  disabled={!appToken || !userToken || isSubmitting}
                >
                  {isSubmitting ? 'Setting up...' : 'Continue'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 2: Test Connection */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Step 2: Test Connection
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Let's verify your tokens work by calling the Akahu API.
              </Typography>

              {testResult ? (
                <>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Connection successful! Your Akahu account is connected.
                  </Alert>
                  <Box sx={{ mt: 3 }}>
                    <Button variant="contained" onClick={() => setActiveStep(2)}>
                      Continue to Link Accounts
                    </Button>
                  </Box>
                </>
              ) : (
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleTestConnection}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Testing...' : 'Test Connection'}
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Step 3: Link Accounts */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Step 3: Link External Accounts
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Link your Akahu accounts to your local Budget Tracker accounts.
              </Typography>

              {loadingAccounts ? (
                <LoadingSpinner message="Loading accounts..." />
              ) : (
                <Button variant="contained" onClick={() => setActiveStep(3)}>
                  Finish Setup
                </Button>
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* Connected State */}
      {connection && activeStep === 3 && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Connection Info */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Connection Status
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Provider: {connection.provider}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {connection.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Connected: {new Date(connection.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Sync Actions */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sync Transactions
                  </Typography>
                  <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField
                      type="number"
                      label="Days Back"
                      value={daysBack}
                      onChange={(e) => setDaysBack(Math.max(1, parseInt(e.target.value) || 1))}
                      size="small"
                      sx={{ width: 120 }}
                      inputProps={{ min: 1, max: 365 }}
                      helperText="1-365 days"
                    />
                    <SyncButton
                      connectionId={connection.connectionId}
                      onSyncStart={handleSyncStart}
                      variant="button"
                      daysBack={daysBack}
                    />
                  </Box>
                  {currentSyncHistoryId && (
                    <SyncStatusIndicator
                      syncHistoryId={currentSyncHistoryId}
                      onSyncComplete={handleSyncComplete}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Linked Accounts */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Linked Accounts
            </Typography>

            {loadingAccounts ? (
              <LoadingSpinner message="Loading accounts..." />
            ) : linkedAccounts.length === 0 ? (
              <Alert severity="info">
                No accounts found. Trigger a sync to fetch your accounts from Akahu.
              </Alert>
            ) : (
              <List>
                {linkedAccounts.map((linkedAccount) => (
                  <React.Fragment key={linkedAccount.id}>
                    <ListItem>
                      <ListItemText
                        primary={linkedAccount.externalName}
                        secondary={
                          <>
                            {linkedAccount.institution} • {linkedAccount.externalType}
                            {linkedAccount.accountNumber && ` • ${linkedAccount.accountNumber}`}
                            {linkedAccount.localAccount && (
                              <Typography variant="body2" color="success.main" component="span" sx={{ display: 'block' }}>
                                ✓ Linked to: {linkedAccount.localAccount.name}
                              </Typography>
                            )}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleOpenLinkDialog(linkedAccount)}
                        >
                          <LinkIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>

          {/* Sync History */}
          <SyncHistoryView
            connectionId={connection.connectionId}
            autoRefresh={!!currentSyncHistoryId}
          />
        </>
      )}

      {/* Link Account Dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Link Account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Link "{selectedLinkedAccount?.externalName}" to a local account:
          </Typography>

          {linkError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {linkError}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Local Account</InputLabel>
            <Select
              value={selectedLocalAccountId}
              onChange={(e) => setSelectedLocalAccountId(e.target.value)}
              label="Local Account"
            >
              {localAccounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleLinkAccount}
            disabled={!selectedLocalAccountId}
          >
            Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Review Dialog */}
      {connection && (
        <TransactionReviewDialog
          open={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          connectionId={connection.connectionId}
          onReviewComplete={() => setReviewDialogOpen(false)}
        />
      )}
    </Container>
  );
};

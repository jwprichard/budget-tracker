import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  FormControlLabel,
  Switch,
  Fab,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAccounts, useCreateAccount } from '../hooks/useAccounts';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { AccountList } from '../components/accounts/AccountList';
import { AccountForm } from '../components/accounts/AccountForm';
import { Account, CreateAccountDto } from '../types';
import { AccountBalance as AccountIcon } from '@mui/icons-material';

export const Accounts = () => {
  const navigate = useNavigate();
  const [includeInactive, setIncludeInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const { data: accounts = [], isLoading, error } = useAccounts(includeInactive);
  const createAccountMutation = useCreateAccount();

  const handleAccountClick = (account: Account) => {
    navigate(`/accounts/${account.id}`);
  };

  const handleCreateAccount = async (data: CreateAccountDto) => {
    try {
      await createAccountMutation.mutateAsync(data);
      setFormOpen(false);
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LoadingSpinner message="Loading accounts..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <ErrorAlert error={error} title="Failed to load accounts" />
      </Container>
    );
  }

  const activeAccounts = accounts.filter((acc) => acc.isActive);
  const inactiveAccounts = accounts.filter((acc) => !acc.isActive);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Accounts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your financial accounts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
        >
          Create Account
        </Button>
      </Box>

      {/* Controls */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''}
          {inactiveAccounts.length > 0 && `, ${inactiveAccounts.length} inactive`}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
          }
          label="Show inactive accounts"
        />
      </Box>

      {/* Account List */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={<AccountIcon />}
          title="No accounts yet"
          description="Create your first account to start tracking your finances"
          actionLabel="Create Account"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <AccountList accounts={accounts} onAccountClick={handleAccountClick} />
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="create account"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setFormOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Create Account Dialog */}
      <AccountForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateAccount}
        isSubmitting={createAccountMutation.isPending}
      />
    </Container>
  );
};

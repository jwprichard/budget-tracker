import { Card, CardContent, CardActionArea, Typography, Box, Chip, IconButton, Tooltip } from '@mui/material';
import { LinkOff as UnlinkIcon, Link as LinkIcon, Error as ErrorIcon } from '@mui/icons-material';
import { Account } from '../../types';
import { AccountTypeIcon } from './AccountTypeIcon';
import { BalanceDisplay } from '../common/BalanceDisplay';
import { useAccountBalance } from '../../hooks/useAccounts';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { unlinkAccount } from '../../services/sync.service';
import { useState } from 'react';

interface AccountCardProps {
  account: Account;
  onClick?: (account: Account) => void;
  onUnlink?: () => void;
}

export const AccountCard = ({ account, onClick, onUnlink }: AccountCardProps) => {
  const { data: balanceData, isLoading } = useAccountBalance(account.id);
  const [unlinking, setUnlinking] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(account);
    }
  };

  const handleUnlink = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    if (!confirm('Are you sure you want to unlink this account from your bank? You can always relink it later.')) {
      return;
    }

    try {
      setUnlinking(true);
      await unlinkAccount(account.id);
      if (onUnlink) {
        onUnlink();
      }
    } catch (error) {
      console.error('Failed to unlink account:', error);
      alert('Failed to unlink account. Please try again.');
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
      <CardActionArea onClick={handleClick} sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.main',
                  color: 'white',
                }}
              >
                <AccountTypeIcon type={account.type} />
              </Box>
              <Box>
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                  {account.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {account.type.replace('_', ' ')}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              {account.isLinkedToBank && (
                <Tooltip title="Unlink from bank">
                  <IconButton
                    size="small"
                    onClick={handleUnlink}
                    disabled={unlinking}
                    sx={{ color: 'error.main' }}
                  >
                    <UnlinkIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Status badges */}
              {account.linkedAccount?.status === 'CLOSED' && (
                <Chip label="Closed" size="small" color="error" />
              )}
              {account.linkedAccount?.status === 'DORMANT' && (
                <Chip label="Dormant" size="small" color="warning" />
              )}
              {account.linkedAccount?.status === 'ERROR' && (
                <Chip
                  label="Error"
                  size="small"
                  color="error"
                  icon={<ErrorIcon fontSize="small" />}
                />
              )}

              {!account.isActive && (
                <Chip label="Inactive" size="small" color="default" variant="outlined" />
              )}
            </Box>
          </Box>

          {account.isLinkedToBank && (
            <Box sx={{ mb: 2 }}>
              <Chip
                icon={<LinkIcon />}
                label="Linked to Bank"
                size="small"
                color="success"
                variant="outlined"
              />
            </Box>
          )}

          {account.category && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {account.category}
            </Typography>
          )}

          {isLoading ? (
            <LoadingSpinner message="" size={20} />
          ) : (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Current Balance
              </Typography>
              <Box>
                <BalanceDisplay
                  amount={balanceData?.currentBalance || 0}
                  currency={account.currency}
                  variant="h5"
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {balanceData?.transactionCount || 0} transaction
                {balanceData?.transactionCount !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

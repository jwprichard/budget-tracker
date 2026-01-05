import { Card, CardContent, CardActionArea, Typography, Box, Chip } from '@mui/material';
import { Account } from '../../types';
import { AccountTypeIcon } from './AccountTypeIcon';
import { BalanceDisplay } from '../common/BalanceDisplay';
import { useAccountBalance } from '../../hooks/useAccounts';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface AccountCardProps {
  account: Account;
  onClick?: (account: Account) => void;
}

export const AccountCard = ({ account, onClick }: AccountCardProps) => {
  const { data: balanceData, isLoading } = useAccountBalance(account.id);

  const handleClick = () => {
    if (onClick) {
      onClick(account);
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea onClick={handleClick} sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountTypeIcon type={account.type} color="primary" />
              <Box>
                <Typography variant="h6" component="div">
                  {account.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {account.type.replace('_', ' ')}
                </Typography>
              </Box>
            </Box>
            {!account.isActive && (
              <Chip label="Inactive" size="small" color="default" variant="outlined" />
            )}
          </Box>

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

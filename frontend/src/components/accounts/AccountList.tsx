import { Grid } from '@mui/material';
import { Account } from '../../types';
import { AccountCard } from './AccountCard';

interface AccountListProps {
  accounts: Account[];
  onAccountClick?: (account: Account) => void;
}

export const AccountList = ({ accounts, onAccountClick }: AccountListProps) => {
  return (
    <Grid container spacing={3}>
      {accounts.map((account) => (
        <Grid item xs={12} sm={6} md={4} key={account.id}>
          <AccountCard account={account} onClick={onAccountClick} />
        </Grid>
      ))}
    </Grid>
  );
};

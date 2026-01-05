import {
  AccountBalance,
  Savings,
  CreditCard,
  LocalAtm,
  TrendingUp,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { SvgIconProps } from '@mui/material';
import { AccountType } from '../../types';

interface AccountTypeIconProps extends SvgIconProps {
  type: AccountType;
}

export const AccountTypeIcon = ({ type, ...props }: AccountTypeIconProps) => {
  const iconMap: Record<AccountType, React.ElementType> = {
    CHECKING: AccountBalance,
    SAVINGS: Savings,
    CREDIT_CARD: CreditCard,
    CASH: LocalAtm,
    INVESTMENT: TrendingUp,
    OTHER: AccountBalanceWallet,
  };

  const Icon = iconMap[type] || AccountBalanceWallet;

  return <Icon {...props} />;
};

import { Typography } from '@mui/material';

interface BalanceDisplayProps {
  amount: number | string;
  currency?: string;
  variant?: 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'h3';
  showSign?: boolean;
  color?: string;
}

export const BalanceDisplay = ({
  amount,
  currency = 'USD',
  variant = 'h6',
  showSign = false,
  color,
}: BalanceDisplayProps) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const isNegative = numericAmount < 0;
  const isPositive = numericAmount > 0;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(numericAmount));

  const displayAmount = isNegative
    ? `-${formattedAmount}`
    : showSign && isPositive
    ? `+${formattedAmount}`
    : formattedAmount;

  const defaultColor = isNegative ? 'error.main' : isPositive ? 'success.main' : 'text.primary';

  return (
    <Typography variant={variant} component="span" sx={{ color: color || defaultColor, fontWeight: 'medium' }}>
      {displayAmount}
    </Typography>
  );
};

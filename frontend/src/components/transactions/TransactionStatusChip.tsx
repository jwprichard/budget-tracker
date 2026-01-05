import { Chip } from '@mui/material';
import { TransactionStatus } from '../../types';

interface TransactionStatusChipProps {
  status: TransactionStatus;
  size?: 'small' | 'medium';
}

export const TransactionStatusChip = ({ status, size = 'small' }: TransactionStatusChipProps) => {
  const statusConfig: Record<TransactionStatus, { label: string; color: 'default' | 'warning' | 'success' }> = {
    PENDING: { label: 'Pending', color: 'warning' },
    CLEARED: { label: 'Cleared', color: 'success' },
    RECONCILED: { label: 'Reconciled', color: 'default' },
  };

  const config = statusConfig[status];

  return <Chip label={config.label} color={config.color} size={size} />;
};

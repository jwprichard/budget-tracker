import { TableRow, TableCell, Chip, Box, Typography, Tooltip } from '@mui/material';
import { SwapHoriz as TransferIcon, AccountBalance as BudgetIcon } from '@mui/icons-material';
import { Transaction } from '../../types';
import { BalanceDisplay } from '../common/BalanceDisplay';
import { TransactionStatusChip } from './TransactionStatusChip';
import { CategoryColorBadge } from '../categories/CategoryColorBadge';
import { format } from 'date-fns';

interface TransactionListItemProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void; // TODO: Remove once delete functionality is re-implemented
  isBudgeted?: boolean;
}

export const TransactionListItem = ({ transaction, onEdit, isBudgeted }: TransactionListItemProps) => {
  const isTransfer = !!transaction.transferToAccountId;
  const category = transaction.category;

  const handleRowClick = () => {
    if (onEdit) {
      onEdit(transaction);
    }
  };

  const formattedDate = format(new Date(transaction.date), 'MMM dd, yyyy');

  return (
    <TableRow
      hover
      onClick={handleRowClick}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.hover',
        }
      }}
    >
      <TableCell>{formattedDate}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isTransfer && <TransferIcon fontSize="small" color="action" />}
          <Box sx={{ flex: 1 }}>
            {transaction.merchant ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {transaction.merchant}
                  </Typography>
                  {transaction.isFromBank && (
                    <Chip
                      label="Bank"
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ height: 18, fontSize: '0.65rem' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {transaction.description}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2">{transaction.description}</Typography>
                {transaction.notes && (
                  <Typography variant="caption" color="text.secondary">
                    {transaction.notes}
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        {transaction.account ? (
          <Box>
            <Typography variant="body2">{transaction.account.name}</Typography>
            {transaction.transferAccount && (
              <Typography variant="caption" color="text.secondary">
                → {transaction.transferAccount.name}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Unknown
          </Typography>
        )}
      </TableCell>
      <TableCell>
        {category ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryColorBadge color={category.color} size={12} />
            <Typography variant="body2">{category.name}</Typography>
            {isBudgeted && (
              <Tooltip title="Has budget">
                <BudgetIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              </Tooltip>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Uncategorized
          </Typography>
        )}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Chip
          label={transaction.type}
          size="small"
          color={transaction.type === 'INCOME' ? 'success' : transaction.type === 'EXPENSE' ? 'error' : 'default'}
          variant="outlined"
        />
      </TableCell>
      <TableCell align="right">
        <BalanceDisplay amount={transaction.amount} variant="body1" showSign />
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <TransactionStatusChip status={transaction.status} />
      </TableCell>
    </TableRow>
  );
};

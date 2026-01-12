import { TableRow, TableCell, IconButton, Chip, Box, Typography } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, SwapHoriz as TransferIcon } from '@mui/icons-material';
import { Transaction } from '../../types';
import { BalanceDisplay } from '../common/BalanceDisplay';
import { TransactionStatusChip } from './TransactionStatusChip';
import { CategoryColorBadge } from '../categories/CategoryColorBadge';
import { useCategories } from '../../hooks/useCategories';
import { format } from 'date-fns';

interface TransactionListItemProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

export const TransactionListItem = ({ transaction, onEdit, onDelete }: TransactionListItemProps) => {
  const isTransfer = !!transaction.transferToAccountId;
  const { data: categories = [] } = useCategories();

  // Find the category for this transaction
  const category = transaction.categoryId
    ? categories.find((cat) => cat.id === transaction.categoryId) ||
      categories.flatMap((cat) => cat.children || []).find((child) => child.id === transaction.categoryId)
    : null;

  const handleEdit = () => {
    if (onEdit && !isTransfer) {
      onEdit(transaction);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(transaction);
    }
  };

  const formattedDate = format(new Date(transaction.date), 'MMM dd, yyyy');

  return (
    <TableRow hover>
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
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Uncategorized
          </Typography>
        )}
      </TableCell>
      <TableCell>
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
      <TableCell>
        <TransactionStatusChip status={transaction.status} />
      </TableCell>
      <TableCell align="right">
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          {!isTransfer && onEdit && (
            <IconButton size="small" onClick={handleEdit} title="Edit">
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton size="small" onClick={handleDelete} color="error" title="Delete">
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

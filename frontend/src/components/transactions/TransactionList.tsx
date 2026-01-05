import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  TablePagination,
} from '@mui/material';
import { Transaction, PaginationMeta } from '../../types';
import { TransactionListItem } from './TransactionListItem';
import { EmptyState } from '../common/EmptyState';
import { Receipt as ReceiptIcon } from '@mui/icons-material';

interface TransactionListProps {
  transactions: Transaction[];
  pagination?: PaginationMeta;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export const TransactionList = ({
  transactions,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
  onPageSizeChange,
}: TransactionListProps) => {
  const handleChangePage = (_event: unknown, newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage + 1); // MUI uses 0-based, API uses 1-based
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onPageSizeChange) {
      onPageSizeChange(parseInt(event.target.value, 10));
    }
  };

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<ReceiptIcon />}
        title="No transactions found"
        description="Create your first transaction to get started"
      />
    );
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Account</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <TransactionListItem
                key={transaction.id}
                transaction={transaction}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <TablePagination
          component="div"
          count={pagination.totalItems}
          page={pagination.page - 1} // MUI uses 0-based, API uses 1-based
          onPageChange={handleChangePage}
          rowsPerPage={pagination.pageSize}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      )}
    </Box>
  );
};

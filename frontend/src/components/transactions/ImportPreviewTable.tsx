import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  FormControlLabel,
  Checkbox,
  TablePagination,
} from '@mui/material';
import { CheckCircle, Warning, Error as ErrorIcon } from '@mui/icons-material';
import { useState } from 'react';
import { BalanceDisplay } from '../common/BalanceDisplay';
import { format } from 'date-fns';

interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  notes?: string;
  status?: 'PENDING' | 'CLEARED' | 'RECONCILED';
  validationStatus: 'valid' | 'duplicate' | 'error';
  errorMessage?: string;
}

interface ImportPreviewTableProps {
  transactions: ParsedTransaction[];
  skipDuplicates: boolean;
  onSkipDuplicatesChange: (skip: boolean) => void;
}

export const ImportPreviewTable = ({
  transactions,
  skipDuplicates,
  onSkipDuplicatesChange,
}: ImportPreviewTableProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const validCount = transactions.filter((t) => t.validationStatus === 'valid').length;
  const duplicateCount = transactions.filter((t) => t.validationStatus === 'duplicate').length;
  const errorCount = transactions.filter((t) => t.validationStatus === 'error').length;

  const toImport = skipDuplicates ? validCount : validCount + duplicateCount;
  const toSkip = skipDuplicates ? duplicateCount : 0;

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: 'valid' | 'duplicate' | 'error'): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'valid':
        return 'success';
      case 'duplicate':
        return 'warning';
      case 'error':
        return 'error';
    }
  };

  const getStatusIcon = (status: 'valid' | 'duplicate' | 'error') => {
    switch (status) {
      case 'valid':
        return <CheckCircle fontSize="small" />;
      case 'duplicate':
        return <Warning fontSize="small" />;
      case 'error':
        return <ErrorIcon fontSize="small" />;
    }
  };

  const getStatusLabel = (status: 'valid' | 'duplicate' | 'error'): string => {
    switch (status) {
      case 'valid':
        return 'Valid';
      case 'duplicate':
        return 'Duplicate';
      case 'error':
        return 'Error';
    }
  };

  const paginatedTransactions = transactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Preview Transactions
      </Typography>

      {/* Statistics */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          icon={<CheckCircle />}
          label={`${validCount} Valid`}
          color="success"
          variant="outlined"
        />
        <Chip
          icon={<Warning />}
          label={`${duplicateCount} Duplicates`}
          color="warning"
          variant="outlined"
        />
        <Chip
          icon={<ErrorIcon />}
          label={`${errorCount} Errors`}
          color="error"
          variant="outlined"
        />
      </Box>

      {/* Import Summary */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Import Summary:</strong> {toImport} transaction{toImport !== 1 ? 's' : ''} will be
          imported
          {toSkip > 0 && `, ${toSkip} will be skipped`}
          {errorCount > 0 && `, ${errorCount} will fail`}
        </Typography>
      </Alert>

      {/* Skip Duplicates Option */}
      {duplicateCount > 0 && (
        <FormControlLabel
          control={
            <Checkbox
              checked={skipDuplicates}
              onChange={(e) => onSkipDuplicatesChange(e.target.checked)}
            />
          }
          label={`Skip ${duplicateCount} duplicate transaction${duplicateCount !== 1 ? 's' : ''}`}
          sx={{ mb: 2 }}
        />
      )}

      {/* Error Summary */}
      {errorCount > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            <strong>{errorCount} transaction{errorCount !== 1 ? 's have' : ' has'} errors:</strong>
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            {transactions
              .filter((t) => t.validationStatus === 'error')
              .slice(0, 5)
              .map((t, index) => (
                <li key={index}>
                  <Typography variant="caption">
                    Row {transactions.indexOf(t) + 1}: {t.errorMessage}
                  </Typography>
                </li>
              ))}
            {errorCount > 5 && (
              <li>
                <Typography variant="caption">
                  ...and {errorCount - 5} more error{errorCount - 5 !== 1 ? 's' : ''}
                </Typography>
              </li>
            )}
          </Box>
        </Alert>
      )}

      {/* Transactions Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Row</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTransactions.map((transaction, index) => {
              const globalIndex = page * rowsPerPage + index;
              return (
                <TableRow
                  key={globalIndex}
                  sx={{
                    bgcolor:
                      transaction.validationStatus === 'error'
                        ? 'error.lighter'
                        : transaction.validationStatus === 'duplicate'
                        ? 'warning.lighter'
                        : 'success.lighter',
                  }}
                >
                  <TableCell>{globalIndex + 1}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(transaction.validationStatus)}
                      label={getStatusLabel(transaction.validationStatus)}
                      color={getStatusColor(transaction.validationStatus)}
                      size="small"
                    />
                    {transaction.errorMessage && (
                      <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                        {transaction.errorMessage}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.validationStatus !== 'error'
                      ? format(transaction.date, 'MMM dd, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>{transaction.description || '-'}</TableCell>
                  <TableCell align="right">
                    {transaction.validationStatus !== 'error' ? (
                      <BalanceDisplay amount={transaction.amount} showSign />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.type}
                      color={transaction.type === 'INCOME' ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                      {transaction.notes || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[25, 50, 100]}
        component="div"
        count={transactions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import { Transaction } from '../../types';

interface DeleteTransactionDialogProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteTransactionDialog = ({
  open,
  transaction,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteTransactionDialogProps) => {
  if (!transaction) return null;

  const isTransfer = !!transaction.transferToAccountId;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Transaction</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this transaction?
          <br />
          <strong>{transaction.description}</strong> - ${Math.abs(parseFloat(transaction.amount))}
        </DialogContentText>

        {isTransfer && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This is a transfer transaction. Both the source and destination transactions will be deleted.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import { Account } from '../../types';

interface DeleteAccountDialogProps {
  open: boolean;
  account: Account | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteAccountDialog = ({ open, account, onClose, onConfirm, isDeleting }: DeleteAccountDialogProps) => {
  if (!account) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Account</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the account <strong>{account.name}</strong>?
        </DialogContentText>

        <Alert severity="info" sx={{ mt: 2 }}>
          {account.isActive
            ? 'If this account has transactions, it will be deactivated instead of permanently deleted.'
            : 'This account is already inactive.'}
        </Alert>
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

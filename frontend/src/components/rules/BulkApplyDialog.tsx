import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  AlertTitle,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useBulkApply } from '../../hooks/useRules';

interface BulkApplyDialogProps {
  open: boolean;
  onClose: () => void;
}

export function BulkApplyDialog({ open, onClose }: BulkApplyDialogProps) {
  const bulkApply = useBulkApply();
  const [result, setResult] = useState<{
    processed: number;
    categorized: number;
    skipped: number;
    errors: Array<{ transactionId: string; error: string }>;
  } | null>(null);

  const handleApply = async () => {
    try {
      const res = await bulkApply.mutateAsync(undefined);
      setResult(res);
    } catch (error) {
      console.error('Bulk apply failed:', error);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Apply Rules to Uncategorized Transactions</DialogTitle>
      <DialogContent>
        {!result && !bulkApply.isPending && (
          <Box>
            <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
              <AlertTitle>What will happen?</AlertTitle>
              This will apply all enabled rules to transactions that are currently uncategorized.
              Only transactions that match a rule will be updated.
            </Alert>

            <Typography variant="body2" color="text.secondary">
              <strong>Process:</strong>
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="1. Find all uncategorized transactions"
                  secondary="Includes both null and 'Uncategorized' category"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="2. Evaluate each transaction against your rules"
                  secondary="In priority order (highest first)"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="3. Update matching transactions"
                  secondary="Assigns the category from the first matching rule"
                />
              </ListItem>
            </List>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              <strong>Note:</strong> Only rules will be evaluated. Bank category data (Akahu) is not
              used for existing transactions.
            </Typography>
          </Box>
        )}

        {bulkApply.isPending && (
          <Box>
            <Typography variant="body1" gutterBottom>
              Applying rules to transactions...
            </Typography>
            <LinearProgress sx={{ mt: 2 }} />
          </Box>
        )}

        {result && (
          <Box>
            {result.categorized > 0 ? (
              <Alert severity="success" icon={<SuccessIcon />} sx={{ mb: 2 }}>
                <AlertTitle>Success!</AlertTitle>
                Categorized {result.categorized} transaction{result.categorized !== 1 ? 's' : ''}
              </Alert>
            ) : (
              <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
                <AlertTitle>No Changes</AlertTitle>
                No transactions matched your rules
              </Alert>
            )}

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Summary:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary={`Processed: ${result.processed} transactions`} />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={`Categorized: ${result.categorized}`}
                    primaryTypographyProps={{ color: 'success.main' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={`Skipped: ${result.skipped}`}
                    secondary="No matching rules or already categorized"
                  />
                </ListItem>
                {result.errors.length > 0 && (
                  <ListItem>
                    <ListItemText
                      primary={`Errors: ${result.errors.length}`}
                      primaryTypographyProps={{ color: 'error.main' }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>

            {result.errors.length > 0 && (
              <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 2 }}>
                <AlertTitle>Some Errors Occurred</AlertTitle>
                {result.errors.slice(0, 3).map((err, idx) => (
                  <Typography key={idx} variant="caption" display="block">
                    • {err.error}
                  </Typography>
                ))}
                {result.errors.length > 3 && (
                  <Typography variant="caption" color="text.secondary">
                    ...and {result.errors.length - 3} more
                  </Typography>
                )}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {!result ? (
          <>
            <Button onClick={handleClose} disabled={bulkApply.isPending}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleApply}
              disabled={bulkApply.isPending}
            >
              {bulkApply.isPending ? 'Applying...' : 'Apply Rules'}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

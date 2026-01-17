/**
 * DeleteScopeDialog Component
 * Dialog for selecting deletion scope when deleting a budget instance from a template
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { BudgetWithStatus } from '../../types/budget.types';

export type DeleteScope = 'INSTANCE' | 'TEMPLATE';

interface DeleteScopeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (scope: DeleteScope) => void;
  budget?: BudgetWithStatus | null;
  templateName?: string;
}

/**
 * Dialog that prompts user to choose deletion scope for budget instances
 */
export const DeleteScopeDialog: React.FC<DeleteScopeDialogProps> = ({
  open,
  onClose,
  onConfirm,
  budget,
  templateName,
}) => {
  const [scope, setScope] = useState<DeleteScope>('INSTANCE');

  const handleConfirm = () => {
    onConfirm(scope);
    onClose();
  };

  const handleClose = () => {
    // Reset to default when closing
    setScope('INSTANCE');
    onClose();
  };

  // If budget doesn't have a template, this dialog shouldn't be shown
  if (!budget?.templateId) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Budget</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This budget is part of the <strong>{templateName || 'a recurring budget'}</strong>{' '}
            template. Choose what you want to delete:
          </Typography>
        </Box>

        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={scope}
            onChange={(e) => setScope(e.target.value as DeleteScope)}
          >
            <FormControlLabel
              value="INSTANCE"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Delete only this period
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Only this specific budget will be deleted. The template and other periods will
                    remain intact.
                  </Typography>
                </Box>
              }
              sx={{
                mb: 2,
                p: 1.5,
                border: '1px solid',
                borderColor: scope === 'INSTANCE' ? 'error.main' : 'divider',
                borderRadius: 1,
                bgcolor: scope === 'INSTANCE' ? 'error.lighter' : 'transparent',
              }}
            />

            <FormControlLabel
              value="TEMPLATE"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Delete entire recurring budget
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Delete the template and all future budget instances. Past and current period
                    budgets will be preserved as one-time budgets.
                  </Typography>
                </Box>
              }
              sx={{
                mb: 1,
                p: 1.5,
                border: '1px solid',
                borderColor: scope === 'TEMPLATE' ? 'error.main' : 'divider',
                borderRadius: 1,
                bgcolor: scope === 'TEMPLATE' ? 'error.lighter' : 'transparent',
              }}
            />
          </RadioGroup>
        </FormControl>

        {scope === 'INSTANCE' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            The recurring budget template will continue to generate budgets for future periods.
          </Alert>
        )}

        {scope === 'TEMPLATE' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will delete the template and all future budgets. This action cannot be undone.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteScopeDialog;

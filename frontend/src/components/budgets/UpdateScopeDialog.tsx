/**
 * UpdateScopeDialog Component
 * Dialog for confirming when a user wants to customize a virtual budget period
 *
 * With virtual periods architecture:
 * - Editing a virtual period creates an override
 * - This dialog confirms the user understands the change will only affect this specific period
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';

interface UpdateScopeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  budgetName?: string;
  templateName?: string;
  isVirtual?: boolean;
}

/**
 * Dialog that confirms user action when customizing a period
 */
export const UpdateScopeDialog: React.FC<UpdateScopeDialogProps> = ({
  open,
  onClose,
  onConfirm,
  budgetName,
  templateName,
  isVirtual = true,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isVirtual ? 'Customize Period' : 'Update Budget'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This budget is part of the <strong>{templateName || 'recurring budget'}</strong> template.
            {budgetName && ` (${budgetName})`}
          </Typography>
        </Box>

        {isVirtual ? (
          <>
            <Typography variant="body1" paragraph>
              You are about to customize this specific period. This will:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 2 }}>
              <li>
                <Typography variant="body2">
                  Save your changes only for this period
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Keep other periods at the template's default values
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Mark this period as customized (won't be affected by template changes)
                </Typography>
              </li>
            </Box>
            <Alert severity="info">
              To change all future periods, edit the template directly instead.
            </Alert>
          </>
        ) : (
          <>
            <Typography variant="body1" paragraph>
              This period has already been customized. Your changes will update
              only this specific period.
            </Typography>
            <Alert severity="info">
              To reset to template defaults, delete this override.
            </Alert>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained">
          {isVirtual ? 'Customize Period' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateScopeDialog;

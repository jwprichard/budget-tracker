/**
 * UpdateScopeDialog Component
 * Dialog for selecting update scope when editing a budget instance from a template
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
import { UpdateScope } from '../../types/budget.types';

interface UpdateScopeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (scope: UpdateScope) => void;
  budgetName?: string;
  templateName?: string;
}

/**
 * Dialog that prompts user to choose update scope for budget instance edits
 */
export const UpdateScopeDialog: React.FC<UpdateScopeDialogProps> = ({
  open,
  onClose,
  onConfirm,
  budgetName,
  templateName,
}) => {
  const [scope, setScope] = useState<UpdateScope>('THIS_AND_FUTURE');

  const handleConfirm = () => {
    onConfirm(scope);
    onClose();
  };

  const handleClose = () => {
    // Reset to default when closing
    setScope('THIS_AND_FUTURE');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Update Budget</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This budget is part of the <strong>{templateName || 'recurring budget'}</strong> template.
            {budgetName && ` (${budgetName})`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose how you want to apply your changes:
          </Typography>
        </Box>

        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={scope}
            onChange={(e) => setScope(e.target.value as UpdateScope)}
          >
            <FormControlLabel
              value="THIS_ONLY"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Update only this period
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Changes will only affect this specific budget. The template and other periods
                    remain unchanged.
                  </Typography>
                </Box>
              }
              sx={{
                mb: 2,
                p: 1.5,
                border: '1px solid',
                borderColor: scope === 'THIS_ONLY' ? 'primary.main' : 'divider',
                borderRadius: 1,
                bgcolor: scope === 'THIS_ONLY' ? 'action.selected' : 'transparent',
              }}
            />

            <FormControlLabel
              value="THIS_AND_FUTURE"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Update this and future periods (Recommended)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Changes will apply to this budget and all future non-customized budgets from
                    this template. Past budgets remain unchanged.
                  </Typography>
                </Box>
              }
              sx={{
                mb: 2,
                p: 1.5,
                border: '1px solid',
                borderColor:
                  scope === 'THIS_AND_FUTURE' ? 'primary.main' : 'divider',
                borderRadius: 1,
                bgcolor: scope === 'THIS_AND_FUTURE' ? 'action.selected' : 'transparent',
              }}
            />

            <FormControlLabel
              value="ALL"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Update all periods
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Changes will apply to all budgets from this template, including past, current,
                    and future periods. This will also update the template itself.
                  </Typography>
                </Box>
              }
              sx={{
                mb: 1,
                p: 1.5,
                border: '1px solid',
                borderColor: scope === 'ALL' ? 'primary.main' : 'divider',
                borderRadius: 1,
                bgcolor: scope === 'ALL' ? 'action.selected' : 'transparent',
              }}
            />
          </RadioGroup>
        </FormControl>

        {scope === 'THIS_ONLY' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            This budget will be marked as "customized" and won't be affected by future template
            changes.
          </Alert>
        )}

        {scope === 'ALL' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will overwrite any customizations made to individual budgets.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained">
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateScopeDialog;

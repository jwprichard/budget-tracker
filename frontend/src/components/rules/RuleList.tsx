import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { useRules, useUpdateRule, useDeleteRule } from '../../hooks/useRules';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { RuleBuilder } from './RuleBuilder';
import { CategoryRule } from '../../services/rule.service';

export function RuleList() {
  const [showDisabled, setShowDisabled] = useState(false);
  const [editingRule, setEditingRule] = useState<CategoryRule | null>(null);
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<CategoryRule | null>(null);

  const { data: rules, isLoading, error } = useRules(showDisabled);
  const updateRule = useUpdateRule();
  const deleteRule = useDeleteRule();

  const handleToggleEnabled = async (rule: CategoryRule) => {
    await updateRule.mutateAsync({
      id: rule.id,
      data: { isEnabled: !rule.isEnabled },
    });
  };

  const handleDelete = async () => {
    if (deleteConfirmRule) {
      await deleteRule.mutateAsync(deleteConfirmRule.id);
      setDeleteConfirmRule(null);
    }
  };

  const formatRuleCondition = (rule: CategoryRule): string => {
    if (rule.conditions.type === 'text') {
      const { field, operator, value, caseSensitive } = rule.conditions.textMatch;
      const caseText = caseSensitive ? ' (case sensitive)' : '';
      return `${field} ${operator} "${value}"${caseText}`;
    }
    return 'Unknown condition';
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading rules..." />;
  }

  if (error) {
    return <ErrorAlert error={error} title="Failed to load rules" />;
  }

  if (!rules || rules.length === 0) {
    return (
      <Alert severity="info">
        No rules created yet. Create your first rule to automatically categorize transactions!
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {rules.length} rule{rules.length !== 1 ? 's' : ''} • Evaluated in priority order
        </Typography>
        <FormControlLabel
          control={<Switch checked={showDisabled} onChange={(e) => setShowDisabled(e.target.checked)} />}
          label="Show disabled"
        />
      </Box>

      {rules.map((rule) => (
        <Card
          key={rule.id}
          sx={{
            mb: 2,
            opacity: rule.isEnabled ? 1 : 0.6,
            borderLeft: 4,
            borderColor: rule.isEnabled ? 'primary.main' : 'divider',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              {/* Drag handle (visual only for Phase 2) */}
              <Box sx={{ color: 'text.disabled', cursor: 'move', mt: 0.5 }}>
                <DragIcon />
              </Box>

              {/* Rule info */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h6">{rule.name}</Typography>
                  {rule.isSystem && (
                    <Chip label="System" size="small" color="primary" variant="outlined" />
                  )}
                  {!rule.isEnabled && (
                    <Chip label="Disabled" size="small" color="default" variant="outlined" />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {formatRuleCondition(rule)}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  {rule.category && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: rule.category.color,
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        → {rule.category.name}
                      </Typography>
                    </Box>
                  )}
                  <Chip
                    label={`Priority: ${rule.priority}`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20 }}
                  />
                  <Chip
                    label={`Matched ${rule.matchCount} times`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20 }}
                  />
                </Box>
              </Box>

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={rule.isEnabled}
                      onChange={() => handleToggleEnabled(rule)}
                      disabled={rule.isSystem || updateRule.isPending}
                      size="small"
                    />
                  }
                  label=""
                />
                <IconButton
                  onClick={() => setEditingRule(rule)}
                  disabled={rule.isSystem}
                  size="small"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => setDeleteConfirmRule(rule)}
                  disabled={rule.isSystem}
                  size="small"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={Boolean(editingRule)} onClose={() => setEditingRule(null)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Rule</DialogTitle>
        <DialogContent>
          {editingRule && (
            <RuleBuilder
              initialData={editingRule}
              onSave={(data) => {
                updateRule.mutate({ id: editingRule.id, data });
                setEditingRule(null);
              }}
              onCancel={() => setEditingRule(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteConfirmRule)} onClose={() => setDeleteConfirmRule(null)}>
        <DialogTitle>Delete Rule?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the rule "{deleteConfirmRule?.name}"? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmRule(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleteRule.isPending}>
            {deleteRule.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

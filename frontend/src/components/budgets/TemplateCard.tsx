/**
 * TemplateCard Component
 * Displays a budget template with expandable list of budget instances
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { BudgetTemplate, BudgetWithStatus, BudgetType } from '../../types/budget.types';
import { formatCurrency } from '../../utils/formatters';

interface TemplateCardProps {
  template: BudgetTemplate;
  budgets?: BudgetWithStatus[]; // Budget instances for this template
  onEdit: (template: BudgetTemplate) => void;
  onDelete: (template: BudgetTemplate) => void;
  onEditBudget?: (budget: BudgetWithStatus) => void;
  onDeleteBudget?: (budget: BudgetWithStatus) => void;
}

/**
 * Format start date for display
 */
const formatBudgetDate = (startDate: string): string => {
  const date = new Date(startDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Get period type display name
 */
const getPeriodTypeName = (periodType: string, interval?: number): string => {
  const displayInterval = interval && interval > 1 ? ` (Every ${interval})` : '';

  switch (periodType) {
    case 'DAILY':
      return 'Daily' + displayInterval;
    case 'WEEKLY':
      return 'Weekly' + displayInterval;
    case 'FORTNIGHTLY':
      return 'Fortnightly' + displayInterval;
    case 'MONTHLY':
      return 'Monthly' + displayInterval;
    case 'ANNUALLY':
      return 'Annually' + displayInterval;
    default:
      return periodType + displayInterval;
  }
};

/**
 * Get color based on budget type
 */
const getBudgetTypeColor = (type: BudgetType): string => {
  return type === 'INCOME' ? '#4caf50' : '#9c27b0'; // Green for income, purple for expense
};

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  budgets = [],
  onEdit,
  onDelete,
  onEditBudget,
  onDeleteBudget,
}) => {
  const [expanded, setExpanded] = useState(false);
  const budgetTypeColor = getBudgetTypeColor(template.type);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `4px solid ${budgetTypeColor}`,
        '&:hover': {
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header: Template name + Status badges */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {template.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Budget Type Chip */}
            <Chip
              label={template.type}
              size="small"
              sx={{ backgroundColor: budgetTypeColor, color: 'white', fontWeight: 'bold' }}
            />
            <Chip
              label={template.isActive ? 'Active' : 'Inactive'}
              color={template.isActive ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </Box>

        {/* Category badge */}
        <Chip
          label={template.categoryName}
          size="small"
          sx={{
            bgcolor: template.categoryColor,
            color: 'white',
            mb: 2,
          }}
        />

        {/* Period type badge */}
        <Chip
          label={`${getPeriodTypeName(template.periodType, template.interval)} Template`}
          variant="outlined"
          size="small"
          sx={{ mb: 2, ml: 1 }}
        />

        {/* Amount */}
        <Typography variant="h4" sx={{ mb: 2, color: 'primary.main', fontWeight: 700 }}>
          {formatCurrency(template.amount)}
        </Typography>

        {/* Instance count */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <ScheduleIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {template.totalInstances} budget{template.totalInstances !== 1 ? 's' : ''} created
          </Typography>
        </Box>

        {/* Active instances */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {template.activeInstances} active (future/current)
        </Typography>

        {/* Next period info */}
        {template.nextPeriodStart && template.isActive && (
          <Typography variant="body2" color="text.secondary">
            Next: {formatBudgetDate(template.nextPeriodStart)}
          </Typography>
        )}

        {/* End date */}
        {template.endDate && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Ends: {new Date(template.endDate).toLocaleDateString()}
          </Typography>
        )}

        {/* Notes */}
        {template.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
            {template.notes}
          </Typography>
        )}
      </CardContent>

      <Divider />

      {/* Actions */}
      <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Box>
          <IconButton
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show budget instances"
            size="small"
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {expanded ? 'Hide' : 'Show'} Budgets ({budgets.length})
          </Typography>
        </Box>
        <Box>
          <IconButton onClick={() => onEdit(template)} size="small" color="primary">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => onDelete(template)} size="small" color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardActions>

      {/* Expandable budget instances list */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <Box sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 400, overflow: 'auto' }}>
          {budgets.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center">
              No budget instances yet
            </Typography>
          ) : (
            <List dense disablePadding>
              {budgets.map((budget, index) => (
                <React.Fragment key={budget.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      py: 1.5,
                      px: 0,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <ListItemText
                        primary={formatBudgetDate(budget.startDate)}
                        secondary={
                          <>
                            {formatCurrency(budget.amount)}
                            {budget.name && ` - ${budget.name}`}
                            {budget.isCustomized && (
                              <Chip
                                label="Customized"
                                size="small"
                                sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
                              />
                            )}
                          </>
                        }
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      <Box>
                        {onEditBudget && (
                          <IconButton size="small" onClick={() => onEditBudget(budget)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        {onDeleteBudget && (
                          <IconButton size="small" onClick={() => onDeleteBudget(budget)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    {/* Budget progress bar */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {budget.type === 'INCOME' ? 'Received' : 'Spent'}: {formatCurrency(budget.spent)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {budget.percentage.toFixed(0)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(budget.percentage, 100)}
                        color={
                          budget.status === 'UNDER_BUDGET'
                            ? 'success'
                            : budget.status === 'ON_TRACK'
                            ? 'info'
                            : budget.status === 'WARNING'
                            ? 'warning'
                            : 'error'
                        }
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Collapse>
    </Card>
  );
};

export default TemplateCard;

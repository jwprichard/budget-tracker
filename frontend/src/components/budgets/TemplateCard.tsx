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
import { BudgetTemplate, BudgetWithStatus } from '../../types/budget.types';
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
 * Format period display (e.g., "January 2026", "Q1 2026", "Week 12 2026")
 */
const formatPeriod = (
  periodType: string,
  year: number,
  periodNumber: number
): string => {
  switch (periodType) {
    case 'MONTHLY':
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return `${monthNames[periodNumber - 1]} ${year}`;
    case 'QUARTERLY':
      return `Q${periodNumber} ${year}`;
    case 'WEEKLY':
      return `W${periodNumber} ${year}`;
    case 'ANNUALLY':
      return `${year}`;
    default:
      return `${periodType} ${periodNumber} ${year}`;
  }
};

/**
 * Get period type display name
 */
const getPeriodTypeName = (periodType: string): string => {
  switch (periodType) {
    case 'MONTHLY':
      return 'Monthly';
    case 'QUARTERLY':
      return 'Quarterly';
    case 'WEEKLY':
      return 'Weekly';
    case 'ANNUALLY':
      return 'Annually';
    default:
      return periodType;
  }
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

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header: Template name + Status badge */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {template.name}
          </Typography>
          <Chip
            label={template.isActive ? 'Active' : 'Inactive'}
            color={template.isActive ? 'success' : 'default'}
            size="small"
          />
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
          label={`${getPeriodTypeName(template.periodType)} Template`}
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
        {template.nextPeriod && template.isActive && (
          <Typography variant="body2" color="text.secondary">
            Next: {formatPeriod(template.periodType, template.nextPeriod.year, template.nextPeriod.periodNumber)}
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
                        primary={formatPeriod(budget.periodType, budget.periodYear, budget.periodNumber)}
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
                          Spent: {formatCurrency(budget.spent)}
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

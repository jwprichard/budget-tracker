/**
 * BudgetProgress Component
 * Linear progress bar with status-based coloring
 */

import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import { BudgetStatus } from '../../types/budget.types';

interface BudgetProgressProps {
  percentage: number;
  status: BudgetStatus;
  showLabel?: boolean;
}

/**
 * Get color based on budget status
 */
const getStatusColor = (status: BudgetStatus): string => {
  switch (status) {
    case 'UNDER_BUDGET':
      return '#4CAF50'; // Green
    case 'ON_TRACK':
      return '#2196F3'; // Blue
    case 'WARNING':
      return '#FF9800'; // Orange
    case 'EXCEEDED':
      return '#F44336'; // Red
    default:
      return '#757575'; // Gray
  }
};

/**
 * Get background color (lighter version) based on status
 */
const getStatusBackgroundColor = (status: BudgetStatus): string => {
  switch (status) {
    case 'UNDER_BUDGET':
      return '#E8F5E9'; // Light green
    case 'ON_TRACK':
      return '#E3F2FD'; // Light blue
    case 'WARNING':
      return '#FFF3E0'; // Light orange
    case 'EXCEEDED':
      return '#FFEBEE'; // Light red
    default:
      return '#F5F5F5'; // Light gray
  }
};

export const BudgetProgress: React.FC<BudgetProgressProps> = ({
  percentage,
  status,
  showLabel = true,
}) => {
  const color = getStatusColor(status);
  const backgroundColor = getStatusBackgroundColor(status);
  const displayPercentage = Math.min(percentage, 100);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <LinearProgress
        variant="determinate"
        value={displayPercentage}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor,
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
            borderRadius: 4,
          },
        }}
        aria-label={`Budget ${percentage.toFixed(1)}% used`}
      />
      {showLabel && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: percentage > 50 ? '#fff' : color,
              fontWeight: 600,
              textShadow: percentage > 50 ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
              fontSize: '0.7rem',
            }}
          >
            {percentage.toFixed(1)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BudgetProgress;

import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import { triggerSync } from '../../services/sync.service';

interface SyncButtonProps {
  connectionId: string;
  onSyncStart?: (syncHistoryId: string) => void;
  onSyncError?: (error: Error) => void;
  variant?: 'button' | 'icon';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  daysBack?: number;
}

/**
 * SyncButton Component
 *
 * Triggers bank synchronization for a connection.
 * Shows loading state during sync initiation.
 *
 * @param connectionId - Bank connection ID
 * @param onSyncStart - Callback when sync starts successfully
 * @param onSyncError - Callback when sync fails to start
 * @param variant - Button variant: 'button' or 'icon'
 * @param size - Button size
 * @param disabled - Disable button
 * @param daysBack - Number of days back to sync (optional)
 */
export const SyncButton: React.FC<SyncButtonProps> = ({
  connectionId,
  onSyncStart,
  onSyncError,
  variant = 'button',
  size = 'medium',
  disabled = false,
  daysBack,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);

      // Calculate startDate if daysBack is provided
      const options: { startDate?: string; endDate?: string } = {};
      if (daysBack !== undefined && daysBack > 0) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);
        options.startDate = startDate.toISOString();
      }

      const result = await triggerSync({ connectionId, options });

      if (result.syncHistoryId && onSyncStart) {
        onSyncStart(result.syncHistoryId);
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      if (onSyncError && error instanceof Error) {
        onSyncError(error);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  if (variant === 'icon') {
    return (
      <Tooltip title="Sync transactions">
        <span>
          <IconButton
            onClick={handleSync}
            disabled={disabled || isSyncing}
            size={size}
            color="primary"
          >
            {isSyncing ? (
              <CircularProgress size={20} />
            ) : (
              <SyncIcon />
            )}
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={isSyncing ? <CircularProgress size={20} /> : <SyncIcon />}
      onClick={handleSync}
      disabled={disabled || isSyncing}
      size={size}
    >
      {isSyncing ? 'Syncing...' : 'Sync Transactions'}
    </Button>
  );
};

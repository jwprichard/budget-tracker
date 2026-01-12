import React, { useEffect, useState } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Typography,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SyncIcon from '@mui/icons-material/Sync';
import { getSyncStatus, type SyncStatus } from '../../services/sync.service';

interface SyncStatusIndicatorProps {
  syncHistoryId?: string;
  onSyncComplete?: (status: SyncStatus) => void;
  onSyncError?: (status: SyncStatus) => void;
  compact?: boolean;
}

/**
 * SyncStatusIndicator Component
 *
 * Shows current sync status with visual indicators.
 * Polls for status updates while sync is in progress.
 *
 * @param syncHistoryId - Sync history ID to monitor
 * @param onSyncComplete - Callback when sync completes successfully
 * @param onSyncError - Callback when sync fails
 * @param compact - Show compact version
 */
export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  syncHistoryId,
  onSyncComplete,
  onSyncError,
  compact = false,
}) => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!syncHistoryId) {
      setStatus(null);
      setIsPolling(false);
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (isMounted) {
        setIsPolling(false);
      }
    };

    const pollStatus = async () => {
      // Don't make request if unmounted
      if (!isMounted) {
        stopPolling();
        return;
      }

      try {
        const syncStatus = await getSyncStatus(syncHistoryId);

        // Only update state if component is still mounted
        if (!isMounted) {
          stopPolling();
          return;
        }

        setStatus(syncStatus);

        // Stop polling if sync is complete or failed
        if (syncStatus.status === 'COMPLETED') {
          stopPolling();
          if (onSyncComplete) {
            onSyncComplete(syncStatus);
          }
        } else if (syncStatus.status === 'FAILED') {
          stopPolling();
          if (onSyncError) {
            onSyncError(syncStatus);
          }
        }
      } catch (error) {
        console.error('Failed to fetch sync status:', error);
        stopPolling();
      }
    };

    // Initial fetch
    setIsPolling(true);
    pollStatus();

    // Poll every 5 seconds while in progress (reduced from 2s to minimize backend load)
    intervalId = setInterval(pollStatus, 5000);

    // Cleanup function - CRITICAL for React StrictMode
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  }, [syncHistoryId, onSyncComplete, onSyncError]);

  if (!status) {
    return null;
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'IN_PROGRESS':
      case 'PENDING':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'COMPLETED':
        return <CheckCircleIcon />;
      case 'FAILED':
        return <ErrorIcon />;
      case 'IN_PROGRESS':
      case 'PENDING':
        return <SyncIcon className="rotating" />;
      default:
        return <SyncIcon />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'COMPLETED':
        return `Synced ${status.transactionsImported} transactions`;
      case 'FAILED':
        return `Sync failed: ${status.errorMessage || 'Unknown error'}`;
      case 'IN_PROGRESS':
        return `Syncing... (${status.transactionsFetched} fetched)`;
      case 'PENDING':
        return 'Starting sync...';
      default:
        return 'Unknown status';
    }
  };

  if (compact) {
    return (
      <Tooltip title={getStatusText()}>
        <Chip
          icon={isPolling ? <CircularProgress size={16} /> : getStatusIcon()}
          label={status.status}
          color={getStatusColor()}
          size="small"
        />
      </Tooltip>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {isPolling && <CircularProgress size={20} />}
        {!isPolling && getStatusIcon()}
        <Typography variant="body2" color="text.secondary">
          {getStatusText()}
        </Typography>
      </Box>

      {status.status === 'IN_PROGRESS' && (
        <LinearProgress variant="indeterminate" />
      )}

      {status.status === 'COMPLETED' && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Imported: {status.transactionsImported} |
            Duplicates: {status.duplicatesDetected} |
            Review: {status.needsReview}
          </Typography>
        </Box>
      )}

      <style>
        {`
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          .rotating {
            animation: rotate 2s linear infinite;
          }
        `}
      </style>
    </Box>
  );
};

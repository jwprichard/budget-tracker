import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { healthCheck } from '../services/api';
import { HealthCheckResponse } from '../types';

export default function Home() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await healthCheck();
        setHealth(data);
      } catch (err) {
        setError('Failed to connect to API');
        console.error('Health check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Budget Tracker
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
          Track expenses, forecast cash flow, and manage your budget
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          System Status
        </Typography>

        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" icon={<ErrorIcon />}>
            {error}
          </Alert>
        )}

        {health && !loading && !error && (
          <Box>
            <Box display="flex" gap={2} mb={2} flexWrap="wrap">
              <Chip
                icon={health.status === 'ok' ? <CheckCircle /> : <ErrorIcon />}
                label={`API: ${health.status.toUpperCase()}`}
                color={health.status === 'ok' ? 'success' : 'error'}
              />
              <Chip
                icon={
                  health.database === 'connected' ? <CheckCircle /> : <ErrorIcon />
                }
                label={`Database: ${health.database.toUpperCase()}`}
                color={health.database === 'connected' ? 'success' : 'error'}
              />
              <Chip label={`Version: ${health.version}`} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Last checked: {new Date(health.timestamp).toLocaleString()}
            </Typography>
          </Box>
        )}
      </Paper>

      <Box sx={{ mt: 4 }}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Development Environment Active</strong>
          </Typography>
          <Typography variant="caption">
            This is a proof of concept. The application is currently in the initial setup phase.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
}

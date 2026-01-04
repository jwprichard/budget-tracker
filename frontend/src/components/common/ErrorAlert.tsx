import { Alert, AlertTitle } from '@mui/material';

interface ErrorAlertProps {
  error: Error | null;
  title?: string;
}

export const ErrorAlert = ({ error, title = 'Error' }: ErrorAlertProps) => {
  if (!error) return null;

  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      <AlertTitle>{title}</AlertTitle>
      {error.message || 'An unexpected error occurred'}
    </Alert>
  );
};

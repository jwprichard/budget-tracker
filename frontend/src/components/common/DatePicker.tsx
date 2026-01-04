import { TextField } from '@mui/material';
import { forwardRef } from 'react';

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  maxDate?: string;
  minDate?: string;
}

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      label = 'Date',
      value,
      onChange,
      error,
      helperText,
      required = false,
      disabled = false,
      fullWidth = true,
      maxDate,
      minDate,
    },
    ref
  ) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    };

    // Get today's date in YYYY-MM-DD format for max date restriction
    const today = new Date().toISOString().split('T')[0];

    return (
      <TextField
        ref={ref}
        label={label}
        type="date"
        value={value}
        onChange={handleChange}
        error={error}
        helperText={helperText}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        InputLabelProps={{
          shrink: true,
        }}
        inputProps={{
          max: maxDate || today, // Default to today to prevent future dates
          min: minDate,
        }}
      />
    );
  }
);

DatePicker.displayName = 'DatePicker';

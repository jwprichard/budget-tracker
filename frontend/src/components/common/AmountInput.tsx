import { TextField, InputAdornment } from '@mui/material';
import { forwardRef } from 'react';

interface AmountInputProps {
  label?: string;
  value: number | string;
  onChange: (value: number) => void;
  currency?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const AmountInput = forwardRef<HTMLDivElement, AmountInputProps>(
  (
    {
      label = 'Amount',
      value,
      onChange,
      currency = 'USD',
      error,
      helperText,
      required = false,
      disabled = false,
      fullWidth = true,
    },
    ref
  ) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;

      // Allow empty string
      if (inputValue === '') {
        onChange(0);
        return;
      }

      // Parse as float and validate
      const numericValue = parseFloat(inputValue);
      if (!isNaN(numericValue) && numericValue >= 0) {
        onChange(numericValue);
      }
    };

    const displayValue = value === 0 || value === '' ? '' : value;

    return (
      <TextField
        ref={ref}
        label={label}
        type="number"
        value={displayValue}
        onChange={handleChange}
        error={error}
        helperText={helperText}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        InputProps={{
          startAdornment: <InputAdornment position="start">{currency === 'USD' ? '$' : currency}</InputAdornment>,
          inputProps: {
            min: 0,
            step: 0.01,
          },
        }}
      />
    );
  }
);

AmountInput.displayName = 'AmountInput';

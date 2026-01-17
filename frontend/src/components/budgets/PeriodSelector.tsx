/**
 * PeriodSelector Component
 * Dynamic period selection based on period type (Weekly/Monthly/Quarterly/Annually)
 */

import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import { BudgetPeriod } from '../../types/budget.types';

interface PeriodSelectorProps {
  periodType: BudgetPeriod;
  periodYear: number;
  periodNumber: number;
  onPeriodTypeChange: (periodType: BudgetPeriod) => void;
  onPeriodYearChange: (year: number) => void;
  onPeriodNumberChange: (periodNumber: number) => void;
  disabled?: boolean;
}

/**
 * Get period number options based on period type
 */
const getPeriodNumberOptions = (periodType: BudgetPeriod): { value: number; label: string }[] => {
  switch (periodType) {
    case 'MONTHLY':
      return [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
      ];
    case 'QUARTERLY':
      return [
        { value: 1, label: 'Q1 (Jan-Mar)' },
        { value: 2, label: 'Q2 (Apr-Jun)' },
        { value: 3, label: 'Q3 (Jul-Sep)' },
        { value: 4, label: 'Q4 (Oct-Dec)' },
      ];
    case 'WEEKLY':
      // Generate weeks 1-53
      return Array.from({ length: 53 }, (_, i) => ({
        value: i + 1,
        label: `Week ${i + 1}`,
      }));
    case 'ANNUALLY':
      return [{ value: 1, label: 'Full Year' }];
    default:
      return [];
  }
};

/**
 * Get year options (current year ± 2)
 */
const getYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
};

/**
 * Get current period number for a given period type
 */
const getCurrentPeriodNumber = (periodType: BudgetPeriod): number => {
  const now = new Date();
  switch (periodType) {
    case 'MONTHLY':
      return now.getMonth() + 1; // 1-12
    case 'QUARTERLY':
      return Math.floor(now.getMonth() / 3) + 1; // 1-4
    case 'WEEKLY':
      // Simple ISO week calculation
      const target = new Date(now.valueOf());
      const dayNumber = (now.getDay() + 6) % 7;
      target.setDate(target.getDate() - dayNumber + 3);
      const firstThursday = target.valueOf();
      target.setMonth(0, 1);
      if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
      }
      return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    case 'ANNUALLY':
      return 1;
    default:
      return 1;
  }
};

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  periodType,
  periodYear,
  periodNumber,
  onPeriodTypeChange,
  onPeriodYearChange,
  onPeriodNumberChange,
  disabled = false,
}) => {
  const periodNumberOptions = getPeriodNumberOptions(periodType);
  const yearOptions = getYearOptions();
  const currentYear = new Date().getFullYear();
  const currentPeriodNumber = getCurrentPeriodNumber(periodType);

  const handlePeriodTypeChange = (event: SelectChangeEvent<BudgetPeriod>) => {
    const newPeriodType = event.target.value as BudgetPeriod;
    onPeriodTypeChange(newPeriodType);

    // Reset to current period when period type changes
    const newPeriodNumber = getCurrentPeriodNumber(newPeriodType);
    onPeriodNumberChange(newPeriodNumber);
  };

  const handlePeriodYearChange = (event: SelectChangeEvent<number>) => {
    onPeriodYearChange(Number(event.target.value));
  };

  const handlePeriodNumberChange = (event: SelectChangeEvent<number>) => {
    onPeriodNumberChange(Number(event.target.value));
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth disabled={disabled}>
          <InputLabel id="period-type-label">Period Type</InputLabel>
          <Select
            labelId="period-type-label"
            id="period-type"
            value={periodType}
            label="Period Type"
            onChange={handlePeriodTypeChange}
          >
            <MenuItem value="MONTHLY">Monthly</MenuItem>
            <MenuItem value="WEEKLY">Weekly</MenuItem>
            <MenuItem value="QUARTERLY">Quarterly</MenuItem>
            <MenuItem value="ANNUALLY">Annually</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={4}>
        <FormControl fullWidth disabled={disabled}>
          <InputLabel id="period-year-label">Year</InputLabel>
          <Select
            labelId="period-year-label"
            id="period-year"
            value={periodYear}
            label="Year"
            onChange={handlePeriodYearChange}
          >
            {yearOptions.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
                {year === currentYear && ' (Current)'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={4}>
        <FormControl fullWidth disabled={disabled}>
          <InputLabel id="period-number-label">Period</InputLabel>
          <Select
            labelId="period-number-label"
            id="period-number"
            value={periodNumber}
            label="Period"
            onChange={handlePeriodNumberChange}
          >
            {periodNumberOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
                {periodYear === currentYear && option.value === currentPeriodNumber && ' (Current)'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default PeriodSelector;

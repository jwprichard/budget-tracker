import React, { useState } from 'react';
import {
  Box,
  TextField,
  Stack,
  Button,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { formatDateForInput } from '../../utils/formatters';

export interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  minDate?: string;
  maxDate?: string;
  compact?: boolean; // Stack vertically for sidebar use
}

/**
 * DateRangePicker Component
 * Provides date range selection with preset options
 * (Last 7 days, Last 30 days, Last 3 months, etc.)
 */
export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate = formatDateForInput(new Date()),
  compact = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const presetMenuOpen = Boolean(anchorEl);

  // Handle preset menu
  const handlePresetMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePresetMenuClose = () => {
    setAnchorEl(null);
  };

  // Calculate date range for presets
  const getPresetRange = (preset: string): DateRange => {
    const today = new Date();
    const endDate = formatDateForInput(today);
    let startDate: string;

    switch (preset) {
      case 'last7days':
        const last7 = new Date(today);
        last7.setDate(today.getDate() - 7);
        startDate = formatDateForInput(last7);
        break;
      case 'last30days':
        const last30 = new Date(today);
        last30.setDate(today.getDate() - 30);
        startDate = formatDateForInput(last30);
        break;
      case 'last3months':
        const last3Months = new Date(today);
        last3Months.setMonth(today.getMonth() - 3);
        startDate = formatDateForInput(last3Months);
        break;
      case 'last6months':
        const last6Months = new Date(today);
        last6Months.setMonth(today.getMonth() - 6);
        startDate = formatDateForInput(last6Months);
        break;
      case 'thisMonth':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = formatDateForInput(monthStart);
        break;
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = formatDateForInput(lastMonthStart);
        return {
          startDate,
          endDate: formatDateForInput(lastMonthEnd),
        };
      case 'thisYear':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        startDate = formatDateForInput(yearStart);
        break;
      case 'lastYear':
        const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
        startDate = formatDateForInput(lastYearStart);
        return {
          startDate,
          endDate: formatDateForInput(lastYearEnd),
        };
      default:
        startDate = endDate;
    }

    return { startDate, endDate };
  };

  // Handle preset selection
  const handlePresetSelect = (preset: string) => {
    const range = getPresetRange(preset);
    onChange(range);
    handlePresetMenuClose();
  };

  // Handle manual date changes
  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      startDate: event.target.value,
    });
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      endDate: event.target.value,
    });
  };

  // Calculate days in range
  const getDaysInRange = (): number => {
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const daysInRange = getDaysInRange();

  return (
    <Box>
      <Stack direction={compact ? 'column' : 'row'} spacing={compact ? 2 : 1} alignItems={compact ? 'stretch' : 'center'} flexWrap="wrap">
        {/* Start Date */}
        <TextField
          label="Start Date"
          type="date"
          value={value.startDate}
          onChange={handleStartDateChange}
          size="small"
          fullWidth={compact}
          InputLabelProps={{ shrink: true }}
          inputProps={{
            min: minDate,
            max: value.endDate,
          }}
        />

        {/* End Date */}
        <TextField
          label="End Date"
          type="date"
          value={value.endDate}
          onChange={handleEndDateChange}
          size="small"
          fullWidth={compact}
          InputLabelProps={{ shrink: true }}
          inputProps={{
            min: value.startDate,
            max: maxDate,
          }}
        />

        {/* Preset Button and Days indicator */}
        <Stack direction="row" spacing={1} alignItems="center" justifyContent={compact ? 'space-between' : 'flex-start'}>
          <Button
            variant="outlined"
            size="small"
            onClick={handlePresetMenuOpen}
            startIcon={<CalendarIcon />}
          >
            Presets
          </Button>

          {/* Days indicator */}
          <Chip
            label={`${daysInRange} day${daysInRange !== 1 ? 's' : ''}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Stack>
      </Stack>

      {/* Preset Menu */}
      <Menu
        anchorEl={anchorEl}
        open={presetMenuOpen}
        onClose={handlePresetMenuClose}
      >
        <MenuItem onClick={() => handlePresetSelect('last7days')}>Last 7 days</MenuItem>
        <MenuItem onClick={() => handlePresetSelect('last30days')}>Last 30 days</MenuItem>
        <MenuItem onClick={() => handlePresetSelect('last3months')}>Last 3 months</MenuItem>
        <MenuItem onClick={() => handlePresetSelect('last6months')}>Last 6 months</MenuItem>
        <MenuItem onClick={() => handlePresetSelect('thisMonth')}>This month</MenuItem>
        <MenuItem onClick={() => handlePresetSelect('lastMonth')}>Last month</MenuItem>
        <MenuItem onClick={() => handlePresetSelect('thisYear')}>This year</MenuItem>
        <MenuItem onClick={() => handlePresetSelect('lastYear')}>Last year</MenuItem>
      </Menu>
    </Box>
  );
};

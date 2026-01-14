import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Chip,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { useAccounts } from '../../hooks/useAccounts';
import { useCategories } from '../../hooks/useCategories';
import { Account, Category } from '../../types';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export interface AnalyticsFiltersState {
  dateRange: DateRange;
  accountIds: string[];
  categoryIds: string[];
}

interface AnalyticsFiltersProps {
  value: AnalyticsFiltersState;
  onChange: (filters: AnalyticsFiltersState) => void;
  showCategoryFilter?: boolean;
}

/**
 * AnalyticsFilters Component
 * Combined filter panel for analytics views
 * Includes date range, account selection, and optional category selection
 */
export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  value,
  onChange,
  showCategoryFilter = false,
}) => {
  // Fetch accounts and categories
  const { data: accountsData } = useAccounts();
  const { data: categoriesData } = useCategories();

  const accounts = accountsData || [];
  const categories = categoriesData || [];

  // Handle date range change
  const handleDateRangeChange = (dateRange: DateRange) => {
    onChange({
      ...value,
      dateRange,
    });
  };

  // Handle account filter change
  const handleAccountsChange = (event: SelectChangeEvent<string[]>) => {
    const selectedValue = event.target.value;
    onChange({
      ...value,
      accountIds: typeof selectedValue === 'string' ? selectedValue.split(',') : selectedValue,
    });
  };

  // Handle category filter change
  const handleCategoriesChange = (event: SelectChangeEvent<string[]>) => {
    const selectedValue = event.target.value;
    onChange({
      ...value,
      categoryIds: typeof selectedValue === 'string' ? selectedValue.split(',') : selectedValue,
    });
  };

  // Get selected account names
  const getSelectedAccountNames = (): string[] => {
    if (value.accountIds.length === 0) return [];
    return accounts
      .filter((account: Account) => value.accountIds.includes(account.id))
      .map((account: Account) => account.name);
  };

  // Get selected category names
  const getSelectedCategoryNames = (): string[] => {
    if (value.categoryIds.length === 0) return [];
    return categories
      .filter((category: Category) => value.categoryIds.includes(category.id))
      .map((category: Category) => category.name);
  };

  return (
    <Card elevation={1}>
      <CardContent>
        <Stack spacing={3}>
          {/* Date Range */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Date Range
            </Typography>
            <DateRangePicker value={value.dateRange} onChange={handleDateRangeChange} />
          </Box>

          {/* Account Filter */}
          <FormControl fullWidth size="small">
            <InputLabel id="account-filter-label">Accounts</InputLabel>
            <Select
              labelId="account-filter-label"
              multiple
              value={value.accountIds}
              onChange={handleAccountsChange}
              input={<OutlinedInput label="Accounts" />}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <em>All accounts</em>;
                }
                const names = getSelectedAccountNames();
                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {names.map((name) => (
                      <Chip key={name} label={name} size="small" />
                    ))}
                  </Box>
                );
              }}
              MenuProps={MenuProps}
            >
              <MenuItem value="">
                <em>All accounts</em>
              </MenuItem>
              {accounts.map((account: Account) => (
                <MenuItem key={account.id} value={account.id}>
                  <Checkbox checked={value.accountIds.indexOf(account.id) > -1} />
                  <ListItemText
                    primary={account.name}
                    secondary={account.type}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Category Filter (Optional) */}
          {showCategoryFilter && (
            <FormControl fullWidth size="small">
              <InputLabel id="category-filter-label">Categories</InputLabel>
              <Select
                labelId="category-filter-label"
                multiple
                value={value.categoryIds}
                onChange={handleCategoriesChange}
                input={<OutlinedInput label="Categories" />}
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <em>All categories</em>;
                  }
                  const names = getSelectedCategoryNames();
                  return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {names.map((name) => (
                        <Chip key={name} label={name} size="small" />
                      ))}
                    </Box>
                  );
                }}
                MenuProps={MenuProps}
              >
                <MenuItem value="">
                  <em>All categories</em>
                </MenuItem>
                {categories
                  .filter((cat: Category) => !cat.parentId) // Only show parent categories
                  .map((category: Category) => (
                    <MenuItem key={category.id} value={category.id}>
                      <Checkbox checked={value.categoryIds.indexOf(category.id) > -1} />
                      <ListItemText
                        primary={category.name}
                        secondary={
                          category.children && category.children.length > 0
                            ? `${category.children.length} subcategories`
                            : undefined
                        }
                      />
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}

          {/* Filter Summary */}
          {(value.accountIds.length > 0 || value.categoryIds.length > 0) && (
            <Box sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Active Filters:
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                {value.accountIds.length > 0 && (
                  <Chip
                    label={`${value.accountIds.length} account${value.accountIds.length !== 1 ? 's' : ''}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {value.categoryIds.length > 0 && (
                  <Chip
                    label={`${value.categoryIds.length} categor${value.categoryIds.length !== 1 ? 'ies' : 'y'}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

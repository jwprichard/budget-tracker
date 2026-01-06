import { FormControl, InputLabel, Select, MenuItem, Box, Typography, CircularProgress } from '@mui/material';
import { useCategories } from '../../hooks/useCategories';
import { CategoryColorBadge } from './CategoryColorBadge';
import { Category } from '../../types';

interface CategorySelectProps {
  value: string;
  onChange: (categoryId: string) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  includeUncategorized?: boolean;
  disabled?: boolean;
}

export const CategorySelect = ({
  value,
  onChange,
  label = 'Category',
  error = false,
  helperText,
  includeUncategorized = true,
  disabled = false,
}: CategorySelectProps) => {
  const { data: categories, isLoading } = useCategories();

  // Flatten the category hierarchy for the dropdown
  const flattenCategories = (cats: Category[] | undefined): Category[] => {
    if (!cats) return [];
    const result: Category[] = [];

    cats.forEach((cat) => {
      result.push(cat);
      // Add children with indentation marker
      if (cat.children && cat.children.length > 0) {
        cat.children.forEach((child) => {
          result.push({ ...child, name: `  ${child.name}` }); // Add indentation
        });
      }
    });

    return result;
  };

  const flatCategories = flattenCategories(categories);

  return (
    <FormControl fullWidth error={error} disabled={disabled || isLoading}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        label={label}
        renderValue={(selected) => {
          if (!selected) return includeUncategorized ? 'Uncategorized' : '';

          const category = flatCategories.find((c) => c.id === selected);
          if (!category) return selected;

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CategoryColorBadge color={category.color} />
              <span>{category.name.trim()}</span>
            </Box>
          );
        }}
      >
        {includeUncategorized && (
          <MenuItem value="">
            <Typography color="text.secondary">Uncategorized</Typography>
          </MenuItem>
        )}
        {isLoading ? (
          <MenuItem disabled>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Loading categories...
          </MenuItem>
        ) : (
          flatCategories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryColorBadge color={category.color} />
                <span>{category.name}</span>
              </Box>
            </MenuItem>
          ))
        )}
      </Select>
      {helperText && (
        <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5, ml: 2 }}>
          {helperText}
        </Typography>
      )}
    </FormControl>
  );
};

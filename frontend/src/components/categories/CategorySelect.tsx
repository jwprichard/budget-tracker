import { Box, CircularProgress, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useCategoryHierarchy } from '../../hooks/useCategories';
import { CategoryColorBadge } from './CategoryColorBadge';
import { TreeSelect, TreeNode } from '../common/TreeSelect';
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
  const { data: categories, isLoading } = useCategoryHierarchy();

  // Convert categories to TreeNode format
  const treeData = useMemo((): TreeNode<Category>[] => {
    if (!categories) return [];

    const convertToTreeNode = (category: Category): TreeNode<Category> => ({
      id: category.id,
      data: category,
      children: category.children?.map(convertToTreeNode),
    });

    return categories.map(convertToTreeNode);
  }, [categories]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Loading categories...
        </Typography>
      </Box>
    );
  }

  return (
    <TreeSelect<Category>
      items={treeData}
      value={value}
      onChange={(categoryId) => onChange(categoryId)}
      label={label}
      placeholder="Select category..."
      getItemLabel={(category) => category.name}
      allowEmpty={includeUncategorized}
      emptyLabel="Uncategorized"
      error={error}
      helperText={helperText}
      disabled={disabled}
      renderItem={(category) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <CategoryColorBadge color={category.color} size={12} />
          <Typography variant="body2">{category.name}</Typography>
        </Box>
      )}
      renderValue={(category) =>
        category ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryColorBadge color={category.color} size={14} />
            <span>{category.name}</span>
          </Box>
        ) : (
          <span>Uncategorized</span>
        )
      }
    />
  );
};

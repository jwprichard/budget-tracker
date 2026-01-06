import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { ChevronRight, ExpandMore } from '@mui/icons-material';
import { useCategoryHierarchy } from '../../hooks/useCategories';
import { CategoryColorBadge } from './CategoryColorBadge';
import { Category } from '../../types';

interface CategoryTreeViewProps {
  onCategorySelect?: (category: Category) => void;
  selectedId?: string;
  showTransactionCount?: boolean;
}

export const CategoryTreeView = ({
  onCategorySelect,
  selectedId,
  showTransactionCount = false,
}: CategoryTreeViewProps) => {
  const { data: categories, isLoading, error } = useCategoryHierarchy();

  const renderTree = (category: Category): React.ReactElement => {
    const hasChildren = category.children && category.children.length > 0;
    const transactionCount = category._count?.transactions;

    return (
      <TreeItem
        key={category.id}
        itemId={category.id}
        label={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 0.5,
            }}
            onClick={() => onCategorySelect?.(category)}
          >
            <CategoryColorBadge color={category.color} size={14} />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {category.name}
            </Typography>
            {showTransactionCount && transactionCount !== undefined && (
              <Typography variant="caption" color="text.secondary">
                ({transactionCount})
              </Typography>
            )}
          </Box>
        }
      >
        {hasChildren && category.children?.map((child) => renderTree(child))}
      </TreeItem>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2 }}>Loading categories...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load categories. Please try again.
      </Alert>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No categories found. Create your first category to get started.
      </Alert>
    );
  }

  return (
    <SimpleTreeView
      slots={{
        collapseIcon: ExpandMore,
        expandIcon: ChevronRight,
      }}
      selectedItems={selectedId}
      sx={{
        flexGrow: 1,
        maxWidth: 400,
        overflowY: 'auto',
      }}
    >
      {categories.map((category) => renderTree(category))}
    </SimpleTreeView>
  );
};

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import { useDeleteCategory } from '../../hooks/useCategories';
import { Category } from '../../types';
import { CategoryColorBadge } from './CategoryColorBadge';

interface DeleteCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  category: Category | null;
}

export const DeleteCategoryDialog = ({ open, onClose, category }: DeleteCategoryDialogProps) => {
  const deleteMutation = useDeleteCategory();

  const handleDelete = async () => {
    if (!category) return;

    try {
      await deleteMutation.mutateAsync(category.id);
      onClose();
    } catch (error: unknown) {
      // Error will be displayed in the alert below
      console.error('Failed to delete category:', error);
    }
  };

  if (!category) return null;

  const hasChildren = category.children && category.children.length > 0;
  const hasTransactions = category._count && category._count.transactions > 0;
  const canDelete = !hasChildren && !hasTransactions;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color="warning" />
        Delete Category
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Are you sure you want to delete this category?
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <CategoryColorBadge color={category.color} size={16} />
            <Typography variant="subtitle1" fontWeight="medium">
              {category.name}
            </Typography>
          </Box>
        </Box>

        {!canDelete && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {hasChildren && (
              <Typography variant="body2">
                This category has {category.children!.length} child {category.children!.length === 1 ? 'category' : 'categories'}.
                Please delete or move the child categories first.
              </Typography>
            )}
            {hasTransactions && (
              <Typography variant="body2" sx={{ mt: hasChildren ? 1 : 0 }}>
                This category is used in {category._count!.transactions} transaction{category._count!.transactions === 1 ? '' : 's'}.
                Please reassign or delete those transactions first.
              </Typography>
            )}
          </Alert>
        )}

        {canDelete && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. The category will be permanently deleted.
          </Alert>
        )}

        {deleteMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {deleteMutation.error instanceof Error
              ? deleteMutation.error.message
              : 'Failed to delete category. Please try again.'}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleteMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          color="error"
          variant="contained"
          disabled={!canDelete || deleteMutation.isPending}
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

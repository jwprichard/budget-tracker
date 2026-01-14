import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Fab,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Category as CategoryIcon,
  ViewList as ListViewIcon,
  AccountTree as TreeViewIcon,
} from '@mui/icons-material';
import { useCategories } from '../hooks/useCategories';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { CategoryCard } from '../components/categories/CategoryCard';
import { CategoryForm } from '../components/categories/CategoryForm';
import { DeleteCategoryDialog } from '../components/categories/DeleteCategoryDialog';
import { CategoryTreeView } from '../components/categories/CategoryTreeView';
import { Category } from '../types';

export const Categories = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');

  const { data: categories = [], isLoading, error } = useCategories();

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    // Fetch stats for the category to show transaction count
    setDeletingCategory({ ...category });
  };

  const handleCreateNew = () => {
    setEditingCategory(undefined);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingCategory(undefined);
  };

  const handleCloseDelete = () => {
    setDeletingCategory(null);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LoadingSpinner message="Loading categories..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <ErrorAlert error={error} title="Failed to load categories" />
      </Container>
    );
  }

  const rootCategories = categories.filter((c) => !c.parentId);
  const totalCategories = categories.length;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Categories
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Organize your transactions with categories
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="grid" aria-label="grid view">
              <ListViewIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="tree" aria-label="tree view">
              <TreeViewIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateNew}>
            Create Category
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {totalCategories} {totalCategories === 1 ? 'category' : 'categories'} total
          {rootCategories.length > 0 && ` (${rootCategories.length} root ${rootCategories.length === 1 ? 'category' : 'categories'})`}
        </Typography>
      </Box>

      {/* Content */}
      {categories.length === 0 ? (
        <EmptyState
          icon={<CategoryIcon sx={{ fontSize: 64 }} />}
          title="No categories yet"
          description="Create your first category to start organizing your transactions"
          actionLabel="Create Category"
          onAction={handleCreateNew}
        />
      ) : viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {rootCategories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <CategoryCard
                category={category}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showStats={false}
              />
              {/* Show child categories */}
              {category.children && category.children.length > 0 && (
                <Box sx={{ ml: 3, mt: 2 }}>
                  <Grid container spacing={2}>
                    {category.children.map((child) => (
                      <Grid item xs={12} key={child.id}>
                        <CategoryCard
                          category={child}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          showStats={false}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Grid>
          ))}
        </Grid>
      ) : (
        <CategoryTreeView
          onCategorySelect={(category) => {
            // Could navigate to category details or open edit dialog
            console.log('Selected category:', category);
          }}
        />
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="create category"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleCreateNew}
      >
        <AddIcon />
      </Fab>

      {/* Create/Edit Category Dialog */}
      <CategoryForm open={formOpen} onClose={handleCloseForm} category={editingCategory} />

      {/* Delete Category Dialog */}
      <DeleteCategoryDialog
        open={deletingCategory !== null}
        onClose={handleCloseDelete}
        category={deletingCategory}
      />
    </Container>
  );
};

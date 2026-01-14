import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
} from '@mui/material';
import { useCategories, useCreateCategory, useUpdateCategory } from '../../hooks/useCategories';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../types';
import { CategoryColorBadge } from './CategoryColorBadge';

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  category?: Category; // If provided, we're editing
}

const PRESET_COLORS = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFEB3B',
  '#FFC107',
  '#FF9800',
  '#FF5722',
  '#795548',
  '#9E9E9E',
  '#607D8B',
];

export const CategoryForm = ({ open, onClose, category }: CategoryFormProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#757575');
  const [icon, setIcon] = useState('');
  const [parentId, setParentId] = useState<string>('');

  const { data: categories } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  // Initialize form with category data if editing
  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
      setIcon(category.icon || '');
      setParentId(category.parentId || '');
    } else {
      // Reset form for new category
      setName('');
      setColor('#757575');
      setIcon('');
      setParentId('');
    }
  }, [category, open]);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    try {
      if (category) {
        // Update existing category
        const updateData: UpdateCategoryDto = {
          name: name.trim(),
          color,
          icon: icon.trim() || undefined,
          parentId: parentId || undefined,
        };
        await updateMutation.mutateAsync({ id: category.id, data: updateData });
      } else {
        // Create new category
        const createData: CreateCategoryDto = {
          name: name.trim(),
          color,
          icon: icon.trim() || undefined,
          parentId: parentId || undefined,
        };
        await createMutation.mutateAsync(createData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleClose = () => {
    setName('');
    setColor('#757575');
    setIcon('');
    setParentId('');
    onClose();
  };

  // Filter out the current category and its children from parent options (can't be its own parent)
  const availableParents = categories?.filter((c) => {
    if (!category) return true; // All available for new categories
    return c.id !== category.id && c.parentId !== category.id;
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{category ? 'Edit Category' : 'Create Category'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Name Field */}
          <TextField
            label="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            autoFocus
            inputProps={{ maxLength: 50 }}
            helperText={`${name.length}/50 characters`}
          />

          {/* Color Picker */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Color
            </Typography>
            <Grid container spacing={1}>
              {PRESET_COLORS.map((presetColor) => (
                <Grid item key={presetColor}>
                  <Box
                    onClick={() => setColor(presetColor)}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: presetColor,
                      cursor: 'pointer',
                      border: color === presetColor ? '3px solid #000' : '1px solid rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.1s',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                    }}
                  />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="Custom Color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                sx={{ width: 120 }}
                InputLabelProps={{ shrink: true }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryColorBadge color={color} size={24} />
                <Typography variant="caption">{color.toUpperCase()}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Icon Field (optional) */}
          <TextField
            label="Icon Name (optional)"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            fullWidth
            helperText="Material-UI icon name (e.g., 'Home', 'Restaurant')"
            inputProps={{ maxLength: 50 }}
          />

          {/* Parent Category */}
          <FormControl fullWidth>
            <InputLabel>Parent Category (optional)</InputLabel>
            <Select value={parentId} onChange={(e) => setParentId(e.target.value)} label="Parent Category (optional)">
              <MenuItem value="">
                <Typography color="text.secondary">None (root category)</Typography>
              </MenuItem>
              {availableParents?.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryColorBadge color={cat.color} />
                    <span>{cat.name}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!name.trim() || isLoading}>
          {isLoading ? 'Saving...' : category ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

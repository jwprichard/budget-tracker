import { Card, CardContent, CardActions, Typography, Box, IconButton, Chip } from '@mui/material';
import { Edit, Delete, FolderOpen } from '@mui/icons-material';
import { Category } from '../../types';
import { CategoryColorBadge } from './CategoryColorBadge';

interface CategoryCardProps {
  category: Category;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onClick?: (category: Category) => void;
  showStats?: boolean;
}

export const CategoryCard = ({ category, onEdit, onDelete, onClick, showStats = false }: CategoryCardProps) => {
  const hasChildren = category.children && category.children.length > 0;
  const transactionCount = category._count?.transactions || 0;

  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: 3,
            }
          : {},
      }}
      onClick={() => onClick?.(category)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CategoryColorBadge color={category.color} size={16} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {category.name}
          </Typography>
          {hasChildren && (
            <Chip
              icon={<FolderOpen fontSize="small" />}
              label={`${category.children!.length} child${category.children!.length === 1 ? '' : 'ren'}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        {category.parent && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Parent:
            </Typography>
            <CategoryColorBadge color={category.parent.color} size={10} />
            <Typography variant="caption" color="text.secondary">
              {category.parent.name}
            </Typography>
          </Box>
        )}

        {showStats && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {transactionCount} transaction{transactionCount === 1 ? '' : 's'}
            </Typography>
          </Box>
        )}

        {category.icon && (
          <Typography variant="caption" color="text.secondary">
            Icon: {category.icon}
          </Typography>
        )}
      </CardContent>

      {(onEdit || onDelete) && (
        <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
          {onEdit && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(category);
              }}
              aria-label="edit category"
            >
              <Edit fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(category);
              }}
              aria-label="delete category"
            >
              <Delete fontSize="small" />
            </IconButton>
          )}
        </CardActions>
      )}
    </Card>
  );
};

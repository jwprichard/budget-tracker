import { Box } from '@mui/material';

interface CategoryColorBadgeProps {
  color: string;
  size?: number;
}

export const CategoryColorBadge = ({ color, size = 12 }: CategoryColorBadgeProps) => {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'inline-block',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        flexShrink: 0,
      }}
    />
  );
};

import React, { ReactNode } from 'react';
import { Box, Typography, Divider } from '@mui/material';

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children, icon }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          color: 'text.secondary',
        }}
      >
        {icon}
        <Typography
          variant="overline"
          sx={{
            fontWeight: 600,
            letterSpacing: 1,
            fontSize: '0.7rem',
          }}
        >
          {title}
        </Typography>
      </Box>
      <Divider sx={{ mb: 1 }} />
      <Box sx={{ px: 2 }}>{children}</Box>
    </Box>
  );
};

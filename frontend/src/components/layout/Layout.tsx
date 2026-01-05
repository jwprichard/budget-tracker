import { Box } from '@mui/material';
import { ReactNode } from 'react';
import { AppBar } from './AppBar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        {children}
      </Box>
    </Box>
  );
};

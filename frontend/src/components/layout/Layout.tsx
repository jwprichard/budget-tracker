import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { AppBar } from './AppBar';
import { Sidebar } from './Sidebar';
import { SidebarProvider } from '../../contexts/SidebarContext';

export const Layout = () => {
  return (
    <SidebarProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar />
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          <Sidebar />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              bgcolor: 'background.default',
              overflow: 'auto',
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </SidebarProvider>
  );
};

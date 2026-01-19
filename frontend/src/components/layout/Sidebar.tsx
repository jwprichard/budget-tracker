import React from 'react';
import {
  Box,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon,
  Settings as ConfigIcon,
  Build as ToolsIcon,
} from '@mui/icons-material';
import { useSidebarContext } from '../../contexts/SidebarContext';
import { SidebarSection } from './SidebarSection';

const SIDEBAR_WIDTH = 300;
const SIDEBAR_COLLAPSED_WIDTH = 48;

export const Sidebar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const {
    content,
    hasContent,
    isCollapsed,
    toggleCollapsed,
    isMobileOpen,
    setIsMobileOpen,
  } = useSidebarContext();

  // Don't render anything if there's no content
  if (!hasContent) {
    return null;
  }

  const sidebarContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Collapse toggle button */}
      {!isMobile && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: isCollapsed ? 'center' : 'flex-end',
            p: 1,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tooltip title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <IconButton size="small" onClick={toggleCollapsed}>
              {isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Content area - hidden when collapsed */}
      {!isCollapsed && (
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            py: 2,
          }}
        >
          {/* Configuration Section */}
          {content.config && (
            <SidebarSection title="Configuration" icon={<ConfigIcon fontSize="small" />}>
              {content.config}
            </SidebarSection>
          )}

          {/* Tools Section */}
          {content.tools && (
            <SidebarSection title="Tools" icon={<ToolsIcon fontSize="small" />}>
              {content.tools}
            </SidebarSection>
          )}
        </Box>
      )}
    </Box>
  );

  // Mobile: Use temporary drawer
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        anchor="left"
        open={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            top: 64, // Below AppBar
            height: 'calc(100% - 64px)',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  // Desktop: Permanent drawer with collapse
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        flexShrink: 0,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          position: 'relative',
          height: '100%',
          borderRight: 1,
          borderColor: 'divider',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

// Export constants for use in Layout
export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH };

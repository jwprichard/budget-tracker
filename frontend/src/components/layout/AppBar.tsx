import { useState } from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalance as AccountsIcon,
  Receipt as TransactionsIcon,
  Category as CategoryIcon,
  AccountBalanceWallet as BudgetIcon,
  Rule as RuleIcon,
  Sync as SyncIcon,
  CalendarMonth as CalendarIcon,
  BarChart as AnalyticsIcon,
  Build as DevelopmentIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  Tune as TuneIcon,
  EventRepeat as PlannedIcon,
  ShowChart as ForecastIcon,
  CompareArrows as MatchIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ThemePicker } from '../common/ThemePicker';
import { useSidebarControls } from '../../hooks/useSidebar';

interface NavigationItem {
  name: string;
  path?: string; // Optional for parent items with submenus
  icon: React.ReactElement;
  children?: NavigationItem[]; // Nested items for dropdown menus
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { name: 'Calendar', path: '/calendar', icon: <CalendarIcon /> },
  { name: 'Transactions', path: '/transactions', icon: <TransactionsIcon /> },
  {
    name: 'Planning',
    icon: <PlannedIcon />,
    children: [
      { name: 'Planned Transactions', path: '/planned-transactions', icon: <PlannedIcon /> },
      { name: 'Budgets', path: '/budgets', icon: <BudgetIcon /> },
      { name: 'Cash Flow Forecast', path: '/forecast', icon: <ForecastIcon /> },
      { name: 'Match Review', path: '/match-review', icon: <MatchIcon /> },
    ],
  },
  {
    name: 'Categorisation',
    icon: <CategoryIcon />,
    children: [
      { name: 'Categories', path: '/categories', icon: <CategoryIcon /> },
      { name: 'Rules', path: '/rules', icon: <RuleIcon /> },
    ],
  },
  {
    name: 'Analytics',
    icon: <AnalyticsIcon />,
    children: [
      { name: 'Spending Analysis', path: '/analytics/spending-analysis', icon: <PieChartIcon /> },
      { name: 'Trends & Patterns', path: '/analytics/trends-patterns', icon: <TrendingUpIcon /> },
    ],
  },
];

export const AppBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const { hasContent: hasSidebarContent, setIsMobileOpen: setSidebarMobileOpen } = useSidebarControls();

  // Dropdown menu state (desktop)
  const [planningMenuAnchor, setPlanningMenuAnchor] = useState<null | HTMLElement>(null);
  const [categorisationMenuAnchor, setCategorisationMenuAnchor] = useState<null | HTMLElement>(null);
  const [analyticsMenuAnchor, setAnalyticsMenuAnchor] = useState<null | HTMLElement>(null);

  // Collapse state (mobile)
  const [planningExpanded, setPlanningExpanded] = useState(false);
  const [categorisationExpanded, setCategorisationExpanded] = useState(false);
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
    // Close all menus
    setPlanningMenuAnchor(null);
    setCategorisationMenuAnchor(null);
    setAnalyticsMenuAnchor(null);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isPlanningActive = () => {
    return location.pathname === '/planned-transactions' ||
           location.pathname === '/budgets' ||
           location.pathname === '/forecast' ||
           location.pathname === '/match-review';
  };

  const isCategorisationActive = () => {
    return location.pathname === '/categories' || location.pathname === '/rules';
  };

  const isAnalyticsActive = () => {
    return location.pathname.startsWith('/analytics');
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (!user?.name) return '?';
    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      const firstInitial = nameParts[0]?.[0];
      const lastInitial = nameParts[nameParts.length - 1]?.[0];
      if (firstInitial && lastInitial) {
        return `${firstInitial}${lastInitial}`.toUpperCase();
      }
    }
    const initial = user.name[0];
    return initial ? initial.toUpperCase() : '?';
  };

  return (
    <>
      <MuiAppBar
        position="sticky"
        sx={{
          bgcolor: 'primary.main',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" component="div" sx={{ flexGrow: isMobile ? 1 : 0, mr: 4 }}>
            Budget Tracker
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
              {navigation.map((item) => {
                // Render dropdown menu for items with children
                if (item.children) {
                  let isActiveItem = false;
                  let menuAnchor = null;
                  let setMenuAnchor: (anchor: HTMLElement | null) => void = () => {};

                  if (item.name === 'Planning') {
                    isActiveItem = isPlanningActive();
                    menuAnchor = planningMenuAnchor;
                    setMenuAnchor = setPlanningMenuAnchor;
                  } else if (item.name === 'Categorisation') {
                    isActiveItem = isCategorisationActive();
                    menuAnchor = categorisationMenuAnchor;
                    setMenuAnchor = setCategorisationMenuAnchor;
                  } else if (item.name === 'Analytics') {
                    isActiveItem = isAnalyticsActive();
                    menuAnchor = analyticsMenuAnchor;
                    setMenuAnchor = setAnalyticsMenuAnchor;
                  }

                  return (
                    <Box key={item.name}>
                      <Button
                        color="inherit"
                        onClick={(e) => setMenuAnchor(e.currentTarget)}
                        sx={{
                          fontWeight: isActiveItem ? 'bold' : 'normal',
                          borderBottom: isActiveItem ? '2px solid white' : 'none',
                          borderRadius: 0,
                        }}
                        startIcon={item.icon}
                        endIcon={<ExpandMoreIcon />}
                      >
                        {item.name}
                      </Button>
                      <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={() => setMenuAnchor(null)}
                      >
                        {item.children.map((child) => (
                          <MenuItem
                            key={child.path}
                            onClick={() => child.path && handleNavigate(child.path)}
                            selected={child.path ? isActive(child.path) : false}
                          >
                            <ListItemIcon>{child.icon}</ListItemIcon>
                            <ListItemText>{child.name}</ListItemText>
                          </MenuItem>
                        ))}
                      </Menu>
                    </Box>
                  );
                }

                // Regular navigation button for items without children
                return (
                  <Button
                    key={item.path}
                    color="inherit"
                    onClick={() => item.path && handleNavigate(item.path)}
                    sx={{
                      fontWeight: item.path && isActive(item.path) ? 'bold' : 'normal',
                      borderBottom: item.path && isActive(item.path) ? '2px solid white' : 'none',
                      borderRadius: 0,
                    }}
                    startIcon={item.icon}
                  >
                    {item.name}
                  </Button>
                );
              })}
            </Box>
          )}

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            {/* Mobile sidebar toggle */}
            {isMobile && hasSidebarContent && (
              <IconButton
                color="inherit"
                onClick={() => setSidebarMobileOpen(true)}
                sx={{ mr: 1 }}
              >
                <TuneIcon />
              </IconButton>
            )}
            <ThemePicker />
            {!isMobile && user && (
              <Typography variant="body2" sx={{ color: 'white', mr: 1 }}>
                {user.name}
              </Typography>
            )}
            <IconButton
              onClick={handleUserMenuOpen}
              size="small"
              sx={{ ml: 1 }}
              aria-controls={userMenuAnchor ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={userMenuAnchor ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {getUserInitials()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </MuiAppBar>

      {/* User Menu */}
      <Menu
        id="user-menu"
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={user?.name}
            secondary={user?.email}
          />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleNavigate('/accounts'); handleUserMenuClose(); }}>
          <ListItemIcon>
            <AccountsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Accounts</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleNavigate('/bank-sync'); handleUserMenuClose(); }}>
          <ListItemIcon>
            <SyncIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Bank Sync</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleNavigate('/development'); handleUserMenuClose(); }}>
          <ListItemIcon>
            <DevelopmentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Development</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            {navigation.map((item) => {
              // Render collapsible menu for items with children
              if (item.children) {
                let isActiveItem = false;
                let isExpanded = false;
                let setExpanded: (expanded: boolean) => void = () => {};

                if (item.name === 'Planning') {
                  isActiveItem = isPlanningActive();
                  isExpanded = planningExpanded;
                  setExpanded = setPlanningExpanded;
                } else if (item.name === 'Categorisation') {
                  isActiveItem = isCategorisationActive();
                  isExpanded = categorisationExpanded;
                  setExpanded = setCategorisationExpanded;
                } else if (item.name === 'Analytics') {
                  isActiveItem = isAnalyticsActive();
                  isExpanded = analyticsExpanded;
                  setExpanded = setAnalyticsExpanded;
                }

                return (
                  <Box key={item.name}>
                    <ListItem disablePadding>
                      <ListItemButton
                        selected={isActiveItem}
                        onClick={() => setExpanded(!isExpanded)}
                      >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.name} />
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </ListItemButton>
                    </ListItem>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <List disablePadding>
                        {item.children.map((child) => (
                          <ListItem key={child.path} disablePadding>
                            <ListItemButton
                              sx={{ pl: 4 }}
                              selected={child.path ? isActive(child.path) : false}
                              onClick={() => child.path && handleNavigate(child.path)}
                            >
                              <ListItemIcon>{child.icon}</ListItemIcon>
                              <ListItemText primary={child.name} />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </Box>
                );
              }

              // Regular navigation item for items without children
              return (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    selected={item.path ? isActive(item.path) : false}
                    onClick={() => item.path && handleNavigate(item.path)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.name} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

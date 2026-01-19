import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
} from '@mui/material';
import { Palette, Check } from '@mui/icons-material';
import { useAppTheme } from '../../contexts/ThemeContext';

export const ThemePicker: React.FC = () => {
  const { currentTheme, setTheme, availableThemes } = useAppTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
    handleClose();
  };

  // Get the primary color for the color swatch
  const getPrimaryColor = (palette: typeof currentTheme.palette) => {
    if (palette?.primary && typeof palette.primary === 'object' && 'main' in palette.primary) {
      return palette.primary.main;
    }
    return '#000';
  };

  return (
    <>
      <Tooltip title="Change theme">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ color: 'inherit' }}
        >
          <Palette />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {availableThemes.map((theme) => (
          <MenuItem
            key={theme.id}
            onClick={() => handleThemeSelect(theme.id)}
            selected={theme.id === currentTheme.id}
          >
            <ListItemIcon>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: getPrimaryColor(theme.palette),
                  border: '2px solid',
                  borderColor: theme.palette?.mode === 'dark' ? '#374151' : '#e5e7eb',
                }}
              />
            </ListItemIcon>
            <ListItemText>{theme.name}</ListItemText>
            {theme.id === currentTheme.id && (
              <Check fontSize="small" sx={{ ml: 1, color: 'primary.main' }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

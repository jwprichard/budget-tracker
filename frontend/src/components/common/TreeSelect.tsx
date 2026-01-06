import { useState, useRef } from 'react';
import {
  FormControl,
  InputLabel,
  OutlinedInput,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  IconButton,
  Typography,
  FormHelperText,
} from '@mui/material';
import {
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

export interface TreeNode<T = any> {
  id: string;
  data: T;
  children?: TreeNode<T>[];
}

interface TreeSelectProps<T> {
  // Data
  items: TreeNode<T>[];
  value: string;
  onChange: (itemId: string, item: T) => void;

  // Display customization
  label?: string;
  placeholder?: string;
  renderItem?: (item: T, depth: number) => React.ReactNode;
  renderValue?: (item: T | null) => React.ReactNode;
  getItemLabel: (item: T) => string;

  // Optional features
  allowEmpty?: boolean;
  emptyLabel?: string;

  // Form state
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
}

export function TreeSelect<T>({
  items,
  value,
  onChange,
  label,
  placeholder = 'Select...',
  renderItem,
  renderValue,
  getItemLabel,
  allowEmpty = true,
  emptyLabel = 'None',
  error = false,
  helperText,
  disabled = false,
  required = false,
}: TreeSelectProps<T>) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLDivElement>(null);

  const open = Boolean(anchorEl);

  // Find selected item
  const findItemById = (id: string, nodes: TreeNode<T>[]): TreeNode<T> | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findItemById(id, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedItem = value ? findItemById(value, items) : null;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (itemId: string, item: T) => {
    onChange(itemId, item);
    handleClose();
  };

  const handleToggleExpand = (itemId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const renderTreeNode = (node: TreeNode<T>, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = value === node.id;

    return (
      <Box key={node.id}>
        <ListItem
          disablePadding
          sx={{
            pl: depth * 2,
            bgcolor: isSelected ? 'action.selected' : 'transparent',
          }}
        >
          {hasChildren && (
            <IconButton
              size="small"
              onClick={(e) => handleToggleExpand(node.id, e)}
              sx={{ mr: 0.5 }}
            >
              {isExpanded ? (
                <ExpandMoreIcon fontSize="small" />
              ) : (
                <ChevronRightIcon fontSize="small" />
              )}
            </IconButton>
          )}
          <ListItemButton
            onClick={() => handleSelect(node.id, node.data)}
            sx={{
              ml: hasChildren ? 0 : 4.5,
              py: 1,
              borderRadius: 1,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            {renderItem ? (
              renderItem(node.data, depth)
            ) : (
              <ListItemText primary={getItemLabel(node.data)} />
            )}
          </ListItemButton>
        </ListItem>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <List disablePadding>
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </List>
        )}
      </Box>
    );
  };

  const displayValueText = selectedItem
    ? getItemLabel(selectedItem.data)
    : allowEmpty
    ? emptyLabel
    : placeholder;

  const displayValueNode = selectedItem && renderValue
    ? renderValue(selectedItem.data)
    : null;

  return (
    <FormControl fullWidth error={error} disabled={disabled} required={required}>
      {label && <InputLabel shrink>{label}</InputLabel>}
      <Box
        ref={inputRef}
        onClick={handleOpen}
        sx={{
          position: 'relative',
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        <OutlinedInput
          value={displayValueText}
          readOnly
          label={label}
          placeholder={placeholder}
          notched={!!label}
          fullWidth
          sx={{
            cursor: disabled ? 'default' : 'pointer',
            '& input': {
              cursor: disabled ? 'default' : 'pointer',
              opacity: displayValueNode ? 0 : 1, // Hide text if custom render exists
            },
          }}
          endAdornment={
            <IconButton
              size="small"
              disabled={disabled}
              sx={{ pointerEvents: 'none' }}
            >
              {open ? <ExpandMoreIcon /> : <ChevronRightIcon />}
            </IconButton>
          }
        />
        {/* Custom rendered value overlay */}
        {displayValueNode && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 14,
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {displayValueNode}
          </Box>
        )}
      </Box>
      {helperText && (
        <FormHelperText>{helperText}</FormHelperText>
      )}

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: {
              width: inputRef.current?.offsetWidth || 300,
              maxHeight: 400,
              overflow: 'auto',
            },
          },
        }}
      >
        <List disablePadding sx={{ py: 1 }}>
          {allowEmpty && (
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleSelect('', null as any)}
                sx={{
                  py: 1,
                  bgcolor: !value ? 'action.selected' : 'transparent',
                }}
              >
                <ListItemText
                  primary={
                    <Typography color="text.secondary">{emptyLabel}</Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          )}
          {items.map((node) => renderTreeNode(node, 0))}
        </List>
      </Popover>
    </FormControl>
  );
}

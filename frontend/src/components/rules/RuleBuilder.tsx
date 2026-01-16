import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import { CategorySelect } from '../categories/CategorySelect';
import { CreateRuleDto, CategoryRule } from '../../services/rule.service';

interface RuleBuilderProps {
  onSave: (data: CreateRuleDto) => void;
  onCancel: () => void;
  initialData?: CategoryRule;
}

export function RuleBuilder({ onSave, onCancel, initialData }: RuleBuilderProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [field, setField] = useState<'description' | 'merchant' | 'notes'>(
    initialData?.conditions?.textMatch?.field || 'description'
  );
  const [operator, setOperator] = useState<'contains' | 'exact' | 'startsWith' | 'endsWith'>(
    initialData?.conditions?.textMatch?.operator || 'contains'
  );
  const [value, setValue] = useState(initialData?.conditions?.textMatch?.value || '');
  const [caseSensitive, setCaseSensitive] = useState(
    initialData?.conditions?.textMatch?.caseSensitive || false
  );
  const [priority, setPriority] = useState(initialData?.priority || 0);

  const handleSubmit = () => {
    if (!name || !categoryId || !value) {
      return; // Basic validation
    }

    onSave({
      name,
      categoryId,
      conditions: {
        type: 'text',
        textMatch: { field, operator, value, caseSensitive },
      },
      priority,
      isEnabled: true,
    });
  };

  const handleFieldChange = (event: SelectChangeEvent) => {
    setField(event.target.value as 'description' | 'merchant' | 'notes');
  };

  const handleOperatorChange = (event: SelectChangeEvent) => {
    setOperator(event.target.value as 'contains' | 'exact' | 'startsWith' | 'endsWith');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Create rules to automatically categorize transactions based on text matching.
      </Typography>

      <TextField
        label="Rule Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Costco → Groceries"
        fullWidth
        required
        helperText="A descriptive name for this rule"
      />

      <CategorySelect
        value={categoryId}
        onChange={setCategoryId}
        label="Assign to Category"
        includeUncategorized={false}
      />

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Match Condition
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Field</InputLabel>
            <Select value={field} onChange={handleFieldChange} label="Field">
              <MenuItem value="description">Description</MenuItem>
              <MenuItem value="merchant">Merchant</MenuItem>
              <MenuItem value="notes">Notes</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Operator</InputLabel>
            <Select value={operator} onChange={handleOperatorChange} label="Operator">
              <MenuItem value="contains">Contains</MenuItem>
              <MenuItem value="exact">Exactly Matches</MenuItem>
              <MenuItem value="startsWith">Starts With</MenuItem>
              <MenuItem value="endsWith">Ends With</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Search Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g., Costco"
            fullWidth
            required
            helperText="The text to match against"
          />

          <FormControlLabel
            control={
              <Checkbox checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
            }
            label="Case Sensitive"
          />
        </Box>
      </Box>

      <TextField
        label="Priority"
        type="number"
        value={priority}
        onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
        helperText="Higher priority rules are evaluated first (default: 0)"
        fullWidth
      />

      <Box display="flex" gap={2} justifyContent="flex-end">
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!name || !categoryId || !value}>
          {initialData ? 'Update Rule' : 'Create Rule'}
        </Button>
      </Box>
    </Box>
  );
}

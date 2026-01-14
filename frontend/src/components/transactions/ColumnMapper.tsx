import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  SelectChangeEvent,
} from '@mui/material';

interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  type?: string;
  notes?: string;
  dateFormat?: string;
  amountSign?: string;
}

interface ColumnMapperProps {
  headers: string[];
  rows: string[][];
  onMappingChange: (mapping: ColumnMapping) => void;
}

const REQUIRED_FIELDS = ['date', 'description', 'amount'] as const;
const OPTIONAL_FIELDS = ['type', 'notes'] as const;

const FIELD_LABELS: Record<string, string> = {
  date: 'Date',
  description: 'Description',
  amount: 'Amount',
  type: 'Type (Income/Expense)',
  notes: 'Notes',
};

export const ColumnMapper = ({ headers, rows, onMappingChange }: ColumnMapperProps) => {
  const [mapping, setMapping] = useState<Record<string, string>>({
    date: '',
    description: '',
    amount: '',
    type: '',
    notes: '',
  });

  const [dateFormat, setDateFormat] = useState<string>('YYYY-MM-DD');
  const [amountSign, setAmountSign] = useState<string>('negative-expense');

  // Auto-detect initial mapping based on header names
  const autoDetectMapping = () => {
    const detected: Record<string, string> = {};

    headers.forEach((header) => {
      const lowerHeader = header.toLowerCase();

      if (lowerHeader.includes('date') || lowerHeader.includes('time')) {
        detected['date'] = header;
      } else if (lowerHeader.includes('description') || lowerHeader.includes('desc') || lowerHeader.includes('memo')) {
        detected['description'] = header;
      } else if (lowerHeader.includes('amount') || lowerHeader.includes('value') || lowerHeader.includes('total')) {
        detected['amount'] = header;
      } else if (lowerHeader.includes('type') || lowerHeader.includes('category')) {
        detected['type'] = header;
      } else if (lowerHeader.includes('note') || lowerHeader.includes('comment')) {
        detected['notes'] = header;
      }
    });

    return detected;
  };

  // Initialize with auto-detected mapping
  useEffect(() => {
    const detected = autoDetectMapping();
    setMapping(detected);
    if (isValidMapping(detected)) {
      onMappingChange({
        ...detected,
        dateFormat,
        amountSign,
      } as ColumnMapping);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers]);

  // Update parent when dateFormat or amountSign changes
  useEffect(() => {
    if (isValidMapping(mapping)) {
      onMappingChange({
        ...mapping,
        dateFormat,
        amountSign,
      } as ColumnMapping);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFormat, amountSign]);

  const isValidMapping = (map: Record<string, string>): boolean => {
    return REQUIRED_FIELDS.every((field) => map[field] && map[field] !== '');
  };

  const handleMappingChange = (field: string) => (event: SelectChangeEvent<string>) => {
    const newMapping = {
      ...mapping,
      [field]: event.target.value,
    };
    setMapping(newMapping);

    if (isValidMapping(newMapping)) {
      onMappingChange({
        ...newMapping,
        dateFormat,
        amountSign,
      } as ColumnMapping);
    }
  };

  const getPreviewValue = (rowIndex: number, header: string): string => {
    const columnIndex = headers.indexOf(header);
    return columnIndex >= 0 && rows[rowIndex] ? (rows[rowIndex][columnIndex] || '') : '';
  };

  const getMappedPreview = (rowIndex: number): Record<string, string> => {
    const preview: Record<string, string> = {};
    Object.entries(mapping).forEach(([field, header]) => {
      if (header) {
        preview[field] = getPreviewValue(rowIndex, header);
      }
    });
    return preview;
  };

  const previewRows = rows.slice(0, 3);
  const isMappingValid = isValidMapping(mapping);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Map CSV Columns
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Match your CSV columns to transaction fields. Required fields are marked with *.
      </Typography>

      {!isMappingValid && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please map all required fields: Date, Description, and Amount
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {/* Required Fields */}
        {REQUIRED_FIELDS.map((field) => (
          <Grid item xs={12} sm={6} md={4} key={field}>
            <FormControl fullWidth required>
              <InputLabel>{FIELD_LABELS[field]}</InputLabel>
              <Select
                value={mapping[field] || ''}
                onChange={handleMappingChange(field)}
                label={FIELD_LABELS[field]}
              >
                <MenuItem value="">
                  <em>Not mapped</em>
                </MenuItem>
                {headers.map((header) => (
                  <MenuItem key={header} value={header}>
                    {header}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ))}

        {/* Optional Fields */}
        {OPTIONAL_FIELDS.map((field) => (
          <Grid item xs={12} sm={6} md={4} key={field}>
            <FormControl fullWidth>
              <InputLabel>{FIELD_LABELS[field]}</InputLabel>
              <Select
                value={mapping[field] || ''}
                onChange={handleMappingChange(field)}
                label={FIELD_LABELS[field]}
              >
                <MenuItem value="">
                  <em>Not mapped</em>
                </MenuItem>
                {headers.map((header) => (
                  <MenuItem key={header} value={header}>
                    {header}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ))}

        {/* Date Format */}
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Date Format</InputLabel>
            <Select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              label="Date Format"
            >
              <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (2024-01-15)</MenuItem>
              <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (01/15/2024)</MenuItem>
              <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (15/01/2024)</MenuItem>
              <MenuItem value="MM-DD-YYYY">MM-DD-YYYY (01-15-2024)</MenuItem>
              <MenuItem value="DD-MM-YYYY">DD-MM-YYYY (15-01-2024)</MenuItem>
              <MenuItem value="DD/MM/YY">DD/MM/YY (15/01/24)</MenuItem>
              <MenuItem value="MM/DD/YY">MM/DD/YY (01/15/24)</MenuItem>
              <MenuItem value="YY-MM-DD">YY-MM-DD (24-01-15)</MenuItem>
              <MenuItem value="DD-MM-YY">DD-MM-YY (15-01-24)</MenuItem>
              <MenuItem value="MM-DD-YY">MM-DD-YY (01-15-24)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Amount Sign Convention */}
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Amount Sign</InputLabel>
            <Select
              value={amountSign}
              onChange={(e) => setAmountSign(e.target.value)}
              label="Amount Sign"
            >
              <MenuItem value="negative-expense">Negative = Expense, Positive = Income</MenuItem>
              <MenuItem value="all-positive">All Positive (use Type column)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Preview */}
      {isMappingValid && previewRows.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Preview (first 3 rows)
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewRows.map((_, rowIndex) => {
                  const preview = getMappedPreview(rowIndex);
                  return (
                    <TableRow key={rowIndex}>
                      <TableCell>{preview['date'] || '-'}</TableCell>
                      <TableCell>{preview['description'] || '-'}</TableCell>
                      <TableCell align="right">{preview['amount'] || '-'}</TableCell>
                      <TableCell>{preview['type'] || 'Auto'}</TableCell>
                      <TableCell>{preview['notes'] || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

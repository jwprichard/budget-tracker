import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Warning } from '@mui/icons-material';
import { FileUpload } from '../common/FileUpload';
import { ColumnMapper } from './ColumnMapper';
import { ImportPreviewTable } from './ImportPreviewTable';
import { useParseCSV, useBulkImport } from '../../hooks/useTransactions';
import { parse, isValid } from 'date-fns';

interface TransactionImportDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
}

interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  type?: string;
  notes?: string;
  dateFormat?: string;
  amountSign?: string;
}

interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  notes?: string;
  status?: 'PENDING' | 'CLEARED' | 'RECONCILED';
  validationStatus: 'valid' | 'duplicate' | 'error';
  errorMessage?: string;
}

const steps = ['Upload CSV', 'Map Columns', 'Preview & Import', 'Results'];

const DATE_FORMATS = {
  'YYYY-MM-DD': 'yyyy-MM-dd',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'MM-DD-YYYY': 'MM-dd-yyyy',
  'DD-MM-YYYY': 'dd-MM-yyyy',
};

export const TransactionImportDialog = ({ open, onClose, accountId }: TransactionImportDialogProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);

  const parseCSVMutation = useParseCSV();
  const bulkImportMutation = useBulkImport();

  const handleFileSelect = async (file: File) => {
    try {
      const result = await parseCSVMutation.mutateAsync(file);
      setCsvHeaders(result.headers);
      setCsvRows(result.rows);
      setActiveStep(1);
    } catch (error) {
      console.error('Failed to parse CSV:', error);
    }
  };

  const handleMappingComplete = (newMapping: ColumnMapping) => {
    setMapping(newMapping);
  };

  const handleNext = () => {
    if (activeStep === 1 && mapping) {
      // Parse and validate transactions
      const parsed = parseTransactions();
      setParsedTransactions(parsed);
      setActiveStep(2);
    } else if (activeStep === 2) {
      // Start import
      handleImport();
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleClose = () => {
    // Reset state
    setActiveStep(0);
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping(null);
    setParsedTransactions([]);
    setImportResult(null);
    onClose();
  };

  const parseTransactions = (): ParsedTransaction[] => {
    if (!mapping) return [];

    const dateFormat = (mapping.dateFormat || 'YYYY-MM-DD') as keyof typeof DATE_FORMATS;
    const amountSign = (mapping.amountSign || 'negative-expense') as 'negative-expense' | 'all-positive';

    return csvRows.map((row, index) => {
      try {
        // Get values from mapped columns
        const dateValue = row[csvHeaders.indexOf(mapping.date)]?.trim();
        const descriptionValue = row[csvHeaders.indexOf(mapping.description)]?.trim();
        const amountValue = row[csvHeaders.indexOf(mapping.amount)]?.trim();
        const typeValue = mapping.type ? row[csvHeaders.indexOf(mapping.type)]?.trim() : '';
        const notesValue = mapping.notes ? row[csvHeaders.indexOf(mapping.notes)]?.trim() : '';

        // Validate required fields
        if (!dateValue || !descriptionValue || !amountValue) {
          return {
            date: new Date(),
            description: descriptionValue || '',
            amount: 0,
            type: 'EXPENSE' as const,
            validationStatus: 'error' as const,
            errorMessage: 'Missing required field (date, description, or amount)',
          };
        }

        // Parse date
        const parsedDate = parse(dateValue, DATE_FORMATS[dateFormat], new Date());
        if (!isValid(parsedDate)) {
          return {
            date: new Date(),
            description: descriptionValue,
            amount: 0,
            type: 'EXPENSE' as const,
            validationStatus: 'error' as const,
            errorMessage: `Invalid date format: ${dateValue}`,
          };
        }

        // Parse amount
        const cleanAmount = amountValue.replace(/[,$]/g, '');
        const amount = parseFloat(cleanAmount);
        if (isNaN(amount)) {
          return {
            date: parsedDate,
            description: descriptionValue,
            amount: 0,
            type: 'EXPENSE' as const,
            validationStatus: 'error' as const,
            errorMessage: `Invalid amount: ${amountValue}`,
          };
        }

        // Determine transaction type
        let type: 'INCOME' | 'EXPENSE';
        if (typeValue) {
          const lowerType = typeValue.toLowerCase();
          if (lowerType.includes('income') || lowerType.includes('credit') || lowerType.includes('deposit')) {
            type = 'INCOME';
          } else {
            type = 'EXPENSE';
          }
        } else {
          // Use amount sign
          if (amountSign === 'negative-expense') {
            type = amount < 0 ? 'EXPENSE' : 'INCOME';
          } else {
            type = 'EXPENSE'; // Default when all positive
          }
        }

        return {
          date: parsedDate,
          description: descriptionValue,
          amount: Math.abs(amount),
          type,
          notes: notesValue || undefined,
          validationStatus: 'valid' as const,
        };
      } catch (error) {
        return {
          date: new Date(),
          description: '',
          amount: 0,
          type: 'EXPENSE' as const,
          validationStatus: 'error' as const,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  };

  const handleImport = async () => {
    const validTransactions = parsedTransactions.filter(
      (t) => t.validationStatus === 'valid' || (t.validationStatus === 'duplicate' && !skipDuplicates)
    );

    const transactionsToImport = validTransactions.map((t) => ({
      type: t.type,
      amount: t.amount,
      date: t.date.toISOString(),
      description: t.description,
      notes: t.notes,
      status: t.status || ('CLEARED' as const),
    }));

    try {
      const result = await bulkImportMutation.mutateAsync({
        accountId,
        transactions: transactionsToImport,
        skipDuplicates,
      });

      setImportResult(result);
      setActiveStep(3);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const canProceed = () => {
    if (activeStep === 0) return false; // File upload handles navigation automatically
    if (activeStep === 1) return mapping !== null;
    if (activeStep === 2) {
      const validOrDuplicate = parsedTransactions.filter(
        (t) => t.validationStatus === 'valid' || t.validationStatus === 'duplicate'
      );
      return validOrDuplicate.length > 0;
    }
    return false;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Import Transactions from CSV</DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Upload CSV */}
        {activeStep === 0 && (
          <Box>
            <FileUpload onFileSelect={handleFileSelect} accept=".csv" maxSize={5} />
            {parseCSVMutation.isPending && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <CircularProgress />
              </Box>
            )}
            {parseCSVMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Failed to parse CSV file. Please check the file format and try again.
              </Alert>
            )}
          </Box>
        )}

        {/* Step 2: Map Columns */}
        {activeStep === 1 && (
          <ColumnMapper headers={csvHeaders} rows={csvRows} onMappingChange={handleMappingComplete} />
        )}

        {/* Step 3: Preview & Import */}
        {activeStep === 2 && (
          <Box>
            <ImportPreviewTable
              transactions={parsedTransactions}
              skipDuplicates={skipDuplicates}
              onSkipDuplicatesChange={setSkipDuplicates}
            />
            {bulkImportMutation.isPending && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3 }}>
                <CircularProgress sx={{ mr: 2 }} />
                <Typography>Importing transactions...</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Step 4: Results */}
        {activeStep === 3 && importResult && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="h6">Import Complete!</Typography>
            </Alert>

            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={`${importResult.imported} transaction${importResult.imported !== 1 ? 's' : ''} imported successfully`}
                />
              </ListItem>

              {importResult.skipped > 0 && (
                <ListItem>
                  <ListItemIcon>
                    <Warning color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${importResult.skipped} duplicate transaction${importResult.skipped !== 1 ? 's' : ''} skipped`}
                  />
                </ListItem>
              )}

              {importResult.errors.length > 0 && (
                <ListItem>
                  <ListItemIcon>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${importResult.errors.length} transaction${importResult.errors.length !== 1 ? 's' : ''} failed`}
                  />
                </ListItem>
              )}
            </List>

            {importResult.errors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Errors:</strong>
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                  {importResult.errors.slice(0, 10).map((error, index) => (
                    <li key={index}>
                      <Typography variant="caption">
                        Row {error.row}: {error.message}
                      </Typography>
                    </li>
                  ))}
                  {importResult.errors.length > 10 && (
                    <li>
                      <Typography variant="caption">
                        ...and {importResult.errors.length - 10} more error{importResult.errors.length - 10 !== 1 ? 's' : ''}
                      </Typography>
                    </li>
                  )}
                </Box>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {activeStep === 3 ? 'Done' : 'Cancel'}
        </Button>
        {activeStep > 0 && activeStep < 3 && (
          <Button onClick={handleBack} disabled={bulkImportMutation.isPending}>
            Back
          </Button>
        )}
        {activeStep < 3 && activeStep > 0 && (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={!canProceed() || bulkImportMutation.isPending}
          >
            {activeStep === 2 ? 'Import' : 'Next'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

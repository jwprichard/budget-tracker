import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  PlayArrow as ApplyIcon,
} from '@mui/icons-material';
import { useCreateRule } from '../hooks/useRules';
import { RuleBuilder } from '../components/rules/RuleBuilder';
import { RuleList } from '../components/rules/RuleList';
import { BulkApplyDialog } from '../components/rules/BulkApplyDialog';

export function Rules() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const createRule = useCreateRule();

  const handleSaveRule = async (data: any) => {
    await createRule.mutateAsync(data);
    setShowBuilder(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Category Rules</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ApplyIcon />}
              onClick={() => setShowBulkDialog(true)}
            >
              Bulk Apply
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowBuilder(!showBuilder)}
            >
              {showBuilder ? 'Cancel' : 'Create Rule'}
            </Button>
          </Box>
        </Box>

        {/* Help Section */}
        <Alert
          severity="info"
          icon={<InfoIcon />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setShowHelp(!showHelp)}
              endIcon={showHelp ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              {showHelp ? 'Hide' : 'Learn More'}
            </Button>
          }
        >
          <AlertTitle>Automatic Categorization</AlertTitle>
          Create rules to automatically assign categories to transactions based on text matching.
          <Collapse in={showHelp} sx={{ mt: 2 }}>
            <Typography variant="body2" paragraph>
              <strong>How it works:</strong>
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>
                Rules are evaluated in <strong>priority order</strong> (highest first) when new transactions
                are created
              </li>
              <li>The first matching rule assigns its category to the transaction</li>
              <li>If no rules match, transactions from your bank use Akahu's category data</li>
              <li>
                If neither rules nor bank data match, transactions are marked as "Uncategorized"
              </li>
            </Typography>
            <Typography variant="body2" paragraph sx={{ mt: 2 }}>
              <strong>Example rules:</strong>
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
              <li>Merchant contains "Costco" → Groceries</li>
              <li>Description starts with "UBER" → Transportation</li>
              <li>Description contains "Netflix" → Entertainment</li>
            </Typography>
          </Collapse>
        </Alert>
      </Box>

      {/* Rule Builder */}
      {showBuilder && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" mb={2}>
            New Rule
          </Typography>
          <RuleBuilder onSave={handleSaveRule} onCancel={() => setShowBuilder(false)} />
        </Paper>
      )}

      {/* Rule List */}
      <RuleList />

      {/* Bulk Apply Dialog */}
      <BulkApplyDialog open={showBulkDialog} onClose={() => setShowBulkDialog(false)} />
    </Container>
  );
}

import apiClient from './api';

/**
 * Text match condition for rules
 */
export interface TextMatch {
  field: 'description' | 'merchant' | 'notes';
  operator: 'contains' | 'exact' | 'startsWith' | 'endsWith';
  value: string;
  caseSensitive?: boolean;
}

/**
 * Text-based rule conditions (Phase 2)
 */
export interface TextRuleConditions {
  type: 'text';
  textMatch: TextMatch;
}

/**
 * Rule conditions union type
 * Currently only text rules (Phase 2)
 */
export type RuleConditions = TextRuleConditions;

/**
 * Create rule DTO
 */
export interface CreateRuleDto {
  name: string;
  categoryId: string;
  conditions: RuleConditions;
  priority?: number;
  isEnabled?: boolean;
}

/**
 * Update rule DTO
 */
export interface UpdateRuleDto {
  name?: string;
  categoryId?: string;
  conditions?: RuleConditions;
  priority?: number;
  isEnabled?: boolean;
}

/**
 * Rule response (from API)
 */
export interface CategoryRule {
  id: string;
  userId: string | null;
  name: string;
  categoryId: string;
  conditions: RuleConditions;
  priority: number;
  isEnabled: boolean;
  isSystem: boolean;
  matchCount: number;
  lastMatched: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: string;
    name: string;
    color: string;
  };
}

/**
 * Rule Service - API wrapper for categorization rules
 */
export const ruleService = {
  /**
   * Get all rules for current user
   */
  async getRules(includeDisabled = false): Promise<CategoryRule[]> {
    const response = await apiClient.get('/v1/rules', {
      params: { includeDisabled },
    });
    return response.data.data;
  },

  /**
   * Get a single rule by ID
   */
  async getRuleById(id: string): Promise<CategoryRule> {
    const response = await apiClient.get(`/v1/rules/${id}`);
    return response.data.data;
  },

  /**
   * Create a new rule
   */
  async createRule(data: CreateRuleDto): Promise<CategoryRule> {
    const response = await apiClient.post('/v1/rules', data);
    return response.data.data;
  },

  /**
   * Update an existing rule
   */
  async updateRule(id: string, data: UpdateRuleDto): Promise<CategoryRule> {
    const response = await apiClient.put(`/v1/rules/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete a rule
   */
  async deleteRule(id: string): Promise<void> {
    await apiClient.delete(`/v1/rules/${id}`);
  },

  /**
   * Bulk apply rules to uncategorized transactions
   */
  async bulkApply(options?: {
    accountId?: string;
    limit?: number;
  }): Promise<{
    processed: number;
    categorized: number;
    skipped: number;
    errors: Array<{ transactionId: string; error: string }>;
  }> {
    const response = await apiClient.post('/v1/rules/bulk-apply', {}, {
      params: options,
    });
    return response.data.data;
  },
};

/**
 * Rule Types
 *
 * Type definitions for categorization rules
 */

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
 * Future: amount, context, composite rules
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
 * Rule response (from database)
 */
export interface CategoryRuleResponse {
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
}

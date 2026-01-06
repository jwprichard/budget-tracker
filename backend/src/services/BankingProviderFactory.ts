import { IBankingDataProvider } from '../interfaces/IBankingDataProvider';
import { AkahuPersonalProvider } from './akahu/AkahuPersonalProvider';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Banking Provider Factory
 *
 * Creates the appropriate banking provider implementation based on connection type.
 * This enables dependency injection and makes it easy to support multiple providers.
 *
 * Supported providers:
 * - AKAHU_PERSONAL: Akahu Personal App (current)
 * - AKAHU_OAUTH: Akahu OAuth (future)
 * - PLAID: Plaid API (future)
 * - TRUELAYER: TrueLayer API (future)
 */
export class BankingProviderFactory {
  /**
   * Create banking provider instance for a connection
   *
   * @param connectionId - Database ID of BankConnection
   * @returns Provider implementation
   * @throws Error if connection not found or provider not supported
   */
  static async createProvider(connectionId: string): Promise<IBankingDataProvider> {
    try {
      logger.info('[BankingProviderFactory] Creating provider', { connectionId });

      const connection = await prisma.bankConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new Error('Bank connection not found');
      }

      logger.info('[BankingProviderFactory] Connection found', {
        connectionId,
        provider: connection.provider,
      });

      // Create provider based on type
      switch (connection.provider) {
        case 'AKAHU_PERSONAL':
          return new AkahuPersonalProvider();

        // Future providers:
        case 'AKAHU_OAUTH':
          // return new AkahuOAuthProvider();
          throw new Error(
            'Akahu OAuth provider not yet implemented. Upgrade to multi-account tier required.'
          );

        case 'PLAID':
          // return new PlaidProvider();
          throw new Error('Plaid provider not yet implemented');

        case 'TRUELAYER':
          // return new TrueLayerProvider();
          throw new Error('TrueLayer provider not yet implemented');

        default:
          throw new Error(`Unsupported provider: ${connection.provider}`);
      }
    } catch (error) {
      logger.error('[BankingProviderFactory] Failed to create provider', {
        connectionId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get list of supported providers
   *
   * @returns Array of provider names
   */
  static getSupportedProviders(): string[] {
    return [
      'AKAHU_PERSONAL',
      // Future providers (commented out until implemented):
      // 'AKAHU_OAUTH',
      // 'PLAID',
      // 'TRUELAYER',
    ];
  }

  /**
   * Check if a provider is supported
   *
   * @param providerName - Provider name to check
   * @returns true if supported, false otherwise
   */
  static isProviderSupported(providerName: string): boolean {
    return this.getSupportedProviders().includes(providerName);
  }
}

/**
 * Forecast Service
 * Calculates future balance projections based on planned transactions and budget implicit spend
 */

import { PrismaClient, TransactionType, ImplicitSpendMode } from '@prisma/client';
import { PlannedTransactionService, PlannedTransactionWithRelations } from './plannedTransaction.service';
import { generateVirtualPeriods, TemplateWithCategory } from '../utils/virtualPeriods';

// ============================================================================
// Types
// ============================================================================

export interface AccountBalance {
  accountId: string;
  accountName: string;
  balance: number;
}

export interface PlannedTransactionSummary {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  isVirtual: boolean;
}

export interface ImplicitSpendSummary {
  budgetId: string;
  budgetName: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  mode: ImplicitSpendMode;
}

export interface DailyForecast {
  date: string;
  accountBalances: {
    accountId: string;
    accountName: string;
    openingBalance: number;
    closingBalance: number;
  }[];
  totalBalance: number;
  plannedTransactions: PlannedTransactionSummary[];
  implicitSpend: ImplicitSpendSummary[];
  hasLowBalance: boolean;
}

export interface ForecastSummary {
  totalIncome: number;
  totalExpenses: number;
  totalTransfers: number;
  netChange: number;
  lowestBalance: number;
  lowestBalanceDate: string;
  lowestBalanceAccount: string;
}

export interface ForecastResponse {
  startDate: string;
  endDate: string;
  accountIds: string[] | null;
  currentBalances: AccountBalance[];
  dailyForecasts: DailyForecast[];
  summary: ForecastSummary;
}

export interface LowBalanceWarning {
  date: string;
  accountId: string;
  accountName: string;
  projectedBalance: number;
  threshold: number;
}

interface DailyImplicitSpend {
  budgetId: string;
  budgetName: string;
  categoryId: string;
  categoryName: string;
  date: Date;
  amount: number;
  mode: ImplicitSpendMode;
}

// ============================================================================
// Service
// ============================================================================

export class ForecastService {
  private plannedTransactionService: PlannedTransactionService;

  constructor(private prisma: PrismaClient) {
    this.plannedTransactionService = new PlannedTransactionService(prisma);
  }

  /**
   * Calculate forecast for a date range
   * @param userId - User UUID
   * @param startDate - Start of forecast range (default: today)
   * @param endDate - End of forecast range
   * @param accountIds - Optional filter by account IDs
   * @param lowBalanceThreshold - Threshold for low balance warnings (default: 0)
   */
  async calculateForecast(
    userId: string,
    startDate: Date,
    endDate: Date,
    accountIds?: string[],
    lowBalanceThreshold: number = 0
  ): Promise<ForecastResponse> {
    // 1. Get accounts and current balances
    const accounts = await this.getAccountsWithBalances(userId, accountIds);

    if (accounts.length === 0) {
      return this.emptyForecastResponse(startDate, endDate, accountIds);
    }

    // 2. Get all planned transactions in range (including virtual)
    const plannedTransactions = await this.getPlannedTransactionsInRange(
      userId,
      startDate,
      endDate,
      accountIds
    );

    // 3. Calculate implicit spend from budgets
    const implicitSpend = await this.calculateImplicitSpend(
      userId,
      plannedTransactions,
      startDate,
      endDate
    );

    // 4. Build daily forecasts
    const dailyForecasts = this.buildDailyForecasts(
      accounts,
      plannedTransactions,
      implicitSpend,
      startDate,
      endDate,
      lowBalanceThreshold
    );

    // 5. Calculate summary
    const summary = this.calculateSummary(dailyForecasts, accounts);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      accountIds: accountIds || null,
      currentBalances: accounts.map((a) => ({
        accountId: a.id,
        accountName: a.name,
        balance: a.currentBalance,
      })),
      dailyForecasts,
      summary,
    };
  }

  /**
   * Get low balance warnings for a date range
   */
  async getLowBalanceWarnings(
    userId: string,
    days: number,
    threshold: number
  ): Promise<LowBalanceWarning[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const forecast = await this.calculateForecast(userId, startDate, endDate, undefined, threshold);

    const warnings: LowBalanceWarning[] = [];

    for (const daily of forecast.dailyForecasts) {
      for (const accountBalance of daily.accountBalances) {
        if (accountBalance.closingBalance < threshold) {
          warnings.push({
            date: daily.date,
            accountId: accountBalance.accountId,
            accountName: accountBalance.accountName,
            projectedBalance: accountBalance.closingBalance,
            threshold,
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Get a forecast summary for quick display
   */
  async getForecastSummary(
    userId: string,
    days: number = 90
  ): Promise<ForecastSummary & { startDate: string; endDate: string }> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const forecast = await this.calculateForecast(userId, startDate, endDate);

    return {
      ...forecast.summary,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Get accounts with current calculated balances
   */
  private async getAccountsWithBalances(
    userId: string,
    accountIds?: string[]
  ): Promise<{ id: string; name: string; currentBalance: number }[]> {
    const accounts = await this.prisma.account.findMany({
      where: {
        userId,
        isActive: true,
        ...(accountIds && accountIds.length > 0 ? { id: { in: accountIds } } : {}),
      },
      select: {
        id: true,
        name: true,
        initialBalance: true,
      },
    });

    if (accounts.length === 0) {
      return [];
    }

    // Calculate current balance for each account
    const accountIdsList = accounts.map((a) => a.id);

    const transactionSums = await this.prisma.transaction.groupBy({
      by: ['accountId'],
      where: {
        userId,
        accountId: { in: accountIdsList },
      },
      _sum: {
        amount: true,
      },
    });

    const sumMap = new Map(
      transactionSums.map((t) => [t.accountId, Number(t._sum.amount || 0)])
    );

    return accounts.map((account) => ({
      id: account.id,
      name: account.name,
      currentBalance: Number(account.initialBalance) + (sumMap.get(account.id) || 0),
    }));
  }

  /**
   * Get all planned transactions in range (including virtual occurrences)
   * For accurate forecasting, we fetch ALL planned transactions when accountIds are specified
   * because transfers affect both source and destination accounts
   */
  private async getPlannedTransactionsInRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    accountIds?: string[]
  ): Promise<PlannedTransactionWithRelations[]> {
    // Use the planned transaction service to get all transactions including virtual
    // Don't filter by accountId here - we need ALL transactions to properly handle transfers
    // where the source or destination might be in the accountIds list
    const query = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      includeVirtual: true,
    };

    const transactions = await this.plannedTransactionService.getPlannedTransactions(userId, query);

    // If filtering by account IDs, include transactions where:
    // - The source account is in the list, OR
    // - The destination account (for transfers) is in the list
    if (accountIds && accountIds.length > 0) {
      return transactions.filter((t) =>
        accountIds.includes(t.accountId) ||
        (t.isTransfer && t.transferToAccountId && accountIds.includes(t.transferToAccountId))
      );
    }

    return transactions;
  }

  /**
   * Calculate implicit spend from budgets
   * Implicit spend represents the "unplanned" portion of budget capacity
   */
  private async calculateImplicitSpend(
    userId: string,
    plannedTransactions: PlannedTransactionWithRelations[],
    startDate: Date,
    endDate: Date
  ): Promise<DailyImplicitSpend[]> {
    // Get active budget templates with DAILY or END_OF_PERIOD implicit spend mode
    const budgetTemplates = await this.prisma.budgetTemplate.findMany({
      where: {
        userId,
        isActive: true,
        type: 'EXPENSE', // Only expense budgets contribute to implicit spend
        implicitSpendMode: { not: 'NONE' },
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    const result: DailyImplicitSpend[] = [];

    for (const template of budgetTemplates) {
      // Generate virtual budget periods that overlap with forecast range
      const templateWithCategory: TemplateWithCategory = {
        ...template,
        amount: template.amount,
      };

      const periods = generateVirtualPeriods(templateWithCategory, startDate, endDate);

      for (const period of periods) {
        // Calculate planned spend in this period from planned transactions
        // that match this budget's category
        const plannedSpend = plannedTransactions
          .filter((pt) => {
            if (pt.categoryId !== template.categoryId) return false;
            const ptDate = new Date(pt.expectedDate);
            return ptDate >= period.startDate && ptDate < period.endDate;
          })
          .reduce((sum, pt) => sum + Math.abs(pt.amount), 0);

        // Calculate remaining budget capacity
        const budgetAmount = Number(template.amount);
        const remainingCapacity = Math.max(0, budgetAmount - plannedSpend);

        if (remainingCapacity <= 0) continue;

        // Distribute implicit spend based on mode
        const implicitMode = template.implicitSpendMode as ImplicitSpendMode;

        if (implicitMode === 'DAILY') {
          // Spread evenly across days in period
          const periodStart = new Date(Math.max(period.startDate.getTime(), startDate.getTime()));
          const periodEnd = new Date(Math.min(period.endDate.getTime(), endDate.getTime()));

          const daysInPeriod = Math.ceil(
            (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysInPeriod <= 0) continue;

          const dailyAmount = remainingCapacity / daysInPeriod;

          let date = new Date(periodStart);
          while (date < periodEnd) {
            result.push({
              budgetId: period.id,
              budgetName: template.name,
              categoryId: template.categoryId,
              categoryName: template.category?.name || 'Unknown',
              date: new Date(date),
              amount: -dailyAmount, // Expenses are negative
              mode: 'DAILY',
            });
            date.setDate(date.getDate() + 1);
          }
        } else if (implicitMode === 'END_OF_PERIOD') {
          // Assume all spent at end of period
          const spendDate = period.endDate;
          if (spendDate >= startDate && spendDate <= endDate) {
            result.push({
              budgetId: period.id,
              budgetName: template.name,
              categoryId: template.categoryId,
              categoryName: template.category?.name || 'Unknown',
              date: new Date(spendDate),
              amount: -remainingCapacity,
              mode: 'END_OF_PERIOD',
            });
          }
        }
      }
    }

    return result;
  }

  /**
   * Build daily forecasts from planned transactions and implicit spend
   */
  private buildDailyForecasts(
    accounts: { id: string; name: string; currentBalance: number }[],
    plannedTransactions: PlannedTransactionWithRelations[],
    implicitSpend: DailyImplicitSpend[],
    startDate: Date,
    endDate: Date,
    lowBalanceThreshold: number
  ): DailyForecast[] {
    const dailyForecasts: DailyForecast[] = [];

    // Initialize balances from current account balances
    const balances = new Map<string, number>(
      accounts.map((a) => [a.id, a.currentBalance])
    );

    // Group planned transactions by date
    const plannedByDate = new Map<string, PlannedTransactionWithRelations[]>();
    for (const pt of plannedTransactions) {
      const dateKey = pt.expectedDate.split('T')[0]!;
      if (!plannedByDate.has(dateKey)) {
        plannedByDate.set(dateKey, []);
      }
      plannedByDate.get(dateKey)!.push(pt);
    }

    // Group implicit spend by date
    const implicitByDate = new Map<string, DailyImplicitSpend[]>();
    for (const is of implicitSpend) {
      const dateKey = is.date.toISOString().split('T')[0]!;
      if (!implicitByDate.has(dateKey)) {
        implicitByDate.set(dateKey, []);
      }
      implicitByDate.get(dateKey)!.push(is);
    }

    // Generate daily forecasts
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0]!;

      // Store opening balances
      const openingBalances = new Map<string, number>(balances);

      // Get planned transactions for this day
      const dayPlanned = plannedByDate.get(dateKey) || [];
      const dayImplicit = implicitByDate.get(dateKey) || [];

      // Apply planned transactions
      for (const pt of dayPlanned) {
        if (pt.isTransfer && pt.transferToAccountId) {
          // For transfers: subtract from source, add to destination
          // Transfer amounts are stored as positive, so we negate for source
          const sourceBalance = balances.get(pt.accountId) || 0;
          balances.set(pt.accountId, sourceBalance - Math.abs(pt.amount));

          const destBalance = balances.get(pt.transferToAccountId) || 0;
          balances.set(pt.transferToAccountId, destBalance + Math.abs(pt.amount));
        } else {
          // For regular income/expense: amount is already signed correctly
          // (positive for income, negative for expense)
          const currentBalance = balances.get(pt.accountId) || 0;
          balances.set(pt.accountId, currentBalance + pt.amount);
        }
      }

      // Apply implicit spend (subtract from a "default" account - first active account)
      // Note: In a more sophisticated implementation, you might associate budgets with specific accounts
      const defaultAccountId = accounts[0]?.id;
      if (defaultAccountId) {
        for (const is of dayImplicit) {
          const currentBalance = balances.get(defaultAccountId) || 0;
          balances.set(defaultAccountId, currentBalance + is.amount);
        }
      }

      // Build account balances for this day
      const accountBalances = accounts.map((account) => ({
        accountId: account.id,
        accountName: account.name,
        openingBalance: openingBalances.get(account.id) || 0,
        closingBalance: balances.get(account.id) || 0,
      }));

      // Calculate total balance - only sum accounts that are in the filtered list
      // (not all accounts that may have been touched by transfers)
      const totalBalance = accounts.reduce(
        (sum, account) => sum + (balances.get(account.id) || 0),
        0
      );

      // Check for low balance
      const hasLowBalance = accountBalances.some(
        (ab) => ab.closingBalance < lowBalanceThreshold
      );

      // Convert planned transactions to summary format
      const plannedSummaries: PlannedTransactionSummary[] = dayPlanned.map((pt) => ({
        id: pt.id,
        name: pt.name,
        amount: pt.amount,
        type: pt.type,
        accountId: pt.accountId,
        accountName: pt.accountName,
        categoryId: pt.categoryId,
        categoryName: pt.categoryName,
        isVirtual: pt.isVirtual,
      }));

      // Convert implicit spend to summary format
      const implicitSummaries: ImplicitSpendSummary[] = dayImplicit.map((is) => ({
        budgetId: is.budgetId,
        budgetName: is.budgetName,
        categoryId: is.categoryId,
        categoryName: is.categoryName,
        amount: is.amount,
        mode: is.mode,
      }));

      dailyForecasts.push({
        date: dateKey,
        accountBalances,
        totalBalance,
        plannedTransactions: plannedSummaries,
        implicitSpend: implicitSummaries,
        hasLowBalance,
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyForecasts;
  }

  /**
   * Calculate summary statistics from daily forecasts
   */
  private calculateSummary(
    dailyForecasts: DailyForecast[],
    accounts: { id: string; name: string; currentBalance: number }[]
  ): ForecastSummary {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTransfers = 0;
    let lowestBalance = Infinity;
    let lowestBalanceDate = '';
    let lowestBalanceAccount = '';

    for (const daily of dailyForecasts) {
      // Aggregate income and expenses from planned transactions
      for (const pt of daily.plannedTransactions) {
        if (pt.type === 'INCOME') {
          totalIncome += Math.abs(pt.amount);
        } else if (pt.type === 'EXPENSE') {
          totalExpenses += Math.abs(pt.amount);
        } else if (pt.type === 'TRANSFER') {
          totalTransfers += Math.abs(pt.amount);
        }
      }

      // Add implicit spend to expenses
      for (const is of daily.implicitSpend) {
        totalExpenses += Math.abs(is.amount);
      }

      // Track lowest balance
      for (const ab of daily.accountBalances) {
        if (ab.closingBalance < lowestBalance) {
          lowestBalance = ab.closingBalance;
          lowestBalanceDate = daily.date;
          lowestBalanceAccount = ab.accountName;
        }
      }
    }

    // Handle case where no forecasts
    if (lowestBalance === Infinity) {
      lowestBalance = accounts.length > 0 ? accounts[0]!.currentBalance : 0;
      lowestBalanceDate = new Date().toISOString().split('T')[0]!;
      lowestBalanceAccount = accounts.length > 0 ? accounts[0]!.name : '';
    }

    const netChange = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      totalTransfers,
      netChange,
      lowestBalance,
      lowestBalanceDate,
      lowestBalanceAccount,
    };
  }

  /**
   * Return an empty forecast response
   */
  private emptyForecastResponse(
    startDate: Date,
    endDate: Date,
    accountIds?: string[]
  ): ForecastResponse {
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      accountIds: accountIds || null,
      currentBalances: [],
      dailyForecasts: [],
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        totalTransfers: 0,
        netChange: 0,
        lowestBalance: 0,
        lowestBalanceDate: startDate.toISOString().split('T')[0]!,
        lowestBalanceAccount: '',
      },
    };
  }
}

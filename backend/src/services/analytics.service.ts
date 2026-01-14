import { PrismaClient, TransactionType, Prisma } from '@prisma/client';
import {
  DailyBalancesResponse,
  CategoryTotalsResponse,
  SpendingTrendsResponse,
  GroupByPeriod,
  TransactionTypeFilter,
  DailyBalance,
  CategoryTotal,
  SpendingTrend,
  AccountDailyBalance,
} from '../types/analytics.types';

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Calculate daily balances for accounts over date range
   * Efficiently aggregates transactions by date
   */
  async getDailyBalances(
    userId: string,
    startDate: Date,
    endDate: Date,
    accountIds?: string[]
  ): Promise<DailyBalancesResponse> {
    // Get accounts with initial balances
    const accounts = await this.prisma.account.findMany({
      where: {
        userId,
        ...(accountIds && accountIds.length > 0 ? { id: { in: accountIds } } : {}),
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        initialBalance: true,
      },
    });

    if (accounts.length === 0) {
      return { dailyBalances: [] };
    }

    const accountIdsList = accounts.map((a) => a.id);

    // Query all transactions in date range, ordered by date
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        accountId: { in: accountIdsList },
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        accountId: true,
        date: true,
        amount: true,
        description: true,
        type: true,
      },
    });

    // Get transactions before start date for accurate starting balance
    const priorTransactions = await this.prisma.transaction.groupBy({
      by: ['accountId'],
      where: {
        userId,
        accountId: { in: accountIdsList },
        date: { lt: startDate },
      },
      _sum: {
        amount: true,
      },
    });

    // Build map of account ID to prior balance
    const priorBalanceMap = new Map<string, number>();
    accounts.forEach((account) => {
      const initialBalance = parseFloat(account.initialBalance.toString());
      const priorSum = priorTransactions.find((pt) => pt.accountId === account.id);
      const priorAmount = priorSum?._sum.amount
        ? parseFloat(priorSum._sum.amount.toString())
        : 0;
      priorBalanceMap.set(account.id, initialBalance + priorAmount);
    });

    // Group transactions by date
    const transactionsByDate = new Map<string, typeof transactions>();
    transactions.forEach((tx) => {
      const dateKey = tx.date.toISOString().split('T')[0]!;
      if (!transactionsByDate.has(dateKey)) {
        transactionsByDate.set(dateKey, []);
      }
      transactionsByDate.get(dateKey)!.push(tx);
    });

    // Generate all dates in range
    const dailyBalances: DailyBalance[] = [];
    const currentDate = new Date(startDate);
    const accountBalances = new Map<string, number>(priorBalanceMap);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0]!;
      const dayTransactions = transactionsByDate.get(dateKey) || [];

      // Update balances for transactions on this day
      dayTransactions.forEach((tx) => {
        const currentBalance = accountBalances.get(tx.accountId) || 0;
        const txAmount = parseFloat(tx.amount.toString());
        accountBalances.set(tx.accountId, currentBalance + txAmount);
      });

      // Build account balances for this day
      const accountDailyBalances: AccountDailyBalance[] = accounts.map((account) => ({
        accountId: account.id,
        accountName: account.name,
        balance: accountBalances.get(account.id) || 0,
        transactions: dayTransactions
          .filter((tx) => tx.accountId === account.id)
          .map((tx) => ({
            id: tx.id,
            amount: parseFloat(tx.amount.toString()),
            description: tx.description,
            type: tx.type,
          })),
      }));

      // Calculate total balance across all accounts
      const totalBalance = Array.from(accountBalances.values()).reduce(
        (sum, bal) => sum + bal,
        0
      );

      dailyBalances.push({
        date: dateKey!,
        balance: totalBalance,
        accounts: accountDailyBalances,
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { dailyBalances };
  }

  /**
   * Aggregate transactions by category
   * Handles hierarchical categories and percentages
   */
  async getCategoryTotals(
    userId: string,
    startDate: Date,
    endDate: Date,
    type: TransactionTypeFilter = 'EXPENSE',
    accountIds?: string[],
    includeSubcategories: boolean = true
  ): Promise<CategoryTotalsResponse> {
    // Build where clause
    const whereClause: Prisma.TransactionWhereInput = {
      userId,
      date: { gte: startDate, lte: endDate },
      ...(accountIds && accountIds.length > 0 ? { accountId: { in: accountIds } } : {}),
      ...(type !== 'ALL' ? { type: type as TransactionType } : {}),
    };

    // Get all transactions with category info
    const transactions = await this.prisma.transaction.findMany({
      where: whereClause,
      select: {
        id: true,
        amount: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            parentId: true,
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Group by category
    const categoryMap = new Map<string | null, {
      categoryId: string | null;
      categoryName: string;
      parentCategoryId: string | null;
      parentCategoryName: string | null;
      color: string;
      total: number;
      transactionCount: number;
    }>();

    let totalAmount = 0;
    let uncategorizedAmount = 0;

    transactions.forEach((tx) => {
      const amount = Math.abs(parseFloat(tx.amount.toString()));
      totalAmount += amount;

      const categoryId = tx.categoryId;
      const categoryKey = categoryId || 'uncategorized';

      if (!categoryId) {
        uncategorizedAmount += amount;
      }

      if (!categoryMap.has(categoryKey)) {
        categoryMap.set(categoryKey, {
          categoryId: categoryId,
          categoryName: tx.category?.name || 'Uncategorized',
          parentCategoryId: tx.category?.parentId || null,
          parentCategoryName: tx.category?.parent?.name || null,
          color: tx.category?.color || '#757575',
          total: 0,
          transactionCount: 0,
        });
      }

      const categoryData = categoryMap.get(categoryKey)!;
      categoryData.total += amount;
      categoryData.transactionCount += 1;
    });

    // Convert to array and calculate percentages
    const categories: CategoryTotal[] = Array.from(categoryMap.values())
      .map((cat) => ({
        ...cat,
        percentage: totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Build subcategory hierarchy if requested
    if (includeSubcategories) {
      const parentCategories = categories.filter((cat) => cat.parentCategoryId === null);
      const childCategories = categories.filter((cat) => cat.parentCategoryId !== null);

      parentCategories.forEach((parent) => {
        parent.subcategories = childCategories
          .filter((child) => child.parentCategoryId === parent.categoryId)
          .map((child) => ({
            ...child,
            percentage: parent.total > 0 ? (child.total / parent.total) * 100 : 0,
          }));
      });

      return {
        categories: parentCategories,
        totalAmount,
        uncategorizedAmount,
      };
    }

    return {
      categories,
      totalAmount,
      uncategorizedAmount,
    };
  }

  /**
   * Get time-series spending trends
   * Supports multiple grouping periods
   */
  async getSpendingTrends(
    userId: string,
    startDate: Date,
    endDate: Date,
    groupBy: GroupByPeriod = 'day',
    accountIds?: string[],
    categoryIds?: string[]
  ): Promise<SpendingTrendsResponse> {
    // Build where clause
    const whereClause: Prisma.TransactionWhereInput = {
      userId,
      date: { gte: startDate, lte: endDate },
      ...(accountIds && accountIds.length > 0 ? { accountId: { in: accountIds } } : {}),
      ...(categoryIds && categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
    };

    // Get all transactions
    const transactions = await this.prisma.transaction.findMany({
      where: whereClause,
      select: {
        date: true,
        amount: true,
        type: true,
      },
      orderBy: { date: 'asc' },
    });

    // Group transactions by period
    const periodMap = new Map<string, { income: number; expense: number; count: number }>();

    transactions.forEach((tx) => {
      const periodKey = this.getPeriodKey(tx.date, groupBy);
      const amount = parseFloat(tx.amount.toString());

      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, { income: 0, expense: 0, count: 0 });
      }

      const period = periodMap.get(periodKey)!;
      period.count += 1;

      if (tx.type === 'INCOME') {
        period.income += amount;
      } else if (tx.type === 'EXPENSE') {
        period.expense += Math.abs(amount);
      }
    });

    // Fill missing periods with zeros
    const filledPeriods = this.fillMissingPeriods(startDate, endDate, groupBy, periodMap);

    // Build trends array
    const trends: SpendingTrend[] = Array.from(filledPeriods.entries())
      .map(([period, data]) => ({
        period,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
        transactionCount: data.count,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Calculate summary
    const totalIncome = trends.reduce((sum, t) => sum + t.income, 0);
    const totalExpense = trends.reduce((sum, t) => sum + t.expense, 0);
    const netChange = totalIncome - totalExpense;
    const dayCount = trends.length;
    const averageDaily = dayCount > 0 ? netChange / dayCount : 0;

    return {
      trends,
      summary: {
        totalIncome,
        totalExpense,
        netChange,
        averageDaily,
      },
    };
  }

  /**
   * Get period key for grouping (day, week, month)
   */
  private getPeriodKey(date: Date, groupBy: GroupByPeriod): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (groupBy) {
      case 'day':
        return `${year}-${month}-${day}`;
      case 'week':
        // ISO week calculation
        const weekNumber = this.getISOWeek(date);
        return `${year}-W${String(weekNumber).padStart(2, '0')}`;
      case 'month':
        return `${year}-${month}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  /**
   * Get ISO week number
   */
  private getISOWeek(date: Date): number {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((tempDate.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7
      )
    );
  }

  /**
   * Fill missing periods with zero values
   */
  private fillMissingPeriods(
    startDate: Date,
    endDate: Date,
    groupBy: GroupByPeriod,
    dataMap: Map<string, { income: number; expense: number; count: number }>
  ): Map<string, { income: number; expense: number; count: number }> {
    const filledMap = new Map(dataMap);
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const periodKey = this.getPeriodKey(currentDate, groupBy);

      if (!filledMap.has(periodKey)) {
        filledMap.set(periodKey, { income: 0, expense: 0, count: 0 });
      }

      // Increment based on groupBy
      switch (groupBy) {
        case 'day':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'week':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'month':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }

    return filledMap;
  }
}

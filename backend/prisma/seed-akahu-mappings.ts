import { PrismaClient } from '@prisma/client';

const akahuMappings = [
  { akahu: 'groceries', local: 'Groceries', confidence: 90 },
  { akahu: 'restaurants', local: 'Restaurants', confidence: 90 },
  { akahu: 'fast-food', local: 'Fast Food', confidence: 90 },
  { akahu: 'cafes', local: 'Coffee Shops', confidence: 85 },
  { akahu: 'transport', local: 'Gas/Fuel', confidence: 80 },
  { akahu: 'public-transport', local: 'Public Transit', confidence: 90 },
  { akahu: 'entertainment', local: 'Entertainment', confidence: 80 },
  { akahu: 'bills', local: 'Utilities', confidence: 75 },
  { akahu: 'health', local: 'Healthcare', confidence: 85 },
  { akahu: 'shopping', local: 'Shopping', confidence: 70 },
  { akahu: 'clothing', local: 'Clothing', confidence: 90 },
  { akahu: 'electronics', local: 'Electronics', confidence: 90 },
  { akahu: 'personal-care', local: 'Personal Care', confidence: 85 },
  { akahu: 'education', local: 'Education', confidence: 90 },
  { akahu: 'home', local: 'Home Goods', confidence: 80 },
  { akahu: 'subscriptions', local: 'Subscriptions', confidence: 90 },
  { akahu: 'banking', local: 'Bank Fees', confidence: 95 },
  { akahu: 'income', local: 'Salary', confidence: 85 },
];

export async function seedAkahuMappings(prisma: PrismaClient) {
  console.log('Seeding Akahu category mappings...');

  for (const mapping of akahuMappings) {
    // Find local category by name (system category with userId=null)
    const localCategory = await prisma.category.findFirst({
      where: { name: mapping.local, userId: null },
    });

    if (localCategory) {
      await prisma.akahuCategoryMapping.upsert({
        where: { akahuCategory: mapping.akahu },
        update: {}, // Don't update if exists
        create: {
          akahuCategory: mapping.akahu,
          localCategoryId: localCategory.id,
          confidence: mapping.confidence,
          isSystemDefault: true,
        },
      });
      console.log(`  ✓ Mapped Akahu category "${mapping.akahu}" → "${mapping.local}"`);
    } else {
      console.warn(`  ⚠️  Could not find local category "${mapping.local}" for Akahu category "${mapping.akahu}"`);
    }
  }

  console.log(`✓ Seeded ${akahuMappings.length} Akahu category mappings`);
}

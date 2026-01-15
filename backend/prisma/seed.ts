import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Starting database seed...');

  // Create only "Uncategorized" category for manual transactions
  // Akahu categories will be auto-created as transactions are synced
  const uncategorized = await prisma.category.create({
    data: {
      name: 'Uncategorized',
      color: '#9E9E9E',
    },
  });

  console.log(`Created category: ${uncategorized.name}`);
  console.log('Database seeding completed!');
  console.log('Note: Akahu categories will be auto-created during bank sync.');
}

seed()
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

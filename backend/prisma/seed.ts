import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategorySeed {
  name: string;
  color: string;
  icon?: string;
  children?: CategorySeed[];
}

const defaultCategories: CategorySeed[] = [
  // Income
  {
    name: 'Income',
    color: '#4CAF50',
    children: [
      { name: 'Salary', color: '#66BB6A' },
      { name: 'Freelance', color: '#81C784' },
      { name: 'Investments', color: '#A5D6A7' },
      { name: 'Gifts Received', color: '#C8E6C9' },
      { name: 'Other Income', color: '#E8F5E9' },
    ],
  },

  // Housing
  {
    name: 'Housing',
    color: '#2196F3',
    children: [
      { name: 'Rent/Mortgage', color: '#42A5F5' },
      { name: 'Property Tax', color: '#64B5F6' },
      { name: 'Home Insurance', color: '#90CAF9' },
      { name: 'HOA Fees', color: '#BBDEFB' },
      { name: 'Maintenance/Repairs', color: '#E3F2FD' },
    ],
  },

  // Utilities
  {
    name: 'Utilities',
    color: '#FF9800',
    children: [
      { name: 'Electricity', color: '#FFA726' },
      { name: 'Water/Sewer', color: '#FFB74D' },
      { name: 'Gas/Heating', color: '#FFCC80' },
      { name: 'Internet', color: '#FFE0B2' },
      { name: 'Phone', color: '#FFF3E0' },
    ],
  },

  // Transportation
  {
    name: 'Transportation',
    color: '#9C27B0',
    children: [
      { name: 'Car Payment', color: '#AB47BC' },
      { name: 'Gas/Fuel', color: '#BA68C8' },
      { name: 'Car Insurance', color: '#CE93D8' },
      { name: 'Maintenance/Repairs', color: '#E1BEE7' },
      { name: 'Public Transit', color: '#F3E5F5' },
      { name: 'Parking/Tolls', color: '#F3E5F5' },
    ],
  },

  // Food & Dining
  {
    name: 'Food & Dining',
    color: '#F44336',
    children: [
      { name: 'Groceries', color: '#EF5350' },
      { name: 'Restaurants', color: '#E57373' },
      { name: 'Fast Food', color: '#EF9A9A' },
      { name: 'Coffee Shops', color: '#FFCDD2' },
    ],
  },

  // Shopping
  {
    name: 'Shopping',
    color: '#E91E63',
    children: [
      { name: 'Clothing', color: '#EC407A' },
      { name: 'Electronics', color: '#F06292' },
      { name: 'Home Goods', color: '#F48FB1' },
      { name: 'Personal Care', color: '#F8BBD0' },
      { name: 'Gifts', color: '#FCE4EC' },
    ],
  },

  // Healthcare
  {
    name: 'Healthcare',
    color: '#00BCD4',
    children: [
      { name: 'Health Insurance', color: '#26C6DA' },
      { name: 'Doctor Visits', color: '#4DD0E1' },
      { name: 'Prescriptions', color: '#80DEEA' },
      { name: 'Dental', color: '#B2EBF2' },
      { name: 'Vision', color: '#E0F7FA' },
    ],
  },

  // Entertainment
  {
    name: 'Entertainment',
    color: '#FFEB3B',
    children: [
      { name: 'Streaming Services', color: '#FFF176' },
      { name: 'Movies/Theater', color: '#FFF59D' },
      { name: 'Hobbies', color: '#FFF9C4' },
      { name: 'Sports/Fitness', color: '#FFFDE7' },
    ],
  },

  // Personal
  {
    name: 'Personal',
    color: '#607D8B',
    children: [
      { name: 'Clothing', color: '#78909C' },
      { name: 'Hair/Beauty', color: '#90A4AE' },
      { name: 'Subscriptions', color: '#B0BEC5' },
      { name: 'Education', color: '#CFD8DC' },
    ],
  },

  // Financial
  {
    name: 'Financial',
    color: '#795548',
    children: [
      { name: 'Bank Fees', color: '#8D6E63' },
      { name: 'ATM Fees', color: '#A1887F' },
      { name: 'Credit Card Interest', color: '#BCAAA4' },
      { name: 'Loan Payments', color: '#D7CCC8' },
    ],
  },

  // Uncategorized
  {
    name: 'Uncategorized',
    color: '#9E9E9E',
    children: [],
  },
];

async function seed() {
  console.log('Starting database seed...');

  // Create categories with hierarchy
  for (const categoryData of defaultCategories) {
    const { children, ...parentData } = categoryData;

    // Create parent category
    const parent = await prisma.category.create({
      data: parentData,
    });

    console.log(`Created parent category: ${parent.name}`);

    // Create child categories if they exist
    if (children && children.length > 0) {
      for (const childData of children) {
        const { children: _, ...childProps } = childData;
        const child = await prisma.category.create({
          data: {
            ...childProps,
            parentId: parent.id,
          },
        });
        console.log(`  Created child category: ${child.name}`);
      }
    }
  }

  console.log('Database seeding completed!');
}

seed()
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

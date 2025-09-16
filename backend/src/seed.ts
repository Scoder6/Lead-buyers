import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, buyers } from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function seed() {
  console.log('Seeding database...');

  // Create a demo user
  const [demoUser] = await db.insert(users).values({
    email: 'demo@example.com',
    name: 'Demo User',
    emailVerified: new Date(),
  }).returning();

  console.log('Created demo user:', demoUser.id);

  // Create sample buyers
  const sampleBuyers = [
    {
      fullName: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      phone: '9876543210',
      city: 'Chandigarh' as const,
      propertyType: 'Apartment' as const,
      bhk: '3' as const,
      purpose: 'Buy' as const,
      budgetMin: 5000000,
      budgetMax: 7000000,
      timeline: '3-6m' as const,
      source: 'Website' as const,
      status: 'New' as const,
      notes: 'Looking for a 3BHK apartment in Sector 22',
      tags: ['urgent', 'verified'],
      ownerId: demoUser.id,
    },
    {
      fullName: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '9876543211',
      city: 'Mohali' as const,
      propertyType: 'Villa' as const,
      bhk: '4' as const,
      purpose: 'Buy' as const,
      budgetMin: 8000000,
      budgetMax: 12000000,
      timeline: '0-3m' as const,
      source: 'Referral' as const,
      status: 'Qualified' as const,
      notes: 'Prefers independent villa with parking',
      tags: ['high-budget', 'ready-to-buy'],
      ownerId: demoUser.id,
    },
    {
      fullName: 'Amit Singh',
      phone: '9876543212',
      city: 'Zirakpur' as const,
      propertyType: 'Plot' as const,
      purpose: 'Buy' as const,
      budgetMin: 2000000,
      budgetMax: 3000000,
      timeline: '>6m' as const,
      source: 'Walk-in' as const,
      status: 'Contacted' as const,
      notes: 'Looking for residential plot for future construction',
      tags: ['investment'],
      ownerId: demoUser.id,
    }
  ];

  await db.insert(buyers).values(sampleBuyers);

  console.log('Seeding completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed!');
  console.error(err);
  process.exit(1);
});

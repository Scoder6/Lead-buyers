import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ===================
// Enums
// ===================
export const cityEnum = pgEnum("city", ["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"]);
export const propertyTypeEnum = pgEnum("property_type", ["Apartment", "Villa", "Plot", "Office", "Retail"]);
export const bhkEnum = pgEnum("bhk", ["1", "2", "3", "4", "Studio"]);
export const purposeEnum = pgEnum("purpose", ["Buy", "Rent"]);
export const timelineEnum = pgEnum("timeline", ["0-3m", "3-6m", ">6m", "Exploring"]);
export const sourceEnum = pgEnum("source", ["Website", "Referral", "Walk-in", "Call", "Other"]);
export const statusEnum = pgEnum("status", [
  "New",
  "Qualified",
  "Contacted",
  "Visited",
  "Negotiation",
  "Converted",
  "Dropped",
]);

// ===================
// Users table
// ===================
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===================
// Buyers table
// ===================
export const buyers = pgTable("buyers", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 80 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 15 }).notNull(),
  city: cityEnum("city").notNull(),
  propertyType: propertyTypeEnum("property_type").notNull(),
  bhk: bhkEnum("bhk"),
  purpose: purposeEnum("purpose").notNull(),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  timeline: timelineEnum("timeline").notNull(),
  source: sourceEnum("source").notNull(),
  status: statusEnum("status").notNull().default("New"),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default([]),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===================
// Buyer history table
// ===================
export const buyerHistory = pgTable("buyer_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  buyerId: uuid("buyer_id").notNull().references(() => buyers.id, { onDelete: "cascade" }),
  changedBy: uuid("changed_by").notNull().references(() => users.id),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
  diff: jsonb("diff").notNull().$type<Record<string, { from: any; to: any }>>(),
});

// ===================
// NextAuth tables
// ===================

// Accounts table
// Accounts table for NextAuth
export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.providerAccountId] }), // ✅ composite PK
  })
);

// Sessions table for NextAuth
export const sessions = pgTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 }).notNull().primaryKey(), // ✅ PK is sessionToken
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

// Verification tokens table for NextAuth
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }), // ✅ composite PK
  })
);

// ===================
// Relations
// ===================
export const usersRelations = relations(users, ({ many }) => ({
  buyers: many(buyers),
  buyerHistory: many(buyerHistory),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const buyersRelations = relations(buyers, ({ one, many }) => ({
  owner: one(users, {
    fields: [buyers.ownerId],
    references: [users.id],
  }),
  history: many(buyerHistory),
}));

export const buyerHistoryRelations = relations(buyerHistory, ({ one }) => ({
  buyer: one(buyers, {
    fields: [buyerHistory.buyerId],
    references: [buyers.id],
  }),
  changedBy: one(users, {
    fields: [buyerHistory.changedBy],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

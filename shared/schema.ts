import { pgTable, serial, text, integer, numeric, boolean, timestamp, varchar, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// Replit Auth Tables (OBRIGATÓRIAS)
// ============================================================================

// Session storage table for express-session
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table adapted for Replit Auth + existing fields
export const users = pgTable('users', {
  // Replit Auth required fields
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email').unique(),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  profileImageUrl: varchar('profile_image_url'),
  
  // Legacy/additional fields for CRM functionality
  name: text('name'),
  password: text('password'),
  role: text('role').default('partner'),
  status: text('status').default('active'),
  managerId: text('manager_id'),
  remunerationTableIds: integer('remuneration_table_ids').array().default(sql`'{}'`),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  permissions: text('permissions').array().default(sql`'{}'`),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// ============================================================================
// Tabelas Existentes
// ============================================================================

export const pricingPlans = pgTable('pricing_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  basePrice: numeric('base_price').notNull(),
  includedUsers: integer('included_users').notNull(),
  additionalUserPrice: numeric('additional_user_price').notNull(),
  features: text('features').array().default(sql`'{}'`),
  isActive: boolean('is_active').default(true),
  order: integer('order').default(1),
});

export const remunerationTables = pgTable('remuneration_tables', {
  id: serial('id').primaryKey(),
  employeeRangeStart: text('employee_range_start').notNull(),
  employeeRangeEnd: text('employee_range_end'),
  finderNegotiationMargin: text('finder_negotiation_margin').notNull(),
  maxCompanyCashback: text('max_company_cashback').notNull(),
  finalFinderCashback: text('final_finder_cashback').notNull(),
  description: text('description'),
  valueType: text('value_type').default('percentage'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const supportMaterials = pgTable('support_materials', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  title: text('title').notNull(),
  category: text('category').notNull(),
  type: text('type').notNull(),
  description: text('description'),
  downloadUrl: text('download_url'),
  viewUrl: text('view_url'),
  fileSize: text('file_size'),
  duration: text('duration'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  isActive: boolean('is_active').default(true),
  order: integer('order').default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// Novas Tabelas
// ============================================================================

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  cnpj: text('cnpj'),
  cpf: text('cpf'),
  status: text('status').default('active'),
  stage: text('stage').default('prospeccao'),
  temperature: text('temperature').default('cold'),
  totalLives: integer('total_lives').default(0),
  partnerId: text('partner_id'),
  partnerName: text('partner_name'),
  contractEndDate: timestamp('contract_end_date', { withTimezone: true }),
  registrationDate: timestamp('registration_date', { withTimezone: true }).defaultNow(),
  lastContactDate: timestamp('last_contact_date', { withTimezone: true }),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
  notes: text('notes'),
  hubspotId: text('hubspot_id'),
  netsuiteId: text('netsuite_id'),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull(),
  type: text('type').notNull(),
  amount: numeric('amount').notNull(),
  status: text('status').default('pending'),
  date: timestamp('date', { withTimezone: true }).defaultNow(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const prospects = pgTable('prospects', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  companyName: text('company_name').notNull(),
  contactName: text('contact_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  cnpj: text('cnpj'),
  employees: text('employees'),
  segment: text('segment'),
  status: text('status').default('pending'),
  partnerId: text('partner_id'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
  validatedAt: timestamp('validated_at', { withTimezone: true }),
  validatedBy: text('validated_by'),
  validationNotes: text('validation_notes'),
  isApproved: boolean('is_approved').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('info'),
  recipientId: text('recipient_id'),
  recipientType: text('recipient_type').default('specific'),
  isRead: boolean('is_read').default(false),
  emailSent: boolean('email_sent').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const uploads = pgTable('uploads', {
  id: serial('id').primaryKey(),
  fileName: text('file_name').notNull(),
  originalName: text('original_name').notNull(),
  fileType: text('file_type'),
  filePath: text('file_path').notNull(),
  fileUrl: text('file_url'),
  uploadedBy: text('uploaded_by'),
  partnerId: text('partner_id'),
  partnerName: text('partner_name'),
  referenceMonth: integer('reference_month'),
  referenceYear: integer('reference_year'),
  size: integer('size'),
  status: text('status').default('pending'),
  downloadCount: integer('download_count').default(0),
  uploadDate: timestamp('upload_date', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const nfeUploads = pgTable('nfe_uploads', {
  id: serial('id').primaryKey(),
  fileName: text('file_name').notNull(),
  partnerId: text('partner_id').notNull(),
  partnerName: text('partner_name'),
  month: text('month').notNull(),
  year: integer('year').notNull(),
  fileType: text('file_type').default('pdf'),
  filePath: text('file_path'),
  fileUrl: text('file_url'),
  status: text('status').default('pending'),
  uploadDate: timestamp('upload_date', { withTimezone: true }).defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

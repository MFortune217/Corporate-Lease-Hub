import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, real, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"),
  companyId: integer("company_id"),
  companyName: text("company_name"),
  companyRole: text("company_role").notNull().default("admin"),
  email: text("email"),
  phone: text("phone"),
  resetCode: text("reset_code"),
  resetCodeExpiry: timestamp("reset_code_expiry"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  price: real("price").notNull(),
  address: text("address").notNull(),
  image: text("image").notNull(),
  beds: integer("beds").notNull(),
  baths: real("baths").notNull(),
  sqft: integer("sqft").notNull(),
  ownerId: integer("owner_id"),
  companyId: integer("company_id"),
  status: text("status").notNull().default("available"),
});

export const insertPropertySchema = createInsertSchema(properties).omit({ id: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

export const corporateLeases = pgTable("corporate_leases", {
  id: serial("id").primaryKey(),
  employeeName: text("employee_name").notNull(),
  employeeId: text("employee_id").notNull(),
  propertyId: integer("property_id"),
  propertyName: text("property_name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  status: text("status").notNull().default("Pending"),
  rent: real("rent").notNull(),
  companyId: integer("company_id"),
});

export const insertLeaseSchema = createInsertSchema(corporateLeases).omit({ id: true });
export type InsertLease = z.infer<typeof insertLeaseSchema>;
export type CorporateLease = typeof corporateLeases.$inferSelect;

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  service: text("service").notNull(),
  rating: real("rating").notNull().default(0),
  status: text("status").notNull().default("Pending Docs"),
  companyId: integer("company_id"),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true });
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("New"),
  date: text("date").notNull(),
  type: text("type").notNull().default("general"),
  userId: integer("user_id"),
  userName: text("user_name"),
  companyId: integer("company_id"),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export const cryptoCurrencies = pgTable("crypto_currencies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  enabled: boolean("enabled").notNull().default(false),
});

export const insertCryptoSchema = createInsertSchema(cryptoCurrencies);
export type InsertCrypto = z.infer<typeof insertCryptoSchema>;
export type CryptoCurrency = typeof cryptoCurrencies.$inferSelect;

export const jobRequests = pgTable("job_requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  requestedBy: text("requested_by").notNull(),
  vendorId: integer("vendor_id"),
  dueDate: text("due_date"),
  status: text("status").notNull().default("pending"),
  propertyId: integer("property_id"),
  companyId: integer("company_id"),
});

export const insertJobRequestSchema = createInsertSchema(jobRequests).omit({ id: true });
export type InsertJobRequest = z.infer<typeof insertJobRequestSchema>;
export type JobRequest = typeof jobRequests.$inferSelect;

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  portal: text("portal").notNull(),
  method: text("method"),
  amount: real("amount"),
  read: boolean("read").notNull().default(false),
  companyId: integer("company_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const contactRequests = pgTable("contact_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const insertContactRequestSchema = createInsertSchema(contactRequests).omit({ id: true, createdAt: true, respondedAt: true });
export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;
export type ContactRequest = typeof contactRequests.$inferSelect;

export const pageContents = pgTable("page_contents", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPageContentSchema = createInsertSchema(pageContents).omit({ id: true, updatedAt: true });
export type InsertPageContent = z.infer<typeof insertPageContentSchema>;
export type PageContent = typeof pageContents.$inferSelect;

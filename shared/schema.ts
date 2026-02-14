import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, real, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"),
  companyName: text("company_name"),
  email: text("email"),
  phone: text("phone"),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

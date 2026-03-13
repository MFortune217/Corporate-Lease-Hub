import {
  type User, type InsertUser,
  type Company, type InsertCompany,
  type Property, type InsertProperty,
  type CorporateLease, type InsertLease,
  type Vendor, type InsertVendor,
  type Document, type InsertDocument,
  type CryptoCurrency, type InsertCrypto,
  type JobRequest, type InsertJobRequest,
  type Notification, type InsertNotification,
  type ContactRequest, type InsertContactRequest,
  type PageContent, type InsertPageContent,
  users, companies, properties, corporateLeases, vendors, documents, cryptoCurrencies, jobRequests, notifications,
  contactRequests, pageContents,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser> & { resetCode?: string | null; resetCodeExpiry?: Date | null; }): Promise<User | undefined>;

  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByName(name: string): Promise<Company | undefined>;
  getCompanyByStripeCustomerId(stripeCustomerId: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, data: Partial<InsertCompany>): Promise<Company | undefined>;

  getProperties(companyId?: number): Promise<Property[]>;
  getProperty(id: number, companyId?: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, data: Partial<InsertProperty>, companyId?: number): Promise<Property | undefined>;
  deleteProperty(id: number, companyId?: number): Promise<void>;

  getLeases(companyId?: number): Promise<CorporateLease[]>;
  getLease(id: number, companyId?: number): Promise<CorporateLease | undefined>;
  createLease(lease: InsertLease): Promise<CorporateLease>;
  updateLease(id: number, data: Partial<InsertLease>, companyId?: number): Promise<CorporateLease | undefined>;

  getVendors(companyId?: number): Promise<Vendor[]>;
  getVendor(id: number, companyId?: number): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, data: Partial<InsertVendor>, companyId?: number): Promise<Vendor | undefined>;

  getDocuments(companyId?: number): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: number, data: Partial<InsertDocument>, companyId?: number): Promise<Document | undefined>;

  getCryptoCurrencies(): Promise<CryptoCurrency[]>;
  upsertCrypto(crypto: InsertCrypto): Promise<CryptoCurrency>;
  toggleCrypto(id: string, enabled: boolean): Promise<CryptoCurrency | undefined>;

  getJobRequests(companyId?: number): Promise<JobRequest[]>;
  getJobRequestsByVendor(vendorId: number, companyId?: number): Promise<JobRequest[]>;
  createJobRequest(job: InsertJobRequest): Promise<JobRequest>;
  updateJobRequest(id: number, data: Partial<InsertJobRequest>, companyId?: number): Promise<JobRequest | undefined>;

  getNotifications(companyId?: number): Promise<Notification[]>;
  getUnreadNotifications(companyId?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number, companyId?: number): Promise<Notification | undefined>;
  markAllNotificationsRead(companyId?: number): Promise<void>;

  getContactRequests(): Promise<ContactRequest[]>;
  getContactRequest(id: number): Promise<ContactRequest | undefined>;
  createContactRequest(request: InsertContactRequest): Promise<ContactRequest>;
  updateContactRequest(id: number, data: Partial<ContactRequest>): Promise<ContactRequest | undefined>;

  getPageContent(slug: string): Promise<PageContent | undefined>;
  getAllPageContents(): Promise<PageContent[]>;
  upsertPageContent(content: InsertPageContent): Promise<PageContent>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser> & { resetCode?: string | null; resetCodeExpiry?: Date | null; }): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyByName(name: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.name, name));
    return company;
  }

  async getCompanyByStripeCustomerId(stripeCustomerId: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.stripeCustomerId, stripeCustomerId));
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [created] = await db.insert(companies).values(company).returning();
    return created;
  }

  async updateCompany(id: number, data: Partial<InsertCompany>): Promise<Company | undefined> {
    const [updated] = await db.update(companies).set(data).where(eq(companies.id, id)).returning();
    return updated;
  }

  async getProperties(companyId?: number): Promise<Property[]> {
    if (companyId) {
      return db.select().from(properties).where(eq(properties.companyId, companyId));
    }
    return db.select().from(properties);
  }

  async getProperty(id: number, companyId?: number): Promise<Property | undefined> {
    if (companyId) {
      const [property] = await db.select().from(properties).where(and(eq(properties.id, id), eq(properties.companyId, companyId)));
      return property;
    }
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [created] = await db.insert(properties).values(property).returning();
    return created;
  }

  async updateProperty(id: number, data: Partial<InsertProperty>, companyId?: number): Promise<Property | undefined> {
    if (companyId) {
      const [updated] = await db.update(properties).set(data).where(and(eq(properties.id, id), eq(properties.companyId, companyId))).returning();
      return updated;
    }
    const [updated] = await db.update(properties).set(data).where(eq(properties.id, id)).returning();
    return updated;
  }

  async deleteProperty(id: number, companyId?: number): Promise<void> {
    if (companyId) {
      await db.delete(properties).where(and(eq(properties.id, id), eq(properties.companyId, companyId)));
    } else {
      await db.delete(properties).where(eq(properties.id, id));
    }
  }

  async getLeases(companyId?: number): Promise<CorporateLease[]> {
    if (companyId) {
      return db.select().from(corporateLeases).where(eq(corporateLeases.companyId, companyId));
    }
    return db.select().from(corporateLeases);
  }

  async getLease(id: number, companyId?: number): Promise<CorporateLease | undefined> {
    if (companyId) {
      const [lease] = await db.select().from(corporateLeases).where(and(eq(corporateLeases.id, id), eq(corporateLeases.companyId, companyId)));
      return lease;
    }
    const [lease] = await db.select().from(corporateLeases).where(eq(corporateLeases.id, id));
    return lease;
  }

  async createLease(lease: InsertLease): Promise<CorporateLease> {
    const [created] = await db.insert(corporateLeases).values(lease).returning();
    return created;
  }

  async updateLease(id: number, data: Partial<InsertLease>, companyId?: number): Promise<CorporateLease | undefined> {
    if (companyId) {
      const [updated] = await db.update(corporateLeases).set(data).where(and(eq(corporateLeases.id, id), eq(corporateLeases.companyId, companyId))).returning();
      return updated;
    }
    const [updated] = await db.update(corporateLeases).set(data).where(eq(corporateLeases.id, id)).returning();
    return updated;
  }

  async getVendors(companyId?: number): Promise<Vendor[]> {
    if (companyId) {
      return db.select().from(vendors).where(eq(vendors.companyId, companyId));
    }
    return db.select().from(vendors);
  }

  async getVendor(id: number, companyId?: number): Promise<Vendor | undefined> {
    if (companyId) {
      const [vendor] = await db.select().from(vendors).where(and(eq(vendors.id, id), eq(vendors.companyId, companyId)));
      return vendor;
    }
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [created] = await db.insert(vendors).values(vendor).returning();
    return created;
  }

  async updateVendor(id: number, data: Partial<InsertVendor>, companyId?: number): Promise<Vendor | undefined> {
    if (companyId) {
      const [updated] = await db.update(vendors).set(data).where(and(eq(vendors.id, id), eq(vendors.companyId, companyId))).returning();
      return updated;
    }
    const [updated] = await db.update(vendors).set(data).where(eq(vendors.id, id)).returning();
    return updated;
  }

  async getDocuments(companyId?: number): Promise<Document[]> {
    if (companyId) {
      return db.select().from(documents).where(eq(documents.companyId, companyId));
    }
    return db.select().from(documents);
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(doc).returning();
    return created;
  }

  async updateDocument(id: number, data: Partial<InsertDocument>, companyId?: number): Promise<Document | undefined> {
    if (companyId) {
      const [updated] = await db.update(documents).set(data).where(and(eq(documents.id, id), eq(documents.companyId, companyId))).returning();
      return updated;
    }
    const [updated] = await db.update(documents).set(data).where(eq(documents.id, id)).returning();
    return updated;
  }

  async getCryptoCurrencies(): Promise<CryptoCurrency[]> {
    return db.select().from(cryptoCurrencies);
  }

  async upsertCrypto(crypto: InsertCrypto): Promise<CryptoCurrency> {
    const [created] = await db
      .insert(cryptoCurrencies)
      .values(crypto)
      .onConflictDoUpdate({
        target: cryptoCurrencies.id,
        set: { name: crypto.name, symbol: crypto.symbol, enabled: crypto.enabled },
      })
      .returning();
    return created;
  }

  async toggleCrypto(id: string, enabled: boolean): Promise<CryptoCurrency | undefined> {
    const [updated] = await db
      .update(cryptoCurrencies)
      .set({ enabled })
      .where(eq(cryptoCurrencies.id, id))
      .returning();
    return updated;
  }

  async getJobRequests(companyId?: number): Promise<JobRequest[]> {
    if (companyId) {
      return db.select().from(jobRequests).where(eq(jobRequests.companyId, companyId));
    }
    return db.select().from(jobRequests);
  }

  async getJobRequestsByVendor(vendorId: number, companyId?: number): Promise<JobRequest[]> {
    if (companyId) {
      return db.select().from(jobRequests).where(and(eq(jobRequests.vendorId, vendorId), eq(jobRequests.companyId, companyId)));
    }
    return db.select().from(jobRequests).where(eq(jobRequests.vendorId, vendorId));
  }

  async createJobRequest(job: InsertJobRequest): Promise<JobRequest> {
    const [created] = await db.insert(jobRequests).values(job).returning();
    return created;
  }

  async updateJobRequest(id: number, data: Partial<InsertJobRequest>, companyId?: number): Promise<JobRequest | undefined> {
    if (companyId) {
      const [updated] = await db.update(jobRequests).set(data).where(and(eq(jobRequests.id, id), eq(jobRequests.companyId, companyId))).returning();
      return updated;
    }
    const [updated] = await db.update(jobRequests).set(data).where(eq(jobRequests.id, id)).returning();
    return updated;
  }

  async getNotifications(companyId?: number): Promise<Notification[]> {
    if (companyId) {
      return db.select().from(notifications).where(eq(notifications.companyId, companyId)).orderBy(desc(notifications.createdAt)).limit(50);
    }
    return db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(50);
  }

  async getUnreadNotifications(companyId?: number): Promise<Notification[]> {
    if (companyId) {
      return db.select().from(notifications).where(and(eq(notifications.read, false), eq(notifications.companyId, companyId))).orderBy(desc(notifications.createdAt));
    }
    return db.select().from(notifications).where(eq(notifications.read, false)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: number, companyId?: number): Promise<Notification | undefined> {
    if (companyId) {
      const [updated] = await db.update(notifications).set({ read: true }).where(and(eq(notifications.id, id), eq(notifications.companyId, companyId))).returning();
      return updated;
    }
    const [updated] = await db.update(notifications).set({ read: true }).where(eq(notifications.id, id)).returning();
    return updated;
  }

  async markAllNotificationsRead(companyId?: number): Promise<void> {
    if (companyId) {
      await db.update(notifications).set({ read: true }).where(and(eq(notifications.read, false), eq(notifications.companyId, companyId)));
    } else {
      await db.update(notifications).set({ read: true }).where(eq(notifications.read, false));
    }
  }

  async getContactRequests(): Promise<ContactRequest[]> {
    return db.select().from(contactRequests).orderBy(desc(contactRequests.createdAt));
  }

  async getContactRequest(id: number): Promise<ContactRequest | undefined> {
    const [request] = await db.select().from(contactRequests).where(eq(contactRequests.id, id));
    return request;
  }

  async createContactRequest(request: InsertContactRequest): Promise<ContactRequest> {
    const [created] = await db.insert(contactRequests).values(request).returning();
    return created;
  }

  async updateContactRequest(id: number, data: Partial<ContactRequest>): Promise<ContactRequest | undefined> {
    const [updated] = await db.update(contactRequests).set(data).where(eq(contactRequests.id, id)).returning();
    return updated;
  }

  async getPageContent(slug: string): Promise<PageContent | undefined> {
    const [page] = await db.select().from(pageContents).where(eq(pageContents.slug, slug));
    return page;
  }

  async getAllPageContents(): Promise<PageContent[]> {
    return db.select().from(pageContents);
  }

  async upsertPageContent(content: InsertPageContent): Promise<PageContent> {
    const [created] = await db
      .insert(pageContents)
      .values({ ...content, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: pageContents.slug,
        set: { title: content.title, content: content.content, updatedAt: new Date() },
      })
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();

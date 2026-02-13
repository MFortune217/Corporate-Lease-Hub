import {
  type User, type InsertUser,
  type Property, type InsertProperty,
  type CorporateLease, type InsertLease,
  type Vendor, type InsertVendor,
  type Document, type InsertDocument,
  type CryptoCurrency, type InsertCrypto,
  type JobRequest, type InsertJobRequest,
  users, properties, corporateLeases, vendors, documents, cryptoCurrencies, jobRequests,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, data: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<void>;

  getLeases(): Promise<CorporateLease[]>;
  getLease(id: number): Promise<CorporateLease | undefined>;
  createLease(lease: InsertLease): Promise<CorporateLease>;
  updateLease(id: number, data: Partial<InsertLease>): Promise<CorporateLease | undefined>;

  getVendors(): Promise<Vendor[]>;
  getVendor(id: number): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, data: Partial<InsertVendor>): Promise<Vendor | undefined>;

  getDocuments(): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: number, data: Partial<InsertDocument>): Promise<Document | undefined>;

  getCryptoCurrencies(): Promise<CryptoCurrency[]>;
  upsertCrypto(crypto: InsertCrypto): Promise<CryptoCurrency>;
  toggleCrypto(id: string, enabled: boolean): Promise<CryptoCurrency | undefined>;

  getJobRequests(): Promise<JobRequest[]>;
  getJobRequestsByVendor(vendorId: number): Promise<JobRequest[]>;
  createJobRequest(job: InsertJobRequest): Promise<JobRequest>;
  updateJobRequest(id: number, data: Partial<InsertJobRequest>): Promise<JobRequest | undefined>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getProperties(): Promise<Property[]> {
    return db.select().from(properties);
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [created] = await db.insert(properties).values(property).returning();
    return created;
  }

  async updateProperty(id: number, data: Partial<InsertProperty>): Promise<Property | undefined> {
    const [updated] = await db.update(properties).set(data).where(eq(properties.id, id)).returning();
    return updated;
  }

  async deleteProperty(id: number): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

  async getLeases(): Promise<CorporateLease[]> {
    return db.select().from(corporateLeases);
  }

  async getLease(id: number): Promise<CorporateLease | undefined> {
    const [lease] = await db.select().from(corporateLeases).where(eq(corporateLeases.id, id));
    return lease;
  }

  async createLease(lease: InsertLease): Promise<CorporateLease> {
    const [created] = await db.insert(corporateLeases).values(lease).returning();
    return created;
  }

  async updateLease(id: number, data: Partial<InsertLease>): Promise<CorporateLease | undefined> {
    const [updated] = await db.update(corporateLeases).set(data).where(eq(corporateLeases.id, id)).returning();
    return updated;
  }

  async getVendors(): Promise<Vendor[]> {
    return db.select().from(vendors);
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [created] = await db.insert(vendors).values(vendor).returning();
    return created;
  }

  async updateVendor(id: number, data: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const [updated] = await db.update(vendors).set(data).where(eq(vendors.id, id)).returning();
    return updated;
  }

  async getDocuments(): Promise<Document[]> {
    return db.select().from(documents);
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(doc).returning();
    return created;
  }

  async updateDocument(id: number, data: Partial<InsertDocument>): Promise<Document | undefined> {
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

  async getJobRequests(): Promise<JobRequest[]> {
    return db.select().from(jobRequests);
  }

  async getJobRequestsByVendor(vendorId: number): Promise<JobRequest[]> {
    return db.select().from(jobRequests).where(eq(jobRequests.vendorId, vendorId));
  }

  async createJobRequest(job: InsertJobRequest): Promise<JobRequest> {
    const [created] = await db.insert(jobRequests).values(job).returning();
    return created;
  }

  async updateJobRequest(id: number, data: Partial<InsertJobRequest>): Promise<JobRequest | undefined> {
    const [updated] = await db.update(jobRequests).set(data).where(eq(jobRequests.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();

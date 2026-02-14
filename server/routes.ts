import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertPropertySchema,
  insertLeaseSchema,
  insertVendorSchema,
  insertDocumentSchema,
  insertCryptoSchema,
  insertJobRequestSchema,
} from "@shared/schema";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Properties
  app.get("/api/properties", async (_req, res) => {
    const props = await storage.getProperties();
    res.json(props);
  });

  app.get("/api/properties/:id", async (req, res) => {
    const property = await storage.getProperty(Number(req.params.id));
    if (!property) return res.status(404).json({ message: "Property not found" });
    res.json(property);
  });

  app.post("/api/properties", async (req, res) => {
    const parsed = insertPropertySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const property = await storage.createProperty(parsed.data);
    res.status(201).json(property);
  });

  app.patch("/api/properties/:id", async (req, res) => {
    const updated = await storage.updateProperty(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Property not found" });
    res.json(updated);
  });

  app.delete("/api/properties/:id", async (req, res) => {
    await storage.deleteProperty(Number(req.params.id));
    res.status(204).send();
  });

  // Corporate Leases
  app.get("/api/leases", async (_req, res) => {
    const leases = await storage.getLeases();
    res.json(leases);
  });

  app.get("/api/leases/:id", async (req, res) => {
    const lease = await storage.getLease(Number(req.params.id));
    if (!lease) return res.status(404).json({ message: "Lease not found" });
    res.json(lease);
  });

  app.post("/api/leases", async (req, res) => {
    const parsed = insertLeaseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const lease = await storage.createLease(parsed.data);
    res.status(201).json(lease);
  });

  app.patch("/api/leases/:id", async (req, res) => {
    const updated = await storage.updateLease(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Lease not found" });
    res.json(updated);
  });

  // Vendors
  app.get("/api/vendors", async (_req, res) => {
    const v = await storage.getVendors();
    res.json(v);
  });

  app.get("/api/vendors/:id", async (req, res) => {
    const vendor = await storage.getVendor(Number(req.params.id));
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  });

  app.post("/api/vendors", async (req, res) => {
    const parsed = insertVendorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const vendor = await storage.createVendor(parsed.data);
    res.status(201).json(vendor);
  });

  app.patch("/api/vendors/:id", async (req, res) => {
    const updated = await storage.updateVendor(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Vendor not found" });
    res.json(updated);
  });

  // Documents
  app.get("/api/documents", async (_req, res) => {
    const docs = await storage.getDocuments();
    res.json(docs);
  });

  app.post("/api/documents", async (req, res) => {
    const parsed = insertDocumentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const doc = await storage.createDocument(parsed.data);
    res.status(201).json(doc);
  });

  app.patch("/api/documents/:id", async (req, res) => {
    const updated = await storage.updateDocument(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Document not found" });
    res.json(updated);
  });

  // Crypto Currencies
  app.get("/api/crypto", async (_req, res) => {
    const cryptos = await storage.getCryptoCurrencies();
    res.json(cryptos);
  });

  app.post("/api/crypto", async (req, res) => {
    const parsed = insertCryptoSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const crypto = await storage.upsertCrypto(parsed.data);
    res.status(201).json(crypto);
  });

  app.patch("/api/crypto/:id/toggle", async (req, res) => {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") return res.status(400).json({ message: "enabled must be boolean" });
    const updated = await storage.toggleCrypto(req.params.id, enabled);
    if (!updated) return res.status(404).json({ message: "Crypto not found" });
    res.json(updated);
  });

  // Job Requests
  app.get("/api/jobs", async (_req, res) => {
    const jobs = await storage.getJobRequests();
    res.json(jobs);
  });

  app.get("/api/jobs/vendor/:vendorId", async (req, res) => {
    const jobs = await storage.getJobRequestsByVendor(Number(req.params.vendorId));
    res.json(jobs);
  });

  app.post("/api/jobs", async (req, res) => {
    const parsed = insertJobRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const job = await storage.createJobRequest(parsed.data);
    res.status(201).json(job);
  });

  app.patch("/api/jobs/:id", async (req, res) => {
    const updated = await storage.updateJobRequest(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Job not found" });
    res.json(updated);
  });

  // Seed endpoint for initial data
  app.post("/api/seed", async (_req, res) => {
    try {
      const existingProps = await storage.getProperties();
      if (existingProps.length > 0) {
        return res.json({ message: "Data already seeded" });
      }

      const seedProperties = [
        { title: "Executive Loft Downtown", type: "Loft", price: 3500, address: "123 Business Blvd, Downtown", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", beds: 1, baths: 1.5, sqft: 1200, status: "leased" },
        { title: "Luxury Condo with View", type: "Condo", price: 4200, address: "456 Skyline Ave, Uptown", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", beds: 2, baths: 2, sqft: 1500, status: "leased" },
        { title: "Suburban Family Home", type: "Single Family Home", price: 2800, address: "789 Maple Dr, Suburbia", image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", beds: 3, baths: 2.5, sqft: 2200, status: "available" },
      ];

      for (const p of seedProperties) {
        await storage.createProperty(p);
      }

      const seedLeases = [
        { employeeName: "Sarah Jenkins", employeeId: "EMP-402", propertyName: "Executive Loft Downtown", startDate: "2023-01-15", endDate: "2024-01-15", status: "Active", rent: 3500 },
        { employeeName: "Michael Chang", employeeId: "EMP-993", propertyName: "Luxury Condo with View", startDate: "2023-06-01", endDate: "2024-06-01", status: "Active", rent: 4200 },
        { employeeName: "Elena Rodriguez", employeeId: "EMP-155", propertyName: "Suburban Family Home", startDate: "2023-09-01", endDate: "2024-09-01", status: "Renewing", rent: 2800 },
        { employeeName: "David Kim", employeeId: "EMP-772", propertyName: "Metro City Apartment", startDate: "2024-01-01", endDate: "2025-01-01", status: "Pending Move-in", rent: 3100 },
      ];

      for (const l of seedLeases) {
        await storage.createLease(l);
      }

      const seedVendors = [
        { name: "Sparkle Cleaners", service: "Cleaning", rating: 4.8, status: "Approved" },
        { name: "FixIt Fast HVAC", service: "HVAC", rating: 4.9, status: "Approved" },
        { name: "Elite Staging Pros", service: "Staging", rating: 4.7, status: "Pending Docs" },
      ];

      for (const v of seedVendors) {
        await storage.createVendor(v);
      }

      const seedDocs = [
        { name: "Lease Agreement", status: "Signed", date: "2023-10-15", type: "lease" },
        { name: "Pet Addendum", status: "Pending", date: "2023-10-16", type: "addendum" },
        { name: "Move-in Checklist", status: "New", date: "2023-10-18", type: "checklist" },
      ];

      for (const d of seedDocs) {
        await storage.createDocument(d);
      }

      const seedCrypto = [
        { id: "btc", name: "Bitcoin", symbol: "BTC", enabled: true },
        { id: "eth", name: "Ethereum", symbol: "ETH", enabled: true },
        { id: "usdc", name: "USD Coin", symbol: "USDC", enabled: true },
        { id: "sol", name: "Solana", symbol: "SOL", enabled: false },
      ];

      for (const c of seedCrypto) {
        await storage.upsertCrypto(c);
      }

      const seedJobs = [
        { title: "Unit 404 - Deep Clean", description: "Full deep cleaning before move-in", requestedBy: "Skyline Properties", dueDate: "2024-02-15", status: "pending" },
        { title: "Unit 201 - HVAC Inspection", description: "Annual HVAC system check", requestedBy: "Metro Management", dueDate: "2024-02-16", status: "pending" },
        { title: "Unit 305 - Move-out Clean", description: "Post move-out cleaning", requestedBy: "Skyline Properties", dueDate: "2024-02-17", status: "pending" },
      ];

      for (const j of seedJobs) {
        await storage.createJobRequest(j);
      }

      res.json({ message: "Seed data created successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe Payment Routes

  app.get("/api/stripe/publishable-key", async (_req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error: any) {
      res.status(500).json({ message: "Stripe not configured" });
    }
  });

  app.post("/api/stripe/create-payment-intent", async (req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const { amount, paymentMethodType, description, metadata } = req.body;

      if (!amount || !paymentMethodType) {
        return res.status(400).json({ message: "amount and paymentMethodType are required" });
      }

      const paymentMethodTypes: string[] = [];
      if (paymentMethodType === "card") {
        paymentMethodTypes.push("card");
      } else if (paymentMethodType === "ach") {
        paymentMethodTypes.push("us_bank_account");
      } else {
        paymentMethodTypes.push(paymentMethodType);
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        payment_method_types: paymentMethodTypes,
        description: description || "CorpLease Payment",
        metadata: metadata || {},
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error("Payment intent error:", error.message);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/stripe/create-payout", async (req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const { amount, description } = req.body;

      if (!amount) {
        return res.status(400).json({ message: "amount is required" });
      }

      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        destination: "default",
        description: description || "CorpLease Vendor Payout",
      } as any);

      res.json({ transfer });
    } catch (error: any) {
      console.error("Payout error:", error.message);
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}

import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertPropertySchema,
  insertLeaseSchema,
  insertVendorSchema,
  insertDocumentSchema,
  insertCryptoSchema,
  insertJobRequestSchema,
  insertNotificationSchema,
  insertUserSchema,
  insertContactRequestSchema,
  insertPageContentSchema,
  type Notification,
} from "@shared/schema";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { broadcastNotification, addSSEClient, removeSSEClient } from "./notifications";
import { signToken, requireAuth, requireRole } from "./auth";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { companies as companiesTable, users as usersTable } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth - Public routes
  app.post("/api/auth/register", async (req, res) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
    }
    const { username, password, role, companyName, email, phone } = parsed.data;
    if (!companyName || !email) {
      return res.status(400).json({ message: "Company name and email are required" });
    }
    const existing = await storage.getUserByUsername(username);
    if (existing) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.transaction(async (tx) => {
      const [company] = await tx.insert(companiesTable).values({
        name: companyName,
        email,
        phone: phone || null,
      }).returning();

      const [user] = await tx.insert(usersTable).values({
        username,
        password: hashedPassword,
        role: role || "customer",
        companyId: company.id,
        companyName,
        companyRole: "admin",
        email,
        phone: phone || null,
      }).returning();

      return { company, user };
    });

    let stripeCustomerId: string | null = null;
    try {
      const stripe = await getUncachableStripeClient();
      const customer = await stripe.customers.create({
        name: companyName,
        email,
        metadata: { companyId: String(result.company.id), portal: role || "customer" },
      });
      stripeCustomerId = customer.id;
      await storage.updateCompany(result.company.id, { stripeCustomerId });
    } catch (err: any) {
      console.warn("Stripe customer creation skipped:", err.message);
    }

    const token = signToken({
      userId: result.user.id,
      companyId: result.company.id,
      role: result.user.role,
      companyRole: result.user.companyRole,
    });

    const { password: _, ...safeUser } = result.user;
    res.status(201).json({ ...safeUser, token, stripeCustomerId });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const companyId = user.companyId || 0;
    const token = signToken({
      userId: user.id,
      companyId,
      role: user.role,
      companyRole: user.companyRole,
    });

    let stripeCustomerId: string | null = null;
    if (companyId) {
      const company = await storage.getCompany(companyId);
      stripeCustomerId = company?.stripeCustomerId || null;
    }

    const { password: _, ...safeUser } = user;
    res.json({ ...safeUser, token, stripeCustomerId });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.user!.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let company = null;
    let stripeCustomerId: string | null = null;
    if (user.companyId) {
      company = await storage.getCompany(user.companyId);
      stripeCustomerId = company?.stripeCustomerId || null;
    }

    const { password: _, ...safeUser } = user;
    res.json({ ...safeUser, company, stripeCustomerId });
  });

  app.post("/api/auth/request-reset", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.json({ message: "If an account exists with that email, a reset code has been sent." });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await storage.updateUser(user.id, { resetCode: code, resetCodeExpiry: expiry });
    console.log(`[Password Reset] Code for ${email}: ${code}`);
    res.json({ message: "If an account exists with that email, a reset code has been sent." });
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "Email, code, and new password are required" });
    }
    const user = await storage.getUserByEmail(email);
    if (!user || user.resetCode !== code) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }
    if (user.resetCodeExpiry && new Date() > user.resetCodeExpiry) {
      return res.status(400).json({ message: "Reset code has expired. Please request a new one." });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await storage.updateUser(user.id, { password: hashedPassword, resetCode: null, resetCodeExpiry: null });
    res.json({ message: "Password has been reset successfully" });
  });

  // Properties - Protected, tenant-scoped
  app.get("/api/properties", requireAuth, async (req, res) => {
    const props = await storage.getProperties(req.user!.companyId);
    res.json(props);
  });

  app.get("/api/properties/:id", requireAuth, async (req, res) => {
    const property = await storage.getProperty(Number(req.params.id), req.user!.companyId);
    if (!property) return res.status(404).json({ message: "Property not found" });
    res.json(property);
  });

  app.post("/api/properties", requireAuth, async (req, res) => {
    const parsed = insertPropertySchema.safeParse({ ...req.body, companyId: req.user!.companyId });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const property = await storage.createProperty(parsed.data);
    res.status(201).json(property);
  });

  app.patch("/api/properties/:id", requireAuth, async (req, res) => {
    const updated = await storage.updateProperty(Number(req.params.id), req.body, req.user!.companyId);
    if (!updated) return res.status(404).json({ message: "Property not found" });
    res.json(updated);
  });

  app.delete("/api/properties/:id", requireAuth, async (req, res) => {
    await storage.deleteProperty(Number(req.params.id), req.user!.companyId);
    res.status(204).send();
  });

  // Corporate Leases - Protected, tenant-scoped
  app.get("/api/leases", requireAuth, async (req, res) => {
    const leases = await storage.getLeases(req.user!.companyId);
    res.json(leases);
  });

  app.get("/api/leases/:id", requireAuth, async (req, res) => {
    const lease = await storage.getLease(Number(req.params.id), req.user!.companyId);
    if (!lease) return res.status(404).json({ message: "Lease not found" });
    res.json(lease);
  });

  app.post("/api/leases", requireAuth, async (req, res) => {
    const parsed = insertLeaseSchema.safeParse({ ...req.body, companyId: req.user!.companyId });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const lease = await storage.createLease(parsed.data);
    res.status(201).json(lease);
  });

  app.patch("/api/leases/:id", requireAuth, async (req, res) => {
    const updated = await storage.updateLease(Number(req.params.id), req.body, req.user!.companyId);
    if (!updated) return res.status(404).json({ message: "Lease not found" });
    res.json(updated);
  });

  // Vendors - Protected, tenant-scoped
  app.get("/api/vendors", requireAuth, async (req, res) => {
    const v = await storage.getVendors(req.user!.companyId);
    res.json(v);
  });

  app.get("/api/vendors/:id", requireAuth, async (req, res) => {
    const vendor = await storage.getVendor(Number(req.params.id), req.user!.companyId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  });

  app.post("/api/vendors", requireAuth, async (req, res) => {
    const parsed = insertVendorSchema.safeParse({ ...req.body, companyId: req.user!.companyId });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const vendor = await storage.createVendor(parsed.data);
    res.status(201).json(vendor);
  });

  app.patch("/api/vendors/:id", requireAuth, async (req, res) => {
    const updated = await storage.updateVendor(Number(req.params.id), req.body, req.user!.companyId);
    if (!updated) return res.status(404).json({ message: "Vendor not found" });
    res.json(updated);
  });

  // Documents - Protected, tenant-scoped
  app.get("/api/documents", requireAuth, async (req, res) => {
    const docs = await storage.getDocuments(req.user!.companyId);
    res.json(docs);
  });

  app.post("/api/documents", requireAuth, async (req, res) => {
    const parsed = insertDocumentSchema.safeParse({ ...req.body, companyId: req.user!.companyId });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const doc = await storage.createDocument(parsed.data);
    res.status(201).json(doc);
  });

  app.patch("/api/documents/:id", requireAuth, async (req, res) => {
    const updated = await storage.updateDocument(Number(req.params.id), req.body, req.user!.companyId);
    if (!updated) return res.status(404).json({ message: "Document not found" });
    res.json(updated);
  });

  // Crypto Currencies - Admin only for toggles, read for authenticated users
  app.get("/api/crypto", requireAuth, async (_req, res) => {
    const cryptos = await storage.getCryptoCurrencies();
    res.json(cryptos);
  });

  app.post("/api/crypto", requireAuth, requireRole("admin"), async (req, res) => {
    const parsed = insertCryptoSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const crypto = await storage.upsertCrypto(parsed.data);
    res.status(201).json(crypto);
  });

  app.patch("/api/crypto/:id/toggle", requireAuth, requireRole("admin"), async (req, res) => {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") return res.status(400).json({ message: "enabled must be boolean" });
    const updated = await storage.toggleCrypto(String(req.params.id), enabled);
    if (!updated) return res.status(404).json({ message: "Crypto not found" });
    res.json(updated);
  });

  // Job Requests - Protected, tenant-scoped
  app.get("/api/jobs", requireAuth, async (req, res) => {
    const jobs = await storage.getJobRequests(req.user!.companyId);
    res.json(jobs);
  });

  app.get("/api/jobs/vendor/:vendorId", requireAuth, async (req, res) => {
    const jobs = await storage.getJobRequestsByVendor(Number(req.params.vendorId), req.user!.companyId);
    res.json(jobs);
  });

  app.post("/api/jobs", requireAuth, async (req, res) => {
    const parsed = insertJobRequestSchema.safeParse({ ...req.body, companyId: req.user!.companyId });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const job = await storage.createJobRequest(parsed.data);
    res.status(201).json(job);
  });

  app.patch("/api/jobs/:id", requireAuth, async (req, res) => {
    const updated = await storage.updateJobRequest(Number(req.params.id), req.body, req.user!.companyId);
    if (!updated) return res.status(404).json({ message: "Job not found" });
    res.json(updated);
  });

  // Seed endpoint
  app.post("/api/seed", async (_req, res) => {
    try {
      const existingProps = await storage.getProperties();
      if (existingProps.length > 0) {
        return res.json({ message: "Data already seeded" });
      }

      const company = await storage.createCompany({
        name: "CorpLease Demo",
        email: "demo@corplease.com",
        phone: "(555) 000-0000",
      });
      const cid = company.id;

      const seedProperties = [
        { title: "Executive Loft Downtown", type: "Loft", price: 3500, address: "123 Business Blvd, Downtown", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", beds: 1, baths: 1.5, sqft: 1200, status: "leased", companyId: cid },
        { title: "Luxury Condo with View", type: "Condo", price: 4200, address: "456 Skyline Ave, Uptown", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", beds: 2, baths: 2, sqft: 1500, status: "leased", companyId: cid },
        { title: "Suburban Family Home", type: "Single Family Home", price: 2800, address: "789 Maple Dr, Suburbia", image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", beds: 3, baths: 2.5, sqft: 2200, status: "available", companyId: cid },
      ];

      for (const p of seedProperties) {
        await storage.createProperty(p);
      }

      const seedLeases = [
        { employeeName: "Sarah Jenkins", employeeId: "EMP-402", propertyName: "Executive Loft Downtown", startDate: "2023-01-15", endDate: "2024-01-15", status: "Active", rent: 3500, companyId: cid },
        { employeeName: "Michael Chang", employeeId: "EMP-993", propertyName: "Luxury Condo with View", startDate: "2023-06-01", endDate: "2024-06-01", status: "Active", rent: 4200, companyId: cid },
        { employeeName: "Elena Rodriguez", employeeId: "EMP-155", propertyName: "Suburban Family Home", startDate: "2023-09-01", endDate: "2024-09-01", status: "Renewing", rent: 2800, companyId: cid },
        { employeeName: "David Kim", employeeId: "EMP-772", propertyName: "Metro City Apartment", startDate: "2024-01-01", endDate: "2025-01-01", status: "Pending Move-in", rent: 3100, companyId: cid },
      ];

      for (const l of seedLeases) {
        await storage.createLease(l);
      }

      const seedVendors = [
        { name: "Sparkle Cleaners", service: "Cleaning", rating: 4.8, status: "Approved", companyId: cid },
        { name: "FixIt Fast HVAC", service: "HVAC", rating: 4.9, status: "Approved", companyId: cid },
        { name: "Elite Staging Pros", service: "Staging", rating: 4.7, status: "Pending Docs", companyId: cid },
      ];

      for (const v of seedVendors) {
        await storage.createVendor(v);
      }

      const seedDocs = [
        { name: "Lease Agreement", status: "Signed", date: "2023-10-15", type: "lease", companyId: cid },
        { name: "Pet Addendum", status: "Pending", date: "2023-10-16", type: "addendum", companyId: cid },
        { name: "Move-in Checklist", status: "New", date: "2023-10-18", type: "checklist", companyId: cid },
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
        { title: "Unit 404 - Deep Clean", description: "Full deep cleaning before move-in", requestedBy: "Skyline Properties", dueDate: "2024-02-15", status: "pending", companyId: cid },
        { title: "Unit 201 - HVAC Inspection", description: "Annual HVAC system check", requestedBy: "Metro Management", dueDate: "2024-02-16", status: "pending", companyId: cid },
        { title: "Unit 305 - Move-out Clean", description: "Post move-out cleaning", requestedBy: "Skyline Properties", dueDate: "2024-02-17", status: "pending", companyId: cid },
      ];

      for (const j of seedJobs) {
        await storage.createJobRequest(j);
      }

      const seedNotifications = [
        { type: "payment_received", title: "Payment Received", message: "$4,200 lease payment received from TechCorp Inc. via ACH bank transfer.", portal: "owner", method: "ACH", amount: 4200, read: false, companyId: cid },
        { type: "payout_processed", title: "Payout Processed", message: "$450 payout sent to Sparkle Cleaners via debit card.", portal: "admin", method: "Card", amount: 450, read: false, companyId: cid },
        { type: "payment_received", title: "Payment Received", message: "$3,500 lease payment received from GlobalTech Ltd. via credit card.", portal: "customer", method: "Card", amount: 3500, read: false, companyId: cid },
        { type: "payout_requested", title: "Payout Requested", message: "$800 crypto payout to FixIt Fast HVAC via BTC is pending.", portal: "vendor", method: "BTC", amount: 800, read: false, companyId: cid },
        { type: "payment_failed", title: "Payment Failed", message: "ACH payment of $2,100 from Innovate Corp was returned. Retry needed.", portal: "admin", method: "ACH", amount: 2100, read: false, companyId: cid },
        { type: "payment_received", title: "Payment Confirmed", message: "$2,800 lease payment confirmed via Ethereum smart contract.", portal: "customer", method: "ETH", amount: 2800, read: true, companyId: cid },
      ];

      for (const n of seedNotifications) {
        await storage.createNotification(n);
      }

      res.json({ message: "Seed data created successfully", companyId: cid });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // SSE endpoint for real-time notifications
  app.get("/api/notifications/stream", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
    addSSEClient(res);
    req.on("close", () => {
      removeSSEClient(res);
    });
  });

  // Notifications CRUD - Protected, tenant-scoped
  app.get("/api/notifications", requireAuth, async (req, res) => {
    const notifs = await storage.getNotifications(req.user!.companyId);
    res.json(notifs);
  });

  app.get("/api/notifications/unread", requireAuth, async (req, res) => {
    const notifs = await storage.getUnreadNotifications(req.user!.companyId);
    res.json(notifs);
  });

  app.post("/api/notifications", requireAuth, async (req, res) => {
    const parsed = insertNotificationSchema.safeParse({ ...req.body, companyId: req.user!.companyId });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const notification = await storage.createNotification(parsed.data);
    broadcastNotification(notification);
    res.status(201).json(notification);
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    const updated = await storage.markNotificationRead(Number(req.params.id), req.user!.companyId);
    if (!updated) return res.status(404).json({ message: "Notification not found" });
    res.json(updated);
  });

  app.post("/api/notifications/read-all", requireAuth, async (_req, res) => {
    await storage.markAllNotificationsRead(_req.user!.companyId);
    res.json({ message: "All notifications marked as read" });
  });

  // Stripe Payment Routes - Protected
  app.get("/api/stripe/publishable-key", async (_req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error: any) {
      res.status(500).json({ message: "Stripe not configured" });
    }
  });

  app.post("/api/stripe/create-payment-intent", requireAuth, async (req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const { paymentMethodType, description, metadata } = req.body;
      let { amount } = req.body;

      if (!amount || !paymentMethodType) {
        return res.status(400).json({ message: "amount and paymentMethodType are required" });
      }

      if (metadata?.type === "corporate_lease_payment") {
        const leases = await storage.getLeases(req.user!.companyId);
        const serverTotal = leases.reduce((sum, l) => sum + l.rent, 0);
        if (Math.abs(amount - serverTotal) > 0.01) {
          amount = serverTotal;
        }
      }

      if (amount <= 0 || amount > 999999) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      const paymentMethodTypes: string[] = [];
      if (paymentMethodType === "card") {
        paymentMethodTypes.push("card");
      } else if (paymentMethodType === "ach") {
        paymentMethodTypes.push("us_bank_account");
      } else {
        paymentMethodTypes.push(paymentMethodType);
      }

      let stripeCustomerId: string | undefined;
      if (req.user!.companyId) {
        const company = await storage.getCompany(req.user!.companyId);
        if (company?.stripeCustomerId) {
          stripeCustomerId = company.stripeCustomerId;
        }
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        payment_method_types: paymentMethodTypes,
        description: description || "CorpLease Payment",
        metadata: { ...metadata, companyId: String(req.user!.companyId) },
        ...(stripeCustomerId ? { customer: stripeCustomerId } : {}),
      });

      const methodLabel = paymentMethodType === "ach" ? "ACH" : paymentMethodType === "card" ? "Card" : paymentMethodType;
      const portal = metadata?.portal || "customer";
      const notification = await storage.createNotification({
        type: "payment_initiated",
        title: "Payment Initiated",
        message: `$${amount.toLocaleString()} payment via ${methodLabel} is being processed.`,
        portal,
        method: methodLabel,
        amount,
        read: false,
        companyId: req.user!.companyId,
      });
      broadcastNotification(notification);

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error("Payment intent error:", error.message);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/stripe/create-payout", requireAuth, async (req, res) => {
    const { amount, description, portal: reqPortal, method: reqMethod } = req.body;
    const payoutPortal = reqPortal || "vendor";
    const payoutMethod = reqMethod || "ACH";

    if (!amount) {
      return res.status(400).json({ message: "amount is required" });
    }

    try {
      const stripe = await getUncachableStripeClient();

      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        destination: "default",
        description: description || "CorpLease Vendor Payout",
        metadata: { companyId: String(req.user!.companyId) },
      } as any);

      const notification = await storage.createNotification({
        type: "payout_processed",
        title: "Payout Processed",
        message: description || `$${amount.toLocaleString()} payout has been processed via ${payoutMethod}.`,
        portal: payoutPortal,
        method: payoutMethod,
        amount,
        read: false,
        companyId: req.user!.companyId,
      });
      broadcastNotification(notification);

      res.json({ transfer });
    } catch (error: any) {
      console.error("Payout error:", error.message);
      const notification = await storage.createNotification({
        type: "payout_requested",
        title: "Payout Queued",
        message: description || `$${amount.toLocaleString()} payout request has been queued.`,
        portal: payoutPortal,
        method: payoutMethod,
        amount,
        read: false,
        companyId: req.user!.companyId,
      });
      broadcastNotification(notification);
      res.status(500).json({ message: error.message });
    }
  });

  // Contact Requests - Public create, Admin read/respond
  app.post("/api/contact", async (req, res) => {
    const parsed = insertContactRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const request = await storage.createContactRequest(parsed.data);
    res.status(201).json(request);
  });

  app.get("/api/contact", requireAuth, requireRole("admin"), async (_req, res) => {
    const requests = await storage.getContactRequests();
    res.json(requests);
  });

  app.patch("/api/contact/:id", requireAuth, requireRole("admin"), async (req, res) => {
    const { adminResponse, status } = req.body;
    const updated = await storage.updateContactRequest(Number(req.params.id), {
      adminResponse,
      status: status || "responded",
      respondedAt: new Date(),
    });
    if (!updated) return res.status(404).json({ message: "Contact request not found" });
    res.json(updated);
  });

  // Page Content - Public read, Admin write
  app.get("/api/pages/:slug", async (req, res) => {
    const page = await storage.getPageContent(req.params.slug);
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json(page);
  });

  app.get("/api/pages", async (_req, res) => {
    const pages = await storage.getAllPageContents();
    res.json(pages);
  });

  app.put("/api/pages/:slug", requireAuth, requireRole("admin"), async (req, res) => {
    const parsed = insertPageContentSchema.safeParse({ ...req.body, slug: req.params.slug });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const page = await storage.upsertPageContent(parsed.data);
    res.json(page);
  });

  // Seed default page content
  app.post("/api/seed-pages", async (_req, res) => {
    const defaultPages = [
      { slug: "about", title: "About Us", content: "CorpLease is the leading corporate housing platform connecting businesses with premium living spaces. Founded with a vision to simplify corporate relocation, we've grown to serve hundreds of companies across major metropolitan areas.\n\nOur platform streamlines the entire process — from property discovery to lease management and payment processing. We believe every professional deserves a comfortable home, and every company deserves a hassle-free housing solution.\n\nWith our network of property owners, vetted service vendors, and cutting-edge technology, we deliver an unmatched corporate housing experience." },
      { slug: "careers", title: "Careers", content: "Join the team that's transforming corporate housing. At CorpLease, we're building the future of professional relocation and property management.\n\nWe're always looking for talented individuals who share our passion for innovation and exceptional service. Whether you're in engineering, design, sales, or operations, there's a place for you here.\n\nCurrent openings include positions in Full-Stack Development, Product Design, Enterprise Sales, Customer Success, and Property Operations. We offer competitive compensation, comprehensive benefits, flexible work arrangements, and the opportunity to make a real impact." },
      { slug: "press", title: "Press & Media", content: "CorpLease has been recognized as an industry leader in corporate housing technology. Our innovative approach to property management and tenant services has garnered attention from leading business publications.\n\nFor press inquiries, media kits, and interview requests, please reach out through our contact page. We're happy to share insights on the corporate housing industry, property technology trends, and our company's growth story.\n\nRecent coverage includes features on our multi-tenant architecture, integrated payment solutions, and our expanding vendor network across major markets." },
      { slug: "privacy-policy", title: "Privacy Policy", content: "Effective Date: January 1, 2024\n\nAt CorpLease, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.\n\nInformation We Collect: We collect information you provide directly, such as your name, email address, company details, and payment information. We also collect usage data through cookies and similar technologies.\n\nHow We Use Information: Your information is used to provide and improve our services, process transactions, communicate with you, and ensure platform security.\n\nData Protection: We implement industry-standard security measures including encryption, secure data storage, and regular security audits. We never sell your personal data to third parties.\n\nYour Rights: You have the right to access, correct, or delete your personal data. Contact us at privacy@corplease.com for any privacy-related requests." },
      { slug: "terms-of-service", title: "Terms of Service", content: "Last Updated: January 1, 2024\n\nWelcome to CorpLease. By accessing or using our platform, you agree to be bound by these Terms of Service.\n\nAccount Registration: Users must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials.\n\nPlatform Usage: CorpLease provides a marketplace connecting corporate tenants, property owners, and service vendors. All transactions are subject to applicable laws and regulations.\n\nPayment Terms: Payments processed through our platform are subject to our payment processing partner's terms. We support multiple payment methods including ACH, credit/debit cards, and select cryptocurrencies.\n\nLiability: CorpLease acts as an intermediary platform. While we vet our partners, we are not responsible for the condition of properties or quality of vendor services beyond our stated guarantees.\n\nTermination: We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity." },
      { slug: "cookie-policy", title: "Cookie Policy", content: "CorpLease uses cookies and similar tracking technologies to enhance your experience on our platform.\n\nEssential Cookies: Required for basic platform functionality including authentication, security, and session management. These cannot be disabled.\n\nAnalytics Cookies: Help us understand how visitors interact with our platform. This data is used to improve our services and user experience.\n\nPreference Cookies: Remember your settings and preferences for a more personalized experience.\n\nManaging Cookies: You can control cookie preferences through your browser settings. Note that disabling certain cookies may affect platform functionality.\n\nBy continuing to use CorpLease, you consent to our use of cookies as described in this policy." },
      { slug: "contact", title: "Contact Us", content: "Have a question or need assistance? We're here to help.\n\nsupport@corplease.com\nsales@corplease.com\n\n(555) 123-4567\nMon-Fri, 9am-6pm EST\n\n100 Corporate Plaza\nSuite 400, New York, NY 10001" },
    ];

    for (const page of defaultPages) {
      await storage.upsertPageContent(page);
    }
    res.json({ message: "Default page content seeded successfully" });
  });

  return httpServer;
}

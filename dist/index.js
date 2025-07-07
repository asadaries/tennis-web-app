var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  bookings: () => bookings,
  bookingsRelations: () => bookingsRelations,
  courtPricingRules: () => courtPricingRules,
  courtPricingRulesRelations: () => courtPricingRulesRelations,
  courts: () => courts,
  courtsRelations: () => courtsRelations,
  insertBookingSchema: () => insertBookingSchema,
  insertCourtSchema: () => insertCourtSchema,
  insertTimeSlotSchema: () => insertTimeSlotSchema,
  insertUserSchema: () => insertUserSchema,
  timeSlots: () => timeSlots,
  timeSlotsRelations: () => timeSlotsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import {
  mysqlTable,
  text,
  serial,
  int,
  boolean,
  timestamp,
  decimal,
  date
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
var users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  gender: text("gender").notNull().default("male"),
  role: text("role").notNull().default("user"),
  // user, admin, vendor
  isBlocked: boolean("is_blocked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var courts = mysqlTable("courts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  openTime: text("open_time").notNull(),
  // Format: "HH:MM"
  closeTime: text("close_time").notNull(),
  // Format: "HH:MM"
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull()
});
var courtPricingRules = mysqlTable("court_pricing_rules", {
  id: serial("id").primaryKey(),
  courtId: int("court_id").references(() => courts.id).notNull(),
  dayOfWeek: int("day_of_week").notNull(),
  // 0-6, Sunday-Saturday
  timeSlot: text("time_slot").notNull(),
  // Format: "HH:MM-HH:MM"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull()
});
var timeSlots = mysqlTable("time_slots", {
  id: serial("id").primaryKey(),
  courtId: int("court_id").references(() => courts.id).notNull(),
  date: date("date").notNull(),
  startTime: text("start_time").notNull(),
  // Format: "HH:MM"
  endTime: text("end_time").notNull(),
  // Format: "HH:MM"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean("is_available").default(true).notNull()
});
var bookings = mysqlTable("bookings", {
  id: serial("id").primaryKey(),
  userId: int("user_id").references(() => users.id).notNull(),
  timeSlotId: int("time_slot_id").references(() => timeSlots.id).notNull(),
  status: text("status").notNull().default("pending"),
  // pending, confirmed, cancelled
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings)
}));
var courtsRelations = relations(courts, ({ many }) => ({
  timeSlots: many(timeSlots),
  pricingRules: many(courtPricingRules)
}));
var timeSlotsRelations = relations(timeSlots, ({ one, many }) => ({
  court: one(courts, {
    fields: [timeSlots.courtId],
    references: [courts.id]
  }),
  bookings: many(bookings)
}));
var bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id]
  }),
  timeSlot: one(timeSlots, {
    fields: [bookings.timeSlotId],
    references: [timeSlots.id]
  })
}));
var courtPricingRulesRelations = relations(
  courtPricingRules,
  ({ one }) => ({
    court: one(courts, {
      fields: [courtPricingRules.courtId],
      references: [courts.id]
    })
  })
);
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
}).extend({
  email: z.string().email(),
  password: z.string().min(6),
  gender: z.enum(["male", "female"]),
  role: z.enum(["user", "admin", "vendor"]).default("user")
});
var insertCourtSchema = createInsertSchema(courts).omit({
  id: true
}).extend({
  pricingRules: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      timeSlot: z.string(),
      price: z.string()
    })
  ).optional()
});
var insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true
});
var insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var envPath = path.join(__dirname, "..", ".env");
dotenv.config({ path: envPath });
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?...."
  );
}
var encodedUrl = new URL(process.env.DATABASE_URL).toString();
var pool = mysql.createPool(encodedUrl);
var db = drizzle(pool, { schema: schema_exports, mode: "default" });

// server/storage.ts
import { eq, and, desc, asc, sql } from "drizzle-orm";
import session from "express-session";
import connectMySQL from "express-mysql-session";
var MySQLSessionStore = connectMySQL(session);
var DatabaseStorage = class {
  constructor() {
    this.sessionStore = new MySQLSessionStore(
      {
        expiration: 864e5,
        // 24 hours
        createDatabaseTable: true,
        schema: {
          tableName: "sessions",
          columnNames: {
            session_id: "session_id",
            expires: "expires",
            data: "data"
          }
        }
      },
      pool
    );
  }
  // User methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    debugger;
    const [user] = await db.select().from(users).where(eq(users.username, username));
    console.log([user]);
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    await db.insert(users).values(insertUser);
    const [user] = await db.select().from(users).where(eq(users.email, insertUser.email));
    return user;
  }
  async updateUser(id, updateData) {
    await db.update(users).set(updateData).where(eq(users.id, id));
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async deleteUser(id) {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.length > 0;
  }
  async blockUser(id) {
    const result = await db.update(users).set({ isBlocked: true }).where(eq(users.id, id));
    return result.length > 0;
  }
  async unblockUser(id) {
    const result = await db.update(users).set({ isBlocked: false }).where(eq(users.id, id));
    return result.length > 0;
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(asc(users.username));
  }
  // Court methods
  async getCourt(id) {
    const [court] = await db.select().from(courts).where(eq(courts.id, id));
    return court || void 0;
  }
  async getAllCourts() {
    return await db.select().from(courts).where(eq(courts.isActive, true)).orderBy(asc(courts.name));
  }
  async createCourt(insertCourt) {
    const { pricingRules, ...courtData } = insertCourt;
    return await db.transaction(async (tx) => {
      await tx.insert(courts).values(courtData);
      const [court] = await tx.select().from(courts).orderBy(desc(courts.id)).limit(1);
      if (pricingRules && pricingRules.length > 0) {
        await tx.insert(courtPricingRules).values(
          pricingRules.map((rule) => ({
            courtId: court.id,
            dayOfWeek: rule.dayOfWeek,
            timeSlot: rule.timeSlot,
            price: rule.price,
            isActive: true
          }))
        );
      }
      return court;
    });
  }
  async updateCourt(id, updateData) {
    const { pricingRules, ...courtData } = updateData;
    return await db.transaction(async (tx) => {
      await tx.update(courts).set(courtData).where(eq(courts.id, id));
      const [court] = await tx.select().from(courts).where(eq(courts.id, id));
      if (pricingRules) {
        await tx.delete(courtPricingRules).where(eq(courtPricingRules.courtId, id));
        if (pricingRules.length > 0) {
          await tx.insert(courtPricingRules).values(
            pricingRules.map((rule) => ({
              courtId: id,
              dayOfWeek: rule.dayOfWeek,
              timeSlot: rule.timeSlot,
              price: rule.price,
              isActive: true
            }))
          );
        }
      }
      return court || void 0;
    });
  }
  async deleteCourt(id) {
    const result = await db.delete(courts).where(eq(courts.id, id));
    return result.length > 0;
  }
  // Time slot methods
  async getTimeSlot(id) {
    const [timeSlot] = await db.select().from(timeSlots).where(eq(timeSlots.id, id));
    return timeSlot || void 0;
  }
  async getTimeSlotWithCourt(id) {
    const [result] = await db.select().from(timeSlots).innerJoin(courts, eq(timeSlots.courtId, courts.id)).where(eq(timeSlots.id, id));
    if (!result) return void 0;
    return {
      ...result.time_slots,
      court: result.courts
    };
  }
  async getTimeSlotsByDate(date2) {
    const results = await db.select().from(timeSlots).innerJoin(courts, eq(timeSlots.courtId, courts.id)).where(sql`${timeSlots.date} = ${date2}`).orderBy(asc(timeSlots.startTime), asc(courts.name));
    return results.map((result) => ({
      ...result.time_slots,
      court: result.courts
    }));
  }
  async getAvailableTimeSlots(date2) {
    const results = await db.select().from(timeSlots).innerJoin(courts, eq(timeSlots.courtId, courts.id)).where(
      and(
        sql`${timeSlots.date} = ${date2}`,
        eq(timeSlots.isAvailable, true),
        eq(courts.isActive, true)
      )
    ).orderBy(asc(timeSlots.startTime), asc(courts.name));
    return results.map((result) => ({
      ...result.time_slots,
      court: result.courts
    }));
  }
  async createTimeSlot(insertTimeSlot) {
    await db.insert(timeSlots).values(insertTimeSlot);
    const [timeSlot] = await db.select().from(timeSlots).orderBy(desc(timeSlots.id)).limit(1);
    return timeSlot;
  }
  async updateTimeSlot(id, updateData) {
    await db.update(timeSlots).set(updateData).where(eq(timeSlots.id, id));
    const [timeSlot] = await db.select().from(timeSlots).where(eq(timeSlots.id, id));
    return timeSlot || void 0;
  }
  async deleteTimeSlot(id) {
    const result = await db.delete(timeSlots).where(eq(timeSlots.id, id));
    return result.length > 0;
  }
  // Booking methods
  async getBooking(id) {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || void 0;
  }
  async getBookingWithDetails(id) {
    const [result] = await db.select().from(bookings).innerJoin(users, eq(bookings.userId, users.id)).innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id)).innerJoin(courts, eq(timeSlots.courtId, courts.id)).where(eq(bookings.id, id));
    if (!result) return void 0;
    return {
      ...result.bookings,
      user: result.users,
      timeSlot: {
        ...result.time_slots,
        court: result.courts
      }
    };
  }
  async getUserBookings(userId) {
    const results = await db.select().from(bookings).innerJoin(users, eq(bookings.userId, users.id)).innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id)).innerJoin(courts, eq(timeSlots.courtId, courts.id)).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
    return results.map((result) => ({
      ...result.bookings,
      user: result.users,
      timeSlot: {
        ...result.time_slots,
        court: result.courts
      }
    }));
  }
  async getAllBookings() {
    const results = await db.select().from(bookings).innerJoin(users, eq(bookings.userId, users.id)).innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id)).innerJoin(courts, eq(timeSlots.courtId, courts.id)).orderBy(desc(bookings.createdAt));
    return results.map((result) => ({
      ...result.bookings,
      user: result.users,
      timeSlot: {
        ...result.time_slots,
        court: result.courts
      }
    }));
  }
  async createBooking(insertBooking) {
    await db.insert(bookings).values(insertBooking);
    const [booking] = await db.select().from(bookings).orderBy(desc(bookings.id)).limit(1);
    await db.update(timeSlots).set({ isAvailable: false }).where(eq(timeSlots.id, insertBooking.timeSlotId));
    return booking;
  }
  async updateBooking(id, updateData) {
    await db.update(bookings).set(updateData).where(eq(bookings.id, id));
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || void 0;
  }
  async cancelBooking(id) {
    const booking = await this.getBooking(id);
    if (!booking) return false;
    await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, id));
    await db.update(timeSlots).set({ isAvailable: true }).where(eq(timeSlots.id, booking.timeSlotId));
    return true;
  }
  async getTimeSlotsByDateRange(startDate, endDate) {
    const results = await db.select().from(timeSlots).leftJoin(bookings, eq(timeSlots.id, bookings.timeSlotId)).leftJoin(users, eq(bookings.userId, users.id)).innerJoin(courts, eq(timeSlots.courtId, courts.id)).where(
      and(
        sql`${timeSlots.date} >= ${startDate}`,
        sql`${timeSlots.date} <= ${endDate}`
      )
    ).orderBy(asc(timeSlots.date), asc(timeSlots.startTime), asc(courts.name));
    return results.map((result) => ({
      ...result.time_slots,
      court: result.courts,
      booking: result.bookings ? {
        ...result.bookings,
        user: result.users
      } : void 0
    }));
  }
  async getPricingRules(courtId) {
    return await this.getCourtPricingRules(courtId);
  }
  async getAllPricingRules() {
    return await db.select().from(courtPricingRules).where(eq(courtPricingRules.isActive, true));
  }
  async createOrUpdatePricingRule(courtId, dayOfWeek, timeSlot, price) {
    const [rule] = await db.select().from(courtPricingRules).where(
      eq(courtPricingRules.courtId, courtId) && eq(courtPricingRules.dayOfWeek, dayOfWeek) && eq(courtPricingRules.timeSlot, timeSlot)
    );
    if (rule) {
      await db.update(courtPricingRules).set({ price }).where(eq(courtPricingRules.id, rule.id));
      return rule;
    } else {
      await db.insert(courtPricingRules).values({
        courtId,
        dayOfWeek,
        timeSlot,
        price,
        isActive: true
      });
      return true;
    }
  }
  async getCourtPricingRules(courtId) {
    return await db.select().from(courtPricingRules).where(eq(courtPricingRules.courtId, courtId));
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import dotenv2 from "dotenv";
dotenv2.config({ path: ".env" });
console.log("\u{1F525} server/index.ts started");
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  try {
    return supplied === stored;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log("Trying to log in:", username);
      try {
        const user = await storage.getUserByUsername(username);
        console.log("User: ", user);
        if (!user) {
          return done(null, false, { message: "User not found" });
        }
        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid password" });
        }
        return done(null, user);
      } catch (error) {
        console.error("Login error:", error);
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        gender: req.body.gender || "male"
        // Default to male if not provided
      });
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login authentication error:", err);
        return res.status(500).json({ message: "Authentication error", error: err.message });
      }
      if (!user) {
        return res.status(401).json({
          message: info?.message || "Invalid credentials",
          suggestion: "If you're having trouble logging in, your password may need to be reset. Please contact an administrator."
        });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login session error:", loginErr);
          return res.status(500).json({ message: "Session creation failed" });
        }
        res.status(200).json(user);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  app2.post("/api/reset-password", async (req, res) => {
    try {
      const { username, newPassword } = req.body;
      if (!username || !newPassword) {
        return res.status(400).json({ message: "Username and new password are required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser(user.id, {
        password: hashedPassword
      });
      if (updatedUser) {
        res.json({ message: "Password updated successfully" });
      } else {
        res.status(500).json({ message: "Failed to update password" });
      }
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Password reset failed" });
    }
  });
}

// server/routes.ts
function requireAdmin(req, res, next) {
  if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
function requireVendor(req, res, next) {
  if (!req.isAuthenticated() || !req.user || req.user.role !== "vendor" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Vendor access required" });
  }
  next();
}
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}
function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      res.json(users2.map((user) => ({ ...user, password: void 0 })));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username) || await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Username or email already exists" });
      }
      const user = await storage.createUser(userData);
      res.status(201).json({ ...user, password: void 0 });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: void 0 });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/users/:id/block", requireVendor, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.blockUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User blocked successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/users/:id/unblock", requireVendor, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.unblockUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User unblocked successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/admin/stats", requireVendor, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const courts2 = await storage.getAllCourts();
      const bookings2 = await storage.getAllBookings();
      const confirmedBookings = bookings2.filter(
        (b) => b.status === "confirmed"
      );
      const pendingBookings = bookings2.filter((b) => b.status === "pending");
      const blockedUsers = users2.filter((u) => u.isBlocked);
      const totalRevenue = confirmedBookings.reduce(
        (sum, b) => sum + parseFloat(b.totalPrice),
        0
      );
      const today = /* @__PURE__ */ new Date();
      const todayStr = today.toISOString().split("T")[0];
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
      const dailyRevenue = confirmedBookings.filter((b) => b.timeSlot.date === todayStr).reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);
      const weeklyRevenue = confirmedBookings.filter((b) => b.timeSlot.date >= weekAgo).reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);
      const monthlyRevenue = confirmedBookings.filter((b) => b.timeSlot.date >= monthAgo).reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);
      const totalTimeSlots = bookings2.length;
      const bookedTimeSlots = confirmedBookings.length;
      const occupancyRate = totalTimeSlots > 0 ? Math.round(bookedTimeSlots / totalTimeSlots * 100) : 0;
      res.json({
        totalUsers: users2.length,
        totalCourts: courts2.length,
        activeBookings: confirmedBookings.length,
        pendingBookings: pendingBookings.length,
        revenue: totalRevenue,
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenue,
        occupancyRate,
        blockedUsers: blockedUsers.length,
        totalTimeSlots,
        bookedTimeSlots
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/courts", async (req, res) => {
    try {
      const courts2 = await storage.getAllCourts();
      res.json(courts2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/courts", requireAdmin, async (req, res) => {
    try {
      const courtData = insertCourtSchema.parse(req.body);
      const court = await storage.createCourt(courtData);
      res.status(201).json(court);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.put("/api/courts/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertCourtSchema.partial().parse(req.body);
      const court = await storage.updateCourt(id, updateData);
      if (!court) {
        return res.status(404).json({ message: "Court not found" });
      }
      res.json(court);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.delete("/api/courts/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCourt(id);
      if (!success) {
        return res.status(404).json({ message: "Court not found" });
      }
      res.json({ message: "Court deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/time-slots", async (req, res) => {
    try {
      const { date: date2 } = req.query;
      if (date2) {
        const timeSlots2 = await storage.getTimeSlotsByDate(date2);
        res.json(timeSlots2);
      } else {
        res.status(400).json({ message: "Date parameter is required" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/time-slots/available", async (req, res) => {
    try {
      const { date: date2 } = req.query;
      if (date2) {
        const timeSlots2 = await storage.getAvailableTimeSlots(date2);
        res.json(timeSlots2);
      } else {
        res.status(400).json({ message: "Date parameter is required" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/time-slots", requireAdmin, async (req, res) => {
    try {
      const timeSlotData = insertTimeSlotSchema.parse(req.body);
      const timeSlot = await storage.createTimeSlot(timeSlotData);
      res.status(201).json(timeSlot);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.put("/api/time-slots/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertTimeSlotSchema.partial().parse(req.body);
      const timeSlot = await storage.updateTimeSlot(id, updateData);
      if (!timeSlot) {
        return res.status(404).json({ message: "Time slot not found" });
      }
      res.json(timeSlot);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.delete("/api/time-slots/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTimeSlot(id);
      if (!success) {
        return res.status(404).json({ message: "Time slot not found" });
      }
      res.json({ message: "Time slot deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/time-slots/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      const timeSlots2 = await storage.getTimeSlotsByDateRange(
        startDate,
        endDate
      );
      res.json(timeSlots2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/pricing-rules", requireVendor, async (req, res) => {
    try {
      const { courtId } = req.query;
      if (courtId) {
        const rules = await storage.getPricingRules(
          parseInt(courtId)
        );
        res.json(rules);
      } else {
        const rules = await storage.getAllPricingRules();
        res.json(rules);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/pricing-rules", requireVendor, async (req, res) => {
    try {
      const { courtId, timeSlot, price } = req.body;
      if (!courtId || !timeSlot || !price) {
        return res.status(400).json({ message: "Court ID, time slot, and price are required" });
      }
      const rule = await storage.createOrUpdatePricingRule(
        courtId,
        timeSlot,
        price
      );
      res.json(rule);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.post("/api/pricing-rules/batch", requireVendor, async (req, res) => {
    try {
      const { updates } = req.body;
      if (!Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates must be an array" });
      }
      const results = await Promise.all(
        updates.map(
          ({ courtId, dayOfWeek, timeSlot, price }) => storage.createOrUpdatePricingRule(courtId, dayOfWeek, timeSlot, price)
        )
      );
      res.json(results);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/bookings", requireAuth, async (req, res) => {
    try {
      let bookings2;
      if (req.user && (req.user.role === "admin" || req.user.role === "vendor")) {
        bookings2 = await storage.getAllBookings();
      } else {
        bookings2 = await storage.getUserBookings(req.user.id);
      }
      res.json(bookings2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const timeSlot = await storage.getTimeSlot(bookingData.timeSlotId);
      if (!timeSlot || !timeSlot.isAvailable) {
        return res.status(400).json({ message: "Time slot is not available" });
      }
      const booking = await storage.createBooking(bookingData);
      const bookingWithDetails = await storage.getBookingWithDetails(
        booking.id
      );
      res.status(201).json(bookingWithDetails);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.put("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertBookingSchema.partial().parse(req.body);
      const existingBooking = await storage.getBooking(id);
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (req.user.role !== "admin" && req.user.role !== "vendor" && existingBooking.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to modify this booking" });
      }
      const booking = await storage.updateBooking(id, updateData);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const bookingWithDetails = await storage.getBookingWithDetails(
        booking.id
      );
      res.json(bookingWithDetails);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.delete("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingBooking = await storage.getBooking(id);
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (req.user.role !== "admin" && req.user.role !== "vendor" && existingBooking.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to cancel this booking" });
      }
      const success = await storage.cancelBooking(id);
      if (!success) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json({ message: "Booking cancelled successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/stats", requireVendor, async (req, res) => {
    try {
      const [users2, bookings2, courts2] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllBookings(),
        storage.getAllCourts()
      ]);
      const confirmedBookings = bookings2.filter(
        (b) => b.status === "confirmed"
      );
      const revenue = confirmedBookings.reduce(
        (sum, b) => sum + parseFloat(b.totalPrice),
        0
      );
      const totalSlots = bookings2.length;
      const occupancyRate = totalSlots > 0 ? confirmedBookings.length / totalSlots * 100 : 0;
      const stats = {
        totalUsers: users2.length,
        totalCourts: courts2.length,
        activeBookings: confirmedBookings.length,
        pendingBookings: bookings2.filter((b) => b.status === "pending").length,
        revenue,
        occupancyRate: Math.round(occupancyRate),
        dailyRevenue: revenue,
        // Could be enhanced to calculate actual daily revenue
        blockedUsers: users2.filter((u) => u.isBlocked).length
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/users/:id/block", requireVendor, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.blockUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User blocked successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/users/:id/unblock", requireVendor, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.unblockUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User unblocked successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/calendar", requireVendor, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      const bookings2 = await storage.getAllBookings();
      const filteredBookings = bookings2.filter((booking) => {
        const bookingDate = booking.timeSlot.date;
        return bookingDate >= startDate && bookingDate <= endDate;
      });
      res.json(filteredBookings);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import { fileURLToPath as fileURLToPath2, URL as URL2 } from "node:url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": fileURLToPath2(new URL2("./client/src", import.meta.url)),
      "@shared": fileURLToPath2(new URL2("./shared", import.meta.url)),
      "@assets": fileURLToPath2(new URL2("./attached_assets", import.meta.url))
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    proxy: {
      "/api": "http://localhost:5000"
      // 👈 Add this to route API calls to backend
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "../client");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import dotenv3 from "dotenv";
dotenv3.config({ path: ".env" });
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen(port, "localhost", () => {
    log(`serving on port ${port}`);
  });
})();

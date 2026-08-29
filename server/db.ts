import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { drizzle } from "drizzle-orm/mysql2";
import { achievements, dietPlans, payments, streakDays, supportMessages, userFoodSelections, users, workoutPlans } from "../drizzle/schema";
import type { InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: Partial<typeof users.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

// --- Autenticação própria (e-mail/senha) ---

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLocalUser(params: {
  email: string;
  passwordHash: string;
  name?: string | null;
  phone?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const openId = `local:${nanoid()}`;
  await db.insert(users).values({
    openId,
    email: params.email,
    passwordHash: params.passwordHash,
    name: params.name ?? null,
    phone: params.phone ?? null,
    loginMethod: "password",
    lastSignedIn: new Date(),
  });
  const created = await getUserByOpenId(openId);
  if (!created) throw new Error("Falha ao criar usuário");
  return created;
}

// Diet Plans
export async function getActiveDietPlan(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(dietPlans)
    .where(and(eq(dietPlans.userId, userId), eq(dietPlans.isActive, true)))
    .orderBy(desc(dietPlans.createdAt)).limit(1);
  return result[0];
}

export async function createDietPlan(userId: number, totalCalories: number, planData: unknown) {
  const db = await getDb();
  if (!db) return;
  await db.update(dietPlans).set({ isActive: false }).where(eq(dietPlans.userId, userId));
  return db.insert(dietPlans).values({ userId, totalCalories, planData, isActive: true });
}

// Food Selections
export async function getUserFoodSelections(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userFoodSelections).where(eq(userFoodSelections.userId, userId));
}

export async function upsertFoodSelection(userId: number, mealType: string, foods: string[]) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(userFoodSelections)
    .where(and(eq(userFoodSelections.userId, userId), eq(userFoodSelections.mealType, mealType))).limit(1);
  if (existing.length > 0) {
    await db.update(userFoodSelections).set({ foods }).where(eq(userFoodSelections.id, existing[0].id));
  } else {
    await db.insert(userFoodSelections).values({ userId, mealType, foods });
  }
}

// Workout Plans
export async function getActiveWorkoutPlan(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workoutPlans)
    .where(and(eq(workoutPlans.userId, userId), eq(workoutPlans.isActive, true)))
    .orderBy(desc(workoutPlans.createdAt)).limit(1);
  return result[0];
}

export async function createWorkoutPlan(userId: number, data: Omit<typeof workoutPlans.$inferInsert, "userId">) {
  const db = await getDb();
  if (!db) return;
  await db.update(workoutPlans).set({ isActive: false }).where(eq(workoutPlans.userId, userId));
  await db.insert(workoutPlans).values({ ...data, userId, isActive: true });
}

// Payments
export async function createPayment(userId: number, sessionId: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(payments).values({ userId, stripeSessionId: sessionId, status: "pending" });
}

export async function completePayment(sessionId: string, paymentIntentId?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(payments).set({ status: "completed", stripePaymentIntentId: paymentIntentId }).where(eq(payments.stripeSessionId, sessionId));
  const payment = await db.select().from(payments).where(eq(payments.stripeSessionId, sessionId)).limit(1);
  if (payment[0]) {
    await db.update(users).set({ hasPaidPlan: true }).where(eq(users.id, payment[0].userId));
  }
}

// Achievements
export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(achievements).where(eq(achievements.userId, userId)).orderBy(desc(achievements.earnedAt));
}

export async function addAchievement(userId: number, type: string, title: string, description: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(achievements).values({ userId, type, title, description });
}

// Support Messages
export async function getSupportMessages(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportMessages).where(eq(supportMessages.userId, userId)).orderBy(supportMessages.createdAt);
}

export async function addSupportMessage(userId: number, message: string, isFromSupport = false) {
  const db = await getDb();
  if (!db) return;
  await db.insert(supportMessages).values({ userId, message, isFromSupport });
}

export async function getUnreadCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(supportMessages)
    .where(and(eq(supportMessages.userId, userId), eq(supportMessages.isFromSupport, true), eq(supportMessages.isRead, false)));
  return result.length;
}

// Streak
export async function getStreakDays(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(streakDays).where(eq(streakDays.userId, userId)).orderBy(desc(streakDays.date));
}

export async function recordStreakDay(userId: number) {
  const db = await getDb();
  if (!db) return;
  const today = new Date().toISOString().split("T")[0];
  const existing = await db.select().from(streakDays)
    .where(and(eq(streakDays.userId, userId), eq(streakDays.date, today))).limit(1);
  if (existing.length === 0) {
    await db.insert(streakDays).values({ userId, date: today });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];
    const hadYesterday = await db.select().from(streakDays)
      .where(and(eq(streakDays.userId, userId), eq(streakDays.date, yStr))).limit(1);
    const user = await getUserById(userId);
    const newStreak = hadYesterday.length > 0 ? (user?.currentStreak ?? 0) + 1 : 1;
    await db.update(users).set({ currentStreak: newStreak, lastActiveDate: new Date() }).where(eq(users.id, userId));
  }
}

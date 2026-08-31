import { boolean, float, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  // Hash da senha (bcrypt) para login por e-mail próprio (fora do Manus).
  // Nulo para contas criadas via Google/OAuth.
  passwordHash: varchar("passwordHash", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  weight: float("weight"),
  height: float("height"),
  age: int("age"),
  sex: mysqlEnum("sex", ["male", "female"]),
  goal: varchar("goal", { length: 64 }),
  dailyCalories: varchar("dailyCalories", { length: 32 }),
  mealTimes: varchar("mealTimes", { length: 128 }),
  routineType: varchar("routineType", { length: 64 }),
  activityLevel: varchar("activityLevel", { length: 64 }),
  wantsWorkout: boolean("wantsWorkout").default(false),
  wantsChocolate: boolean("wantsChocolate").default(false),
  stripeCustomerId: varchar("stripeCustomerId", { length: 64 }),
  hasPaidPlan: boolean("hasPaidPlan").default(false),
  // Assinatura cancelada pelo cliente: para de renovar, mas mantém o acesso até
  // o fim do período já pago (CDC/legal). Quando null/false, segue ativa.
  assinaturaCancelada: boolean("assinaturaCancelada").default(false),
  // Prova de consumo (defesa em estorno/chargeback): downloads do PDF.
  pdfDownloads: int("pdfDownloads").default(0),
  pdfUltimoDownloadEm: timestamp("pdfUltimoDownloadEm"),
  currentStreak: int("currentStreak").default(0),
  lastActiveDate: timestamp("lastActiveDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const dietPlans = mysqlTable("diet_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  totalCalories: int("totalCalories"),
  planData: json("planData"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const userFoodSelections = mysqlTable("user_food_selections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mealType: varchar("mealType", { length: 32 }).notNull(),
  foods: json("foods"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workoutPlans = mysqlTable("workout_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  location: mysqlEnum("location", ["gym", "home"]),
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced"]),
  daysPerWeek: int("daysPerWeek"),
  muscleGroups: json("muscleGroups"),
  workoutGoal: varchar("workoutGoal", { length: 64 }),
  planData: json("planData"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }),
  stripeSessionId: varchar("stripeSessionId", { length: 128 }),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description"),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export const supportMessages = mysqlTable("support_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  message: text("message").notNull(),
  isFromSupport: boolean("isFromSupport").default(false),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const adminMessages = mysqlTable("admin_messages", {
  id: int("id").autoincrement().primaryKey(),
  fromUserId: int("fromUserId").notNull(),
  toUserId: int("toUserId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const streakDays = mysqlTable("streak_days", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Controle de e-mails de marketing já enviados (evita duplicidade no funil).
export const marketingEmails = mysqlTable("marketing_emails", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 40 }).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
}, (t) => ({
  // Garante 1 envio por (usuário, etapa): a reserva antes do envio evita
  // duplicidade mesmo se o scheduler interno e o cron externo rodarem juntos.
  uniqUserType: uniqueIndex("uniq_user_type").on(t.userId, t.type),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type DietPlan = typeof dietPlans.$inferSelect;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type AdminMessage = typeof adminMessages.$inferSelect;

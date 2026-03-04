import {
  bigserial,
  varchar,
  text,
  integer,
  date,
  timestamp,
  boolean,
  pgTable,
  bigint,
  check,
} from "drizzle-orm/pg-core";

// ==================== MASTER DATA ====================

export const masterSurahs = pgTable("master_surahs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  nameLatin: varchar("name_latin", { length: 100 }).notNull(),
  nameArabic: varchar("name_arabic", { length: 100 }),
  totalVerses: integer("total_verses").notNull(),
  revelationType: varchar("revelation_type", { length: 20 }).notNull(),
  juz: varchar("juz", { length: 50 }),
});

export const masterDailyPrayers = pgTable("master_daily_prayers", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  title: varchar("title", { length: 150 }).notNull(),
  category: varchar("category", { length: 50 }),
  arabicText: text("arabic_text"),
  latinText: text("latin_text"),
  translation: text("translation"),
});

export const masterPrayerReadings = pgTable("master_prayer_readings", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  stepOrder: integer("step_order").notNull(),
  title: varchar("title", { length: 150 }).notNull(),
  category: varchar("category", { length: 50 }),
  arabicText: text("arabic_text"),
  translation: text("translation"),
});

// ==================== CORE TABLES ====================

export const mosques = pgTable("mosques", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  address: text("address"),
  contactPhone: varchar("contact_phone", { length: 20 }),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  mosqueId: bigint("mosque_id", { mode: "number" })
    .notNull()
    .references(() => mosques.id),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 20 }).notNull(),
  isVerified: boolean("is_verified").default(false),
  verificationToken: varchar("verification_token", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studyGroups = pgTable("study_groups", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  mosqueId: bigint("mosque_id", { mode: "number" })
    .notNull()
    .references(() => mosques.id, { onDelete: "cascade" }),
  teacherId: bigint("teacher_id", { mode: "number" }).references(
    () => users.id,
    {
      onDelete: "set null",
    },
  ),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
});

export const students = pgTable("students", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  mosqueId: bigint("mosque_id", { mode: "number" })
    .notNull()
    .references(() => mosques.id),
  groupId: bigint("group_id", { mode: "number" }).references(
    () => studyGroups.id,
  ),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  parentName: varchar("parent_name", { length: 100 }),
  parentPhone: varchar("parent_phone", { length: 20 }),
  birthDate: date("birth_date"),
  gender: varchar("gender", { length: 1 }),
  address: text("address"),
  currentLevel: varchar("current_level", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  studentId: bigint("student_id", { mode: "number" })
    .notNull()
    .references(() => students.id),
  teacherId: bigint("teacher_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  date: date("date").defaultNow(),
  status: varchar("status", { length: 10 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== TRANSACTION TABLES ====================

export const learningRecords = pgTable("learning_records", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  studentId: bigint("student_id", { mode: "number" })
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  teacherId: bigint("teacher_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  date: date("date").defaultNow(),
  type: varchar("type", { length: 10 }).notNull(),
  levelOrSurah: varchar("level_or_surah", { length: 50 }).notNull(),
  startPoint: varchar("start_point", { length: 20 }).notNull(),
  endPoint: varchar("end_point", { length: 20 }).notNull(),
  quality: varchar("quality", { length: 1 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const memorizationRecords = pgTable("memorization_records", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  studentId: bigint("student_id", { mode: "number" })
    .notNull()
    .references(() => students.id),
  teacherId: bigint("teacher_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  date: date("date").defaultNow(),
  surahId: bigint("surah_id", { mode: "number" })
    .notNull()
    .references(() => masterSurahs.id),
  verseStart: integer("verse_start").notNull(),
  verseEnd: integer("verse_end").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  quality: varchar("quality", { length: 20 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const worshipRecords = pgTable("worship_records", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  studentId: bigint("student_id", { mode: "number" })
    .notNull()
    .references(() => students.id),
  teacherId: bigint("teacher_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  date: date("date").defaultNow(),
  type: varchar("type", { length: 20 }).notNull(),
  dailyPrayerId: bigint("daily_prayer_id", { mode: "number" }).references(
    () => masterDailyPrayers.id,
  ),
  prayerReadingId: bigint("prayer_reading_id", { mode: "number" }).references(
    () => masterPrayerReadings.id,
  ),
  isCompleted: boolean("is_completed").default(false),
  quality: varchar("quality", { length: 1 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityPosts = pgTable("activity_posts", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  mosqueId: bigint("mosque_id", { mode: "number" })
    .notNull()
    .references(() => mosques.id),
  authorId: bigint("author_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content"),
  activityDate: date("activity_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityImages = pgTable("activity_images", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  postId: bigint("post_id", { mode: "number" })
    .notNull()
    .references(() => activityPosts.id),
  imageUrl: text("image_url").notNull(),
  caption: varchar("caption", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityComments = pgTable("activity_comments", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  postId: bigint("post_id", { mode: "number" })
    .notNull()
    .references(() => activityPosts.id, { onDelete: "cascade" }),
  userId: bigint("user_id", { mode: "number" })
    .references(() => users.id, { onDelete: "set null" }),
  parentName: varchar("parent_name", { length: 100 }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

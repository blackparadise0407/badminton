import {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  date,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nickname: text("nickname"),
  isRegular: boolean("is_regular").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  defaultHours: real("default_hours").notNull().default(2),
  notes: text("notes"),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  venue: text("venue"),
  courts: integer("courts").notNull().default(1),
  courtRatePerHour: integer("court_rate_per_hour").notNull(),
  shuttlePrice: integer("shuttle_price").notNull(),
  shuttlesUsed: integer("shuttles_used").notNull().default(0),
  snackTotal: integer("snack_total").notNull().default(0),
  status: text("status", { enum: ["active", "archived"] })
    .notNull()
    .default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const attendances = pgTable(
  "attendances",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id),
    startHour: real("start_hour").notNull(),
    endHour: real("end_hour").notNull(),
    joinedSnack: boolean("joined_snack").notNull().default(false),
    amountDue: integer("amount_due").notNull().default(0),
    amountPaid: integer("amount_paid").notNull().default(0),
    paidAt: timestamp("paid_at"),
    method: text("method", { enum: ["bank", "cash"] }),
  },
  (t) => [uniqueIndex("att_session_player").on(t.sessionId, t.playerId)],
);

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  attendanceId: integer("attendance_id")
    .notNull()
    .references(() => attendances.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  qty: integer("qty").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
});

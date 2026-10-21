import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, text, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";

export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  folio: varchar("folio", { length: 32 }).notNull().unique(),
  accessToken: uuid("access_token").defaultRandom().notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 16 }).notNull(),
  email: varchar("email", { length: 150 }),
  serviceId: varchar("service_id", { length: 40 }).notNull(),
  stylistId: varchar("stylist_id", { length: 30 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  time: varchar("time", { length: 5 }).notNull(),
  duration: integer("duration").notNull(),
  price: integer("price").notNull(),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("confirmed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("appointments_schedule_idx").on(table.date, table.stylistId),
  uniqueIndex("appointments_slot_idx").on(table.date, table.time, table.stylistId).where(sql`${table.status} = 'confirmed'`),
]);

export const inquiries = pgTable("inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

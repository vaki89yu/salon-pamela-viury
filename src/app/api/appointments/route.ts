import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { findService, findStylist, juarezToday, minutesToTime, slotIsInFuture, timeToMinutes, validBookingDate } from "@/lib/catalog";
import { jsonError, normalizePhone, rateLimited } from "@/lib/requests";

const bookingSchema = z.object({
  name: z.string().trim().min(3, "Escribe tu nombre completo.").max(100),
  phone: z.string().regex(/^[+\d\s()\-]{10,20}$/, "Escribe un teléfono válido de 10 dígitos."),
  email: z.union([z.email().max(150), z.literal("")]).optional(),
  serviceId: z.string().max(40), stylistId: z.string().max(30),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().trim().max(500).optional(), consent: z.literal(true),
});

export async function POST(request: NextRequest) {
  if (rateLimited(request, "booking", 15)) return jsonError("Has realizado varios intentos. Espera unos minutos antes de continuar.", 429);
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("La solicitud no es válida."); }
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Revisa los datos de tu cita.");
  const data = parsed.data;
  const service = findService(data.serviceId);
  const stylist = findStylist(data.stylistId);
  const phone = normalizePhone(data.phone);
  if (phone.length !== 10) return jsonError("Escribe un teléfono de 10 dígitos.");
  if (!service || !stylist || !stylist.services.includes(service.id)) return jsonError("La especialista no está disponible para este servicio.");
  const start = timeToMinutes(data.time);
  if (!validBookingDate(data.date) || !slotIsInFuture(data.date, data.time) || minutesToTime(start) !== data.time || start < 600 || start % 30 !== 0 || start + service.duration > 1140) return jsonError("La fecha o el horario no están disponibles.");
  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${data.stylistId}:${data.date}`}))`);
      const existing = await tx.select({ time: appointments.time, duration: appointments.duration }).from(appointments).where(and(eq(appointments.date, data.date), eq(appointments.stylistId, data.stylistId), eq(appointments.status, "confirmed")));
      if (existing.some((item) => start < timeToMinutes(item.time) + item.duration && start + service.duration > timeToMinutes(item.time))) return null;
      const folio = `PV-${juarezToday().replace(/-/g, "").slice(2)}-${randomBytes(4).toString("hex").toUpperCase()}`;
      const [appointment] = await tx.insert(appointments).values({ folio, name: data.name, phone, email: data.email || null, serviceId: service.id, stylistId: stylist.id, date: data.date, time: data.time, duration: service.duration, price: service.price, notes: data.notes || null }).returning();
      return appointment;
    });
    if (!result) return jsonError("Ese horario acaba de reservarse. Elige otro para continuar.", 409);
    return Response.json({ appointment: result }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { console.error("Booking error", error); return jsonError("No pudimos guardar tu cita. Por favor, inténtalo de nuevo.", 500); }
}

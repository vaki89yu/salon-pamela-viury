import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { findService, findStylist, minutesToTime, slotIsInFuture, timeToMinutes, validBookingDate } from "@/lib/catalog";
import { jsonError } from "@/lib/requests";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const service = findService(request.nextUrl.searchParams.get("service") ?? "");
  const stylist = findStylist(request.nextUrl.searchParams.get("stylist") ?? "");
  if (!service || !stylist || !stylist.services.includes(service.id)) return jsonError("Selecciona un servicio y una especialista válidos.");
  if (!validBookingDate(date)) return jsonError("Elige un día de lunes a sábado dentro de los próximos 90 días.");
  try {
    const booked = await db.select({ time: appointments.time, duration: appointments.duration }).from(appointments).where(and(eq(appointments.date, date), eq(appointments.stylistId, stylist.id), eq(appointments.status, "confirmed")));
    const slots: string[] = [];
    for (let start = 600; start + service.duration <= 1140; start += 30) {
      const time = minutesToTime(start);
      if (slotIsInFuture(date, time) && !booked.some((item) => start < timeToMinutes(item.time) + item.duration && start + service.duration > timeToMinutes(item.time))) slots.push(time);
    }
    return Response.json({ slots }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { console.error("Availability error", error); return jsonError("No pudimos consultar la agenda. Intenta de nuevo en un momento.", 503); }
}

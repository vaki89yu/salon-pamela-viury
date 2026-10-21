import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { jsonError, normalizePhone, rateLimited } from "@/lib/requests";

export async function POST(request: NextRequest) {
  if (rateLimited(request, "lookup", 20)) return jsonError("Demasiados intentos. Intenta de nuevo en unos minutos.", 429);
  let data;
  try { data = await request.json(); } catch { return jsonError("La solicitud no es válida."); }
  if (!data || typeof data !== "object" || typeof data.folio !== "string" || typeof data.phone !== "string" || data.folio.length > 40 || data.phone.length > 20 || normalizePhone(data.phone).length !== 10) return jsonError("Escribe tu folio y el teléfono de 10 dígitos de tu reserva.");
  try {
    const [appointment] = await db.select().from(appointments).where(and(eq(appointments.folio, data.folio.trim().toUpperCase()), eq(appointments.phone, normalizePhone(data.phone)))).limit(1);
    if (!appointment) return jsonError("No encontramos una cita con esos datos. Revisa tu folio y teléfono.", 404);
    return Response.json({ appointment }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { console.error("Lookup error", error); return jsonError("No pudimos consultar tu cita. Intenta de nuevo.", 503); }
}

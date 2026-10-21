import { NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { jsonError, rateLimited } from "@/lib/requests";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ folio: string }> }) {
  if (rateLimited(request, "cancel", 20)) return jsonError("Espera un momento e inténtalo de nuevo.", 429);
  const { folio } = await params;
  let body;
  try { body = await request.json(); } catch { return jsonError("Solicitud inválida."); }
  const parsed = z.object({ accessToken: z.uuid() }).safeParse(body);
  if (!parsed.success) return jsonError("No se pudo verificar tu reserva.", 401);
  try {
    const appointment = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(appointments).where(and(eq(appointments.folio, folio), eq(appointments.accessToken, parsed.data.accessToken))).limit(1);
      if (!current) return null;
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${current.stylistId}:${current.date}`}))`);
      const [updated] = await tx.update(appointments).set({ status: "cancelled" }).where(eq(appointments.id, current.id)).returning();
      return updated;
    });
    if (!appointment) return jsonError("No encontramos la reserva.", 404);
    return Response.json({ appointment }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { console.error("Cancel error", error); return jsonError("No pudimos cancelar tu cita. Intenta de nuevo.", 500); }
}

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { appointmentPdf, pdfResponse } from "@/lib/pdf";
import { jsonError } from "@/lib/requests";

export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params;
  const token = request.nextUrl.searchParams.get("token");
  if (!z.uuid().safeParse(token).success) return jsonError("No se pudo verificar el acceso al comprobante.", 401);
  try {
    const [appointment] = await db.select().from(appointments).where(and(eq(appointments.folio, folio), eq(appointments.accessToken, token!))).limit(1);
    if (!appointment) return jsonError("No encontramos este comprobante.", 404);
    return pdfResponse(await appointmentPdf(appointment), `Lumina-${appointment.folio}.pdf`);
  } catch (error) { console.error("PDF error", error); return jsonError("No se pudo generar tu PDF. Inténtalo de nuevo.", 500); }
}

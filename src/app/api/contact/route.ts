import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { jsonError, rateLimited } from "@/lib/requests";

const contactSchema = z.object({ name: z.string().trim().min(3).max(100), email: z.email().max(150), message: z.string().trim().min(10).max(1500), consent: z.literal(true) });
export async function POST(request: NextRequest) {
  if (rateLimited(request, "contact", 8)) return jsonError("Has enviado varios mensajes. Intenta de nuevo más tarde.", 429);
  let body;
  try { body = await request.json(); } catch { return jsonError("Revisa tu mensaje."); }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return jsonError("Completa tu nombre, un correo válido y un mensaje de al menos 10 caracteres.");
  try {
    await db.insert(inquiries).values({ name: parsed.data.name, email: parsed.data.email, message: parsed.data.message });
    return Response.json({ ok: true, message: "Tu mensaje se guardó correctamente. Gracias por escribirnos." }, { status: 201 });
  } catch (error) { console.error("Contact error", error); return jsonError("No pudimos guardar tu mensaje. Intenta nuevamente.", 500); }
}

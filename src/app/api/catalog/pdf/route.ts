import { catalogPdf, pdfResponse } from "@/lib/pdf";

export const runtime = "nodejs";
export async function GET() {
  try { return pdfResponse(await catalogPdf(), "Lumina-Menu-de-servicios.pdf"); }
  catch (error) { console.error("Catalog PDF error", error); return Response.json({ error: "No se pudo generar el menú. Intenta de nuevo." }, { status: 500 }); }
}

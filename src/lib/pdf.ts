import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, degrees, PDFPage, PDFFont, PDFImage, RGB } from "pdf-lib";
import { Booking, dateLabel, findService, findStylist, money, packages, salon, services, stylists } from "@/lib/catalog";

const ink = rgb(0.18, 0.16, 0.14);
const gold = rgb(0.63, 0.49, 0.32);
const bronze = rgb(0.56, 0.39, 0.24);
const sand = rgb(0.93, 0.89, 0.83);
const soft = rgb(0.97, 0.95, 0.92);
const cream = rgb(0.99, 0.98, 0.96);
const muted = rgb(0.46, 0.42, 0.38);
const night = rgb(0.17, 0.16, 0.15);
const W = 595.28;
const H = 841.89;

/* Fonts are embedded from the project, so the PDFs keep the salon's
   typography and full Unicode support (accents, ñ, ·). */
const clean = (text: string) => text.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "");

const fontFile = (name: string) => readFile(path.join(process.cwd(), "public", "fonts", name));

const prettyPhone = (value: string) => value.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3");

type Kit = { doc: PDFDocument; serif: PDFFont; italic: PDFFont; serifBold: PDFFont; sans: PDFFont; bold: PDFFont };

function write(page: PDFPage, value: string, x: number, y: number, size: number, font: PDFFont, color = ink, maxWidth = 460, lineHeight?: number) {
  page.drawText(clean(value), { x, y, size, font, color, maxWidth, lineHeight: lineHeight ?? size * 1.55 });
}

function spaced(value: string, gap = 1) {
  return value.split("").join(" ".repeat(gap));
}

function centered(page: PDFPage, value: string, y: number, size: number, font: PDFFont, color = ink) {
  const text = clean(value);
  page.drawText(text, { x: (W - font.widthOfTextAtSize(text, size)) / 2, y, size, font, color });
}

function rule(page: PDFPage, y: number, x = 52, width = W - 104, color = sand, thickness = 0.7) {
  page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness, color });
}

function diamond(page: PDFPage, x: number, y: number, radius = 3, color = gold) {
  page.drawSquare({ x, y, size: radius * 1.6, color, rotate: degrees(45) });
}

function ornament(page: PDFPage, y: number, width = 60) {
  const mid = W / 2;
  page.drawLine({ start: { x: mid - width, y }, end: { x: mid - 9, y }, thickness: 0.7, color: gold });
  page.drawLine({ start: { x: mid + 9, y }, end: { x: mid + width, y }, thickness: 0.7, color: gold });
  diamond(page, mid - 2.4, y - 2.4);
}

function crest(page: PDFPage, cx: number, cy: number, radius: number, kit: Kit, color = gold, labelColor = bronze) {
  page.drawCircle({ x: cx, y: cy, size: radius, borderColor: color, borderWidth: 0.9 });
  page.drawCircle({ x: cx, y: cy, size: radius - 3.6, borderColor: color, borderWidth: 0.35, borderOpacity: 0.65 });
  const size = radius * 0.95;
  const label = "PV";
  page.drawText(label, { x: cx - kit.serif.widthOfTextAtSize(label, size) / 2, y: cy - size * 0.34, size, font: kit.serif, color: labelColor });
}

function letterhead(page: PDFPage, kit: Kit, background = true) {
  if (background) page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: cream });
  // Always repaint the header band: it also trims any photo bleeding up into it.
  page.drawRectangle({ x: 0, y: H - 112, width: W, height: 112, color: soft });
  crest(page, 80, H - 56, 23, kit);
  write(page, spaced("SALÓN DE BELLEZA", 1), 116, H - 44, 7.4, kit.sans, muted);
  write(page, salon.name, 114, H - 69, 23, kit.serif, ink);
  write(page, spaced("CIUDAD JUÁREZ · CHIHUAHUA", 0), 116, H - 82, 6.4, kit.sans, muted);
  const since = `DESDE ${salon.founded}`;
  page.drawText(since, { x: W - 52 - kit.sans.widthOfTextAtSize(since, 7), y: H - 44, size: 7, font: kit.sans, color: muted });
  const motto = salon.tagline;
  page.drawText(clean(motto), { x: W - 52 - kit.italic.widthOfTextAtSize(clean(motto), 11.5), y: H - 70, size: 11.5, font: kit.italic, color: bronze });
  page.drawLine({ start: { x: 0, y: H - 112 }, end: { x: W, y: H - 112 }, thickness: 0.8, color: gold });
}

function footer(page: PDFPage, kit: Kit, note: string, pageLabel: string) {
  rule(page, 66);
  write(page, salon.legalName.toUpperCase(), 52, 48, 6.8, kit.bold, ink);
  write(page, `${salon.district} · ${salon.hours}`, 52, 35, 6.8, kit.sans, muted);
  page.drawText(clean(note), { x: W - 52 - kit.italic.widthOfTextAtSize(clean(note), 9.5), y: 46, size: 9.5, font: kit.italic, color: bronze });
  page.drawText(pageLabel, { x: W - 52 - kit.sans.widthOfTextAtSize(pageLabel, 6.4), y: 33, size: 6.4, font: kit.sans, color: muted });
}

async function photo(doc: PDFDocument, file: string) {
  return doc.embedJpg(await readFile(path.join(process.cwd(), "public", "images", file)));
}

type Masks = { above?: RGB; below?: RGB; side?: RGB; bias?: number };

/** Draws an image cropped to an exact box: pdf-lib has no clipping, so the
 *  overflow is painted over with the surrounding background colours. */
function coverImage(page: PDFPage, image: PDFImage, x: number, y: number, width: number, height: number, masks: Masks = {}) {
  const { above = cream, below = cream, side = cream, bias = 0.62 } = masks;
  const scale = Math.max(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  const dx = x - (w - width) / 2;
  const dy = y - (h - height) * bias;
  page.drawImage(image, { x: dx, y: dy, width: w, height: h });
  // Masks run past the page edges so no hairline seam is visible where they meet the background.
  const pad = 2;
  if (dy < y) page.drawRectangle({ x: dx - pad, y: dy - pad, width: w + pad * 2, height: y - dy + pad, color: below });
  if (dy + h > y + height) page.drawRectangle({ x: dx - pad, y: y + height, width: w + pad * 2, height: dy + h - (y + height) + pad, color: above });
  if (dx < x) page.drawRectangle({ x: dx - pad, y: y - pad, width: x - dx + pad, height: height + pad * 2, color: side });
  if (dx + w > x + width) page.drawRectangle({ x: x + width, y: y - pad, width: dx + w - (x + width) + pad, height: height + pad * 2, color: side });
}

async function createKit(title: string, subject: string): Promise<Kit> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(title);
  doc.setSubject(subject);
  doc.setAuthor(salon.legalName);
  doc.setCreator(`${salon.legalName} · ${salon.city}`);
  doc.setProducer(salon.legalName);
  doc.setCreationDate(new Date());
  const [serifFile, italicFile, serifBoldFile, sansFile, boldFile] = await Promise.all([
    fontFile("garamond-variable.ttf"),
    fontFile("garamond-variable-italic.ttf"),
    fontFile("garamond-variable.ttf"),
    fontFile("dm-sans-regular.ttf"),
    fontFile("dm-sans-semibold.ttf"),
  ]);
  return {
    doc,
    serif: await doc.embedFont(serifFile),
    italic: await doc.embedFont(italicFile),
    serifBold: await doc.embedFont(serifBoldFile),
    sans: await doc.embedFont(sansFile),
    bold: await doc.embedFont(boldFile),
  };
}

function detailRow(page: PDFPage, kit: Kit, label: string, value: string, y: number, valueFont = kit.sans, size = 11.5) {
  write(page, spaced(label, 0), 52, y, 7.2, kit.bold, muted);
  write(page, value, 214, y - 2, size, valueFont, ink, 329);
  rule(page, y - 15);
}

/* ---------- Appointment receipt ---------- */
export async function appointmentPdf(booking: Booking) {
  const kit = await createKit(`Comprobante ${booking.folio} · ${salon.legalName}`, "Comprobante de cita");
  const { doc } = kit;
  const service = findService(booking.serviceId);
  const stylist = findStylist(booking.stylistId);
  const cancelled = booking.status === "cancelled";
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: cream });
  const band = await photo(doc, service?.image.replace("/images/", "") ?? "hero.jpg");
  coverImage(page, band, 0, H - 244, W, 132, { above: soft, bias: 0.84 });
  letterhead(page, kit, false);
  page.drawRectangle({ x: 0, y: H - 244, width: W, height: 132, color: night, opacity: 0.38 });
  write(page, spaced(cancelled ? "CITA CANCELADA" : "CITA CONFIRMADA", 1), 52, H - 170, 8.4, kit.bold, rgb(1, 0.97, 0.92));
  write(page, cancelled ? "Le esperamos en otra ocasión" : "Su lugar está reservado", 50, H - 206, 27, kit.serif, rgb(1, 0.99, 0.96));

  page.drawRectangle({ x: 52, y: H - 318, width: W - 104, height: 58, color: soft, borderColor: sand, borderWidth: 0.7 });
  write(page, spaced("FOLIO", 1), 68, H - 281, 7, kit.bold, muted);
  write(page, booking.folio, 68, H - 303, 15, kit.serifBold, bronze);
  const stamp = `${booking.time} h`;
  page.drawText(stamp, { x: W - 70 - kit.serif.widthOfTextAtSize(stamp, 21), y: H - 300, size: 21, font: kit.serif, color: ink });
  const dayText = dateLabel(booking.date);
  page.drawText(clean(dayText), { x: W - 70 - kit.sans.widthOfTextAtSize(clean(dayText), 7.6), y: H - 279, size: 7.6, font: kit.sans, color: muted });

  // The detail rows flow from the top; the summary block below is anchored so
  // the page always closes with the same rhythm, however many rows there are.
  const rows: [string, string, PDFFont?, number?][] = [
    ["A NOMBRE DE", booking.name],
    ["SERVICIO", service?.name ?? booking.serviceId],
    ["ESPECIALISTA", `${stylist?.name ?? booking.stylistId}${stylist ? ` · ${stylist.role}` : ""}`],
    ["DURACIÓN ESTIMADA", `${booking.duration} minutos`],
    ["TELÉFONO DE CONTACTO", prettyPhone(booking.phone)],
  ];
  if (booking.email) rows.push(["CORREO", booking.email]);
  if (booking.notes) rows.push(["NOTAS", booking.notes.slice(0, 140), kit.italic, 10]);
  rows.forEach(([label, value, font, size], index) => detailRow(page, kit, label, value, H - 356 - index * 36, font, size));

  const boxY = 196;
  page.drawRectangle({ x: 52, y: boxY, width: W - 104, height: 54, color: soft });
  write(page, spaced("INVERSIÓN ESTIMADA", 0), 68, boxY + 32, 7.2, kit.bold, muted);
  write(page, "Precio sujeto a diagnóstico · Pago en el salón", 68, boxY + 15, 8, kit.sans, muted);
  const amount = `Desde ${money(booking.price)} MXN`;
  page.drawText(clean(amount), { x: W - 68 - kit.serif.widthOfTextAtSize(clean(amount), 19), y: boxY + 19, size: 19, font: kit.serif, color: bronze });

  write(page, spaced("INDICACIONES", 1), 52, 162, 7.2, kit.bold, muted);
  const tips = cancelled
    ? ["Este folio ya no ocupa un lugar en nuestra agenda.", "Puede reservar una nueva cita cuando lo desee desde nuestro sitio.", "Conserve este documento como constancia de la cancelación."]
    : ["Le recomendamos llegar 10 minutos antes de su cita.", "Conserve su folio para consultar, descargar o cancelar su reserva.", "Si necesita cancelar, agradecemos avisar con 24 horas de anticipación."];
  tips.forEach((tip, index) => {
    const ty = 144 - index * 15.5;
    diamond(page, 54, ty + 2.2, 2.1);
    write(page, tip, 66, ty, 9, kit.sans, muted, 460);
  });

  centered(page, cancelled ? "Será un gusto recibirle en otra ocasión." : "Será un placer recibirle en el salón.", 88, 12.5, kit.italic, bronze);
  footer(page, kit, salon.motto, "DOCUMENTO INFORMATIVO · NO ES UNA FACTURA");
  return doc.save();
}

/* ---------- Service catalogue ---------- */
export async function catalogPdf() {
  const kit = await createKit(`Carta de servicios · ${salon.legalName}`, "Carta de servicios y tarifas");
  const { doc } = kit;

  /* Cover */
  const cover = doc.addPage([W, H]);
  cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: cream });
  coverImage(cover, await photo(doc, "hero.jpg"), 0, H - 470, W, 470, { bias: 0.5 });
  cover.drawRectangle({ x: 0, y: H - 470, width: W, height: 470, color: night, opacity: 0.34 });
  cover.drawRectangle({ x: 34, y: 34, width: W - 68, height: H - 68, borderColor: gold, borderWidth: 0.8 });
  crest(cover, W / 2, H - 150, 34, kit, rgb(1, 0.95, 0.88), rgb(1, 0.97, 0.92));
  centered(cover, spaced("SALÓN DE BELLEZA", 2), H - 232, 9, kit.sans, rgb(1, 0.97, 0.93));
  centered(cover, salon.name, H - 290, 46, kit.serif, rgb(1, 0.99, 0.97));
  centered(cover, spaced("CIUDAD JUÁREZ · CHIHUAHUA", 0), H - 318, 7.6, kit.sans, rgb(0.97, 0.93, 0.88));
  centered(cover, spaced("CARTA DE SERVICIOS", 3), H - 540, 10, kit.bold, bronze);
  ornament(cover, H - 566, 86);
  centered(cover, salon.tagline, H - 606, 20, kit.italic, ink);
  centered(cover, "Una selección de servicios de alta peluquería y estética,", H - 640, 11, kit.sans, muted);
  centered(cover, "ejecutados con técnica, criterio y absoluta discreción.", H - 658, 11, kit.sans, muted);
  centered(cover, `${salon.district}  ·  ${salon.hours}`, 118, 8.6, kit.sans, muted);
  centered(cover, `Tarifas vigentes ${new Date().getFullYear()} · Precios en pesos mexicanos`, 100, 7.6, kit.sans, muted);
  centered(cover, salon.motto, 72, 12, kit.italic, bronze);

  /* Services */
  const menu = doc.addPage([W, H]);
  letterhead(menu, kit);
  write(menu, spaced("NUESTROS SERVICIOS", 1), 52, H - 150, 8, kit.bold, bronze);
  write(menu, "Nuestros servicios", 50, H - 188, 31, kit.serif, ink);
  rule(menu, H - 206);
  let y = H - 236;
  for (const [index, service] of services.entries()) {
    write(menu, String(index + 1).padStart(2, "0"), 52, y + 2, 10, kit.italic, gold);
    write(menu, service.name, 78, y, 17, kit.serif, ink, 330);
    const price = `Desde ${money(service.price)}`;
    menu.drawText(clean(price), { x: W - 52 - kit.serifBold.widthOfTextAtSize(clean(price), 12.5), y: y + 2, size: 12.5, font: kit.serifBold, color: bronze });
    write(menu, `${service.category.toUpperCase()}  ·  ${service.duration} MIN`, 78, y - 15, 7, kit.bold, muted);
    write(menu, service.description, 78, y - 31, 9.2, kit.sans, muted, 465, 13);
    rule(menu, y - 58);
    y -= 84;
  }
  // The closing note clears the last description, which may wrap to two lines.
  write(menu, "Los precios son orientativos y se confirman tras el diagnóstico personalizado,", 52, 108, 8.4, kit.sans, muted, 470);
  write(menu, "según el largo, la densidad y el historial de color de su cabello.", 52, 95, 8.4, kit.sans, muted, 470);
  footer(menu, kit, "Carta de servicios", "PÁGINA 2 DE 4");

  /* Packages */
  const bundle = doc.addPage([W, H]);
  letterhead(bundle, kit);
  write(bundle, spaced("EXPERIENCIAS COMPLETAS", 1), 52, H - 150, 8, kit.bold, bronze);
  write(bundle, "Paquetes de autor", 50, H - 188, 31, kit.serif, ink);
  write(bundle, "Combinaciones diseñadas para quienes desean una transformación integral", 52, H - 212, 9.4, kit.sans, muted, 470);
  let py = H - 250;
  for (const item of packages) {
    const height = 118;
    bundle.drawRectangle({ x: 52, y: py - height, width: W - 104, height, color: item.featured ? soft : cream, borderColor: item.featured ? gold : sand, borderWidth: item.featured ? 0.9 : 0.6 });
    write(bundle, item.name, 70, py - 34, 19, kit.serif, ink);
    write(bundle, spaced(item.subtitle.toUpperCase(), 0), 70, py - 50, 7, kit.bold, bronze);
    item.items.forEach((line, index) => {
      const ly = py - 70 - index * 14;
      diamond(bundle, 72, ly + 2, 2);
      write(bundle, line, 84, ly, 9, kit.sans, muted, 300);
    });
    const total = money(item.price);
    bundle.drawText(clean(total), { x: W - 70 - kit.serif.widthOfTextAtSize(clean(total), 23), y: py - 40, size: 23, font: kit.serif, color: bronze });
    const save = `Ahorro de ${money(item.saving)}`;
    bundle.drawText(clean(save), { x: W - 70 - kit.sans.widthOfTextAtSize(clean(save), 8), y: py - 56, size: 8, font: kit.sans, color: muted });
    const dur = `${item.duration} min`;
    bundle.drawText(clean(dur), { x: W - 70 - kit.sans.widthOfTextAtSize(clean(dur), 8), y: py - 70, size: 8, font: kit.sans, color: muted });
    py -= height + 18;
  }
  ornament(bundle, py - 6, 70);
  centered(bundle, "Los paquetes se agendan en una sola visita y pueden personalizarse.", py - 34, 11.5, kit.italic, bronze);
  footer(bundle, kit, "Paquetes de autor", "PÁGINA 3 DE 4");

  /* Team & info */
  const team = doc.addPage([W, H]);
  letterhead(team, kit);
  write(team, spaced("NUESTRO EQUIPO", 1), 52, H - 150, 8, kit.bold, bronze);
  write(team, "Manos expertas", 50, H - 188, 31, kit.serif, ink);
  rule(team, H - 206);
  let ty = H - 232;
  for (const member of stylists) {
    const image = await photo(doc, member.photo.replace("/images/", ""));
    const size = 62;
    coverImage(team, image, 52, ty - size, size, size, { bias: 0.8 });
    team.drawRectangle({ x: 52, y: ty - size, width: size, height: size, borderColor: sand, borderWidth: 0.7 });
    write(team, member.name, 130, ty - 16, 16, kit.serif, ink);
    write(team, spaced(`${member.role.toUpperCase()} · ${member.years} AÑOS`, 0), 130, ty - 30, 6.8, kit.bold, bronze);
    write(team, member.bio, 130, ty - 46, 8.8, kit.sans, muted, 400, 12.5);
    rule(team, ty - 76);
    ty -= 96;
  }
  write(team, spaced("INFORMACIÓN DE VISITA", 1), 52, ty - 4, 8, kit.bold, bronze);
  const facts: [string, string][] = [
    ["Dirección", salon.district],
    ["Horario", salon.hours],
    ["Reservas", "En línea, con folio y comprobante en PDF"],
    ["Formas de pago", "En el salón. No se realizan cobros en línea"],
  ];
  facts.forEach(([label, value], index) => {
    const fy = ty - 26 - index * 20;
    write(team, label, 52, fy, 8.6, kit.bold, ink);
    write(team, value, 160, fy, 8.6, kit.sans, muted, 380);
  });
  ornament(team, ty - 124, 70);
  centered(team, salon.motto, ty - 152, 13, kit.italic, bronze);
  footer(team, kit, "Equipo e información", "PÁGINA 4 DE 4");

  return doc.save();
}

export function pdfResponse(bytes: Uint8Array, filename: string) {
  return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}



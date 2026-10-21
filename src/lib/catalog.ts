export const services = [
  { id: "corte", category: "Cabello", name: "Corte & styling", short: "Corte & styling", description: "Corte de precisión adaptado a su rostro y textura. Incluye diagnóstico, lavado y peinado con acabado profesional.", price: 450, duration: 60, image: "/images/hair.jpg", imageAlt: "Cabello largo con ondas y un acabado de salón", tag: "CORTE DE PRECISIÓN", featured: true },
  { id: "balayage", category: "Cabello", name: "Balayage & color", short: "Balayage & color", description: "Luz y dimensión en tonos calculados a medida. Coloración personalizada con tratamiento protector incluido.", price: 1800, duration: 180, image: "/images/hair.jpg", imageAlt: "Ondas con coloración y reflejos naturales", tag: "EL MÁS SOLICITADO", featured: false },
  { id: "manicure", category: "Uñas", name: "Manicure & gel", short: "Manicure & gel", description: "Acabado impecable en cada detalle. Preparación, cuidado de cutícula y esmaltado en gel de larga duración.", price: 350, duration: 60, image: "/images/nails.jpg", imageAlt: "Manicure en tonos nude con detalles delicados", tag: "ACABADO IMPECABLE", featured: true },
  { id: "maquillaje", category: "Maquillaje", name: "Maquillaje social", short: "Maquillaje social", description: "Maquillaje luminoso y de larga duración, diseñado para realzar sus facciones en cualquier ocasión especial.", price: 850, duration: 90, image: "/images/makeup.jpg", imageAlt: "Aplicación profesional de maquillaje y labial", tag: "LUMINOSIDAD NATURAL", featured: true },
  { id: "tratamiento", category: "Cuidado", name: "Tratamiento de hidratación", short: "Tratamiento de hidratación", description: "Hidratación profunda reparadora, con masaje capilar y acabado con brillo natural.", price: 650, duration: 60, image: "/images/beauty.jpg", imageAlt: "Tratamiento de belleza y cuidado capilar", tag: "CUIDADO PROFUNDO", featured: false },
  { id: "novia", category: "Maquillaje", name: "Look de novia", short: "Novias & ocasiones", description: "Maquillaje y peinado personalizados para su gran día, con asesoría previa. La prueba se agenda por separado.", price: 2500, duration: 180, image: "/images/portrait.jpg", imageAlt: "Retrato de mujer con peinado y maquillaje natural", tag: "SU GRAN DÍA", featured: false },
] as const;

export const salon = {
  name: "Pamela Viury",
  legalName: "Salón de Belleza Pamela Viury",
  tagline: "Alta peluquería, color y estética",
  motto: "El cuidado también es una forma de elegancia.",
  city: "Ciudad Juárez, Chihuahua",
  district: "Zona Pronaf · Ciudad Juárez",
  hours: "Lunes a sábado · 10:00 a 19:00 h",
  founded: 2014,
} as const;

export const stylists = [
  { id: "pamela", name: "Pamela Viury", role: "Directora creativa", specialty: "Color & transformaciones", photo: "/images/team-pamela.jpg", bio: "Fundadora del salón. Especialista en color a medida y en diseñar transformaciones que respetan la esencia de cada mujer.", years: 14, services: ["corte", "balayage", "novia", "tratamiento"] },
  { id: "valeria", name: "Valeria Cordero", role: "Estilista senior", specialty: "Cabello & styling", photo: "/images/team-valeria.jpg", bio: "Experta en cortes de precisión y peinados de autor. Su firma es el movimiento natural y el acabado impecable.", years: 9, services: ["corte", "balayage", "tratamiento"] },
  { id: "sofia", name: "Sofía Rentería", role: "Maquillista profesional", specialty: "Maquillaje & novias", photo: "/images/team-sofia.jpg", bio: "Formada en maquillaje editorial y de novias. Crea looks luminosos, duraderos y siempre fieles a sus facciones.", years: 7, services: ["corte", "maquillaje", "novia", "tratamiento"] },
  { id: "daniela", name: "Daniela Rivas", role: "Nail artist", specialty: "Uñas & cuidado de manos", photo: "/images/team-daniela.jpg", bio: "Perfeccionista del detalle. Domina el diseño en gel, la nail art fina y el cuidado profundo de manos.", years: 6, services: ["manicure"] },
];

export const packages = [
  { id: "esencia", name: "Experiencia Esencia", subtitle: "Cuidado esencial", items: ["Corte & styling", "Tratamiento de hidratación", "Diagnóstico capilar"], price: 950, saving: 150, duration: 120 },
  { id: "firma", name: "Experiencia Firma", subtitle: "La más solicitada", items: ["Balayage & color", "Tratamiento de hidratación", "Corte & styling"], price: 2600, saving: 300, duration: 240, featured: true },
  { id: "gala", name: "Experiencia Gala", subtitle: "Para una ocasión especial", items: ["Maquillaje social", "Peinado de autor", "Manicure & gel"], price: 1750, saving: 200, duration: 180 },
];

export const experience = [
  { step: "01", title: "Diagnóstico personal", text: "Analizamos tu cabello, tu tono de piel y tu estilo de vida antes de tocar una sola tijera." },
  { step: "02", title: "Propuesta a medida", text: "Te presentamos la propuesta, el tiempo estimado y el presupuesto cerrado. Sin sorpresas." },
  { step: "03", title: "Ejecución de autor", text: "Trabajamos con técnica profesional y producto de alta gama, cuidando cada detalle." },
  { step: "04", title: "Cuidado en casa", text: "Te explicamos cómo mantener el resultado y agendamos tu siguiente visita si lo deseas." },
];

export function findService(id: string) { return services.find((service) => service.id === id); }
export function findStylist(id: string) { return stylists.find((stylist) => stylist.id === id); }
export function money(value: number) { return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value); }
export function minutesToTime(value: number) { return `${Math.floor(value / 60).toString().padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`; }
export function timeToMinutes(value: string) { const [h, m] = value.split(":").map(Number); return h * 60 + m; }
export function juarezToday() { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Ciudad_Juarez", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
export function dateLabel(date: string) { return new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)); }
export function validBookingDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return false;
  const today = juarezToday();
  const max = new Date(`${today}T12:00:00Z`); max.setUTCDate(max.getUTCDate() + 90);
  return date >= today && date <= max.toISOString().slice(0, 10) && parsed.getUTCDay() !== 0;
}
export function slotIsInFuture(date: string, time: string) {
  if (date !== juarezToday()) return date > juarezToday();
  const current = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Ciudad_Juarez", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  return time > current;
}
export type Booking = {
  folio: string;
  accessToken: string;
  name: string;
  phone: string;
  email: string | null;
  serviceId: string;
  stylistId: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  notes: string | null;
  status: string;
};

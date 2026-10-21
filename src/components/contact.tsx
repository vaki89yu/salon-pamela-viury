"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, ChevronDown, Clock3, LoaderCircle, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { BrandMark } from "@/components/brand";

export const faqs = [
  { question: "¿Cómo reservo mi cita?", answer: "Elija el servicio, la especialista y un horario disponible, complete sus datos y confirme. Recibirá su folio en pantalla y podrá descargar el comprobante en PDF al instante; no se envían correos automáticos." },
  { question: "¿Tengo que pagar al reservar?", answer: "No. La reserva en línea no realiza ningún cobro ni solicita datos bancarios. Los precios son orientativos y se confirman durante el diagnóstico, antes de iniciar el servicio." },
  { question: "¿Puedo cancelar o cambiar mi cita?", answer: "Sí. Entre a “Mi cita” con su folio y teléfono para cancelarla. Para cambiarla, cancele la anterior y reserve un nuevo horario. Agradecemos avisar con al menos 24 horas de anticipación." },
  { question: "¿Qué sucede si llego tarde?", answer: "Le recomendamos llegar 10 minutos antes para su diagnóstico. Si tiene algún contratiempo, escríbanos desde el formulario de contacto. La continuidad del servicio dependerá de la agenda del día." },
  { question: "¿El precio de la coloración puede variar?", answer: "Sí. Los precios de la carta son “desde” y pueden variar según el largo, la densidad, el historial de color y el resultado deseado. Siempre explicamos el presupuesto antes de comenzar." },
  { question: "¿Cuál es su horario de atención?", answer: "La agenda está disponible de lunes a sábado, de 10:00 a 19:00 h, en horario local de Ciudad Juárez. Los domingos permanecemos cerrados. Puede reservar con hasta 90 días de anticipación." },
];

export function ContactModal({ onClose, onBook, initialForm = false }: { onClose: () => void; onBook: () => void; initialForm?: boolean }) {
  const [showForm, setShowForm] = useState(initialForm);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), email: form.get("email"), message: form.get("message"), consent: form.get("consent") === "on" }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error); setSent(true);
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos enviar tu mensaje."); } finally { setLoading(false); }
  }
  return <Dialog title="ATENCIÓN AL CLIENTE" onClose={onClose} className="contact-dialog"><div className="contact-modal-content">
    {sent ? <div className="message-success"><span className="receipt-symbol"><Check size={29}/></span><h2>Gracias por <em>escribirnos.</em></h2><p>Su mensaje quedó registrado en nuestro buzón de atención. No se ha enviado ningún correo automático.</p><button className="button button-primary" onClick={onClose}>Listo <Check size={16}/></button></div> : <><BrandMark size={40}/><h2>{showForm ? <>Escríbanos <em>su consulta.</em></> : <>¿En qué podemos <em>ayudarle?</em></>}</h2><p>{showForm ? "Cuéntenos su consulta, la ocasión o el resultado que busca. Le responderemos con gusto." : "Aquí resolvemos las dudas más frecuentes sobre reservas, precios y cancelaciones."}</p>
      {showForm ? <form onSubmit={submit} className="contact-form"><div className="form-grid"><label className="field">Nombre y apellidos *<input name="name" required minLength={3} maxLength={100} autoComplete="name" placeholder="Nombre completo"/></label><label className="field">Correo electrónico *<input name="email" type="email" required maxLength={150} autoComplete="email" placeholder="hola@tucorreo.com"/></label></div><label className="field">Su consulta *<textarea name="message" required minLength={10} maxLength={1500} rows={4} placeholder="Me gustaría saber más sobre…"/></label><label className="consent"><input type="checkbox" name="consent" required/><span>Acepto el uso de mis datos para atender esta solicitud.</span></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17}/> : <Mail size={17}/>} {loading ? "Enviando consulta…" : "Enviar consulta"}</button><p className="form-note"><ShieldCheck size={14}/> Sus datos se guardan de forma privada y no se utilizan con fines publicitarios.</p></form> : <><div className="faq-list">{faqs.slice(0, 4).map((faq) => <details key={faq.question}><summary>{faq.question}<ChevronDown size={16}/></summary><p>{faq.answer}</p></details>)}</div><div className="help-actions"><button className="button button-primary" onClick={onBook}>Reservar cita <ArrowRight size={16}/></button><button className="button button-outline" onClick={() => setShowForm(true)}><MessageCircle size={16}/>Tengo otra consulta</button></div><p className="help-hours"><Clock3 size={14}/> Lunes a sábado · 10:00 a 19:00 h</p></>}
    </>}
  </div></Dialog>;
}

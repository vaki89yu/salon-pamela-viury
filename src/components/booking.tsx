"use client";

import { useEffect, useState, FormEvent } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCheck, Clock3, Copy, Download, Flower2, LoaderCircle, MapPin, Scissors, ShieldCheck, Sparkles, UserRound, X } from "lucide-react";
import { Booking, dateLabel, findService, findStylist, juarezToday, money, services, stylists } from "@/lib/catalog";
import { Dialog } from "@/components/dialog";
import { BrandMark } from "@/components/brand";

function initialDate() {
  const date = new Date(`${juarezToday()}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
function maximumDate() { const date = new Date(`${juarezToday()}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + 90); return date.toISOString().slice(0, 10); }

export function AppointmentReceipt({ appointment, onUpdate }: { appointment: Booking; onUpdate: (value: Booking) => void }) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const service = findService(appointment.serviceId);
  const cancelled = appointment.status === "cancelled";
  async function download() {
    setDownloading(true); setError("");
    try {
      const response = await fetch(`/api/appointments/${appointment.folio}/pdf?token=${appointment.accessToken}`);
      if (!response.ok) throw new Error("No pudimos generar tu comprobante. Inténtalo de nuevo.");
      const blob = await response.blob(); const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = `Pamela-Viury-${appointment.folio}.pdf`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos descargar tu PDF."); }
    finally { setDownloading(false); }
  }
  async function cancel() {
    setCancelling(true); setError("");
    try {
      const response = await fetch(`/api/appointments/${appointment.folio}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken: appointment.accessToken }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      onUpdate(data.appointment); setConfirmCancel(false);
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos cancelar tu cita."); }
    finally { setCancelling(false); }
  }
  async function copy() { try { await navigator.clipboard.writeText(appointment.folio); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { setError("Puedes seleccionar y copiar el folio que aparece arriba."); } }
  return <div className="receipt">
    <div className={`receipt-symbol ${cancelled ? "is-cancelled" : ""}`}>{cancelled ? <X size={30}/> : <CheckCheck size={31}/>}</div>
    <p className="mini-label">{cancelled ? "RESERVA CANCELADA" : "RESERVA CONFIRMADA"}</p>
    <h2>{cancelled ? "Su cita está cancelada." : "Su cita está confirmada"}</h2>
    <p className="receipt-intro">{cancelled ? "El horario ha quedado disponible. Será un gusto recibirle en otra ocasión." : `${appointment.name.split(" ")[0]}, le esperamos en el salón. Conserve su folio y descargue su comprobante en PDF.`}</p>
    <button className="folio" onClick={copy} title="Copiar folio"><span><small>SU FOLIO</small><strong>{appointment.folio}</strong></span>{copied ? <Check size={18}/> : <Copy size={18}/>}</button>
    <span className="sr-only" role="status">{copied ? "Folio copiado" : ""}</span>
    <div className="receipt-details">
      <div><Sparkles size={17}/><span><small>Servicio</small><strong>{service?.name}</strong></span></div>
      <div><UserRound size={17}/><span><small>Su especialista</small><strong>{findStylist(appointment.stylistId)?.name}</strong></span></div>
      <div><CalendarDays size={17}/><span><small>Fecha</small><strong>{dateLabel(appointment.date)}</strong></span></div>
      <div><Clock3 size={17}/><span><small>Hora de Ciudad Juárez</small><strong>{appointment.time} h · {appointment.duration} min</strong></span></div>
    </div>
    <div className="receipt-price"><span>Inversión estimada</span><strong>Desde {money(appointment.price)} <small>MXN</small></strong></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-primary receipt-download" onClick={download} disabled={downloading}>{downloading ? <LoaderCircle className="spin" size={17}/> : <Download size={17}/>} {downloading ? "Preparando tu PDF…" : "Descargar comprobante PDF"}</button>
    <p className="form-note">El precio final se confirma en el salón. No se realiza ningún cobro en línea ni se envían correos automáticos.</p>
    {!cancelled && !confirmCancel && <button className="text-button cancel-link" onClick={() => setConfirmCancel(true)}>Necesito cancelar mi cita</button>}
    {confirmCancel && <div className="cancel-box"><strong>¿Confirma que desea cancelar?</strong><p>Su horario quedará disponible para otra clienta.</p><div><button className="button button-outline" onClick={() => setConfirmCancel(false)} disabled={cancelling}>Conservar cita</button><button className="button button-danger" onClick={cancel} disabled={cancelling}>{cancelling ? "Cancelando…" : "Sí, cancelar"}</button></div></div>}
  </div>;
}

export function BookingModal({ initialService, onClose }: { initialService?: string; onClose: () => void }) {
  const [step, setStep] = useState(initialService ? 1 : 0);
  const [serviceId, setServiceId] = useState(initialService || "corte");
  const [stylistId, setStylistId] = useState(() => stylists.find((item) => item.services.includes(initialService || "corte"))!.id);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [appointment, setAppointment] = useState<Booking | null>(null);
  const service = findService(serviceId)!;
  const availableStylists = stylists.filter((item) => item.services.includes(serviceId));
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setTime(""); setAvailabilityError(""); setSlots([]);
    fetch(`/api/availability?date=${date}&service=${serviceId}&stylist=${stylistId}`, { signal: controller.signal })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; })
      .then((data) => setSlots(data.slots))
      .catch((err) => { if (err.name !== "AbortError") setAvailabilityError(err.message || "No pudimos cargar los horarios."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [date, serviceId, stylistId, refresh]);
  function selectService(id: string) { setServiceId(id); const first = stylists.find((item) => item.services.includes(id))!; if (!first.services.includes(serviceId) || !findStylist(stylistId)?.services.includes(id)) setStylistId(first.id); setError(""); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId, stylistId, date, time, name: form.get("name"), phone: form.get("phone"), email: form.get("email"), notes: form.get("notes"), consent: form.get("consent") === "on" }) });
      const data = await response.json();
      if (!response.ok) { if (response.status === 409) { setStep(1); setRefresh((value) => value + 1); } throw new Error(data.error); }
      setAppointment(data.appointment);
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos reservar tu cita. Inténtalo de nuevo."); }
    finally { setSubmitting(false); }
  }
  return <Dialog title="RESERVA DE CITA" onClose={onClose} className={appointment ? "receipt-dialog" : "booking-dialog"}>
    {appointment ? <AppointmentReceipt appointment={appointment} onUpdate={setAppointment}/> : <>
      <div className="booking-heading"><h2>Reserve su <em>cita.</em></h2><p>Tres pasos para agendar su visita al salón.</p></div>
      <ol className="booking-steps">{["Servicio", "Fecha y hora", "Sus datos"].map((label, index) => <li key={label} className={step === index ? "current" : step > index ? "complete" : ""}><span>{step > index ? <Check size={13}/> : `0${index + 1}`}</span>{label}</li>)}</ol>
      <div className="booking-layout"><div className="booking-main">
        {step === 0 && <div className="step-content"><h3>Elija su servicio</h3><div className="service-options">{services.map((item) => <button key={item.id} className={`service-option ${item.id === serviceId ? "selected" : ""}`} onClick={() => selectService(item.id)}><span className="service-option-icon">{item.category === "Cabello" ? <Scissors size={20}/> : item.category === "Uñas" ? <Flower2 size={20}/> : <Sparkles size={20}/>}</span><strong>{item.name}</strong><small>{item.duration} min · Desde {money(item.price)}</small><span className="option-check">{item.id === serviceId && <Check size={12}/>}</span></button>)}</div><p className="form-note">Todos los servicios incluyen diagnóstico y asesoría personalizada. Precios en MXN.</p></div>}
        {step === 1 && <div className="step-content"><h3>Elija fecha y horario</h3><div className="form-grid"><label className="field">Su especialista<select value={stylistId} onChange={(event) => setStylistId(event.target.value)}>{availableStylists.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.specialty}</option>)}</select></label><label className="field">Elige un día<input type="date" value={date} min={juarezToday()} max={maximumDate()} onChange={(event) => setDate(event.target.value)}/></label></div><p className="time-label"><Clock3 size={15}/> Horarios disponibles <span>Hora de Ciudad Juárez</span></p>
          {loading ? <div className="availability-state"><LoaderCircle className="spin" size={21}/><span>Consultando disponibilidad…</span></div> : availabilityError ? <div className="availability-state"><p>{availabilityError}</p><button className="text-button" onClick={() => setRefresh((value) => value + 1)}>Volver a consultar</button></div> : slots.length ? <div className="time-slots">{slots.map((slot) => <button key={slot} className={time === slot ? "selected" : ""} onClick={() => setTime(slot)} aria-pressed={time === slot}>{slot}</button>)}</div> : <div className="availability-state"><CalendarDays size={23}/><p>Este día está completo. Pruebe con otra fecha o especialista.</p></div>}
          <p className="form-note">Lunes a sábado, de 10:00 a 19:00 h. Domingos cerrado. Puede reservar con hasta 90 días de anticipación.</p></div>}
        {step === 2 && <form id="booking-form" className="step-content" onSubmit={submit}><h3>Sus datos de contacto</h3><label className="field">Nombre completo *<input name="name" autoComplete="name" required minLength={3} maxLength={100} placeholder="Nombre y apellidos"/></label><div className="form-grid"><label className="field">Teléfono de 10 dígitos *<input name="phone" autoComplete="tel" type="tel" inputMode="tel" required minLength={10} maxLength={20}  placeholder="656 123 4567"/></label><label className="field">Correo electrónico <span className="optional">opcional</span><input name="email" autoComplete="email" type="email" maxLength={150} placeholder="hola@tucorreo.com"/></label></div><label className="field">¿Algo que debamos saber? <span className="optional">opcional</span><textarea name="notes" maxLength={500} rows={2} placeholder="Indíquenos cualquier consideración sobre su cabello o su visita."/></label><label className="consent"><input type="checkbox" name="consent" required/><span>Acepto que mis datos se utilicen únicamente para gestionar mi cita y atender mi solicitud.</span></label></form>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div><aside className="booking-summary"><div className="summary-image" style={{ backgroundImage: `url(${service.image})` }}><BrandMark size={36}/></div><p className="mini-label">RESUMEN DE SU CITA</p><h3>{service.name}</h3><p><Clock3 size={14}/>{service.duration} minutos de servicio</p><p><UserRound size={14}/>{findStylist(stylistId)?.name}</p>{step > 0 && <p><CalendarDays size={14}/>{date ? dateLabel(date).replace(/ de \d{4}$/, "") : "Elija una fecha"}{time && ` · ${time} h`}</p>}<div className="summary-price"><small>Desde</small><strong>{money(service.price)} <span>MXN</span></strong></div><p className="summary-trust"><ShieldCheck size={18}/><span>Reserva sin cobros en línea. Presupuesto cerrado en el salón.</span></p></aside></div>
      <div className="booking-footer"><button className="text-button" onClick={() => step > 0 ? (setStep(step - 1), setError("")) : onClose()} disabled={submitting}><ArrowLeft size={16}/>{step > 0 ? "Volver" : "Cancelar"}</button>{step < 2 ? <button className="button button-primary" onClick={() => { setStep(step + 1); setError(""); }} disabled={step === 1 && (!time || loading)}>Continuar <ArrowRight size={16}/></button> : <button form="booking-form" type="submit" className="button button-primary" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={17}/> : <Check size={17}/>} {submitting ? "Reservando…" : "Confirmar mi cita"}</button>}</div>
    </>}
  </Dialog>;
}

export function LookupModal({ onClose }: { onClose: () => void }) {
  const [appointment, setAppointment] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/appointments/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folio: form.get("folio"), phone: form.get("phone") }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error); setAppointment(data.appointment);
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos consultar tu cita."); } finally { setLoading(false); }
  }
  return <Dialog title="CONSULTA DE CITA" onClose={onClose} className="receipt-dialog">{appointment ? <><AppointmentReceipt appointment={appointment} onUpdate={setAppointment}/><button className="text-button lookup-again" onClick={() => { setAppointment(null); setError(""); }}><ArrowLeft size={15}/>Consultar otra cita</button></> : <div className="lookup-content"><BrandMark size={42}/><h2>Consulte su <em>cita.</em></h2><p>Consulte su reserva, descargue su comprobante o cancele su cita. Solo necesita su folio y teléfono.</p><form onSubmit={lookup}><label className="field">Folio de su cita<input name="folio" required maxLength={32} placeholder="PV-260101-A1B2C3D4" autoCapitalize="characters" className="folio-input"/></label><label className="field">Teléfono de su reserva<input name="phone" type="tel" inputMode="tel" required minLength={10} maxLength={20} placeholder="656 123 4567" autoComplete="tel"/></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17}/> : <CalendarDays size={17}/>} {loading ? "Consultando…" : "Consultar mi cita"}</button></form><p className="form-note"><ShieldCheck size={14}/> Sus datos son privados y se usan solo para localizar su reserva.</p></div>}</Dialog>;
}

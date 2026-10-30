import Image from "next/image";
import { plans } from "../landing-content";
import type { ConfirmedRegistration } from "./registration-model";

// No está conectada al formulario: requiere un resultado confirmado por el backend.
export function RegistrationConfirmation({ receipt }: { receipt: ConfirmedRegistration | null }) {
  if (!receipt?.registrationId.trim()) return null;
  const plan = plans.find((item) => item.id === receipt.planId);
  if (!plan) return null;
  const paid = receipt.status === "active";
  if (paid && (!receipt.paymentReference.trim() || !receipt.validUntil.trim() || !receipt.attendanceCode.trim())) return null;

  return (
    <section className="registration-confirmation" aria-labelledby="confirmation-title" role="status">
      <Image src={`/registration/${paid ? "payment" : "cash"}-confirmed.svg`} alt="" width={60} height={60} />
      <h1 id="confirmation-title">{paid ? "¡Pago Exitoso!" : "Tu registro fue guardado"}</h1>
      <p>{paid ? "Bienvenido(a) a Imperium Cross. Tu membresía ya está activa." : "Elegiste pagar en efectivo. Tu membresía permanecerá pendiente hasta que recepción confirme el pago presencial."}</p>
      <dl className="confirmation-summary">
        <div><dt>Plan</dt><dd>{plan.name} — S/{plan.price}</dd></div>
        {paid && <><div><dt>Vigente hasta</dt><dd>{receipt.validUntil}</dd></div><div><dt>Código de asistencia</dt><dd>{receipt.attendanceCode}</dd></div></>}
      </dl>
      <p className="confirmation-note">{paid ? (receipt.credentialsEmailSent ? "Te enviamos un correo con tus credenciales de acceso al sistema." : "El envío del correo de acceso está pendiente.") : "Al confirmar tu pago en recepción, se podrá gestionar tu acceso al sistema."}</p>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { plans } from "../landing-content";
import { RegistrationForm } from "./registration-form";
import type { PlanId } from "./registration-model";
import "./registration.css";

export function PlanRegistration() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!selectedPlan || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    dialog.querySelector("h1")?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [selectedPlan]);

  return (
    <>
      <div className="plans-grid">
        {plans.map((plan) => (
          <article key={plan.id} className={`plan-card ${plan.id === "premium" ? "plan-featured" : ""}`}>
            <h3>Plan {plan.name}</h3>
            <p className="plan-price">S/. {plan.price}<span>Mensual</span></p>
            <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <button className="landing-button" type="button" aria-haspopup="dialog" aria-label={`Inscribirme al Plan ${plan.name}`} onClick={(event) => {
              openerRef.current = event.currentTarget;
              setSelectedPlan(plan.id);
            }}>Elegir plan</button>
          </article>
        ))}
      </div>
      <dialog
        className="registration-dialog"
        ref={dialogRef}
        aria-labelledby="registration-title"
        aria-modal="true"
        onClose={() => {
          setSelectedPlan(null);
          openerRef.current?.focus({ preventScroll: true });
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex='0']",
          )).filter((element) => element.getClientRects().length > 0);
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
        }}
      >
        <button className="registration-close" type="button" aria-label="Cerrar inscripción" onClick={() => dialogRef.current?.close()}>×</button>
        {selectedPlan && <RegistrationForm key={selectedPlan} initialPlanId={selectedPlan} />}
      </dialog>
    </>
  );
}

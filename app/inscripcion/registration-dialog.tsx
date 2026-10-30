"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { plans } from "../landing-content";
import { actionBaseClasses, landingActionSizes, primaryActionClasses } from "../ui-styles";
import { RegistrationForm } from "./registration-form";
import type { PlanId } from "./registration-model";

type PlanCardProps = {
  plan: (typeof plans)[number];
  onSelect: (planId: PlanId, button: HTMLButtonElement) => void;
};

function PlanCard({ plan, onSelect }: PlanCardProps) {
  const isFeatured = plan.id === "premium";
  const borderClasses = isFeatured ? "border-brand-start bg-brand-surface" : "border-line";
  const featureMargin = plan.id === "basico" ? "mt-[97px]" : "mt-10";

  return (
    <article
      data-ui="plan-card"
      className={[
        "flex min-h-[598px] flex-col items-center rounded-card border-2",
        "px-6 pt-7.5 pb-[27px] max-lg:px-3 max-md:px-6",
        borderClasses,
      ].join(" ")}
    >
      <h3 className="text-center text-xl font-bold">Plan {plan.name}</h3>
      <p className="mt-10 text-center text-4xl font-bold whitespace-nowrap">
        S/. {plan.price}
        <span className="block text-2xl">Mensual</span>
      </p>
      <ul className={`mb-10 flex max-w-[188px] flex-col gap-2.5 ${featureMargin}`}>
        {plan.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <button
        data-ui="landing-button"
        type="button"
        aria-haspopup="dialog"
        aria-label={`Inscribirme al Plan ${plan.name}`}
        onClick={(event) => onSelect(plan.id, event.currentTarget)}
        className={[
          actionBaseClasses,
          primaryActionClasses,
          landingActionSizes.plan,
          "mt-auto hover:brightness-[.93]",
        ].join(" ")}
      >
        Elegir plan
      </button>
    </article>
  );
}

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

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedPlan]);

  function openRegistration(planId: PlanId, button: HTMLButtonElement) {
    openerRef.current = button;
    setSelectedPlan(planId);
  }

  function closeRegistration() {
    dialogRef.current?.close();
  }

  function restoreFocus() {
    setSelectedPlan(null);
    openerRef.current?.focus({ preventScroll: true });
  }

  function containFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;

    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex='0']",
      ),
    ).filter((element) => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;

    const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
    const isOutside =
      event.clientX < left ||
      event.clientX > right ||
      event.clientY < top ||
      event.clientY > bottom;

    if (isOutside) closeRegistration();
  }

  return (
    <>
      <div
        data-ui="plans-grid"
        className="mx-auto mt-24 grid max-w-plans grid-cols-3 gap-17.5 max-lg:gap-5
          max-md:mt-10 max-md:max-w-mobile-cards max-md:grid-cols-1 max-md:gap-7"
      >
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onSelect={openRegistration} />
        ))}
      </div>
      <dialog
        data-ui="registration-dialog"
        ref={dialogRef}
        aria-labelledby="registration-title"
        aria-modal="true"
        onClose={restoreFocus}
        onKeyDown={containFocus}
        onClick={closeOnBackdrop}
        className="fixed m-auto max-h-[calc(100dvh_-_32px)] w-[calc(100%_-_24px)]
          max-w-registration overflow-auto overscroll-contain border-0 bg-transparent p-0
          backdrop:bg-black/55"
      >
        <button
          data-ui="registration-close"
          type="button"
          aria-label="Cerrar inscripción"
          onClick={closeRegistration}
          className="absolute top-2.5 right-2.5 z-1 size-8 cursor-pointer rounded-full
            bg-white text-2xl leading-none text-brand-start hover:bg-brand-surface"
        >
          ×
        </button>
        {selectedPlan && <RegistrationForm key={selectedPlan} initialPlanId={selectedPlan} />}
      </dialog>
    </>
  );
}

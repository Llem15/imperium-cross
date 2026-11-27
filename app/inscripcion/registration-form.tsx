"use client";

import { useEffect, useRef } from "react";
import { RegistrationConfirmation } from "./registration-confirmation";
import { maxWeeklySessions } from "./registration-model";
import type { PlanId } from "./registration-model";
import { ApplicantStep, PlanPaymentStep, ScheduleStep } from "./registration-steps";
import { linkButtonClasses } from "./registration-styles";
import { useRegistration } from "./use-registration";
import type { RegistrationStep } from "./use-registration";

const totalSteps = 4;
const stepTitles: Record<RegistrationStep, string> = {
  1: "Tus datos",
  2: "Elige tu horario",
  3: "Elige tu plan",
  4: "Pago de tu membresía",
};

function StepProgress({ step }: { step: RegistrationStep }) {
  return (
    <div data-ui="registration-progress" className="flex gap-1.5" aria-hidden="true">
      {Array.from({ length: totalSteps }, (_, index) => (
        <span
          key={index}
          className={`h-1 w-7 rounded-full ${index < step ? "bg-brand-start" : "bg-line"}`}
        />
      ))}
    </div>
  );
}

export function RegistrationForm({ initialPlanId }: { initialPlanId: PlanId }) {
  const registration = useRegistration(initialPlanId);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { step, options } = registration;

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  if (registration.completed) {
    return (
      <RegistrationConfirmation
        preview={{ planId: registration.planId, method: registration.method }}
      />
    );
  }

  function renderStep() {
    if (step === 1) {
      return (
        <ApplicantStep
          data={registration.data}
          errors={registration.errors}
          onChange={registration.updateField}
          onSubmit={registration.nextStep}
        />
      );
    }

    if (!options) {
      return registration.optionsFailed ? (
        <p className="mt-6 text-center text-caption text-brand-start" role="alert">
          No pudimos cargar los horarios.{" "}
          <button type="button" className={linkButtonClasses} onClick={registration.retryOptions}>
            Reintentar
          </button>
        </p>
      ) : (
        <p className="mt-6 text-center text-caption text-muted" role="status">
          Cargando horarios…
        </p>
      );
    }

    if (step === 2) {
      return (
        <ScheduleStep
          availability={options.availability}
          limit={maxWeeklySessions(options.sessionsByPlan)}
          schedule={registration.schedule}
          onToggle={registration.toggleScheduleSession}
          onRemove={registration.removeScheduleSession}
          onBack={() => registration.goToStep(1)}
          onSubmit={registration.confirmSchedule}
        />
      );
    }

    return (
      <PlanPaymentStep
        planId={registration.planId}
        method={registration.method}
        schedule={registration.schedule}
        sessionsByPlan={options.sessionsByPlan}
        notice={registration.planNotice}
        onPlanChange={registration.selectPlan}
        onMethodChange={registration.setMethod}
        onChangeSchedule={() => registration.goToStep(2)}
        onBack={() => registration.goToStep(2)}
        onSubmit={registration.continueRegistration}
      />
    );
  }

  return (
    <section
      data-ui="registration-card"
      aria-labelledby="registration-title"
      className="min-h-0 w-full max-w-registration rounded-dialog border border-ink
        bg-white p-[32px] text-ink max-compact:px-6 max-compact:py-8 max-small:px-4.5"
    >
      <header
        data-ui="registration-heading"
        className="flex flex-col items-center gap-3.75 text-center"
      >
        <StepProgress step={step} />
        <p className="text-sm text-muted">
          Paso {step} de {totalSteps}
        </p>
        <h1
          id="registration-title"
          tabIndex={-1}
          ref={headingRef}
          className="text-2xl font-bold focus:outline-none"
        >
          {stepTitles[step]}
        </h1>
      </header>
      {renderStep()}
    </section>
  );
}

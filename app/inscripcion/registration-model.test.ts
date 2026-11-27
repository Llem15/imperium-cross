import { describe, expect, it } from "vitest";
import {
  canScheduleDay,
  formatSession,
  maxWeeklySessions,
  membershipEndDate,
  planCoversSessions,
  planForSessions,
  removeSession,
  scheduledSessions,
  toggleSession,
  validateApplicant,
} from "./registration-model";
import type { Applicant, PlanSessions } from "./registration-model";

const sessionsByPlan: PlanSessions = { basico: 2, premium: 3, pro: 5 };

describe("horarios", () => {
  it("formatea sesiones de 60 minutos", () => {
    expect(formatSession("19:00")).toBe("19:00 – 20:00");
    expect(formatSession("09:00")).toBe("09:00 – 10:00");
  });

  it("permite como máximo 1 sesión por día: otra hora del mismo día la reemplaza", () => {
    const monday = toggleSession({}, 1, "18:00");
    const replaced = toggleSession(monday, 1, "19:00");

    expect(replaced).toEqual({ 1: "19:00" });
    expect(scheduledSessions(replaced)).toHaveLength(1);
  });

  it("quita la sesión al elegir de nuevo la misma hora", () => {
    expect(toggleSession({ 1: "18:00" }, 1, "18:00")).toEqual({});
  });

  it("quita una sesión sin modificar el horario original", () => {
    const schedule = { 1: "18:00", 3: "07:00" };

    expect(removeSession(schedule, 1)).toEqual({ 3: "07:00" });
    expect(schedule).toEqual({ 1: "18:00", 3: "07:00" });
  });

  it("ordena las sesiones de lunes a viernes", () => {
    const sessions = scheduledSessions({ 5: "18:00", 1: "19:00", 3: "07:00" });

    expect(sessions.map(({ day }) => day.short)).toEqual(["Lun", "Mié", "Vie"]);
  });

  it("bloquea días nuevos al llegar al límite, pero deja cambiar los ya elegidos", () => {
    const schedule = { 1: "06:00", 2: "06:00" };

    expect(canScheduleDay(schedule, 3, 2)).toBe(false);
    expect(canScheduleDay(schedule, 1, 2)).toBe(true);
    expect(canScheduleDay(schedule, 3, 3)).toBe(true);
  });

  it("usa como límite las sesiones del plan más amplio", () => {
    expect(maxWeeklySessions(sessionsByPlan)).toBe(5);
  });
});

describe("planes", () => {
  it("indica si un plan cubre las sesiones elegidas", () => {
    expect(planCoversSessions(sessionsByPlan, "basico", 2)).toBe(true);
    expect(planCoversSessions(sessionsByPlan, "basico", 3)).toBe(false);
    expect(planCoversSessions(sessionsByPlan, "premium", 3)).toBe(true);
    expect(planCoversSessions(sessionsByPlan, "premium", 4)).toBe(false);
    expect(planCoversSessions(sessionsByPlan, "pro", 5)).toBe(true);
  });

  it("conserva el plan elegido si cubre las sesiones", () => {
    expect(planForSessions("pro", sessionsByPlan, 2)).toBe("pro");
    expect(planForSessions("basico", sessionsByPlan, 2)).toBe("basico");
  });

  it("cambia al plan más barato que cubre las sesiones", () => {
    expect(planForSessions("basico", sessionsByPlan, 3)).toBe("premium");
    expect(planForSessions("basico", sessionsByPlan, 4)).toBe("pro");
    expect(planForSessions("premium", sessionsByPlan, 5)).toBe("pro");
  });
});

describe("datos del solicitante", () => {
  const applicant: Applicant = {
    firstName: "Ana",
    lastName: "Torres",
    email: "ana@correo.com",
    password: "clave1234",
    phone: "987654321",
    dni: "12345678",
    goal: "Ganar fuerza",
  };

  it("acepta datos válidos", () => {
    expect(validateApplicant(applicant)).toEqual({});
  });

  it.each(["corta1", "solotexto", "12345678", "a".repeat(64) + "1"])(
    "rechaza la contraseña %s",
    (password) => {
      expect(validateApplicant({ ...applicant, password }).password).toBe(
        "Usa al menos 8 caracteres, con letras y números.",
      );
    },
  );

  it("acepta contraseñas con tildes y ñ", () => {
    expect(validateApplicant({ ...applicant, password: "contraseña1" }).password).toBeUndefined();
  });
});

describe("membresía", () => {
  it("termina 30 días después de hoy", () => {
    expect(membershipEndDate(new Date(2026, 10, 26))).toBe("26/12/2026");
  });
});

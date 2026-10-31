import { plans as publicPlans } from "@/app/landing-content";
import { demoDate, members as initialMembers } from "./dashboard";
import type { DemoMember, DemoRole } from "./dashboard";
import {
  exercises as initialExercises,
  progressNotes,
  routines as initialRoutines,
} from "./training";
import type { Exercise, Prescription, ProgressNote } from "./training";

export type Member = DemoMember & { dni: string; phone: string; attendanceCode: string };
export type Staff = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Exclude<DemoRole, "member">;
  active: boolean;
  dni: string;
  phone: string;
  portrait?: string;
};
export type Plan = {
  id: string;
  name: string;
  priceCents: number;
  days: number;
  benefits: string[];
  active: boolean;
  discount: number;
};
export type Product = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  stock: number;
  minimum: number;
  description: string;
  image: string;
};
export type TrainingExercise = Exercise & { category: string; muscleGroup: string };
export type Routine = {
  id: string;
  name: string;
  updatedOn: string;
  trainerId: string;
  prescriptions: Prescription[];
};
export type PaymentMethod = "card" | "yape" | "cash";
export type Payment = {
  id: string;
  memberId: string;
  planId: string;
  cents: number;
  method: PaymentMethod;
  status: "paid" | "pending";
  date: string;
};
export type Attendance = { id: string; memberId: string; date: string; time: string };
export type Sale = {
  id: string;
  date: string;
  method: PaymentMethod;
  lines: { productId: string; name: string; quantity: number; cents: number }[];
  total: number;
};
export type DemoData = {
  members: Member[];
  staff: Staff[];
  plans: Plan[];
  products: Product[];
  exercises: TrainingExercise[];
  routines: Routine[];
  notes: ProgressNote[];
  payments: Payment[];
  attendance: Attendance[];
  sales: Sale[];
};

export const paymentLabels: Record<PaymentMethod, string> = {
  card: "Tarjeta",
  yape: "Yape",
  cash: "Efectivo",
};
export const productCategories = ["Suplementos", "Accesorios", "Ropa", "Snacks"];
export const exerciseCategories = ["Fuerza", "Cardio", "Flexibilidad", "Calistenia"];

export const initialDemoData: DemoData = {
  members: initialMembers.map((member, index) => ({
    ...member,
    dni: `7000000${index + 1}`,
    phone: `90000000${index + 1}`,
    attendanceCode: String(4821 + index),
  })),
  staff: [
    {
      id: "staff-admin",
      firstName: "Lin",
      lastName: "Pacheco",
      email: "lin@example.test",
      role: "admin",
      active: true,
      dni: "71000001",
      phone: "900000011",
    },
    {
      id: "staff-reception",
      firstName: "Milagros",
      lastName: "Leon",
      email: "recepcion@example.test",
      role: "reception",
      active: true,
      dni: "71000002",
      phone: "900000012",
    },
    {
      id: "trainer-pedro",
      firstName: "Pedro",
      lastName: "Navarro",
      email: "pedro@example.test",
      role: "trainer",
      active: true,
      dni: "71000003",
      phone: "900000013",
    },
    {
      id: "trainer-other",
      firstName: "Lía",
      lastName: "Parado",
      email: "lia@example.test",
      role: "trainer",
      active: false,
      dni: "71000004",
      phone: "900000014",
    },
  ],
  plans: publicPlans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    priceCents: Math.round(Number(plan.price) * 100),
    days: 30,
    benefits: [...plan.features],
    active: true,
    discount: plan.id === "premium" ? 10 : plan.id === "pro" ? 25 : 0,
  })),
  products: [
    {
      id: "product-whey",
      name: "Whey pro 3kg Chocolate",
      category: "Suplementos",
      priceCents: 9000,
      stock: 12,
      minimum: 5,
      description:
        "Proteína en polvo sabor chocolate, 3 kg. Producto de ejemplo para consulta y venta presencial.",
      image: "product-whey.png",
    },
    {
      id: "product-gloves",
      name: "Guantes deportivos rojos",
      category: "Accesorios",
      priceCents: 2000,
      stock: 10,
      minimum: 3,
      description: "Guantes de entrenamiento para proteger las manos durante los ejercicios.",
      image: "product-gloves.png",
    },
    {
      id: "product-whey-vanilla",
      name: "Whey pro 3kg Vainilla",
      category: "Suplementos",
      priceCents: 9000,
      stock: 3,
      minimum: 5,
      description: "Presentación de ejemplo de proteína de vainilla, disponible en recepción.",
      image: "product-whey.png",
    },
    {
      id: "product-whey-natural",
      name: "Whey pro 3kg Natural",
      category: "Suplementos",
      priceCents: 9000,
      stock: 0,
      minimum: 5,
      description: "Presentación de ejemplo actualmente agotada.",
      image: "product-whey.png",
    },
  ],
  exercises: [
    ...initialExercises.map((exercise) => ({
      ...exercise,
      category: "Fuerza",
      muscleGroup: exercise.id === "exercise-bench" ? "Pecho" : "Espalda",
    })),
    {
      id: "exercise-squat",
      name: "Sentadilla",
      image: "exercise-squat.png",
      detailImage: "exercise-squat.png",
      crop: { width: "224.38%", height: "133.97%", left: "-104.02%", top: "-28.81%" },
      level: "Alta",
      category: "Fuerza",
      muscleGroup: "Piernas",
      description: "Ejercicio de tren inferior del catálogo de demostración.",
      instructions: "Consulta las indicaciones de tu entrenador antes de realizar el ejercicio.",
    },
    {
      id: "exercise-rope",
      name: "Salto de soga",
      image: "exercise-rope.png",
      detailImage: "exercise-rope.png",
      crop: { width: "175.11%", height: "104.51%", left: "-79.01%", top: "-1.78%" },
      level: "Bajo",
      category: "Cardio",
      muscleGroup: "Cuerpo completo",
      description: "Ejercicio cardiovascular del catálogo de demostración.",
      instructions: "Consulta las indicaciones de tu entrenador antes de realizar el ejercicio.",
    },
  ],
  routines: initialRoutines.map((routine) => ({
    ...routine,
    trainerId: "trainer-pedro",
    updatedOn: demoDate,
    prescriptions: [...routine.prescriptions],
  })),
  notes: [...progressNotes],
  payments: initialMembers.map((member, index) => ({
    id: `payment-${index + 1}`,
    memberId: member.id,
    planId: member.planId,
    cents: member.planId === "basico" ? 3999 : member.planId === "pro" ? 9999 : 6999,
    method: index % 3 === 0 ? "cash" : index % 3 === 1 ? "card" : "yape",
    status: member.status === "pending" ? "pending" : "paid",
    date: member.joinedOn,
  })),
  attendance: [
    { id: "attendance-1", memberId: "member-melani", date: demoDate, time: "07:30" },
    { id: "attendance-2", memberId: "member-ana", date: demoDate, time: "09:15" },
    { id: "attendance-3", memberId: "member-mario", date: "2026-12-06", time: "18:40" },
  ],
  sales: [],
};

export function newDemoId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
export function money(cents: number) {
  return `S/ ${(cents / 100).toFixed(2)}`;
}
export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function membershipStatus(member: DemoMember) {
  if (member.status === "pending") return "pending";
  return member.expiresOn && member.expiresOn < demoDate ? "expired" : member.status;
}

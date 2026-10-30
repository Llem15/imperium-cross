import type { PlanId } from "@/app/inscripcion/registration-model";

export type DemoRole = "admin" | "reception" | "trainer" | "member";

type NavigationItem = {
  label: string;
  href?: string;
};

type DemoProfile = {
  id: DemoRole;
  label: string;
  name: string;
  subtitle: string;
  href: string;
  avatar: string;
  navigation: readonly NavigationItem[];
};

export const demoProfiles: readonly DemoProfile[] = [
  {
    id: "admin",
    label: "Administrador",
    name: "Lin Pacheco",
    subtitle: "Administrador",
    href: "/admin",
    avatar: "avatar-admin.png",
    navigation: [
      { label: "Dashboard", href: "/admin" },
      { label: "Usuarios" },
      { label: "Clientes" },
      { label: "Membresías" },
      { label: "Productos" },
    ],
  },
  {
    id: "reception",
    label: "Recepción",
    name: "Milagros Leon",
    subtitle: "Recepcionista",
    href: "/recepcion/clientes",
    avatar: "avatar-reception.png",
    navigation: [
      { label: "Clientes", href: "/recepcion/clientes" },
      { label: "Membresías y pagos" },
      { label: "Asistencia" },
      { label: "Venta de productos" },
    ],
  },
  {
    id: "trainer",
    label: "Entrenador",
    name: "Pedro Navarro",
    subtitle: "Entrenador",
    href: "/entrenador/clientes",
    avatar: "avatar-trainer.png",
    navigation: [
      { label: "Mis Clientes", href: "/entrenador/clientes" },
      { label: "Ejercicios" },
      { label: "Rutina" },
      { label: "Seguimiento" },
    ],
  },
  {
    id: "member",
    label: "Socio",
    name: "Melani Camacho",
    subtitle: "Premium",
    href: "/socio/mi-rutina",
    avatar: "avatar-member.png",
    navigation: [
      { label: "Mi rutina", href: "/socio/mi-rutina" },
      { label: "Perfil" },
      { label: "Productos" },
      { label: "Pagos" },
    ],
  },
];

// Identidades y registros ficticios. La fecha fija evita resultados variables al renderizar.
export const demoDate = "2026-12-07";
export const demoTrainerId = "trainer-pedro";
export const demoMemberId = "member-melani";

export type DemoMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  planId: PlanId;
  status: "active" | "pending";
  trainerId: string;
  routineId: string | null;
  joinedOn: string;
  expiresOn: string | null;
  objective: string;
  portrait?: string;
};

export const members: readonly DemoMember[] = [
  {
    id: demoMemberId,
    firstName: "Melani",
    lastName: "Camacho",
    email: "melani@example.test",
    planId: "premium",
    status: "active",
    trainerId: demoTrainerId,
    routineId: "routine-upper",
    joinedOn: "2026-12-01",
    expiresOn: "2026-12-12",
    objective: "Ganar masa muscular",
    portrait: "member-portrait.png",
  },
  {
    id: "member-ana",
    firstName: "Ana",
    lastName: "Torres",
    email: "ana@example.test",
    planId: "basico",
    status: "active",
    trainerId: demoTrainerId,
    routineId: "routine-upper",
    joinedOn: "2026-11-15",
    expiresOn: "2026-12-20",
    objective: "Mejorar resistencia",
  },
  {
    id: "member-mario",
    firstName: "Mario",
    lastName: "Bautista",
    email: "mario@example.test",
    planId: "basico",
    status: "active",
    trainerId: demoTrainerId,
    routineId: "routine-upper",
    joinedOn: "2026-12-02",
    expiresOn: "2027-01-01",
    objective: "Ganar fuerza",
  },
  {
    id: "member-milagros",
    firstName: "Milagros",
    lastName: "Leon",
    email: "milagros@example.test",
    planId: "pro",
    status: "pending",
    trainerId: demoTrainerId,
    routineId: null,
    joinedOn: "2026-12-07",
    expiresOn: null,
    objective: "Mejorar condición física",
  },
  {
    id: "member-luis",
    firstName: "Luis",
    lastName: "Torres",
    email: "luis@example.test",
    planId: "premium",
    status: "active",
    trainerId: "trainer-other",
    routineId: null,
    joinedOn: "2026-11-20",
    expiresOn: "2026-12-30",
    objective: "Mejorar condición física",
  },
];

export const planLabels: Record<PlanId, string> = {
  basico: "Básico",
  premium: "Premium",
  pro: "Pro",
};

export function fullName(member: DemoMember) {
  return `${member.firstName} ${member.lastName}`;
}

export function matchesMember(member: DemoMember, query: string) {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  return normalize(`${fullName(member)} ${member.email}`).includes(normalize(query.trim()));
}

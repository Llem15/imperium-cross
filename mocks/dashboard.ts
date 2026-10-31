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
      { label: "Usuarios", href: "/admin/usuarios" },
      { label: "Clientes", href: "/admin/clientes" },
      { label: "Membresías", href: "/admin/membresias" },
      { label: "Productos", href: "/admin/productos" },
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
      { label: "Membresías y pagos", href: "/recepcion/membresias" },
      { label: "Asistencia", href: "/recepcion/asistencia" },
      { label: "Venta de productos", href: "/recepcion/productos" },
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
      { label: "Ejercicios", href: "/entrenador/ejercicios" },
      { label: "Rutina", href: "/entrenador/rutinas" },
      { label: "Seguimiento", href: "/entrenador/seguimiento" },
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
      { label: "Perfil", href: "/socio/perfil" },
      { label: "Productos", href: "/socio/productos" },
      { label: "Pagos", href: "/socio/pagos" },
    ],
  },
];

// Datos públicos y ficticios para la demostración; no son credenciales reales.
export const demoPassword = "Imperium-demo";
export const demoAccounts = [
  { username: "lin.admin", email: "lin@admin.com", role: "admin" },
  { username: "milagros.recepcion", email: "milagros@recepcion.com", role: "reception" },
  { username: "pedro.entrenador", email: "pedro@entrenador.com", role: "trainer" },
  { username: "melani.cliente", email: "melani@gmail.com", role: "member" },
] as const;

// Identidades y registros ficticios. La fecha fija evita resultados variables al renderizar.
export const demoDate = "2026-12-07";
export const demoTrainerId = "trainer-pedro";
export const demoMemberId = "member-melani";

export type DemoMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  planId: string;
  status: "active" | "pending" | "expired";
  trainerId: string | null;
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
    email: "melani@gmail.com",
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
    email: "ana@gmail.com",
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
    email: "mario@gmail.com",
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
    email: "milagros@gmail.com",
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
    email: "luis@gmail.com",
    planId: "premium",
    status: "active",
    trainerId: "trainer-other",
    routineId: null,
    joinedOn: "2026-11-20",
    expiresOn: "2026-12-30",
    objective: "Mejorar condición física",
  },
];

export const planLabels: Record<string, string> = {
  basico: "Básico",
  premium: "Premium",
  pro: "Pro",
};

export function fullName(member: Pick<DemoMember, "firstName" | "lastName">) {
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

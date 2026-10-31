import { demoDate, fullName, members } from "./dashboard";
import type { DemoMember } from "./dashboard";

export const monthlyIncome = [
  { month: "Ene", cents: 1110600 },
  { month: "Feb", cents: 1530160 },
  { month: "Mar", cents: 1332720 },
  { month: "Abr", cents: 1727600 },
  { month: "May", cents: 1628920 },
  { month: "Jun", cents: 2023760 },
  { month: "Jul", cents: 1875680 },
  { month: "Ago", cents: 2245880 },
  { month: "Sep", cents: 1925040 },
  { month: "Oct", cents: 2344600 },
  { month: "Nov", cents: 2171840 },
  { month: "Dic", cents: 2468000 },
] as const;

export function formatMoney(cents: number) {
  return `S/ ${new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(cents / 100)}`;
}

export function overviewMetrics(currentMembers: readonly DemoMember[] = members) {
  const members = currentMembers;
  const month = demoDate.slice(0, 7);
  const active = members.filter(
    (member) => member.status === "active" && (!member.expiresOn || member.expiresOn >= demoDate),
  ).length;
  const recent = members.filter((member) => member.joinedOn.startsWith(month)).length;
  const expiring = members.filter((member) => {
    if (member.status !== "active" || !member.expiresOn) return false;
    const days = (Date.parse(member.expiresOn) - Date.parse(demoDate)) / 86400000;
    return days >= 0 && days <= 7;
  }).length;
  const current = monthlyIncome[11].cents;
  const previous = monthlyIncome[10].cents;
  const growth = ((current / previous - 1) * 100).toFixed(1);

  return [
    { label: "Clientes activos", value: String(active), detail: "En el escenario actual" },
    { label: "Ingresos del mes", value: formatMoney(current), detail: `+${growth}%` },
    { label: "Nuevas membresías", value: String(recent), detail: "Durante este mes" },
    { label: "Membresías por vencer", value: String(expiring), detail: "Próximos 7 días" },
  ];
}

export const recentActivity = [
  { id: "activity-1", title: "Nuevo cliente", detail: fullName(members[3]), ago: "Hace 8 min" },
  { id: "activity-2", title: "Venta registrada", detail: "Proteína Whey", ago: "Hace 21 min" },
  { id: "activity-3", title: "Renovación", detail: fullName(members[1]), ago: "Hace 34 min" },
  { id: "activity-4", title: "Rutina asignada", detail: fullName(members[0]), ago: "Hace 52 min" },
];

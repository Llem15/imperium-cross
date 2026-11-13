"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getApiMembershipStatus, parseApiClients } from "@/features/members/client-api-model";
import type { ApiClient } from "@/features/members/client-api-model";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

const monthLabels = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

type MembershipRow = { fechaInicio?: string; estadoMembresia?: string | null };
type Summary = {
  ingresosMensuales: { anio: number; mes: number; total: number }[];
  actividad: { titulo: string; detalle: string; fecha: string }[];
};
type MonthIncome = { month: string; amount: number };
type Metric = { label: string; value: string; detail: string; negative?: boolean };
type Activity = { id: string; title: string; detail: string; ago: string };

function formatMoney(amount: number) {
  return `S/ ${new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(amount)}`;
}

function localDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function relativeTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (iso.length <= 10 || /T00:00/.test(iso)) {
    const days = Math.round(
      (Date.parse(localDate(new Date())) - Date.parse(localDate(date))) / 86400000,
    );
    if (days <= 0) return "Hoy";
    if (days === 1) return "Ayer";
    if (days < 30) return `Hace ${days} días`;
  } else {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Ayer";
    if (days < 30) return `Hace ${days} días`;
  }
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function buildView(clients: ApiClient[], memberships: MembershipRow[], summary: Summary) {
  const now = new Date();
  const today = localDate(now);
  const month = today.slice(0, 7);

  const months: MonthIncome[] = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const row = summary.ingresosMensuales.find(
      (item) => item.anio === date.getFullYear() && item.mes === date.getMonth() + 1,
    );
    return { month: monthLabels[date.getMonth()], amount: Number(row?.total ?? 0) };
  });
  const current = months[11].amount;
  const previous = months[10].amount;
  const growth = previous > 0 ? (current / previous - 1) * 100 : null;

  const activeClients = clients.filter(
    (client) => getApiMembershipStatus(client, today).status === "active",
  );
  const expiring = activeClients.filter((client) => {
    if (!client.fechaFinMembresia) return false;
    const days = (Date.parse(client.fechaFinMembresia) - Date.parse(today)) / 86400000;
    return days >= 0 && days <= 7;
  }).length;
  const newMemberships = memberships.filter(
    (item) =>
      item.fechaInicio?.startsWith(month) && item.estadoMembresia?.toLowerCase() !== "cancelada",
  ).length;

  const metrics: Metric[] = [
    {
      label: "Clientes activos",
      value: String(activeClients.length),
      detail: `${clients.length} ${clients.length === 1 ? "cliente registrado" : "clientes registrados"}`,
    },
    {
      label: "Ingresos del mes",
      value: formatMoney(current),
      detail:
        growth === null
          ? "Mes en curso"
          : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% vs. mes anterior`,
      negative: growth !== null && growth < 0,
    },
    { label: "Nuevas membresías", value: String(newMemberships), detail: "Durante este mes" },
    { label: "Membresías por vencer", value: String(expiring), detail: "Próximos 7 días" },
  ];

  const activity: Activity[] = summary.actividad.map((item, index) => ({
    id: `activity-${index}`,
    title: item.titulo,
    detail: item.detalle,
    ago: relativeTime(item.fecha),
  }));

  return { metrics, months, activity };
}

const placeholderMetrics: Metric[] = [
  "Clientes activos",
  "Ingresos del mes",
  "Nuevas membresías",
  "Membresías por vencer",
].map((label) => ({ label, value: "—", detail: "" }));

const placeholderMonths: MonthIncome[] = Array.from({ length: 12 }, () => ({
  month: "",
  amount: 0,
}));

function IncomeChart({ months }: { months: MonthIncome[] }) {
  const max = Math.max(...months.map((item) => item.amount), 1);

  return (
    <figure
      aria-labelledby="income-chart-title"
      className="h-82.5 min-w-0 rounded-statistic border border-dashboard-line bg-white px-5 py-4.75"
    >
      <figcaption>
        <h2 id="income-chart-title">Ingresos mensuales</h2>
        <p className="mt-1.75 text-xs text-muted">Matrículas + ventas</p>
      </figcaption>
      <div
        aria-hidden="true"
        className="mt-6.25 grid h-53 grid-cols-12 items-end gap-3 max-sm:gap-1.5"
      >
        {months.map((item, index) => (
          <div key={index} className="flex h-full min-w-0 flex-col items-center justify-end gap-3">
            <div
              title={item.month ? `${item.month}: ${formatMoney(item.amount)}` : undefined}
              style={{
                height: `${item.amount > 0 ? Math.max(8, (item.amount / max) * 180) : 4}px`,
              }}
              className={`w-7 max-w-full rounded-control ${index === 11 ? "bg-status-success" : "bg-line"}`}
            />
            <span className="text-[9px] text-muted">{item.month}</span>
          </div>
        ))}
      </div>
      <div className="sr-only">
        <table>
          <caption>Ingresos por mes</caption>
          <thead>
            <tr>
              <th scope="col">Mes</th>
              <th scope="col">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {months.map((item, index) => (
              <tr key={index}>
                <th scope="row">{item.month}</th>
                <td>{formatMoney(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export function AdminDashboard() {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ ingresosMensuales: [], actividad: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const get = async (path: string): Promise<unknown> => {
          const response = await fetch(`${apiBaseUrl}${path}`, {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        };
        const [clientsBody, membershipsBody, summaryBody] = await Promise.all([
          get("/api/clientes"),
          get("/api/membresias"),
          get("/api/resumen"),
        ]);
        const parsed = (summaryBody ?? {}) as Partial<Summary>;
        setClients(parseApiClients(clientsBody));
        setMemberships(Array.isArray(membershipsBody) ? (membershipsBody as MembershipRow[]) : []);
        setSummary({
          ingresosMensuales: Array.isArray(parsed.ingresosMensuales)
            ? parsed.ingresosMensuales
            : [],
          actividad: Array.isArray(parsed.actividad) ? parsed.actividad : [],
        });
      } catch {
        if (!controller.signal.aborted) {
          setError("No se pudo cargar el resumen. Vuelve a intentarlo en unos minutos.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  const view = !loading && !error ? buildView(clients, memberships, summary) : null;
  const metrics = view?.metrics ?? placeholderMetrics;
  const months = view?.months ?? placeholderMonths;
  const activity = view?.activity ?? [];

  return (
    <section className="pt-4.25">
      <h1 className="text-base">Resumen general</h1>
      {error && (
        <p role="alert" className="mt-4 text-sm text-brand-start">
          {error}
        </p>
      )}
      <div className="mt-12 grid grid-cols-4 gap-3.5 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex min-h-29.5 justify-between gap-2 rounded-statistic border border-dashboard-line bg-white p-4.5"
          >
            <div>
              <h2 className="text-sm text-muted">{metric.label}</h2>
              <p className="mt-2.5 text-2xl">{metric.value}</p>
              <p
                className={`mt-2.5 text-xs ${metric.negative ? "text-brand-start" : "text-status-success"}`}
              >
                {metric.detail}
              </p>
            </div>
            <span className="relative mt-0.5 size-8 shrink-0">
              <Image src="/dashboard/metric-circle.svg" alt="" width={32} height={32} />
              <span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center text-sm text-status-success"
              >
                ↗
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4.5 grid grid-cols-[741fr_340fr] gap-4.5 max-xl:grid-cols-1">
        <IncomeChart months={months} />
        <section
          aria-labelledby="recent-activity-title"
          className="min-h-82.5 rounded-statistic border border-dashboard-line bg-white px-5 py-4.75"
        >
          <h2 id="recent-activity-title">Actividad reciente</h2>
          {activity.length === 0 ? (
            <p className="mt-6.75 text-sm text-muted">
              {loading ? "Cargando actividad…" : "Sin actividad reciente."}
            </p>
          ) : (
            <ul className="mt-6.75 flex flex-col gap-7.5">
              {activity.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px]">{item.title}</p>
                    <p className="mt-1.25 text-xs text-muted">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted">{item.ago}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

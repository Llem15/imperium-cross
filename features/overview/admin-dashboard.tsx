import Image from "next/image";
import { formatMoney, monthlyIncome, overviewMetrics, recentActivity } from "@/mocks/overview";

function IncomeChart() {
  const max = Math.max(...monthlyIncome.map((item) => item.cents));

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
        {monthlyIncome.map((item, index) => (
          <div
            key={item.month}
            className="flex h-full min-w-0 flex-col items-center justify-end gap-3"
          >
            <div
              title={`${item.month}: ${formatMoney(item.cents)}`}
              style={{ height: `${(item.cents / max) * 180}px` }}
              className={`w-7 max-w-full rounded-control ${index === 11 ? "bg-status-success" : "bg-line"}`}
            />
            <span className="text-[9px] text-muted">{item.month}</span>
          </div>
        ))}
      </div>
      <div className="sr-only">
        <table>
          <caption>Ingresos de ejemplo por mes, año 2026</caption>
          <thead>
            <tr>
              <th scope="col">Mes</th>
              <th scope="col">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {monthlyIncome.map((item) => (
              <tr key={item.month}>
                <th scope="row">{item.month}</th>
                <td>{formatMoney(item.cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export function AdminDashboard() {
  return (
    <section className="pt-4.25">
      <h1 className="text-base">Resumen general</h1>
      <div className="mt-12 grid grid-cols-4 gap-3.5 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {overviewMetrics().map((metric) => (
          <div
            key={metric.label}
            className="flex min-h-29.5 justify-between gap-2 rounded-statistic border border-dashboard-line bg-white p-4.5"
          >
            <div>
              <h2 className="text-sm text-muted">{metric.label}</h2>
              <p className="mt-2.5 text-2xl">{metric.value}</p>
              <p className="mt-2.5 text-xs text-status-success">{metric.detail}</p>
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
        <IncomeChart />
        <section
          aria-labelledby="recent-activity-title"
          className="min-h-82.5 rounded-statistic border border-dashboard-line bg-white px-5 py-4.75"
        >
          <h2 id="recent-activity-title">Actividad reciente</h2>
          <ul className="mt-6.75 flex flex-col gap-7.5">
            {recentActivity.map((activity) => (
              <li key={activity.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px]">{activity.title}</p>
                  <p className="mt-1.25 text-xs text-muted">{activity.detail}</p>
                </div>
                <span className="shrink-0 text-[10px] text-muted">{activity.ago}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

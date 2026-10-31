"use client";

import { useState } from "react";
import { SearchField, StatusBadge } from "@/components/dashboard/dashboard-ui";
import {
  Button,
  DataTable,
  Details,
  ManagementPanel,
  Notice,
} from "@/components/dashboard/management-ui";
import { useDemoData } from "@/features/demo/demo-provider";
import { demoDate, fullName, matchesMember } from "@/mocks/dashboard";
import { membershipStatus, newDemoId } from "@/mocks/internal-data";

export function AttendancePage() {
  const { data, setData } = useDemoData();
  const [date, setDate] = useState(demoDate);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [memberId, setMemberId] = useState("");
  const [notice, setNotice] = useState("");
  const member = data.members.find((item) => item.id === memberId);
  const results = data.members.filter(
    (item) =>
      matchesMember(item, query) ||
      item.dni.includes(query.trim()) ||
      item.attendanceCode === query.trim(),
  );
  const duplicate = data.attendance.some(
    (entry) => entry.memberId === memberId && entry.date === demoDate,
  );
  return (
    <>
      <ManagementPanel
        title="Asistencia"
        subtitle="Registro de ingreso al gimnasio"
        actions={
          <>
            <label className="text-sm">
              Fecha
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="ml-3 rounded-control border border-muted p-2"
              />
            </label>
            <Button
              small
              onClick={() => {
                setOpen(true);
                setQuery("");
                setMemberId("");
              }}
            >
              + Marcar asistencia
            </Button>
          </>
        }
      >
        {notice && <Notice>{notice}</Notice>}
        <DataTable
          rows={data.attendance.filter((entry) => !date || entry.date === date)}
          caption="Registro de asistencias"
          columns={[
            {
              label: "Nombre",
              render: (row) =>
                data.members.find((item) => item.id === row.memberId)?.firstName ?? "—",
            },
            {
              label: "Apellidos",
              render: (row) =>
                data.members.find((item) => item.id === row.memberId)?.lastName ?? "—",
            },
            {
              label: "Membresía",
              render: (row) =>
                data.plans.find(
                  (plan) =>
                    plan.id === data.members.find((item) => item.id === row.memberId)?.planId,
                )?.name ?? "—",
            },
            { label: "Fecha", render: (row) => row.date },
            { label: "Hora", render: (row) => row.time },
            {
              label: "Estado",
              render: () => <StatusBadge status="active" label="Ingreso registrado" />,
            },
          ]}
        />
      </ManagementPanel>
      {open && (
        <Details title="Marcar asistencia" onClose={() => setOpen(false)}>
          <p className="mb-5 text-sm text-line">
            Registro de ingreso al gimnasio · fecha de prueba: {demoDate}
          </p>
          <SearchField
            value={query}
            onChange={(value) => {
              setQuery(value);
              setMemberId("");
            }}
            label="Buscar por nombre, DNI o código"
          />
          {!member && (
            <ul className="mt-4 max-h-44 overflow-auto">
              {results.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setMemberId(item.id)}
                    className="w-full cursor-pointer border-b border-dashboard-line p-3 text-left text-sm hover:bg-brand-surface"
                  >
                    {fullName(item)} · {item.dni}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {results.length === 0 && (
            <p role="status" className="my-5 text-sm">
              No se encontraron clientes.
            </p>
          )}
          {member && (
            <>
              <div className="my-5 space-y-3 rounded-media bg-dashboard-canvas p-4 text-sm">
                <h3 className="font-bold">Información del socio</h3>
                <p>Cliente: {fullName(member)}</p>
                <p>DNI: {member.dni}</p>
                <p>
                  Estado: <StatusBadge status={membershipStatus(member)} />
                </p>
                <p>Plan: {data.plans.find((plan) => plan.id === member.planId)?.name}</p>
                <p>Vencimiento: {member.expiresOn}</p>
              </div>
              <Notice>
                {duplicate
                  ? "Este socio ya tiene un ingreso registrado para la fecha de prueba."
                  : membershipStatus(member) === "active"
                    ? "Membresía vigente. Puede continuar con el registro de ingreso."
                    : membershipStatus(member) === "pending"
                      ? "Pago pendiente. La asistencia no puede confirmarse."
                      : "Membresía vencida. Renueva la membresía antes de registrar el ingreso."}
              </Notice>
            </>
          )}
          <Button
            className="mt-5 w-full"
            disabled={!member || membershipStatus(member) !== "active" || duplicate}
            onClick={() => {
              if (!member) return;
              const now = new Date();
              setData((current) => ({
                ...current,
                attendance: [
                  ...current.attendance,
                  {
                    id: newDemoId("attendance"),
                    memberId: member.id,
                    date: demoDate,
                    time: now.toLocaleTimeString("es-PE", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    }),
                  },
                ],
              }));
              setDate(demoDate);
              setOpen(false);
              setNotice(`Asistencia de prueba registrada para ${fullName(member)}.`);
            }}
          >
            Confirmar asistencia
          </Button>
        </Details>
      )}
    </>
  );
}

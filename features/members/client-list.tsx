"use client";

import Image from "next/image";
import { useState } from "react";
import {
  DashboardPanel,
  RoutineBadge,
  SearchField,
  StatusBadge,
} from "@/components/dashboard/dashboard-ui";
import { Dialog } from "@/components/ui/dialog";
import {
  demoDate,
  demoTrainerId,
  fullName,
  matchesMember,
  members,
  planLabels,
} from "@/mocks/dashboard";
import type { DemoMember } from "@/mocks/dashboard";
import { latestNote, routines } from "@/mocks/training";

function lastFollowUp(memberId: string) {
  const note = latestNote(memberId);
  if (!note) return "—";
  const days = (Date.parse(demoDate) - Date.parse(note.date)) / 86400000;
  return days === 0 ? "Hoy" : `Hace ${days} días`;
}

function MemberDetail({ member }: { member: DemoMember }) {
  const routine = routines.find((item) => item.id === member.routineId);
  const note = latestNote(member.id);

  return (
    <div className="flex min-h-[433px] flex-col items-center justify-center gap-2.5 pt-8 text-center">
      {member.portrait && (
        <Image
          src={`/dashboard/${member.portrait}`}
          alt=""
          width={181}
          height={181}
          className="rounded-full"
        />
      )}
      <h2
        id="member-detail-title"
        data-dialog-heading
        tabIndex={-1}
        className="text-xl font-bold focus:outline-none"
      >
        {fullName(member)}
      </h2>
      <RoutineBadge>{routine?.name ?? "Sin asignar"}</RoutineBadge>
      <dl className="flex flex-col gap-2.5">
        <div>
          <dt className="text-sm text-muted">Último seguimiento</dt>
          <dd className="mt-1.25">
            {note ? note.date.split("-").reverse().join("/") : "Sin seguimiento"}
          </dd>
        </div>
        <div>
          <dt className="mb-1.25 text-sm text-muted">Estado</dt>
          <dd>
            <StatusBadge status={member.status} />
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Objetivo</dt>
          <dd className="mt-1.25">{member.objective}</dd>
        </div>
      </dl>
    </div>
  );
}

export function ClientList({ mode }: { mode: "reception" | "trainer" }) {
  const [query, setQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<DemoMember | null>(null);
  const isTrainer = mode === "trainer";
  const available = isTrainer
    ? members.filter((member) => member.trainerId === demoTrainerId)
    : members;
  const filtered = available.filter((member) => matchesMember(member, query));
  const title = isTrainer ? "Mis clientes" : "Clientes";
  const columnWidths = isTrainer ? [141, 150, 252, 223, 219] : [141, 150, 180, 104, 139, 268];
  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);

  return (
    <>
      <DashboardPanel className="min-h-[583px]">
        <div className="flex items-center justify-between gap-6 max-md:flex-col max-md:items-start">
          <div>
            <h1 className="text-base">{title}</h1>
            <p className="mt-1.25 text-sm text-line">
              {isTrainer ? `Tienes ${available.length} clientes asignados` : "Registro de clientes"}
            </p>
          </div>
          <SearchField value={query} onChange={setQuery} />
        </div>
        <div
          role="region"
          aria-label={`Tabla de ${title.toLowerCase()}`}
          tabIndex={0}
          className="mt-18.75 max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-brand-start max-md:mt-10"
        >
          <table className="w-full min-w-[985px] table-fixed border-collapse text-left">
            <caption className="sr-only">
              {title}: {filtered.length} resultados
            </caption>
            <colgroup>
              {columnWidths.map((width, index) => (
                <col key={index} style={{ width: `${(width / totalWidth) * 100}%` }} />
              ))}
            </colgroup>
            <thead className="border-b border-line">
              <tr>
                <th scope="col" className="pb-1 font-normal">
                  Nombres
                </th>
                <th scope="col" className="pb-1 font-normal">
                  Apellidos
                </th>
                <th scope="col" className="pb-1 font-normal">
                  {isTrainer ? "Rutina actual" : "Correo"}
                </th>
                <th scope="col" className="pb-1 font-normal">
                  {isTrainer ? "Último seguimiento" : "Plan"}
                </th>
                {!isTrainer && (
                  <th scope="col" className="pb-1 font-normal">
                    Estado
                  </th>
                )}
                <th scope="col" className="pb-1 font-normal">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => {
                const routine = routines.find((item) => item.id === member.routineId);
                return (
                  <tr key={member.id} className="h-11.75 text-sm">
                    <td className="pr-4">{member.firstName}</td>
                    <td className="pr-4">{member.lastName}</td>
                    <td className="pr-4">
                      {isTrainer ? (routine?.name ?? "Sin asignar") : member.email}
                    </td>
                    <td className="pr-4">
                      {isTrainer ? lastFollowUp(member.id) : planLabels[member.planId]}
                    </td>
                    {!isTrainer && (
                      <td className="pr-4">
                        <StatusBadge status={member.status} />
                      </td>
                    )}
                    <td>
                      <div className="flex gap-3.75">
                        <button
                          type="button"
                          aria-label={`Ver a ${fullName(member)}`}
                          aria-haspopup="dialog"
                          onClick={() => setSelectedMember(member)}
                          className="flex h-9.75 w-10.75 cursor-pointer items-center justify-center rounded-control border-[1.5px] border-status-info hover:bg-status-info-surface"
                        >
                          <Image src="/dashboard/view.svg" alt="" width={17} height={10} />
                        </button>
                        {!isTrainer && (
                          <button
                            type="button"
                            disabled
                            aria-label={`Editar a ${fullName(member)}, disponible en una próxima entrega`}
                            title="Edición disponible en una próxima entrega"
                            className="flex size-9.75 items-center justify-center rounded-control border-[1.5px] border-status-pending opacity-50"
                          >
                            <Image src="/dashboard/edit.svg" alt="" width={20} height={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={isTrainer ? 5 : 6}
                    className="py-12 text-center text-sm text-muted"
                    role="status"
                  >
                    No se encontraron clientes para tu búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardPanel>
      <Dialog
        open={selectedMember !== null}
        onClose={() => setSelectedMember(null)}
        labelledBy="member-detail-title"
      >
        {selectedMember && <MemberDetail member={selectedMember} />}
      </Dialog>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

export const STAFF_PHOTO_EVENT = "staff-photo-updated";

type StaffRow = { idUsuario: number; nombres: string; apellidos: string; tieneFoto: boolean };

export function useStaffPhoto(fullName: string): string | null {
  const [photo, setPhoto] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((current) => current + 1);
    window.addEventListener(STAFF_PHOTO_EVENT, refresh);
    return () => window.removeEventListener(STAFF_PHOTO_EVENT, refresh);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/usuarios`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const rows: unknown = await response.json();
        if (!Array.isArray(rows)) return;
        const person = (rows as StaffRow[]).find(
          (row) => `${row.nombres} ${row.apellidos}` === fullName && row.tieneFoto,
        );
        setPhoto(person ? `${apiBaseUrl}/api/usuarios/${person.idUsuario}/foto?v=${tick}` : null);
      } catch {}
    }
    void load();
    return () => controller.abort();
  }, [fullName, tick]);

  return photo;
}

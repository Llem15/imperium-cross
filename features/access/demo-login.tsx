"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { DemoRole } from "@/mocks/dashboard";
import { demoProfiles } from "@/mocks/dashboard";

export function DemoLogin() {
  const [role, setRole] = useState<DemoRole>("member");
  const profile = demoProfiles.find((item) => item.id === role) ?? demoProfiles[3];

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-16">
      <div className="relative w-full max-w-[441px]">
        <section
          aria-labelledby="login-title"
          className="rounded-media border border-line bg-white p-15 max-sm:px-6 max-sm:py-10"
        >
          <Image
            src="/landing/logo-header.png"
            alt="Imperium Cross"
            width={120}
            height={120}
            className="mx-auto"
            preload
          />
          <h1 id="login-title" className="text-center text-2xl font-bold">
            Imperium Cross
          </h1>
          <p className="mt-2.5 text-center text-sm text-muted">Bienvenido(a)</p>
          <div className="mt-11.25">
            <label htmlFor="demo-profile" className="block font-bold">
              Usuario
            </label>
            <select
              id="demo-profile"
              aria-describedby="demo-access-description"
              value={role}
              onChange={(event) => setRole(event.target.value as DemoRole)}
              className="mt-2.5 min-h-10 w-full rounded-control border border-muted bg-white px-3.75 py-2.5 text-sm text-muted focus:outline-2 focus:outline-brand-start"
            >
              {demoProfiles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <div className="mt-5">
              <p id="password-preview-label" className="font-bold">
                Contraseña
              </p>
              <div
                role="img"
                aria-label="Contraseña de ejemplo, no se requiere contraseña para acceder"
                className="mt-2.5 flex min-h-10 items-center justify-between rounded-control border border-muted px-3.75 py-2.5 text-caption text-muted"
              >
                <span aria-hidden="true">●●●●●●●●●●</span>
                <Image src="/dashboard/password-hidden.svg" alt="" width={20} height={20} />
              </div>
            </div>
            <p
              aria-disabled="true"
              title="La recuperación de contraseña queda fuera de esta entrega"
              className="mt-3.75 text-right text-caption font-medium text-brand-end"
            >
              ¿Olvidaste tu contraseña?
            </p>
            <Link
              href={profile.href}
              className="mt-10 flex min-h-11.25 w-full items-center justify-center rounded-media
                bg-linear-to-r/srgb from-brand-start to-brand-end p-2.5 font-bold text-white hover:brightness-95"
            >
              Iniciar sesión
            </Link>
          </div>
        </section>
        <p
          id="demo-access-description"
          className="absolute top-full mt-3 w-full text-center text-caption text-muted"
        >
          Acceso de demostración. Elige un perfil; no necesitas contraseña.
        </p>
      </div>
    </main>
  );
}

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { demoAccounts, demoPassword, demoProfiles } from "@/mocks/dashboard";

export function DemoLogin() {
  const router = useRouter();
  const usernameRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function enterDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = username.trim().toLowerCase();
    const account = demoAccounts.find(
      (item) => item.username === normalized || item.email === normalized,
    );
    if (!account || password !== demoPassword) {
      setError(
        "El usuario o la contraseña de prueba no coinciden. Consulta las cuentas de demostración.",
      );
      usernameRef.current?.focus();
      return;
    }
    const profile = demoProfiles.find((item) => item.id === account.role);
    if (profile) router.push(profile.href);
  }

  const inputClasses =
    "mt-2.5 min-h-10 w-full rounded-control border border-muted bg-white px-3.75 py-2.5 text-sm focus:outline-2 focus:outline-brand-start";

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-[441px]">
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
          <form
            onSubmit={enterDemo}
            className="mt-11.25"
            aria-describedby="demo-access-description"
          >
            <label htmlFor="demo-username" className="block font-bold">
              Usuario
            </label>
            <input
              id="demo-username"
              ref={usernameRef}
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError("");
              }}
              placeholder="melani.cliente"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-error" : undefined}
              className={inputClasses}
            />
            <label htmlFor="demo-password" className="mt-5 block font-bold">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="demo-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                autoComplete="off"
                placeholder="Contraseña de prueba"
                required
                className={`${inputClasses} pr-12`}
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-4 right-2 flex size-8 cursor-pointer items-center justify-center rounded-control"
              >
                <Image src="/dashboard/password-hidden.svg" alt="" width={20} height={20} />
              </button>
            </div>
            {error && (
              <p id="login-error" role="alert" className="mt-3 text-caption text-brand-start">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="mt-10 flex min-h-11.25 w-full cursor-pointer items-center justify-center rounded-media bg-linear-to-r/srgb from-brand-start to-brand-end p-2.5 font-bold text-white hover:brightness-95"
            >
              Iniciar sesión
            </button>
          </form>
        </section>
        <div id="demo-access-description" className="mt-3 text-caption text-muted">
          <p className="text-center">Prototipo frontend: utiliza únicamente cuentas ficticias.</p>
          <details className="mt-2 rounded-control border border-dashboard-line bg-white p-3">
            <summary className="cursor-pointer font-semibold">Cuentas de demostración</summary>
            <ul className="mt-3 space-y-2">
              {demoAccounts.map((account) => (
                <li key={account.username}>
                  <span className="font-semibold">
                    {demoProfiles.find((profile) => profile.id === account.role)?.label}:
                  </span>{" "}
                  <code>{account.username}</code>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Contraseña de prueba para todas: <code>{demoPassword}</code>
            </p>
          </details>
        </div>
      </div>
    </main>
  );
}

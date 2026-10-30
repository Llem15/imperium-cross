"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { demoProfiles } from "@/mocks/dashboard";
import { Dialog } from "@/components/ui/dialog";

type Profile = (typeof demoProfiles)[number];

function Sidebar({ profile, onNavigate }: { profile: Profile; onNavigate?: () => void }) {
  return (
    <>
      <Link
        href="/login"
        aria-label="Imperium Cross, elegir perfil"
        onClick={onNavigate}
        className="mx-auto mt-5.25 block w-25"
      >
        <Image src="/landing/logo-footer.png" alt="Imperium Cross" width={100} height={100} />
      </Link>
      <nav
        aria-label={`Navegación de ${profile.label}`}
        className="mt-11.5 mr-5.25 ml-7 flex flex-col gap-5"
      >
        {profile.navigation.map((item) => {
          const content = (
            <>
              <span aria-hidden="true" className="shrink-0">
                ▣
              </span>
              <span className="whitespace-nowrap">{item.label}</span>
            </>
          );
          const base = "flex h-11 items-center gap-2.5 rounded-lg px-2.5 py-3.75 text-sm";

          return item.href ? (
            <Link
              key={item.label}
              href={item.href}
              aria-current="page"
              onClick={onNavigate}
              className={`${base} bg-linear-to-r/srgb from-brand-start to-brand-end text-white`}
            >
              {content}
            </Link>
          ) : (
            <span
              key={item.label}
              aria-disabled="true"
              title="Disponible en una próxima entrega"
              className={`${base} cursor-default text-white/65`}
            >
              {content}
            </span>
          );
        })}
      </nav>
    </>
  );
}

function ProfileMenu({ profile }: { profile: Profile }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  function closeOnEscape(event: KeyboardEvent<HTMLDetailsElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeMenu();
    detailsRef.current?.querySelector("summary")?.focus();
  }

  return (
    <details ref={detailsRef} onKeyDown={closeOnEscape} className="relative min-w-0">
      <summary
        aria-label={`Cambiar perfil de demostración. Perfil actual: ${profile.label}`}
        className="flex cursor-pointer list-none items-center gap-3.75 rounded-control [&::-webkit-details-marker]:hidden"
      >
        <Image
          src={`/dashboard/${profile.avatar}`}
          alt=""
          width={50}
          height={50}
          className="shrink-0 rounded-full max-sm:size-10"
        />
        <span className="min-w-0 text-sm">
          <span className="block truncate">{profile.name}</span>
          <span className="block text-xs text-line">{profile.subtitle}</span>
        </span>
        <span aria-hidden="true" className="rotate-90 text-line">
          ›
        </span>
      </summary>
      <nav
        aria-label="Perfiles de demostración"
        className="absolute top-full right-0 z-20 mt-3 w-60 max-w-[calc(100vw-32px)] rounded-media
          border border-line bg-white p-3 text-sm shadow-lg"
      >
        <p className="px-3 py-2 text-xs text-muted">Perfil de demostración</p>
        {demoProfiles.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={closeMenu}
            className="block rounded-control px-3 py-2.5 hover:bg-brand-surface"
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/login"
          onClick={closeMenu}
          className="mt-2 block border-t border-dashboard-line px-3 py-2.5 text-brand-start"
        >
          Volver al acceso
        </Link>
      </nav>
    </details>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const profile = demoProfiles.find((item) => pathname === item.href) ?? demoProfiles[0];
  const [navigationOpen, setNavigationOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    function closeOnDesktop() {
      if (desktop.matches) setNavigationOpen(false);
    }
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <div className="min-h-dvh bg-dashboard-canvas lg:pl-sidebar">
      <a
        href="#dashboard-content"
        className="fixed top-2 left-2 z-50 -translate-y-[180%] bg-white p-3 focus:translate-y-0"
      >
        Saltar al contenido
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-sidebar overflow-y-auto bg-ink text-white lg:block">
        <Sidebar profile={profile} />
      </aside>
      <header
        data-ui="dashboard-header"
        className="flex h-dashboard-header items-center justify-end gap-14.5 bg-white px-[55px]
          max-lg:h-22 max-lg:justify-between max-lg:gap-4 max-lg:px-6 max-sm:px-4"
      >
        <button
          type="button"
          aria-label="Abrir navegación"
          aria-haspopup="dialog"
          aria-expanded={navigationOpen}
          onClick={() => setNavigationOpen(true)}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control
            border border-dashboard-line text-2xl lg:hidden"
        >
          <span aria-hidden="true">☰</span>
        </button>
        <span
          aria-hidden="true"
          className="flex size-12.5 shrink-0 items-center justify-center rounded-full border border-[#d9d9d9] max-lg:ml-auto max-sm:hidden"
        >
          <Image src="/dashboard/bell.svg" alt="" width={21} height={22} />
        </span>
        <ProfileMenu profile={profile} />
      </header>
      <main
        id="dashboard-content"
        className="min-w-0 pt-[29px] pr-[52px] pb-12 pl-[53px] max-xl:px-8 max-lg:px-6 max-sm:px-4"
      >
        {children}
      </main>
      <Dialog
        open={navigationOpen}
        onClose={() => setNavigationOpen(false)}
        labelledBy="navigation-title"
        drawer
      >
        <h2 id="navigation-title" data-dialog-heading tabIndex={-1} className="sr-only">
          Navegación de {profile.label}
        </h2>
        <Sidebar profile={profile} onNavigate={() => setNavigationOpen(false)} />
      </Dialog>
    </div>
  );
}

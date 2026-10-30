"use client";

import { useRef } from "react";
import { navigation } from "./landing-content";

export function MobileNavigation() {
  const menuRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    if (menuRef.current) menuRef.current.open = false;
  }

  function handleEscape(event: React.KeyboardEvent<HTMLDetailsElement>) {
    if (event.key !== "Escape" || !menuRef.current?.open) return;

    event.preventDefault();
    closeMenu();
    menuRef.current.querySelector("summary")?.focus();
  }

  return (
    <details
      data-ui="mobile-navigation"
      ref={menuRef}
      onKeyDown={handleEscape}
      className="relative hidden max-lg:block"
    >
      <summary className="cursor-pointer p-3 font-bold">Menú</summary>
      <nav
        aria-label="Navegación móvil"
        className="absolute right-0 z-20 flex w-55 flex-col gap-4
          rounded-media border border-line bg-white p-4"
      >
        {navigation.map(([label, id]) => (
          <a key={id} href={`#${id}`} onClick={closeMenu}>
            {label}
          </a>
        ))}
        <a href="#contacto" onClick={closeMenu}>
          Contáctanos
        </a>
      </nav>
    </details>
  );
}

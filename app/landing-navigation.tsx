"use client";

import { useRef } from "react";
import { navigation } from "./landing-content";

export function MobileNavigation() {
  const menuRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    if (menuRef.current) menuRef.current.open = false;
  }

  return (
    <details
      className="mobile-navigation"
      ref={menuRef}
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuRef.current?.open) {
          event.preventDefault();
          closeMenu();
          menuRef.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary>Menú</summary>
      <nav aria-label="Navegación móvil">
        {navigation.map(([label, id]) => (
          <a key={id} href={`#${id}`} onClick={closeMenu}>
            {label}
          </a>
        ))}
        <a href="#contacto" onClick={closeMenu}>Contáctanos</a>
      </nav>
    </details>
  );
}

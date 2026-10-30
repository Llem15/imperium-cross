import Image from "next/image";
import { ContactDetails, SocialLinks } from "./landing-contact";
import { navigation } from "./landing-content";
import { MobileNavigation } from "./landing-navigation";
import { LandingAction } from "./landing-ui";

export function LandingHeader() {
  return (
    <header id="inicio" data-ui="landing-header" className="h-[130px] bg-white max-lg:h-25">
      <div
        data-ui="landing-header-inner"
        className="mx-auto flex h-full max-w-header items-center justify-between max-wide:px-6"
      >
        <a href="#inicio" aria-label="Imperium Cross, inicio" className="wide:mt-2 wide:self-start">
          <Image
            src="/landing/logo-header.png"
            alt="Imperium Cross"
            width={109}
            height={109}
            className="max-lg:size-21"
            preload
          />
        </a>
        <nav
          aria-label="Navegación principal"
          data-ui="desktop-navigation"
          className="flex items-center gap-10 font-bold max-wide:gap-6 max-lg:hidden
            wide:-mr-7 wide:translate-y-[6.5px]"
        >
          {navigation.map(([label, id], index) => (
            <a
              key={id}
              href={`#${id}`}
              className={index === navigation.length - 1 ? "mr-6.5" : undefined}
            >
              {label}
            </a>
          ))}
          <LandingAction href="#contacto" size="header">
            Contáctanos
          </LandingAction>
        </nav>
        <MobileNavigation />
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer
      data-ui="landing-footer"
      className="mt-[226px] bg-ink px-6 pt-[65px] pb-[49px] text-white
        max-md:mt-22 max-md:px-5 max-md:py-10"
    >
      <div
        data-ui="footer-inner"
        className="mx-auto flex max-w-footer gap-36 max-wide:justify-center max-wide:gap-12.5
          max-lg:flex-col max-lg:items-center max-lg:gap-7.5"
      >
        <div className="flex w-43 shrink-0 flex-col items-center pt-5 text-center max-lg:pt-0">
          <Image src="/landing/logo-footer.png" alt="Imperium Cross" width={155} height={155} />
          <p>Entrena. Avanza. Supera tus límites.</p>
        </div>
        <div className="max-md:w-full">
          <div
            data-ui="footer-details"
            className="grid grid-cols-[150px_150px_246px] gap-15 p-5 text-center
              max-wide:grid-cols-[140px_140px_minmax(150px,246px)] max-wide:gap-6
              max-lg:gap-7.5 max-md:grid-cols-1 max-md:gap-8"
          >
            <ContactDetails footer />
          </div>
          <SocialLinks />
        </div>
      </div>
      <p className="mt-[61px] text-center max-md:mt-10 max-md:text-sm">
        © 2026 IMPERIUM CROSS. Todos los derechos reservados.
      </p>
    </footer>
  );
}

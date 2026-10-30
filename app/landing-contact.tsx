import Image from "next/image";
import { gym, mapsEmbedUrl, socialNetworks } from "./landing-content";
import { LandingSection } from "./landing-ui";

export function ContactDetails({ footer = false }: { footer?: boolean }) {
  const headingClasses = footer ? "mb-3.75 text-xl font-bold" : "mb-2.5 font-bold";
  const email = { label: "Correo", value: gym.email, href: `mailto:${gym.email}` };
  const whatsapp = {
    label: "WhatsApp",
    value: gym.phone,
    href: gym.whatsappUrl,
    external: true,
  };
  const phone = { label: "Teléfono", value: gym.phone, href: `tel:${gym.phoneNumber}` };
  const contacts = footer ? [whatsapp, email, phone] : [email, whatsapp, phone];

  return (
    <>
      <div>
        <h3 className={headingClasses}>{footer ? "Ubicación" : "Encuéntranos"}</h3>
        <p>{gym.address}</p>
        {!footer && (
          <a
            href={gym.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block font-bold text-brand-start underline underline-offset-3"
          >
            Cómo llegar
            <span className="sr-only"> (abre Google Maps en otra pestaña)</span>
          </a>
        )}
      </div>
      <div>
        <h3 className={headingClasses}>{footer ? "Horario" : "Horarios"}</h3>
        <p>
          {footer ? "Lun - Vie" : "Lunes a Viernes"}
          <br />
          6:00 am - 10:00 pm
        </p>
        <p className="mt-2.5">
          Sábado
          <br />
          7:00 am - 6:00 pm
        </p>
      </div>
      <div>
        <h3 className={headingClasses}>Contacto</h3>
        {contacts.map((contact, index) => {
          const opensNewTab = "external" in contact && contact.external;

          return (
            <p key={contact.label} className={index > 0 ? "mt-2.5" : undefined}>
              {contact.label}
              <br />
              <a
                href={contact.href}
                target={opensNewTab ? "_blank" : undefined}
                rel={opensNewTab ? "noopener noreferrer" : undefined}
                className="wrap-anywhere"
              >
                {contact.value}
              </a>
            </p>
          );
        })}
      </div>
    </>
  );
}

export function LocationMap() {
  return (
    <div
      data-ui="contact-map"
      className="relative overflow-hidden rounded-r-panel max-md:h-110 max-md:rounded-panel"
    >
      <iframe
        src={mapsEmbedUrl}
        title={`Ubicación de ${gym.name}: ${gym.address}`}
        width={604}
        height={639}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block h-full w-full border-0"
        allowFullScreen
      />
    </div>
  );
}

export function ContactSection() {
  return (
    <LandingSection
      id="contacto"
      headingId="contact-title"
      title="CONTÁCTANOS"
      width="wide"
      className="mt-50"
    >
      <div
        data-ui="contact-grid"
        className="mt-25 grid grid-cols-[457fr_604fr] gap-[29px]
          max-md:mt-10 max-md:grid-cols-1 max-md:gap-5"
      >
        <div
          data-ui="contact-details"
          className="min-h-[639px] rounded-l-panel border border-line px-10.5 py-18
            max-lg:px-6 max-lg:py-15 max-md:min-h-0
            max-md:rounded-panel max-md:py-10 [&>div+div]:mt-12.5"
        >
          <ContactDetails />
        </div>
        <LocationMap />
      </div>
    </LandingSection>
  );
}

type SocialIconProps = {
  icon: (typeof socialNetworks)[number]["icon"];
};

function SocialIcon({ icon }: SocialIconProps) {
  if (icon === "facebook") {
    return <Image src="/landing/social-facebook.svg" alt="" width={65} height={65} />;
  }

  const glyphWidth = icon === "tiktok" ? 24 : 26.25;
  const glyphHeight = icon === "tiktok" ? 28 : 26.25;

  return (
    <span className="relative inline-block size-social">
      <Image src="/landing/social-circle.svg" alt="" width={65} height={65} />
      <Image
        src={`/landing/social-${icon}.svg`}
        alt=""
        width={glyphWidth}
        height={glyphHeight}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      />
    </span>
  );
}

export function SocialLinks() {
  return (
    <>
      <ul
        data-ui="footer-socials"
        aria-label="Redes sociales de referencia"
        className="mt-3.75 flex justify-center gap-15 max-md:mt-8 max-md:gap-7.5"
      >
        {socialNetworks.map((network) => (
          <li key={network.icon}>
            {network.url ? (
              <a
                href={network.url}
                aria-label={`${network.name} (abre en otra pestaña)`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full hover:opacity-85"
              >
                <SocialIcon icon={network.icon} />
              </a>
            ) : (
              <span
                role="img"
                aria-label={`${network.name}: enlace pendiente`}
                title={`${network.name}: enlace pendiente`}
                className="inline-block"
              >
                <SocialIcon icon={network.icon} />
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-xs text-footer-muted">
        Facebook e Instagram: enlaces pendientes.
      </p>
    </>
  );
}

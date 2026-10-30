import Image from "next/image";
import { gym, mapsEmbedUrl, socialNetworks } from "./landing-content";

export function ContactDetails({ footer = false }: { footer?: boolean }) {
  const email = (
    <p>Correo<br /><a href={`mailto:${gym.email}`}>{gym.email}</a></p>
  );
  const whatsapp = (
    <p>WhatsApp<br /><a href={gym.whatsappUrl} target="_blank" rel="noopener noreferrer">{gym.phone}</a></p>
  );

  return (
    <>
      <div>
        <h3>{footer ? "Ubicación" : "Encuéntranos"}</h3>
        <p>{gym.address}</p>
        {!footer && <a className="contact-directions" href={gym.mapsUrl} target="_blank" rel="noopener noreferrer">Cómo llegar<span className="sr-only"> (abre Google Maps en otra pestaña)</span></a>}
      </div>
      <div>
        <h3>{footer ? "Horario" : "Horarios"}</h3>
        <p>{footer ? "Lun - Vie" : "Lunes a Viernes"}<br />6:00 am - 10:00 pm</p>
        <p>Sábado<br />7:00 am - 6:00 pm</p>
      </div>
      <div>
        <h3>Contacto</h3>
        {footer ? <>{whatsapp}{email}</> : <>{email}{whatsapp}</>}
        <p>Teléfono<br /><a href={`tel:${gym.phoneNumber}`}>{gym.phone}</a></p>
      </div>
    </>
  );
}

export function LocationMap() {
  return (
    <div className="contact-map">
      <iframe
        src={mapsEmbedUrl}
        title={`Ubicación de ${gym.name}: ${gym.address}`}
        width={604}
        height={639}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}

function SocialIcon({ icon }: { icon: (typeof socialNetworks)[number]["icon"] }) {
  if (icon === "facebook") {
    return <Image src="/landing/social-facebook.svg" alt="" width={65} height={65} />;
  }

  return (
    <span className={`social-icon social-${icon}`}>
      <Image src="/landing/social-circle.svg" alt="" width={65} height={65} />
      <Image
        className="social-glyph"
        src={`/landing/social-${icon}.svg`}
        alt=""
        width={icon === "tiktok" ? 24 : 26.25}
        height={icon === "tiktok" ? 28 : 26.25}
      />
    </span>
  );
}

export function SocialLinks() {
  return (
    <>
      <ul className="footer-socials" aria-label="Redes sociales de referencia">
        {socialNetworks.map((network) => (
          <li key={network.icon}>
            {network.url ? (
              <a href={network.url} aria-label={`${network.name} (abre en otra pestaña)`} target="_blank" rel="noopener noreferrer"><SocialIcon icon={network.icon} /></a>
            ) : (
              <span className="social-pending" role="img" aria-label={`${network.name}: enlace pendiente`} title={`${network.name}: enlace pendiente`}><SocialIcon icon={network.icon} /></span>
            )}
          </li>
        ))}
      </ul>
      <p className="social-status">Facebook e Instagram: enlaces pendientes.</p>
    </>
  );
}

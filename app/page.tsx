import Image from "next/image";
import type { CSSProperties } from "react";
import { benefits, coaches, facilities, navigation, testimonials } from "./landing-content";
import { ContactDetails, LocationMap, SocialLinks } from "./landing-contact";
import { MobileNavigation } from "./landing-navigation";
import { PlanRegistration } from "./inscripcion/registration-dialog";

function Photo({ name, alt = "", cropStyle, preload = false }: {
  name: string;
  alt?: string;
  cropStyle?: Pick<CSSProperties, "width" | "height" | "left" | "top">;
  preload?: boolean;
}) {
  return (
    <div className="photo-frame" style={cropStyle}>
      <Image src={`/landing/${name}.png`} alt={alt} fill sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 1440px" preload={preload} />
    </div>
  );
}

function PlanLink({ outline = false }: { outline?: boolean }) {
  return <a className={outline ? "landing-button landing-button-outline" : "landing-button"} href={outline ? "#nosotros" : "#planes"}>{outline ? "Conócenos" : "Ver planes"}</a>;
}

export default function Home() {
  return (
    <>
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <header className="landing-header" id="inicio">
        <div className="landing-header-inner">
          <a href="#inicio" aria-label="Imperium Cross, inicio"><Image src="/landing/logo-header.png" alt="Imperium Cross" width={109} height={109} preload /></a>
          <nav aria-label="Navegación principal" className="desktop-navigation">
            {navigation.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}
            <a className="landing-button" href="#contacto">Contáctanos</a>
          </nav>
          <MobileNavigation />
        </div>
      </header>
      <main id="contenido">
        <section className="landing-hero" aria-labelledby="hero-title">
          <Photo name="hero" preload cropStyle={{ width: "123.11%", height: "117.81%", left: "-10.97%", top: "-17.84%" }} />
          <div className="photo-shade" />
          <div className="hero-content">
            <h1 id="hero-title">TRANSFORMA TU RUTINA,<br />SUPERA TUS LÍMITES</h1>
            <p>Entrena, diviértete y mejora</p>
            <div className="hero-actions"><PlanLink /><PlanLink outline /></div>
          </div>
        </section>

        <section className="benefits-section landing-section" id="nosotros" aria-labelledby="benefits-title">
          <div className="section-heading"><h2 id="benefits-title">¿POR QUÉ NOSOTROS?</h2><p>Nuestros 4 beneficios</p></div>
          <div className="benefits-grid">
            {benefits.map((benefit) => <article key={benefit.title}>
              <div className="benefit-photo"><Photo name={benefit.image} cropStyle={benefit.image === "benefit-coaches" ? { width: "156.1%", height: "103.3%", left: "-25.68%", top: "-0.13%" } : undefined} /></div>
              <h3>{benefit.title}</h3><p>{benefit.description}</p>
            </article>)}
          </div>
        </section>

        <section className="plans-section landing-section" id="planes" aria-labelledby="plans-title">
          <h2 id="plans-title">NUESTROS PLANES</h2>
          <PlanRegistration />
        </section>

        <section className="facilities-section landing-section" aria-labelledby="facilities-title">
          <h2 id="facilities-title">INSTALACIONES</h2>
          <div className="facilities-grid">
            {facilities.map((facility, index) => <figure key={facility.title} className="facility-card">
              <Photo name={facility.image} cropStyle={index > 0 ? { width: "324.72%", height: "100%", left: `${[0, -162.36, -39.66, -168.01][index]}%` } : undefined} />
              <figcaption>{facility.title}</figcaption>
            </figure>)}
          </div>
        </section>

        <section className="coaches-section landing-section" id="entrenadores" aria-labelledby="coaches-title">
          <h2 id="coaches-title">ENTRENADORES</h2>
          <div className="coaches-grid">
            {coaches.map((coach, index) => <article key={coach.name} className="coach-card">
              <div className="coach-photo"><Photo name={coach.image} cropStyle={{ width: `${[155.12, 152.67, 160.27][index]}%`, height: `${[197.55, 194.44, 204.11][index]}%`, left: `${[-27.68, -26.47, -30.28][index]}%`, top: `${[0.11, -0.12, -4.66][index]}%` }} /></div>
              <h3>{coach.name}</h3><p>{coach.specialty}</p>
            </article>)}
          </div>
        </section>

        <section className="testimonials-section landing-section" id="testimonios" aria-labelledby="testimonials-title">
          <h2 id="testimonials-title">TESTIMONIOS</h2>
          <div className="testimonials-grid">
            {testimonials.map((testimonial) => <figure className="testimonial-card" key={testimonial.name}>
              <figcaption><Image src={`/landing/${testimonial.image}.png`} alt="" width={35} height={35} /><div><h3>{testimonial.name}</h3><time dateTime={testimonial.datetime}>{testimonial.date}</time></div></figcaption>
              <p className="testimonial-stars" aria-label="5 de 5 estrellas">★★★★★</p><blockquote>“{testimonial.quote}”</blockquote>
            </figure>)}
          </div>
        </section>

        <section className="contact-section landing-section" id="contacto" aria-labelledby="contact-title">
          <h2 id="contact-title">CONTÁCTANOS</h2>
          <p className="contact-demo-note">Proyecto de demostración. Datos de contacto de prueba.</p>
          <div className="contact-grid"><div className="contact-details"><ContactDetails /></div><LocationMap /></div>
        </section>

        <section className="landing-cta" aria-labelledby="cta-title">
          <Photo name="cta" /><div className="photo-shade" />
          <div className="cta-content"><h2 id="cta-title">TU PRÓXIMO ENTRENAMIENTO COMIENZA AQUÍ</h2><p>Únete a Imperium Cross y comienza a entrenar con un plan adaptado a ti.</p><PlanLink /></div>
        </section>
      </main>
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand"><Image src="/landing/logo-footer.png" alt="Imperium Cross" width={155} height={155} /><p>Entrena. Avanza. Supera tus límites.</p></div>
          <div className="footer-information"><div className="footer-details"><ContactDetails footer /></div>
            <SocialLinks />
          </div>
        </div>
        <p className="footer-copyright">© 2026 IMPERIUM CROSS. Todos los derechos reservados.</p>
      </footer>
    </>
  );
}

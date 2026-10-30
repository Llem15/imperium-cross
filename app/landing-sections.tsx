import Image from "next/image";
import { benefits, coaches, facilities, heroCrop, testimonials } from "./landing-content";
import { LandingAction, LandingSection, Photo } from "./landing-ui";

export function LandingHero() {
  return (
    <section
      data-ui="landing-hero"
      aria-labelledby="hero-title"
      className="relative flex h-[1000px] items-center justify-center overflow-hidden
        text-center text-white max-md:h-[620px]"
    >
      <Photo name="hero" crop={heroCrop} preload />
      <div className="absolute inset-0 bg-ink/30" />
      <div
        data-ui="hero-content"
        className="relative w-[min(564px,calc(100%-40px))] wide:-translate-y-1.5"
      >
        <h1 id="hero-title" className="text-4xl font-bold max-md:text-[clamp(25px,6vw,36px)]">
          TRANSFORMA TU RUTINA,
          <br />
          SUPERA TUS LÍMITES
        </h1>
        <p className="mt-2.5 text-xl">Entrena, diviértete y mejora</p>
        <div className="mt-[37px] flex justify-center gap-[49px] max-md:flex-wrap max-md:gap-4">
          <LandingAction href="#planes">Ver planes</LandingAction>
          <LandingAction href="#nosotros" outline>
            Conócenos
          </LandingAction>
        </div>
      </div>
    </section>
  );
}

export function BenefitsSection() {
  return (
    <LandingSection
      id="nosotros"
      headingId="benefits-title"
      title="¿POR QUÉ NOSOTROS?"
      subtitle="Nuestros 4 beneficios"
      width="benefits"
      className="mt-[206px]"
    >
      <div
        data-ui="benefits-grid"
        className="mt-[86px] grid grid-cols-4 gap-10 max-lg:grid-cols-2
          max-md:mt-10 max-md:gap-x-5 max-md:gap-y-8"
      >
        {benefits.map((benefit) => (
          <article key={benefit.title} className="text-center">
            <div
              data-ui="benefit-photo"
              className="relative h-[193px] overflow-hidden rounded-media
                max-md:aspect-[244/193] max-md:h-auto"
            >
              <Photo name={benefit.image} crop={benefit.crop} />
            </div>
            <h3 className="mt-7.5 text-xl font-bold max-md:mt-5 max-md:text-lg">{benefit.title}</h3>
            <p className="mt-3.75">{benefit.description}</p>
          </article>
        ))}
      </div>
    </LandingSection>
  );
}

export function FacilitiesSection() {
  return (
    <LandingSection headingId="facilities-title" title="INSTALACIONES" className="mt-[211px]">
      <div
        data-ui="facilities-grid"
        className="mt-21 grid grid-cols-4 gap-[33px] max-lg:grid-cols-2
          max-md:mt-10 max-md:gap-5"
      >
        {facilities.map((facility) => (
          <figure
            data-ui="facility-card"
            key={facility.title}
            className="relative flex h-110 items-end justify-center overflow-hidden
              rounded-card px-4 pb-[27px] max-md:h-82.5 max-md:px-2"
          >
            <Photo name={facility.image} crop={facility.crop} />
            <figcaption className="relative text-center text-2xl font-bold text-white max-md:text-lg">
              {facility.title}
            </figcaption>
          </figure>
        ))}
      </div>
    </LandingSection>
  );
}

export function CoachesSection() {
  return (
    <LandingSection
      id="entrenadores"
      headingId="coaches-title"
      title="ENTRENADORES"
      className="mt-[251px]"
    >
      <div
        data-ui="coaches-grid"
        className="mx-auto mt-[99px] grid max-w-coaches grid-cols-3 gap-12.5
          max-lg:gap-5 max-md:mt-10 max-md:max-w-mobile-cards max-md:grid-cols-1 max-md:gap-7"
      >
        {coaches.map((coach) => (
          <article
            data-ui="coach-card"
            key={coach.name}
            className="flex flex-col items-center overflow-hidden rounded-card border border-line pb-7.5"
          >
            <div
              data-ui="coach-photo"
              className="relative h-[265px] w-full overflow-hidden max-lg:h-[230px]
                max-md:aspect-[270/265] max-md:h-auto"
            >
              <Photo name={coach.image} crop={coach.crop} />
            </div>
            <h3 className="mt-5 text-center text-2xl font-bold max-lg:text-xl max-md:text-2xl">
              {coach.name}
            </h3>
            <p className="mt-3.75 rounded-card border border-brand-end px-5.5 py-1.25 text-brand-end">
              {coach.specialty}
            </p>
          </article>
        ))}
      </div>
    </LandingSection>
  );
}

export function TestimonialsSection() {
  return (
    <LandingSection
      id="testimonios"
      headingId="testimonials-title"
      title="TESTIMONIOS"
      width="wide"
      className="mt-[194px]"
    >
      <div
        data-ui="testimonials-grid"
        className="mt-27 grid grid-cols-3 items-center gap-12.5 max-lg:gap-5
          max-md:mt-10 max-md:max-w-mobile-cards max-md:grid-cols-1 max-md:gap-7"
      >
        {testimonials.map((testimonial) => (
          <figure
            data-ui="testimonial-card"
            key={testimonial.name}
            className="min-h-[213px] rounded-media border border-line px-5 py-7.5"
          >
            <figcaption className="flex items-start gap-2.5">
              <Image
                src={`/landing/${testimonial.image}.png`}
                alt=""
                width={35}
                height={35}
                className="rounded-[50%]"
              />
              <div>
                <h3 className="text-base font-bold">{testimonial.name}</h3>
                <time dateTime={testimonial.datetime} className="text-sm">
                  {testimonial.date}
                </time>
              </div>
            </figcaption>
            <p className="mt-2.5 font-bold text-rating" aria-label="5 de 5 estrellas">
              ★★★★★
            </p>
            <blockquote className="mt-2.5 italic">“{testimonial.quote}”</blockquote>
          </figure>
        ))}
      </div>
    </LandingSection>
  );
}

export function LandingCallToAction() {
  return (
    <section
      data-ui="landing-cta"
      aria-labelledby="cta-title"
      className="relative mx-auto mt-37 flex h-[424px] max-w-wide items-center
        justify-center overflow-hidden rounded-panel text-center text-white
        max-wide:mx-6 max-md:mx-5 max-md:mt-16"
    >
      <Photo name="cta" />
      <div className="absolute inset-0 bg-ink/30" />
      <div className="relative w-[min(427px,calc(100%-40px))]">
        <h2 id="cta-title" className="text-2xl font-bold">
          TU PRÓXIMO ENTRENAMIENTO COMIENZA AQUÍ
        </h2>
        <p className="mt-3.75">
          Únete a Imperium Cross y comienza a entrenar con un plan adaptado a ti.
        </p>
        <LandingAction href="#planes" className="mt-8.75">
          Ver planes
        </LandingAction>
      </div>
    </section>
  );
}

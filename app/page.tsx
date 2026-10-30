import { PlanRegistration } from "./inscripcion/registration-dialog";
import { ContactSection } from "./landing-contact";
import {
  BenefitsSection,
  CoachesSection,
  FacilitiesSection,
  LandingCallToAction,
  LandingHero,
  TestimonialsSection,
} from "./landing-sections";
import { LandingFooter, LandingHeader } from "./landing-shell";
import { LandingSection } from "./landing-ui";

export default function Home() {
  return (
    <>
      <a
        href="#contenido"
        className="fixed top-2 left-2 z-50 translate-y-[-180%] bg-white p-3 focus:translate-y-0"
      >
        Saltar al contenido
      </a>
      <LandingHeader />
      <main id="contenido">
        <LandingHero />
        <BenefitsSection />
        <LandingSection
          id="planes"
          headingId="plans-title"
          title="NUESTROS PLANES"
          className="mt-52.5"
        >
          <PlanRegistration />
        </LandingSection>
        <FacilitiesSection />
        <CoachesSection />
        <TestimonialsSection />
        <ContactSection />
        <LandingCallToAction />
      </main>
      <LandingFooter />
    </>
  );
}

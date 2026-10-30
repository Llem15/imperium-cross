// Proyecto de demostración: estos contactos no constituyen datos comerciales validados.
export const gym = {
  name: "Imperium Cross",
  address: "Prol. 28 de Julio 581, Lurigancho-Chosica, Lima, Perú.",
  coordinates: { latitude: -11.9391165, longitude: -76.6966084 },
  mapsUrl: "https://www.google.com/maps/place/Imperium+Cross/@-11.9391262,-76.6967129,21z/data=!4m6!3m5!1s0x9105ef7cf975a43d:0xf85589cc23010665!8m2!3d-11.9391165!4d-76.6966084!16s%2Fg%2F11f01txz3r",
  phone: "+51 907 100 926",
  phoneNumber: "+51907100926",
  email: "impermiumcross@hotmail.com",
  whatsappUrl: "https://wa.me/51907100926",
} as const;

const mapQuery = new URLSearchParams({
  q: `${gym.coordinates.latitude},${gym.coordinates.longitude}`,
  z: "17",
  hl: "es",
  output: "embed",
});

export const mapsEmbedUrl = `https://www.google.com/maps?${mapQuery}`;

export const socialNetworks = [
  { name: "Facebook", icon: "facebook", url: null },
  { name: "TikTok", icon: "tiktok", url: "https://www.tiktok.com/@imperium.cross" },
  { name: "Instagram", icon: "instagram", url: null },
] as const;

export const navigation = [
  ["Inicio", "inicio"],
  ["Nosotros", "nosotros"],
  ["Planes", "planes"],
  ["Entrenadores", "entrenadores"],
  ["Testimonios", "testimonios"],
] as const;

export function getPlanContactUrl(planName: (typeof plans)[number]["name"]) {
  const message = `Hola, quisiera información sobre el Plan ${planName}. Consulta desde un proyecto de demostración; no es una contratación.`;
  return `${gym.whatsappUrl}?text=${encodeURIComponent(message)}`;
}

export const benefits = [
  { title: "Equipamiento", description: "Máquinas y espacios preparados para diferentes tipos de entrenamiento.", image: "benefit-equipment" },
  { title: "Entrenadores", description: "Acompañamiento para mejorar tu entrenamiento.", image: "benefit-coaches" },
  { title: "Horarios flexibles", description: "Entrena en horarios que se adapten a tu rutina.", image: "benefit-hours" },
  { title: "Seguimiento", description: "Consulta tus rutinas y revisa tu progreso desde tu propia cuenta.", image: "benefit-progress" },
] as const;

export const plans = [
  { name: "Básico", price: "39.99", features: ["Acceso al gimnasio", "Consulta de rutinas", "Seguimiento de entrenamiento"] },
  { name: "Premium", price: "69.99", features: ["Acceso al gimnasio.", "Rutinas personalizadas", "Seguimiento de progreso", "10% de descuento en nuestros productos", "Calculadora nutricional"] },
  { name: "Pro", price: "99.99", features: ["Acceso al gimnasio.", "Rutinas personalizadas", "Seguimiento de progreso", "25% de descuento en nuestros productos", "Camiseta exclusiva + Estacionamiento free", "Calculadora nutricional"] },
] as const;

export const facilities = [
  { title: "Herramientas", image: "facility-equipment" },
  { title: "Zona de batidos", image: "facility-shakes" },
  { title: "Productos", image: "facility-products" },
  { title: "Zona de entrenamiento", image: "facility-training" },
] as const;

export const coaches = [
  { name: "Pedro Huarcaya", specialty: "CrossFit", image: "coach-pedro" },
  { name: "Lia Parado", specialty: "Cardio", image: "coach-lia" },
  { name: "Luis Rosales", specialty: "Fuerza", image: "coach-luis" },
] as const;

export const testimonials = [
  { name: "Alejandro Puga", date: "20 Julio 2026", datetime: "2026-07-20", image: "avatar-alejandro", quote: "El seguimiento de mis entrenamientos me ayudó a mantener una rutina constante." },
  { name: "Carlos Morce", date: "02 Agosto 2026", datetime: "2026-08-02", image: "avatar-carlos", quote: "Contar con un control claro de mis avances marcó la diferencia para no rendirme y volver el ejercicio un hábito." },
  { name: "Marta Porras", date: "17 Agosto 2026", datetime: "2026-08-17", image: "avatar-marta", quote: "Tener a alguien evaluando mi progreso día a día me dio la motivación que necesitaba para ser constante." },
] as const;

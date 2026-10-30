import type { CSSProperties } from "react";

export type PhotoCrop = Pick<CSSProperties, "width" | "height" | "left" | "top">;

type PhotoContent = {
  image: string;
  crop?: PhotoCrop;
};

type Benefit = PhotoContent & {
  title: string;
  description: string;
};

type Facility = PhotoContent & {
  title: string;
};

type Coach = PhotoContent & {
  name: string;
  specialty: string;
};

// Proyecto de demostración: estos contactos no constituyen datos comerciales validados.
export const gym = {
  name: "Imperium Cross",
  address: "Prol. 28 de Julio 581, Lurigancho-Chosica, Lima, Perú.",
  coordinates: {
    latitude: -11.9391165,
    longitude: -76.6966084,
  },
  mapsUrl: [
    "https://www.google.com/maps/place/Imperium+Cross/",
    "@-11.9391262,-76.6967129,21z/data=!4m6!3m5!",
    "1s0x9105ef7cf975a43d:0xf85589cc23010665!8m2!3d-11.9391165!",
    "4d-76.6966084!16s%2Fg%2F11f01txz3r",
  ].join(""),
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

export const heroCrop: PhotoCrop = {
  width: "123.11%",
  height: "117.81%",
  left: "-10.97%",
  top: "-17.84%",
};

export const benefits: readonly Benefit[] = [
  {
    title: "Equipamiento",
    description: "Máquinas y espacios preparados para diferentes tipos de entrenamiento.",
    image: "benefit-equipment",
  },
  {
    title: "Entrenadores",
    description: "Acompañamiento para mejorar tu entrenamiento.",
    image: "benefit-coaches",
    crop: { width: "156.1%", height: "103.3%", left: "-25.68%", top: "-0.13%" },
  },
  {
    title: "Horarios flexibles",
    description: "Entrena en horarios que se adapten a tu rutina.",
    image: "benefit-hours",
  },
  {
    title: "Seguimiento",
    description: "Consulta tus rutinas y revisa tu progreso desde tu propia cuenta.",
    image: "benefit-progress",
  },
];

export const plans = [
  {
    id: "basico",
    name: "Básico",
    price: "39.99",
    features: ["Acceso al gimnasio", "Consulta de rutinas", "Seguimiento de entrenamiento"],
  },
  {
    id: "premium",
    name: "Premium",
    price: "69.99",
    features: [
      "Acceso al gimnasio.",
      "Rutinas personalizadas",
      "Seguimiento de progreso",
      "10% de descuento en nuestros productos",
      "Calculadora nutricional",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "99.99",
    features: [
      "Acceso al gimnasio.",
      "Rutinas personalizadas",
      "Seguimiento de progreso",
      "25% de descuento en nuestros productos",
      "Camiseta exclusiva + Estacionamiento free",
      "Calculadora nutricional",
    ],
  },
] as const;

const facilityCrop = { width: "324.72%", height: "100%" };

export const facilities: readonly Facility[] = [
  { title: "Herramientas", image: "facility-equipment" },
  {
    title: "Zona de batidos",
    image: "facility-shakes",
    crop: { ...facilityCrop, left: "-162.36%" },
  },
  {
    title: "Productos",
    image: "facility-products",
    crop: { ...facilityCrop, left: "-39.66%" },
  },
  {
    title: "Zona de entrenamiento",
    image: "facility-training",
    crop: { ...facilityCrop, left: "-168.01%" },
  },
];

export const coaches: readonly Coach[] = [
  {
    name: "Pedro Huarcaya",
    specialty: "CrossFit",
    image: "coach-pedro",
    crop: { width: "155.12%", height: "197.55%", left: "-27.68%", top: "0.11%" },
  },
  {
    name: "Lia Parado",
    specialty: "Cardio",
    image: "coach-lia",
    crop: { width: "152.67%", height: "194.44%", left: "-26.47%", top: "-0.12%" },
  },
  {
    name: "Luis Rosales",
    specialty: "Fuerza",
    image: "coach-luis",
    crop: { width: "160.27%", height: "204.11%", left: "-30.28%", top: "-4.66%" },
  },
];

export const testimonials = [
  {
    name: "Alejandro Puga",
    date: "20 Julio 2026",
    datetime: "2026-07-20",
    image: "avatar-alejandro",
    quote: "El seguimiento de mis entrenamientos me ayudó a mantener una rutina constante.",
  },
  {
    name: "Carlos Morce",
    date: "02 Agosto 2026",
    datetime: "2026-08-02",
    image: "avatar-carlos",
    quote: [
      "Contar con un control claro de mis avances marcó la diferencia",
      "para no rendirme y volver el ejercicio un hábito.",
    ].join(" "),
  },
  {
    name: "Marta Porras",
    date: "17 Agosto 2026",
    datetime: "2026-08-17",
    image: "avatar-marta",
    quote: [
      "Tener a alguien evaluando mi progreso día a día me dio",
      "la motivación que necesitaba para ser constante.",
    ].join(" "),
  },
] as const;

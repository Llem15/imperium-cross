import { demoMemberId } from "./dashboard";

export type Exercise = {
  id: string;
  name: string;
  image: string;
  detailImage: string;
  crop: { width: string; height: string; left: string; top: string };
  level: "Bajo" | "Medio" | "Alta";
  description: string;
  instructions: string;
};

export type Prescription = {
  id: string;
  exerciseId: string;
  sets: number;
  repetitions: number;
  restSeconds: number;
};

export const exercises: readonly Exercise[] = [
  {
    id: "exercise-bench",
    name: "Press de banca",
    image: "exercise-bench.png",
    detailImage: "exercise-bench.png",
    crop: { width: "100%", height: "113.97%", left: "0%", top: "-9.86%" },
    level: "Medio",
    description:
      "Ejercicio de empuje horizontal que trabaja principalmente el pectoral, con apoyo de tríceps y hombro anterior.",
    instructions:
      "Mantén la espalda y los pies firmes en el banco, controla el descenso de la barra y evita rebotar en el pecho.",
  },
  {
    id: "exercise-row",
    name: "Remo con barra",
    image: "exercise-row.png",
    detailImage: "exercise-row.png",
    crop: { width: "185.27%", height: "110.58%", left: "-84.98%", top: "-4.99%" },
    level: "Medio",
    description:
      "Ejercicio de tracción que trabaja la espalda y los músculos estabilizadores del tronco.",
    instructions:
      "Mantén la espalda neutra, flexiona ligeramente las rodillas y acerca la barra al abdomen con un movimiento controlado.",
  },
];

export const routines: readonly {
  id: string;
  name: string;
  prescriptions: readonly Prescription[];
}[] = [
  {
    id: "routine-upper",
    name: "Tren superior",
    // El frame muestra ocho tarjetas de dos ejercicioS
    prescriptions: Array.from({ length: 8 }, (_, index) => ({
      id: `prescription-${index + 1}`,
      exerciseId: index % 4 < 2 ? "exercise-bench" : "exercise-row",
      sets: 4,
      repetitions: 10,
      restSeconds: 60,
    })),
  },
];

export type ProgressNote = {
  id: string;
  memberId: string;
  date: string;
  text: string;
};

export const progressNotes: readonly ProgressNote[] = [
  {
    id: "note-1",
    memberId: demoMemberId,
    date: "2026-12-07",
    text: "Aumentaste 5 kg en press de banca. ¡Muy bien! Sigue así con tu rutina.",
  },
  {
    id: "note-2",
    memberId: demoMemberId,
    date: "2026-12-04",
    text: "Recomendación: mejorar la técnica de descenso y mantener los pies firmes.",
  },
  {
    id: "note-3",
    memberId: demoMemberId,
    date: "2026-12-01",
    text: "Buen control del movimiento en el remo con barra. Mantén la espalda neutra.",
  },
  {
    id: "note-4",
    memberId: demoMemberId,
    date: "2026-11-28",
    text: "Completaste todas las series con buena técnica y descansos regulares.",
  },
  {
    id: "note-5",
    memberId: demoMemberId,
    date: "2026-11-25",
    text: "Mejoró tu estabilidad durante los ejercicios de tren superior.",
  },
  {
    id: "note-6",
    memberId: demoMemberId,
    date: "2026-11-21",
    text: "Primera revisión de la rutina. Prioriza la técnica antes de aumentar la carga.",
  },
  {
    id: "note-ana",
    memberId: "member-ana",
    date: "2026-12-04",
    text: "Buena resistencia y recuperación entre series.",
  },
  {
    id: "note-mario",
    memberId: "member-mario",
    date: "2026-12-03",
    text: "Buen entrenamiento de fuerza; conserva el control de cada repetición.",
  },
];

export function latestNote(memberId: string) {
  return progressNotes.find((note) => note.memberId === memberId);
}

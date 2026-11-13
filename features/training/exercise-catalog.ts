export type ExerciseGuide = {
  name: string;
  gif: string;
  instructions: string;
};

export const exerciseGuides: Record<string, ExerciseGuide> = {
  Squat: {
    name: "Sentadilla",
    gif: "exercise-squat.gif",
    instructions:
      "Separa los pies al ancho de los hombros, baja llevando la cadera hacia atrás y mantén el pecho erguido. Empuja el suelo con los talones para subir.",
  },
  "Push Up": {
    name: "Flexiones",
    gif: "exercise-push-up.gif",
    instructions:
      "Apoya las manos un poco más abiertas que los hombros y mantén el cuerpo en línea recta. Baja el pecho hacia el suelo y empuja hasta estirar los brazos.",
  },
  Lunge: {
    name: "Zancada",
    gif: "exercise-lunge.gif",
    instructions:
      "Da un paso largo al frente y baja hasta que ambas rodillas formen unos 90 grados. Empuja con el pie delantero para volver y alterna las piernas.",
  },
  Plank: {
    name: "Plancha",
    gif: "exercise-plank.gif",
    instructions:
      "Apoya antebrazos y puntas de los pies con el cuerpo alineado de cabeza a talones. Contrae abdomen y glúteos y respira sin dejar caer la cadera.",
  },
  "Bench Press": {
    name: "Press de banca",
    gif: "exercise-bench-press.gif",
    instructions:
      "Con la espalda firme en el banco y los pies apoyados, baja la barra de forma controlada hasta el pecho y empújala hasta estirar los brazos.",
  },
  Deadlift: {
    name: "Peso muerto",
    gif: "exercise-deadlift.gif",
    instructions:
      "Con la barra cerca de las piernas y la espalda recta, empuja el suelo con las piernas y extiende la cadera. Baja la barra pegada al cuerpo.",
  },
  "Pull Up": {
    name: "Dominadas",
    gif: "exercise-pull-up.gif",
    instructions:
      "Agarra la barra un poco más abierta que los hombros, tira llevando el pecho hacia ella y baja sin balancearte hasta estirar los brazos.",
  },
  "Shoulder Press": {
    name: "Press de hombros",
    gif: "exercise-shoulder-press.gif",
    instructions:
      "Con el abdomen firme, empuja las pesas por encima de la cabeza y baja hasta la altura de los hombros sin arquear la espalda.",
  },
  "Barbell Squat": {
    name: "Sentadilla con barra",
    gif: "exercise-barbell-squat.gif",
    instructions:
      "Coloca la barra sobre la parte alta de la espalda, baja con la espalda recta y las rodillas alineadas con los pies, y sube empujando con todo el pie.",
  },
  "Barbell Row": {
    name: "Remo con barra",
    gif: "exercise-barbell-row.gif",
    instructions:
      "Inclina el torso con la espalda recta, tira de la barra hacia el abdomen juntando los omóplatos y bájala de forma controlada.",
  },
  "Bulgarian Split": {
    name: "Sentadilla búlgara",
    gif: "exercise-bulgarian-split.gif",
    instructions:
      "Apoya el pie de atrás en un banco, baja con el torso erguido hasta que el muslo delantero quede paralelo al suelo y sube empujando con la pierna de adelante.",
  },
  Burpee: {
    name: "Burpee",
    gif: "exercise-burpee.gif",
    instructions:
      "Baja a una flexión, lleva los pies hacia las manos, salta con los brazos arriba y repite sin pausa manteniendo un ritmo constante.",
  },
};

export const levelFromSql: Record<string, "Bajo" | "Medio" | "Alto"> = {
  Basico: "Bajo",
  Intermedio: "Medio",
  Avanzado: "Alto",
};

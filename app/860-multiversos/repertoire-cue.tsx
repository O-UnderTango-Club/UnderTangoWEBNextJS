import type { ShowScene } from "./show-score";

type Excerpt = { title: string; file: string; entry: number };

export const REPERTOIRE: Partial<Record<ShowScene, Excerpt>> = {
  59: { title: "een vriend van Hakken uit Nederland", file: "/multiversos/repertorio-hakken.mp3", entry: 6 },
  67: { title: "Un Cuerpo Musical Electrónico", file: "/multiversos/repertorio-cuerpo.mp3", entry: 1 },
  79: { title: "trance psicomusical", file: "/multiversos/repertorio-trance.mp3", entry: 3 },
  91: { title: "Quero Ver Quem Sente de Verdade", file: "/multiversos/repertorio-quero.mp3", entry: 1 },
};

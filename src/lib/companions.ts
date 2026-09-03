/* Catálogo de astros nomeados que orbitam cada buraco negro.
   As etiquetas só surgem quando a câmera se aproxima (labelZoom). */

export type CompanionKind = "star" | "cloud" | "knot" | "cluster" | "galaxy" | "planet" | "ship";

export interface Companion {
  id: string;
  kind: CompanionKind;
  name: string;
  sub: string;
  /** semieixo maior como fração do lado menor da tela (plano orbital) */
  rFrac?: number;
  /** distância ao longo do eixo do jato, fração da tela (objetos "knot") */
  distFrac?: number;
  side?: 1 | -1;
  /** excentricidade visual da órbita */
  ecc?: number;
  /** ângulo inicial */
  th0: number;
  /** multiplicador da taxa kepleriana local */
  omScale?: number;
  /** raio base em px */
  size: number;
  /** cor do núcleo */
  col: string;
  /** cor do destaque (terminador iluminado dos planetas) */
  col2?: string;
  /** cor do brilho como "r,g,b" */
  glow: string;
  /** zoom mínimo para a etiqueta aparecer */
  labelZoom: number;
  /** desenha o fluxo de vento estelar em direção ao buraco negro */
  wind?: boolean;
}

export const COMPANIONS: Record<string, Companion[]> = {
  cygx1: [
    {
      id: "hde226868",
      kind: "star",
      name: "HDE 226868",
      sub: "supergigante azul · ~20 M☉ · doa vento estelar",
      rFrac: 0.33,
      ecc: 0,
      th0: 0.6,
      omScale: 300,
      size: 4.2,
      col: "#f0f6ff",
      glow: "147,197,253",
      labelZoom: 1.45,
      wind: true,
    },
  ],

  sgra: [
    {
      id: "s2",
      kind: "star",
      name: "S2",
      sub: "período de 16 anos · e = 0,88",
      rFrac: 0.15,
      ecc: 0.62,
      th0: 0.8,
      omScale: 1.7,
      size: 2.6,
      col: "#fff6dd",
      glow: "255,236,179",
      labelZoom: 1.5,
    },
    {
      id: "s62",
      kind: "star",
      name: "S62",
      sub: "período de 9,9 anos · órbita quase rasante",
      rFrac: 0.115,
      ecc: 0.45,
      th0: 2.6,
      omScale: 2.3,
      size: 2.2,
      col: "#ffe9c4",
      glow: "255,214,150",
      labelZoom: 1.7,
    },
    {
      id: "s0102",
      kind: "star",
      name: "S0-102",
      sub: "período de 11,5 anos",
      rFrac: 0.21,
      ecc: 0.35,
      th0: 4.4,
      omScale: 1.25,
      size: 2.2,
      col: "#f2efff",
      glow: "214,200,255",
      labelZoom: 1.4,
    },
    {
      id: "g2",
      kind: "cloud",
      name: "G2",
      sub: "nuvem de gás · periastro em 2014",
      rFrac: 0.27,
      ecc: 0.18,
      th0: 5.4,
      omScale: 0.85,
      size: 3.2,
      col: "#ffc98a",
      glow: "255,150,70",
      labelZoom: 1.35,
    },
  ],

  quasar: [
    {
      id: "blr",
      kind: "cloud",
      name: "Nuvem da RLL",
      sub: "região de linhas largas · ~10.000 km/s",
      rFrac: 0.12,
      ecc: 0.1,
      th0: 1.2,
      omScale: 1.0,
      size: 3,
      col: "#a5f3fc",
      glow: "110,231,230",
      labelZoom: 1.55,
    },
    {
      id: "nlr",
      kind: "cloud",
      name: "Nuvem da RLE",
      sub: "região de linhas estreitas · ~500 km/s",
      rFrac: 0.3,
      ecc: 0.08,
      th0: 3.5,
      omScale: 0.7,
      size: 3.4,
      col: "#bbf7d0",
      glow: "134,239,172",
      labelZoom: 1.3,
    },
    {
      id: "hotspotq",
      kind: "knot",
      name: "Hotspot do jato",
      sub: "terminal do jato · lobo de rádio",
      distFrac: 0.3,
      side: 1,
      th0: 0.9,
      size: 2.6,
      col: "#dbeafe",
      glow: "158,200,255",
      labelZoom: 1.3,
    },
  ],

  m87: [
    {
      id: "hst1",
      kind: "knot",
      name: "HST-1",
      sub: "nó do jato · ~60 pc do núcleo",
      distFrac: 0.2,
      side: 1,
      th0: 2.2,
      size: 2.8,
      col: "#e0f2fe",
      glow: "165,215,255",
      labelZoom: 1.35,
    },
    {
      id: "gc",
      kind: "cluster",
      name: "Aglomerado globular",
      sub: "M87 abriga ~12.000 deles",
      rFrac: 0.26,
      ecc: 0,
      th0: 5.0,
      omScale: 0.4,
      size: 2.4,
      col: "#fde68a",
      glow: "252,211,77",
      labelZoom: 1.25,
    },
    {
      id: "ngc4486b",
      kind: "galaxy",
      name: "NGC 4486B",
      sub: "elíptica anã · sendo canibalizada por M87",
      rFrac: 0.4,
      ecc: 0,
      th0: 1.9,
      omScale: 0.42,
      size: 3.4,
      col: "#ffe7c2",
      glow: "255,214,160",
      labelZoom: 1.2,
    },
  ],

  /* ---- Gargantua (Interestelar): 10⁸ M☉ em rotação quase máxima ---- */
  gargantua: [
    {
      id: "g-miller",
      kind: "planet",
      name: "Miller",
      sub: "1 hora aqui ≈ 7 anos na Terra",
      rFrac: 0.085,
      ecc: 0,
      th0: 2.1,
      omScale: 1,
      size: 3.4,
      col: "#3f9fd8",
      col2: "#c9ecff",
      glow: "120,200,255",
      labelZoom: 1.25,
    },
    {
      id: "g-lander",
      kind: "ship",
      name: "Lander",
      sub: "veículo de pouso · desceu a Miller",
      rFrac: 0.071,
      ecc: 0,
      th0: 1.82,
      omScale: 1.08,
      size: 2.1,
      col: "#e8f6ff",
      glow: "125,235,255",
      labelZoom: 1.75,
    },
    {
      id: "g-ranger",
      kind: "ship",
      name: "Ranger",
      sub: "módulo de descida · escolta Miller",
      rFrac: 0.099,
      ecc: 0,
      th0: 2.46,
      omScale: 0.94,
      size: 1.9,
      col: "#e8f6ff",
      glow: "125,235,255",
      labelZoom: 1.75,
    },
    {
      id: "g-endurance",
      kind: "ship",
      name: "Endurance",
      sub: "nave-mãe · estação anelar",
      rFrac: 0.148,
      ecc: 0,
      th0: 5.2,
      omScale: 0.78,
      size: 2.6,
      col: "#e8f6ff",
      glow: "125,235,255",
      labelZoom: 1.45,
    },
    {
      id: "g-mann",
      kind: "planet",
      name: "Mann",
      sub: "planeta de gelo do Dr. Mann",
      rFrac: 0.21,
      ecc: 0,
      th0: 3.9,
      omScale: 0.62,
      size: 3,
      col: "#8fb0c4",
      col2: "#f4fbff",
      glow: "200,225,240",
      labelZoom: 1.3,
    },
    {
      id: "g-edmunds",
      kind: "planet",
      name: "Edmunds",
      sub: "planeta habitável da missão Lázaro",
      rFrac: 0.33,
      ecc: 0,
      th0: 0.8,
      omScale: 0.48,
      size: 3.1,
      col: "#c98f4e",
      col2: "#ffe6b8",
      glow: "255,205,130",
      labelZoom: 1.15,
    },
  ],
};

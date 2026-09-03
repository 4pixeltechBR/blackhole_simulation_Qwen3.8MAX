/* Física e formatação — buraco negro de Schwarzschild */

export const G = 6.674e-11; // m³ kg⁻¹ s⁻²
export const C = 2.998e8; // m/s
export const M_SUN = 1.989e30; // kg
export const L_SUN = 3.828e26; // W
export const AU_KM = 1.496e8; // km
export const RS_PER_MSUN_KM = 2.953; // km por massa solar

export interface SimParams {
  mass: number; // massas solares
  accretion: number; // fração de Eddington (0..1.2)
  timeScale: number; // 0..4
  tilt: number; // inclinação da vista em graus (0 = face, 84 = bordo)
  probeR: number; // raio da sonda em unidades de rs (3..30)
  starCount: number;
  presetId: string;
  lensing: boolean;
  disk: boolean;
  jets: boolean;
  trails: boolean;
  paused: boolean;
}

export interface Telemetry {
  rsKm: number;
  rsLabel: string;
  shadowLabel: string;
  iscoLabel: string;
  tempK: number;
  tempLabel: string;
  lumLSun: number;
  lumLabel: string;
  eddPct: number;
  probeVRatio: number; // fração de c
  probePeriodS: number;
  probePeriodLabel: string;
  dilation: number; // fator τ(local)/τ(∞)
  dilationLabel: string;
}

const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻",
};

export function sup(n: number | string): string {
  return String(n).split("").map((c) => SUP[c] ?? c).join("");
}

/** 4.3e6 -> "4,30×10⁶" (pt-BR) */
export function sci(x: number, digits = 2): string {
  if (!isFinite(x) || x === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(x)));
  const m = x / Math.pow(10, e);
  const ms = m.toFixed(digits).replace(".", ",");
  if (e === 0) return ms;
  return `${ms}×10${sup(e)}`;
}

export function fmtNum(x: number, digits = 2): string {
  return x.toFixed(digits).replace(".", ",");
}

export function fmtDistance(km: number): string {
  if (km >= AU_KM * 0.8) return `${fmtNum(km / AU_KM, 2)} UA`;
  if (km >= 1e6) return `${sci(km, 2)} km`;
  return `${fmtNum(km, 0)} km`;
}

export function fmtDuration(s: number): string {
  if (s < 1) return `${fmtNum(s * 1000, 0)} ms`;
  if (s < 120) return `${fmtNum(s, 1)} s`;
  if (s < 7200) return `${fmtNum(s / 60, 1)} min`;
  if (s < 172800) return `${fmtNum(s / 3600, 1)} h`;
  if (s < 6.3e7) return `${fmtNum(s / 86400, 1)} dias`;
  return `${sci(s / 3.156e7, 2)} anos`;
}

export function computeTelemetry(p: SimParams): Telemetry {
  const rsKm = RS_PER_MSUN_KM * p.mass;
  const massKg = p.mass * M_SUN;
  const rsM = rsKm * 1000;

  // temperatura interna do disco ~ M^(-1/4) · ṁ^(1/4)
  const tempK = 2.0e7 * Math.pow(p.mass / 10, -0.25) * Math.pow(Math.max(p.accretion, 1e-4), 0.25);

  // luminosidade como fração de Eddington (η = 0,1 cancela na fração)
  const lEddW = 1.26e31 * p.mass;
  const lumW = p.accretion * lEddW;
  const lumLSun = lumW / L_SUN;

  // sonda em órbita circular a r = probeR · rs
  const rM = p.probeR * rsM;
  const vRatio = Math.sqrt(rsM / (2 * rM)); // v/c
  const period = 2 * Math.PI * Math.sqrt((rM * rM * rM) / (G * massKg));
  const dTau = Math.sqrt(Math.max(0, 1 - 1.5 / p.probeR)); // órbita circular
  const farPerLocal = dTau > 0 ? 1 / dTau : Infinity;

  return {
    rsKm,
    rsLabel: fmtDistance(rsKm),
    shadowLabel: fmtDistance(rsKm * 2.6),
    iscoLabel: fmtDistance(rsKm * 3),
    tempK,
    tempLabel: `${sci(tempK, 1)} K`,
    lumLSun,
    lumLabel: `${sci(lumLSun, 2)} L☉`,
    eddPct: p.accretion * 100,
    probeVRatio: vRatio,
    probePeriodS: period,
    probePeriodLabel: fmtDuration(period),
    dilation: dTau,
    dilationLabel:
      farPerLocal === Infinity
        ? "∞ (horizonte)"
        : `1 h → ${fmtNum(farPerLocal, farPerLocal >= 10 ? 1 : 2)} h`,
  };
}

export interface Preset {
  id: string;
  name: string;
  note: string;
  patch: Partial<SimParams>;
}

export const PRESETS: Preset[] = [
  {
    id: "cygx1",
    name: "Cygnus X-1",
    note: "buraco negro estelar · 21 M☉",
    patch: { presetId: "cygx1", mass: 21, accretion: 0.32, tilt: 58, jets: true, probeR: 6 },
  },
  {
    id: "sgra",
    name: "Sgr A*",
    note: "centro da Via Láctea · 4,3×10⁶ M☉",
    patch: { presetId: "sgra", mass: 4.3e6, accretion: 0.18, tilt: 62, jets: false, probeR: 6 },
  },
  {
    id: "quasar",
    name: "Quasar",
    note: "núcleo ativo · 2×10⁸ M☉",
    patch: { presetId: "quasar", mass: 2e8, accretion: 0.92, tilt: 52, jets: true, probeR: 8 },
  },
  {
    id: "m87",
    name: "M87*",
    note: "gigante do aglomerado de Virgem · 6,5×10⁹ M☉",
    patch: { presetId: "m87", mass: 6.5e9, accretion: 0.4, tilt: 70, jets: true, probeR: 10 },
  },
];

export function massFromSlider(v: number): number {
  return Math.pow(10, v);
}
export function sliderFromMass(m: number): number {
  return Math.log10(m);
}

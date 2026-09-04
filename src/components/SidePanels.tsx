import { fmtNum, sci, type SimParams, type Telemetry } from "../lib/astro";
import { Panel, Row } from "./ui";

const massSci = (m: number) => `${sci(m, 2)} M☉`;

export function TelemetryPanel({ t, p, fps, defaultOpen = true }: { t: Telemetry; p: SimParams; fps: number; defaultOpen?: boolean }) {
  return (
    <Panel
      title="Telemetria relativística"
      defaultOpen={defaultOpen}
      className="w-[280px] max-w-[calc(100vw-2rem)]"
      badge={
        <span className="flex items-center gap-1.5">
          <span className={`h-[6px] w-[6px] rounded-full ${p.paused ? "bg-zinc-500" : "bg-amber-400 animate-pulse-dot"}`} />
          <span className="font-num text-[9px] text-zinc-500 tabular-nums">{fps} fps</span>
        </span>
      }
    >
      <Row label="Massa" value={`${t.rsKm > 0 ? massSci(p.mass) : ""}`} />
      <Row label="Raio de Schwarzschild" value={t.rsLabel} />
      <Row label="Sombra (≈ 2,6 rs)" value={t.shadowLabel} />
      <Row label="ISCO (3 rs)" value={t.iscoLabel} />
      <Row label="Temp. interna do disco" value={t.tempLabel} tone="text-amber-200" />
      <Row label="Luminosidade" value={t.lumLabel} tone="text-amber-200" />
      <Row label="Fração de Eddington" value={`${fmtNum(t.eddPct, 1)} %`} />

      <div className="mt-3 mb-1 flex items-center gap-2">
        <span className="h-[7px] w-[7px] rounded-full bg-teal-300 shadow-[0_0_8px_rgba(94,234,212,0.8)]" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-teal-200/90 font-num">
          Sonda a {fmtNum(p.probeR, 1)} rs
        </span>
      </div>
      <Row label="Velocidade orbital" value={`${fmtNum(t.probeVRatio * 100, 1)} % c`} tone="text-teal-200" />
      <Row label="Período orbital" value={t.probePeriodLabel} tone="text-teal-200" />
      <Row label="Dilatação do tempo" value={t.dilationLabel} tone="text-teal-200" />
      <div className="mt-2 text-[9.5px] leading-relaxed text-zinc-500">
        Relógio da sonda versus relógio distante, órbita circular: dτ/dt = √(1 − 3rs/2r).
      </div>
    </Panel>
  );
}

/* ---------------- notas de física ---------------- */

const NOTES: Array<{ eq: string; txt: string }> = [
  {
    eq: "rs = 2GM / c²",
    txt: "Raio do horizonte de eventos. A sombra observada mede ≈ 2,6 rs (raio crítico de captura de fótons).",
  },
  {
    eq: "θ = ½(β + √(β² + 4θᴇ²))",
    txt: "Equação da lente gravitacional resolvida para cada estrela de fundo: o anel azul marca o raio de Einstein θᴇ.",
  },
  {
    eq: "I ∝ (1 + β·cos φ · sen i)³",
    txt: "Beaming Doppler relativístico: o lado do disco que gira em sua direção brilha mais e desloca para o azul.",
  },
  {
    eq: "v = c·√(rs / 2r)",
    txt: "Velocidade kepleriana de uma órbita circular. Na ISCO (3 rs) atinge exatamente c/2.",
  },
];

export function PhysicsPanel({ defaultOpen }: { defaultOpen: boolean }) {
  return (
    <Panel title="Física do modelo" defaultOpen={defaultOpen} className="w-[280px] max-w-[calc(100vw-2rem)]">
      <ul className="space-y-3">
        {NOTES.map((n) => (
          <li key={n.eq}>
            <div className="font-num text-[11.5px] text-amber-200/95 tracking-tight">{n.eq}</div>
            <p className="text-[10px] leading-relaxed text-zinc-500 mt-0.5">{n.txt}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ---------------- catálogo de astros em órbita ---------------- */

import { COMPANIONS } from "../lib/companions";

export function CompanionsPanel({
  presetId,
  onFocus,
  defaultOpen = true,
}: {
  presetId: string;
  onFocus: (id: string) => void;
  defaultOpen?: boolean;
}) {
  const list = COMPANIONS[presetId] || COMPANIONS[presetId === "quasar" ? "ton618" : "sgra"] || [];

  return (
    <Panel
      title="Astros em Órbita"
      defaultOpen={defaultOpen}
      className="w-[280px] max-w-[calc(100vw-2rem)]"
      badge={
        <span className="font-num text-[9px] text-amber-400/90 tracking-wider">
          {list.length} astros
        </span>
      }
    >
      <div className="text-[9.5px] text-zinc-400 mb-2 leading-relaxed">
        🔍 Os nomes surgem na tela ao <strong>aproximar com o zoom</strong>. Clique em um astro para centralizar e focar:
      </div>
      <div className="space-y-1.5 max-h-[220px] overflow-y-auto thin-scroll pr-1">
        {list.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onFocus(c.id)}
            className="w-full text-left p-2 rounded-lg border border-white/10 bg-white/[0.03] hover:border-amber-400/40 hover:bg-white/[0.07] transition-all duration-150 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.col }} />
                <span className="text-[11px] font-semibold text-zinc-200 group-hover:text-amber-200 transition-colors">
                  {c.name}
                </span>
              </div>
              <span className="font-num text-[8.5px] text-zinc-500">
                zoom ≥ {c.labelZoom.toFixed(1)}×
              </span>
            </div>
            <div className="text-[9px] text-zinc-400 mt-0.5 truncate">{c.sub}</div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

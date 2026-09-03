import { useCallback, useMemo, useRef, useState } from "react";
import SimCanvas, { type SimCanvasHandle } from "./components/SimCanvas";
import ControlPanel from "./components/ControlPanel";
import { PhysicsPanel, TelemetryPanel } from "./components/SidePanels";
import { useDrone } from "./hooks/useDrone";
import { computeTelemetry, fmtNum, type SimParams } from "./lib/astro";

const INITIAL: SimParams = {
  mass: 4.3e6,
  accretion: 0.25,
  timeScale: 1,
  tilt: 62,
  probeR: 6,
  starCount: 1800,
  lensing: true,
  disk: true,
  jets: true,
  trails: true,
  paused: false,
};

export default function App() {
  const [params, setParams] = useState<SimParams>(INITIAL);
  const [sound, setSound] = useState(false);
  const [hud, setHud] = useState({ fps: 0, zoom: 1 });
  const [isMobile] = useState(() => window.innerWidth < 1024);
  const simRef = useRef<SimCanvasHandle | null>(null);

  const patch = useCallback((p: Partial<SimParams>) => {
    setParams((prev) => ({ ...prev, ...p }));
  }, []);

  const onHud = useCallback((fps: number, zoom: number) => setHud({ fps, zoom }), []);

  const telemetry = useMemo(() => computeTelemetry(params), [params]);
  useDrone(sound, params.mass, params.accretion);

  return (
    <main className="relative h-full w-full overflow-hidden bg-void text-zinc-200">
      <SimCanvas ref={simRef} params={params} onHud={onHud} />

      {/* véu de legibilidade nas bordas */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_55%,rgba(2,3,9,0.5)_100%)]" />

      {/* ---------- cabeçalho ---------- */}
      <header className="pointer-events-none fixed left-5 top-5 md:left-8 md:top-7 z-10 max-w-[430px] animate-rise">
        <div className="hidden sm:flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
            <circle cx="13" cy="13" r="11.4" stroke="#f59e0b" strokeWidth="1.4" opacity="0.85" />
            <circle cx="13" cy="13" r="5.4" fill="#04050c" stroke="#fbbf24" strokeWidth="1.2" />
            <path d="M2.5 13h3.4M20.1 13h3.4" stroke="#f59e0b" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
          </svg>
          <span className="font-num text-[10px] tracking-[0.3em] uppercase text-amber-400/90">
            Observatório numérico · relatividade geral
          </span>
        </div>
        <h1 className="font-display font-extrabold text-[clamp(1.9rem,4.2vw,3.4rem)] leading-[1.04] tracking-tight text-zinc-50 mt-2.5">
          Horizonte<span className="text-amber-400">.</span>
        </h1>
        <p className="hidden md:block text-[12.5px] md:text-[13.5px] leading-relaxed text-zinc-400 mt-2 max-w-[380px]">
          Um buraco negro supermassivo ancora o centro de uma galáxia espiral. Ajuste a massa,
          alimente o disco de acreção e observe a luz das estrelas se curvar ao redor da sombra.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3.5 font-num text-[10px] tracking-[0.14em] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className={`h-[6px] w-[6px] rounded-full ${params.paused ? "bg-zinc-500" : "bg-amber-400 animate-pulse-dot"}`} />
            {params.paused ? "SIMULAÇÃO PAUSADA" : "INTEGRAÇÃO EM TEMPO REAL"}
          </span>
          <span className="hidden sm:inline text-zinc-600">
            arraste p/ mover · scroll p/ zoom · 2× clique recentra
          </span>
        </div>
      </header>

      {/* ---------- telemetria (direita) ---------- */}
      <div className={`fixed right-4 md:right-6 z-10 ${isMobile ? "top-[104px]" : "top-7"} animate-rise`} style={{ animationDelay: "0.12s" }}>
        <TelemetryPanel t={telemetry} p={params} fps={hud.fps} defaultOpen={!isMobile} />
      </div>

      {/* ---------- HUD da câmera ---------- */}
      <div
        className="fixed right-4 md:right-6 top-1/2 z-10 -translate-y-1/2 animate-rise"
        style={{ animationDelay: "0.16s" }}
        title="Câmera"
      >
        <div className="flex flex-col items-center gap-0.5 rounded-md border border-white/10 bg-black/50 p-1.5 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
          <button className="hud-btn" aria-label="Aproximar" title="Aproximar" onClick={() => simRef.current?.zoomBy(1.4)}>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M8 3.5v9M3.5 8h9" />
            </svg>
          </button>
          <span className="my-0.5 font-num text-[10px] tabular-nums tracking-wide text-amber-300/90">
            ×{fmtNum(hud.zoom, 1)}
          </span>
          <button className="hud-btn" aria-label="Afastar" title="Afastar" onClick={() => simRef.current?.zoomBy(1 / 1.4)}>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3.5 8h9" />
            </svg>
          </button>
          <div className="my-1 h-px w-5 bg-white/10" />
          <button
            className="hud-btn"
            aria-label="Recentralizar vista"
            title="Recentralizar (ou duplo clique)"
            onClick={() => simRef.current?.reset()}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 5.5v-3h3M13.5 5.5v-3h-3M2.5 10.5v3h3M13.5 10.5v3h-3" />
              <circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>
      </div>

      {/* ---------- controles (esquerda, abaixo) ---------- */}
      <div className="fixed left-4 md:left-6 bottom-4 md:bottom-6 z-10 animate-rise" style={{ animationDelay: "0.2s" }}>
        <ControlPanel params={params} sound={sound} onPatch={patch} onSound={setSound} defaultOpen={!isMobile} />
      </div>

      {/* ---------- física (canto inf. direito, só desktop) ---------- */}
      {!isMobile && (
        <div className="fixed right-6 bottom-6 z-10 animate-rise" style={{ animationDelay: "0.28s" }}>
          <PhysicsPanel defaultOpen={false} />
        </div>
      )}
    </main>
  );
}

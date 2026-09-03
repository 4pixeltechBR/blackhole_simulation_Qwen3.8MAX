import { useCallback, useMemo, useState } from "react";
import SimCanvas from "./components/SimCanvas";
import ControlPanel from "./components/ControlPanel";
import { PhysicsPanel, TelemetryPanel } from "./components/SidePanels";
import { useDrone } from "./hooks/useDrone";
import { computeTelemetry, type SimParams } from "./lib/astro";

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
  const [fps, setFps] = useState(0);
  const [isMobile] = useState(() => window.innerWidth < 1024);

  const patch = useCallback((p: Partial<SimParams>) => {
    setParams((prev) => ({ ...prev, ...p }));
  }, []);

  const telemetry = useMemo(() => computeTelemetry(params), [params]);
  useDrone(sound, params.mass, params.accretion);

  return (
    <main className="relative h-full w-full overflow-hidden bg-void text-zinc-200">
      <SimCanvas params={params} onFps={setFps} />

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
        <div className="flex items-center gap-4 mt-3.5 font-num text-[10px] tracking-[0.14em] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className={`h-[6px] w-[6px] rounded-full ${params.paused ? "bg-zinc-500" : "bg-amber-400 animate-pulse-dot"}`} />
            {params.paused ? "SIMULAÇÃO PAUSADA" : "INTEGRAÇÃO EM TEMPO REAL"}
          </span>
          <span className="hidden sm:inline text-zinc-600">mova o cursor · paralaxe</span>
        </div>
      </header>

      {/* ---------- telemetria (direita) ---------- */}
      <div className={`fixed right-4 md:right-6 z-10 ${isMobile ? "top-[104px]" : "top-7"} animate-rise`} style={{ animationDelay: "0.12s" }}>
        <TelemetryPanel t={telemetry} p={params} fps={fps} defaultOpen={!isMobile} />
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

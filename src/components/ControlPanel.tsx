import { PRESETS, massFromSlider, sci, sliderFromMass, type SimParams } from "../lib/astro";
import { Panel, Slider, Toggle } from "./ui";

interface Props {
  params: SimParams;
  sound: boolean;
  onPatch: (patch: Partial<SimParams>) => void;
  onSound: (v: boolean) => void;
}

export default function ControlPanel({ params, sound, onPatch, onSound, defaultOpen = true }: Props & { defaultOpen?: boolean }) {
  const logM = sliderFromMass(params.mass);
  const activePreset = PRESETS.find((p) => p.id === params.presetId)?.id;

  return (
    <Panel title="Parâmetros físicos" defaultOpen={defaultOpen} className="w-[300px] max-w-[calc(100vw-2rem)]">
      {/* presets */}
      <div className="grid grid-cols-2 gap-1.5 mb-4">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPatch(p.patch)}
            className={`text-left px-2.5 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
              activePreset === p.id
                ? "border-amber-400/60 bg-amber-400/10 shadow-[0_0_14px_-4px_rgba(245,158,11,0.5)]"
                : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
            }`}
          >
            <span className="block text-[11.5px] font-semibold text-zinc-100 leading-tight">{p.name}</span>
            <span className="block text-[9px] text-zinc-500 leading-tight mt-0.5">{p.note}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <Slider
          label="Massa do horizonte"
          min={1}
          max={10}
          step={0.01}
          value={logM}
          display={`${sci(massFromSlider(logM), 2)} M☉`}
          onChange={(v) => onPatch({ mass: massFromSlider(v) })}
        />
        <Slider
          label="Taxa de acreção (Eddington)"
          min={0}
          max={1.2}
          step={0.01}
          value={params.accretion}
          display={`${Math.round(params.accretion * 100)} %`}
          onChange={(v) => onPatch({ accretion: v })}
        />
        <Slider
          label="Fluxo do tempo"
          min={0}
          max={4}
          step={0.05}
          value={params.timeScale}
          display={`${params.timeScale.toFixed(2).replace(".", ",")}×`}
          onChange={(v) => onPatch({ timeScale: v })}
        />
        <Slider
          label="Inclinação do observador"
          min={0}
          max={84}
          step={1}
          value={params.tilt}
          display={`${params.tilt}°`}
          accent="#5eead4"
          onChange={(v) => onPatch({ tilt: v })}
        />
        <Slider
          label="Sonda · raio orbital"
          min={3}
          max={30}
          step={0.5}
          value={params.probeR}
          display={`${params.probeR.toFixed(1).replace(".", ",")} rs`}
          accent="#5eead4"
          onChange={(v) => onPatch({ probeR: v })}
        />
        <Slider
          label="Densidade estelar"
          min={500}
          max={4000}
          step={100}
          value={params.starCount}
          display={`${params.starCount}`}
          accent="#8b9dff"
          onChange={(v) => onPatch({ starCount: v })}
        />
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.07] grid grid-cols-2 gap-x-4">
        <Toggle label="Lente gravitacional" on={params.lensing} accent="#67e8f9" onChange={(v) => onPatch({ lensing: v })} />
        <Toggle label="Disco de acreção" on={params.disk} onChange={(v) => onPatch({ disk: v })} />
        <Toggle label="Jatos polares" on={params.jets} accent="#93c5fd" onChange={(v) => onPatch({ jets: v })} />
        <Toggle label="Rastros orbitais" on={params.trails} accent="#8b9dff" onChange={(v) => onPatch({ trails: v })} />
      </div>

      {/* transporte */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onPatch({ paused: !params.paused })}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] border transition-all duration-200 cursor-pointer ${
            params.paused
              ? "border-amber-400/60 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25"
              : "border-white/12 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.09] hover:text-white"
          }`}
        >
          {params.paused ? (
            <svg width="11" height="12" viewBox="0 0 11 12" fill="currentColor">
              <path d="M0.5 0.8a0.6 0.6 0 0 1 0.9-0.52l9 5.2a0.6 0.6 0 0 1 0 1.04l-9 5.2a0.6 0.6 0 0 1-0.9-0.52V0.8z" />
            </svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
              <rect x="0.5" width="3" height="12" rx="0.8" />
              <rect x="6.5" width="3" height="12" rx="0.8" />
            </svg>
          )}
          {params.paused ? "Retomar" : "Pausar"}
        </button>
        <button
          type="button"
          onClick={() => onSound(!sound)}
          aria-pressed={sound}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] border transition-all duration-200 cursor-pointer ${
            sound
              ? "border-teal-300/60 bg-teal-300/10 text-teal-200 hover:bg-teal-300/20"
              : "border-white/12 bg-white/[0.04] text-zinc-400 hover:bg-white/[0.09] hover:text-zinc-200"
          }`}
        >
          <svg width="14" height="13" viewBox="0 0 14 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 4.5h2L7 1.8v9.4L3.5 8.5h-2z" fill="currentColor" stroke="none" />
            {sound ? (
              <>
                <path d="M9.5 4.2a3.2 3.2 0 0 1 0 4.6" />
                <path d="M11.5 2.4a6 6 0 0 1 0 8.2" />
              </>
            ) : (
              <path d="M9.5 5l3.5 3.5M13 5l-3.5 3.5" />
            )}
          </svg>
          {sound ? "Som" : "Mudo"}
        </button>
      </div>
    </Panel>
  );
}

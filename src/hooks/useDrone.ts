import { useEffect, useRef } from "react";

/**
 * Drone ambiente grave (WebAudio). O tom fundamental acompanha a massa do
 * buraco negro e a abertura do filtro acompanha a acreção.
 * Reutiliza uma única instância de AudioContext para evitar vazamentos e atingir limites do navegador.
 */
export function useDrone(enabled: boolean, mass: number, accretion: number) {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const oscsRef = useRef<OscillatorNode[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (enabled && !initializedRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;

      const ctx = new Ctor();
      ctxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);

      const freq = 30 + Math.log10(Math.max(mass, 1) + 1) * 3.4;
      const specs: Array<[OscillatorType, number, number]> = [
        ["sine", 1, 0.5],
        ["triangle", 0.5, 0.22],
        ["sine", 1.498, 0.16],
        ["sine", 2.003, 0.07],
      ];

      specs.forEach(([type, ratio, vol]) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(freq * ratio, ctx.currentTime);
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, ctx.currentTime);
        o.connect(g).connect(filter);
        o.start();
        oscsRef.current.push(o);
      });

      // LFO sutil para respiração
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.07, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(120, ctx.currentTime);
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();
      oscsRef.current.push(lfo);

      filter.connect(master).connect(ctx.destination);
      gainRef.current = master;
      filterRef.current = filter;
      initializedRef.current = true;
    }

    const ctx = ctxRef.current;
    const gain = gainRef.current;
    if (!ctx || !gain) return;

    if (enabled) {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => undefined);
      }
      const targetVol = 0.045 + Math.min(accretion, 1) * 0.05;
      gain.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.35);
    } else {
      gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
    }
  }, [enabled, mass, accretion]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx || !gainRef.current || !filterRef.current || !enabled) return;

    const freq = 30 + Math.log10(Math.max(mass, 1) + 1) * 3.4;
    const ratios = [1, 0.5, 1.498, 2.003];
    oscsRef.current.slice(0, 4).forEach((o, i) => {
      o.frequency.setTargetAtTime(freq * ratios[i], ctx.currentTime, 0.25);
    });

    filterRef.current.frequency.setTargetAtTime(220 + Math.min(accretion, 1) * 620, ctx.currentTime, 0.3);
    gainRef.current.gain.setTargetAtTime(0.045 + Math.min(accretion, 1) * 0.05, ctx.currentTime, 0.3);
  }, [mass, accretion, enabled]);
}

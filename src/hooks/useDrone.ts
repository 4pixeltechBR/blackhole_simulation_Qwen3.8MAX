import { useEffect, useRef } from "react";

/**
 * Drone ambiente grave (WebAudio). O tom fundamental acompanha a massa do
 * buraco negro e a abertura do filtro acompanha a acreção.
 */
export function useDrone(enabled: boolean, mass: number, accretion: number) {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const oscsRef = useRef<OscillatorNode[]>([]);

  useEffect(() => {
    if (!enabled) {
      if (ctxRef.current) {
        const c = ctxRef.current;
        gainRef.current?.gain.setTargetAtTime(0, c.currentTime, 0.12);
        const toClose = c;
        oscsRef.current.forEach((o) => {
          try {
            o.stop(c.currentTime + 0.6);
          } catch {
            /* noop */
          }
        });
        oscsRef.current = [];
        gainRef.current = null;
        filterRef.current = null;
        ctxRef.current = null;
        window.setTimeout(() => {
          toClose.close().catch(() => undefined);
        }, 700);
      }
      return;
    }

    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 320;
    filter.Q.value = 0.8;

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
      o.frequency.value = freq * ratio;
      const g = ctx.createGain();
      g.gain.value = vol;
      o.connect(g).connect(filter);
      o.start();
      oscsRef.current.push(o);
    });

    // respiração lenta do filtro
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    oscsRef.current.push(lfo);

    filter.connect(master).connect(ctx.destination);
    gainRef.current = master;
    filterRef.current = filter;
    master.gain.setTargetAtTime(0.045 + Math.min(accretion, 1) * 0.05, ctx.currentTime, 0.8);
    ctx.resume().catch(() => undefined);

    return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx || !gainRef.current || !filterRef.current) return;
    const freq = 30 + Math.log10(Math.max(mass, 1) + 1) * 3.4;
    const ratios = [1, 0.5, 1.498, 2.003];
    oscsRef.current.slice(0, 4).forEach((o, i) => {
      o.frequency.setTargetAtTime(freq * ratios[i], ctx.currentTime, 0.25);
    });
    filterRef.current.frequency.setTargetAtTime(220 + Math.min(accretion, 1) * 620, ctx.currentTime, 0.3);
    gainRef.current.gain.setTargetAtTime(0.045 + Math.min(accretion, 1) * 0.05, ctx.currentTime, 0.4);
  }, [mass, accretion]);
}

import { useEffect, useRef } from "react";
import { Engine } from "../engine/engine";
import type { SimParams } from "../lib/astro";

interface Props {
  params: SimParams;
  onFps: (fps: number) => void;
}

export default function SimCanvas({ params, onFps }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const paramsRef = useRef(params);
  const onFpsRef = useRef(onFps);
  paramsRef.current = params;
  onFpsRef.current = onFps;

  // regenera a população estelar quando a densidade muda
  useEffect(() => {
    engineRef.current?.spawnGalaxy(params.starCount);
  }, [params.starCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const engine = new Engine((fps) => onFpsRef.current(fps));
    engineRef.current = engine;

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.resize(w, h);
    };
    fit();
    window.addEventListener("resize", fit);

    const onMove = (e: PointerEvent) => {
      engine.setPointer(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1
      );
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      engine.frame(ctx, dt, paramsRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
      window.removeEventListener("pointermove", onMove);
      engineRef.current = null;
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 block" aria-label="Simulação de buraco negro" />;
}

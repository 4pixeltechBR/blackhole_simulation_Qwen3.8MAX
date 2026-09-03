import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Engine } from "../engine/engine";
import type { SimParams } from "../lib/astro";

export interface SimCanvasHandle {
  zoomBy: (factor: number) => void;
  reset: () => void;
}

interface Props {
  params: SimParams;
  onHud: (fps: number, zoom: number) => void;
}

const SimCanvas = forwardRef<SimCanvasHandle, Props>(function SimCanvas(
  { params, onHud },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const paramsRef = useRef(params);
  const hudRef = useRef(onHud);
  const dragRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef(0);

  paramsRef.current = params;
  hudRef.current = onHud;

  useImperativeHandle(ref, () => ({
    zoomBy: (f: number) => {
      const e = engineRef.current;
      const c = canvasRef.current;
      if (e && c) e.zoomAt(c.clientWidth / 2, c.clientHeight / 2, f);
    },
    reset: () => engineRef.current?.resetView(),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const engine = new Engine((fps, zoom) => hudRef.current(fps, zoom));
    engineRef.current = engine;

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.resize(w, h);
    };
    fit();

    /* ---------- zoom com roda do mouse ---------- */
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * 0.0013);
      engine.zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
    };

    /* ---------- arrastar / pinça ---------- */
    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointersRef.current.size === 1) {
        dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        canvas.classList.add("dragging");
      } else {
        dragRef.current = null;
        const pts = [...pointersRef.current.values()];
        pinchRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();

      if (pointersRef.current.has(e.pointerId)) {
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // pinça com dois dedos
      if (pointersRef.current.size === 2) {
        const [a, b] = [...pointersRef.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchRef.current > 0 && dist > 0) {
          const mx = (a.x + b.x) / 2 - rect.left;
          const my = (a.y + b.y) / 2 - rect.top;
          engine.zoomAt(mx, my, dist / pinchRef.current);
        }
        pinchRef.current = dist;
        return;
      }

      // arrasto com clique segurando
      if (dragRef.current && dragRef.current.id === e.pointerId) {
        engine.panBy(e.clientX - dragRef.current.x, e.clientY - dragRef.current.y);
        dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        return;
      }

      // paralaxe sutil quando apenas pairando
      engine.setPointer(
        (e.clientX - rect.left) / rect.width - 0.5,
        (e.clientY - rect.top) / rect.height - 0.5
      );
    };

    const onUp = (e: PointerEvent) => {
      pointersRef.current.delete(e.pointerId);
      if (dragRef.current?.id === e.pointerId) {
        dragRef.current = null;
        canvas.classList.remove("dragging");
      }
      if (pointersRef.current.size < 2) pinchRef.current = 0;
    };

    const onDbl = () => engine.resetView();

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("dblclick", onDbl);
    window.addEventListener("resize", fit);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      engine.frame(ctx, dt, paramsRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("dblclick", onDbl);
      window.removeEventListener("resize", fit);
      engineRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full cursor-grab touch-none select-none dragging:cursor-grabbing"
    />
  );
});

export default SimCanvas;

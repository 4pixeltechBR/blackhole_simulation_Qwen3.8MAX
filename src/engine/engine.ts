import type { SimParams } from "../lib/astro";

/* ============================================================
   Motor de renderização — buraco negro no centro galáctico
   Disco de acreção com beaming Doppler, lente gravitacional
   (equação da lente θ = ½(β + √(β² + 4θE²))), jatos e sonda.
   ============================================================ */

interface BgStar {
  x: number; // posição absoluta em px (regenerada no resize)
  y: number;
  fx: number; // fração 0..1 do viewport
  fy: number;
  s: number;
  col: string;
  a: number;
  tw: number;
  ph: number;
}

interface Blob {
  fx: number;
  fy: number;
  rf: number;
  col: [number, number, number];
  al: number;
  ph: number;
}

interface GalStar {
  rf: number; // raio como fração de U
  th: number;
  s: number;
  col: string;
  a: number;
  tw: number;
  ph: number;
}

interface DiskP {
  rr: number; // raio em unidades de rs
  th: number;
  om: number; // rad/s (referência massa Sgr A*)
  s: number;
  wob: number;
}

interface JetP {
  t: number;
  side: number;
  drift: number;
  ph: number;
  sp: number;
  amp: number;
}

const TAU = Math.PI * 2;
const STAR_COLS = ["#cfe0ff", "#f5f7ff", "#ffe9c4", "#ffd9a0", "#b7c8ff", "#ffab8a"];
const GAL_COLS = ["#ffe9c4", "#f5f0ff", "#cfe0ff", "#ffd9a0", "#aebfff", "#ff9e7a"];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export class Engine {
  private w = 0;
  private h = 0;
  private U = 0;
  private cx = 0;
  private cy = 0;

  private bg: BgStar[] = [];
  private blobs: Blob[] = [];
  private gal: GalStar[] = [];
  private disk: DiskP[] = [];
  private jets: JetP[] = [];

  private tSim = 0;
  private tWall = 0;
  private probeTh = 0.9;

  private px = 0;
  private py = 0;
  private tpx = 0;
  private tpy = 0;

  // câmera: zoom + arrasto
  private zoomT = 1;
  private zoomCur = 1;
  private panTX = 0;
  private panTY = 0;
  private panCurX = 0;
  private panCurY = 0;

  private fpsFrames = 0;
  private fpsTime = 0;
  private onHud?: (fps: number, zoom: number) => void;

  private rnd = mulberry32(20260214);

  constructor(onHud?: (fps: number, zoom: number) => void) {
    this.onHud = onHud;
    this.seedBackground();
    this.seedDisk();
    this.seedJets();
    this.spawnGalaxy(1800);
  }

  /* ------------------------- população ------------------------- */

  private seedBackground() {
    const r = this.rnd;
    this.bg = [];
    for (let i = 0; i < 640; i++) {
      this.bg.push({
        x: 0,
        y: 0,
        fx: r(),
        fy: r(),
        s: 0.4 + r() * 1.3,
        col: STAR_COLS[Math.floor(r() * STAR_COLS.length)],
        a: 0.25 + r() * 0.6,
        tw: 0.6 + r() * 2.4,
        ph: r() * TAU,
      });
    }
    this.blobs = [
      { fx: 0.18, fy: 0.22, rf: 0.5, col: [56, 189, 248], al: 0.05, ph: 0.0 },
      { fx: 0.85, fy: 0.18, rf: 0.42, col: [168, 85, 247], al: 0.04, ph: 1.7 },
      { fx: 0.78, fy: 0.85, rf: 0.55, col: [245, 158, 11], al: 0.038, ph: 3.1 },
      { fx: 0.12, fy: 0.8, rf: 0.46, col: [45, 212, 191], al: 0.042, ph: 4.6 },
      { fx: 0.5, fy: 0.08, rf: 0.36, col: [190, 60, 90], al: 0.03, ph: 5.9 },
    ];
  }

  private seedDisk() {
    const r = this.rnd;
    this.disk = [];
    for (let i = 0; i < 880; i++) {
      const rr = 3 + 13 * Math.pow(r(), 1.55);
      this.disk.push({
        rr,
        th: r() * TAU,
        om: 0.85 * Math.pow(rr / 3, -1.5) * (0.85 + r() * 0.3),
        s: 0.7 + r() * 1.7,
        wob: r() * TAU,
      });
    }
  }

  private seedJets() {
    const r = this.rnd;
    this.jets = [];
    for (let i = 0; i < 150; i++) {
      this.jets.push({
        t: r(),
        side: i % 2 === 0 ? 1 : -1,
        drift: (r() - 0.5) * 2,
        ph: r() * TAU,
        sp: 0.22 + r() * 0.4,
        amp: 4 + r() * 14,
      });
    }
  }

  spawnGalaxy(n: number) {
    const r = mulberry32(90210 + n);
    this.gal = [];
    const arms = 2;
    for (let i = 0; i < n; i++) {
      const arm = i % arms;
      const t = Math.pow(r(), 0.62);
      const rf = 0.055 + 0.44 * t;
      const wind = 3.2 * Math.log(rf / 0.03);
      const th = arm * Math.PI + wind + (r() - 0.5) * (0.55 + 0.9 * t);
      const warm = r() < 1 - t * 0.75;
      this.gal.push({
        rf,
        th,
        s: 0.5 + r() * 1.25 + (warm ? 0.3 : 0),
        col: warm
          ? GAL_COLS[Math.floor(r() * 3)]
          : GAL_COLS[2 + Math.floor(r() * 4)],
        a: 0.3 + r() * 0.62,
        tw: 0.5 + r() * 2.2,
        ph: r() * TAU,
      });
    }
  }

  /* --------------------------- setup --------------------------- */

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.U = Math.min(w, h);
    this.cx = w / 2;
    this.cy = h / 2;
    for (const s of this.bg) {
      s.x = s.fx * w;
      s.y = s.fy * h;
    }
  }

  setPointer(nx: number, ny: number) {
    this.tpx = nx;
    this.tpy = ny;
  }

  /* -------------------------- câmera -------------------------- */

  /** Zoom mantendo o ponto de mundo sob (mx,my) fixo na tela */
  zoomAt(mx: number, my: number, factor: number) {
    const z0 = this.zoomT;
    const z1 = clamp(z0 * factor, 0.55, 8);
    if (Math.abs(z1 - z0) < 1e-6) return;
    const wx = (mx - this.cx - this.panTX) / z0;
    const wy = (my - this.cy - this.panTY) / z0;
    this.panTX = mx - this.cx - wx * z1;
    this.panTY = my - this.cy - wy * z1;
    this.zoomT = z1;
    this.clampPan();
  }

  /** Deslocamento em pixels de tela (arrasto 1:1 com o cursor) */
  panBy(dx: number, dy: number) {
    this.panTX += dx;
    this.panTY += dy;
    this.clampPan();
  }

  resetView() {
    this.zoomT = 1;
    this.panTX = 0;
    this.panTY = 0;
  }

  getZoom(): number {
    return this.zoomCur;
  }

  private clampPan() {
    const lim = Math.max(this.w, this.h) * 0.85 * this.zoomT;
    this.panTX = clamp(this.panTX, -lim, lim);
    this.panTY = clamp(this.panTY, -lim, lim);
  }

  private rsPx(mass: number): number {
    // escala visual: ~5 px (buraco estelar) até ~2,2% do lado menor (10¹⁰ M☉)
    return clamp(
      this.U * Math.pow(10, -2.31 + 0.0717 * Math.log10(mass)),
      4.5,
      0.022 * this.U
    );
  }

  /* --------------------------- frame --------------------------- */

  frame(ctx: CanvasRenderingContext2D, dt: number, p: SimParams) {
    if (this.w === 0) return;
    const dtw = Math.min(dt, 0.05);
    this.tWall += dtw;

    const dts = p.paused ? 0 : dtw * p.timeScale;
    this.tSim += dts;

    // easing do paralaxe
    this.px += (this.tpx - this.px) * 0.045;
    this.py += (this.tpy - this.py) * 0.045;

    // easing da câmera (zoom + arrasto)
    this.zoomCur += (this.zoomT - this.zoomCur) * 0.14;
    this.panCurX += (this.panTX - this.panCurX) * 0.22;
    this.panCurY += (this.panTY - this.panCurY) * 0.22;
    if (Math.abs(this.zoomCur - this.zoomT) < 5e-4) this.zoomCur = this.zoomT;

    const Z = this.zoomCur;
    const massN = p.mass / 4.3e6;
    const rs = this.rsPx(p.mass) * Z;
    const tilt = (p.tilt * Math.PI) / 180;
    const cosI = Math.cos(tilt);
    const sinI = Math.sin(tilt);
    const cx = this.cx + this.panCurX;
    const cy = this.cy + this.panCurY;
    const U = this.U * Z;
    const lwK = Math.pow(Z, 0.55); // espessuras de traço acompanham o zoom
    const acc = clamp(p.accretion, 0, 1.2);
    const kU3 = Math.pow(this.U / 900, 3); // ω orbital não depende do zoom

    /* --- física orbital (visual) --- */
    const gmVis = massN * 2.2e4 * kU3;
    for (const s of this.gal) {
      const r0 = s.rf * this.U; // raio sem zoom → ω constante
      const om = Math.min(1.6, Math.sqrt(gmVis / Math.max(r0 * r0 * r0, 1)));
      s.th += om * dts;
    }
    for (const d of this.disk) {
      const om = clamp(d.om * Math.sqrt(massN), 0, 3.4);
      d.th += om * dts;
    }
    const omProbe = clamp(0.85 * Math.sqrt(massN) * Math.pow(p.probeR / 3, -1.5), 0.02, 3);
    this.probeTh += omProbe * dts;

    /* ================= fundo ================= */
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#04050c";
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.globalCompositeOperation = "lighter";

    // nebulosas ambientes (deriva lenta, camada distante)
    for (const b of this.blobs) {
      const bx =
        this.cx + (b.fx * this.w - this.cx) * Z +
        Math.sin(this.tWall * 0.03 + b.ph) * U * 0.012 +
        this.panCurX * 0.3 + this.px * 16;
      const by =
        this.cy + (b.fy * this.h - this.cy) * Z +
        Math.cos(this.tWall * 0.026 + b.ph) * U * 0.012 +
        this.panCurY * 0.3 + this.py * 16;
      const br = b.rf * U;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      g.addColorStop(0, `rgba(${b.col[0]},${b.col[1]},${b.col[2]},${b.al})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(bx - br, by - br, br * 2, br * 2);
    }

    /* --- lente gravitacional: estrelas de fundo --- */
    const re = 2.4 * rs + 9 * Z; // raio de Einstein visual
    const lensOn = p.lensing;

    for (const s of this.bg) {
      const twk = 0.68 + 0.32 * Math.sin(this.tWall * s.tw + s.ph);
      // camada "no infinito": zoom pleno, arrasto reduzido (profundidade)
      let x = this.cx + (s.x - this.cx) * Z + this.panCurX * 0.3 + this.px * 10;
      let y = this.cy + (s.y - this.cy) * Z + this.panCurY * 0.3 + this.py * 10;
      let alpha = s.a * twk;
      let size = s.s * Math.pow(Z, 0.5);
      let streak = 0;

      if (lensOn) {
        const dx = x - cx;
        const dy = y - cy;
        const r0 = Math.hypot(dx, dy) || 0.001;
        if (r0 < re * 6) {
          const disc = Math.sqrt(r0 * r0 + 4 * re * re);
          const theta = 0.5 * (r0 + disc); // imagem primária
          const scale = theta / r0;
          x = cx + dx * scale;
          y = cy + dy * scale;
          const mu = clamp(1 + Math.pow(re / r0, 1.5), 1, 3.4);
          alpha *= mu;
          size *= 0.8 + mu * 0.25;
          streak = r0 < re * 2.6 ? clamp((re * re) / (r0 * r0 + re) * 1.1, 0, 6.5) : 0;

          // imagem secundária (lado oposto, tênue)
          if (r0 < re * 3.5) {
            const r2 = 0.5 * (disc - r0);
            const ux = dx / r0;
            const uy = dy / r0;
            ctx.globalAlpha = alpha * 0.2;
            ctx.fillStyle = s.col;
            ctx.beginPath();
            ctx.arc(cx - ux * r2, cy - uy * r2, size * 0.62, 0, TAU);
            ctx.fill();
          }
        }
      }

      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.fillStyle = s.col;
      if (streak > 0.4) {
        const dx = x - cx;
        const dy = y - cy;
        const rr = Math.hypot(dx, dy) || 1;
        ctx.strokeStyle = s.col;
        ctx.lineWidth = size * 0.9;
        ctx.beginPath();
        ctx.moveTo(x - (dx / rr) * streak, y - (dy / rr) * streak);
        ctx.lineTo(x + (dx / rr) * streak, y + (dy / rr) * streak);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(x, y, size * 0.62, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // anel de Einstein
    if (lensOn) {
      const g = ctx.createRadialGradient(cx, cy, re * 0.72, cx, cy, re * 1.4);
      g.addColorStop(0, "rgba(120,200,255,0)");
      g.addColorStop(0.5, "rgba(140,215,255,0.055)");
      g.addColorStop(1, "rgba(120,200,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, re * 1.4, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(165,225,255,0.16)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, re, 0, TAU);
      ctx.stroke();
    }

    /* --- nebulosidade espiral + bojo --- */
    const gOx = this.px * 5;
    const gOy = this.py * 5;
    const gcx = cx + gOx;
    const gcy = cy + gOy;

    ctx.save();
    ctx.translate(gcx, gcy);
    ctx.scale(1, Math.max(cosI, 0.16));
    for (let arm = 0; arm < 2; arm++) {
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const t = i / 64;
        const r = U * (0.075 + 0.42 * t);
        const ang = arm * Math.PI + 3.2 * Math.log(r / (U * 0.03));
        const x = Math.cos(ang) * r;
        const y = Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(140,160,255,0.024)";
      ctx.lineWidth = U * 0.036;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    // bojo central
    const bg1 = ctx.createRadialGradient(0, 0, 0, 0, 0, U * 0.2);
    bg1.addColorStop(0, "rgba(255,216,150,0.16)");
    bg1.addColorStop(0.3, "rgba(255,170,100,0.075)");
    bg1.addColorStop(0.65, "rgba(140,110,190,0.035)");
    bg1.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bg1;
    ctx.beginPath();
    ctx.arc(0, 0, U * 0.2, 0, TAU);
    ctx.fill();
    ctx.restore();

    /* --- estrelas da galáxia --- */
    for (const s of this.gal) {
      const r = s.rf * U;
      const cosT = Math.cos(s.th);
      const sinT = Math.sin(s.th);
      const x = gcx + r * cosT;
      const y = gcy + r * sinT * cosI;
      const twk = 0.62 + 0.38 * Math.sin(this.tWall * s.tw + s.ph);
      const alpha = s.a * twk;

      if (p.trails) {
        const r0t = s.rf * this.U;
        const rOm = Math.min(1.6, Math.sqrt(gmVis / Math.max(r0t * r0t * r0t, 1)));
        const dA = clamp(rOm * 0.85, 0.02, 0.5);
        ctx.globalAlpha = alpha * 0.3;
        ctx.strokeStyle = s.col;
        ctx.lineWidth = s.s * 0.7 * lwK;
        ctx.beginPath();
        ctx.ellipse(gcx, gcy, r, r * cosI, 0, s.th - dA, s.th);
        ctx.stroke();
      }

      const sz0 = s.s * Math.pow(Z, 0.45);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.col;
      if (s.s > 1.25) {
        ctx.beginPath();
        ctx.arc(x, y, sz0 * 0.62, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, sz0, sz0);
      }
    }
    ctx.globalAlpha = 1;

    /* ================= disco de acreção ================= */
    const diskScale = Math.min(1, (0.36 * U) / (16 * rs));
    const inner = 3 * rs * diskScale;
    const outer = 16 * rs * diskScale;
    const dOx = this.px * 2.5;
    const dOy = this.py * 2.5;
    const dcx = cx + dOx;
    const dcy = cy + dOy;
    const cosId = Math.max(cosI, 0.07);
    const accK = 0.2 + 0.8 * Math.min(acc, 1);

    if (p.disk) {
      // brilho base (elipse)
      ctx.save();
      ctx.translate(dcx, dcy);
      ctx.scale(1, cosId);
      const dg = ctx.createRadialGradient(0, 0, inner * 0.6, 0, 0, outer);
      dg.addColorStop(0, `rgba(255,220,160,${0.3 * accK})`);
      dg.addColorStop(0.22, `rgba(255,160,70,${0.16 * accK})`);
      dg.addColorStop(0.6, `rgba(255,100,40,${0.05 * accK})`);
      dg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(0, 0, outer, 0, TAU);
      ctx.fill();
      ctx.restore();

      // metade posterior (sin θ < 0 → acima do centro)
      this.drawDiskSide(ctx, p, dcx, dcy, cosId, sinI, rs, diskScale, accK, true, dts, lwK);
    }

    /* ================= sombra + anel de fótons ================= */
    const shadowR = 2.55 * rs;

    // halo externo quente
    const rim = ctx.createRadialGradient(cx, cy, shadowR * 0.85, cx, cy, shadowR * 2.1);
    rim.addColorStop(0, `rgba(255,190,110,${0.4 * accK})`);
    rim.addColorStop(0.4, `rgba(255,140,60,${0.14 * accK})`);
    rim.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(cx, cy, shadowR * 2.1, 0, TAU);
    ctx.fill();

    // horizonte de eventos — a sombra é sempre circular
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(cx, cy, shadowR, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "lighter";

    // anel de fótons
    ctx.strokeStyle = `rgba(255,228,175,${0.28 + 0.5 * Math.min(acc, 1)})`;
    ctx.lineWidth = 3.6 * lwK;
    ctx.beginPath();
    ctx.arc(cx, cy, 2.62 * rs, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,240,205,0.92)";
    ctx.lineWidth = 1.25 * lwK;
    ctx.beginPath();
    ctx.arc(cx, cy, 2.62 * rs, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "rgba(150,200,255,0.22)";
    ctx.lineWidth = lwK;
    ctx.beginPath();
    ctx.arc(cx, cy, shadowR, 0, TAU);
    ctx.stroke();

    // halo do disco lensado sobre/abaixo da sombra (efeito "Interstellar")
    if (p.disk) {
      const haloA = (0.09 + 0.2 * sinI) * accK;
      ctx.strokeStyle = `rgba(255,150,70,${haloA})`;
      ctx.lineWidth = rs * 0.55;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.9 * rs, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,210,150,${haloA * 0.8})`;
      ctx.lineWidth = rs * 0.16;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.78 * rs, 0, TAU);
      ctx.stroke();
    }

    /* --- metade frontal do disco --- */
    if (p.disk) {
      this.drawDiskSide(ctx, p, dcx, dcy, cosId, sinI, rs, diskScale, accK, false, dts, lwK);
    }

    /* ================= jatos relativísticos ================= */
    if (p.jets && acc > 0.02) {
      const len = U * (0.14 + 0.2 * Math.min(acc, 1.2));
      const jetA = Math.min(1, acc * 1.3);
      for (const j of this.jets) {
        j.t += j.sp * dts * (0.55 + acc);
        if (j.t > 1) j.t -= 1;
        const d = j.t * len;
        const x = cx + j.drift * d * 0.22 + Math.sin(j.t * 7 + j.ph) * j.amp * j.t * Z;
        const y = cy - j.side * (d + shadowR * 0.9);
        const a = Math.pow(1 - j.t, 1.7) * 0.5 * jetA;
        const sz = ((1 - j.t) * 2.6 + 0.6) * Math.pow(Z, 0.6);
        ctx.globalAlpha = a;
        ctx.fillStyle = j.side > 0 ? "#bfe0ff" : "#9ec8ff";
        ctx.beginPath();
        ctx.arc(x, y, sz, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // núcleo dos jatos
      for (const side of [1, -1]) {
        const jg = ctx.createRadialGradient(cx, cy - side * shadowR, 0, cx, cy - side * shadowR, rs * 2.4);
        jg.addColorStop(0, `rgba(190,225,255,${0.4 * jetA})`);
        jg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = jg;
        ctx.beginPath();
        ctx.arc(cx, cy - side * shadowR, rs * 2.4, 0, TAU);
        ctx.fill();
      }
    }

    /* ================= sonda em órbita ================= */
    const rp = Math.min(Math.max(p.probeR * rs * diskScale, shadowR * 1.15 + 6), 0.44 * U);
    ctx.setLineDash([4, 7]);
    ctx.strokeStyle = "rgba(94,234,212,0.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rp, rp * cosId, 0, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    const pxs = cx + Math.cos(this.probeTh) * rp;
    const pys = cy + Math.sin(this.probeTh) * rp * cosId;
    ctx.strokeStyle = "rgba(94,234,212,0.5)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rp, rp * cosId, 0, this.probeTh - 0.45, this.probeTh);
    ctx.stroke();
    const glowR = 9 * Math.pow(Z, 0.5);
    const pg = ctx.createRadialGradient(pxs, pys, 0, pxs, pys, glowR);
    pg.addColorStop(0, "rgba(153,246,228,0.9)");
    pg.addColorStop(1, "rgba(94,234,212,0)");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(pxs, pys, glowR, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#eafffb";
    ctx.beginPath();
    ctx.arc(pxs, pys, 2.1 * Math.pow(Z, 0.5), 0, TAU);
    ctx.fill();

    /* ================= vinheta (fixa na tela, independente da câmera) ================= */
    ctx.globalCompositeOperation = "source-over";
    const vg = ctx.createRadialGradient(
      this.cx, this.cy, this.U * 0.3,
      this.cx, this.cy, Math.max(this.w, this.h) * 0.74
    );
    vg.addColorStop(0, "rgba(2,3,8,0)");
    vg.addColorStop(1, "rgba(2,3,8,0.62)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, this.w, this.h);

    /* --- fps --- */
    this.fpsFrames++;
    this.fpsTime += dt;
    if (this.fpsTime >= 1) {
      this.onHud?.(Math.round(this.fpsFrames / this.fpsTime), this.zoomCur);
      this.fpsFrames = 0;
      this.fpsTime = 0;
    }
  }

  private drawDiskSide(
    ctx: CanvasRenderingContext2D,
    p: SimParams,
    dcx: number,
    dcy: number,
    cosId: number,
    sinI: number,
    rs: number,
    diskScale: number,
    accK: number,
    far: boolean,
    dts: number,
    lwK: number
  ) {
    const massN = p.mass / 4.3e6;
    ctx.lineCap = "round";
    for (const d of this.disk) {
      const sinT = Math.sin(d.th);
      if (far ? sinT >= 0 : sinT < 0) continue;

      const rpx = d.rr * rs * diskScale;
      const cosT = Math.cos(d.th);
      const om = clamp(d.om * Math.sqrt(massN), 0, 3.4);
      const dop = cosT * sinI; // >0 aproxima (lado direito)
      const heat = Math.pow(3 / d.rr, 0.8) * (0.78 + 0.3 * Math.pow(Math.max(p.accretion, 0.01), 0.25));
      const boost = Math.pow(1 + 0.72 * dop, 3) / 5.09;
      const hue = clamp(52 - 40 * (1 - heat) + 26 * dop, 4, 64);
      const lit = clamp(40 + 38 * heat + 14 * boost, 20, 88);
      const alpha =
        (0.1 + 0.42 * heat) *
        accK *
        (0.3 + 0.9 * clamp(boost, 0, 1.3)) *
        (far ? 0.82 : 1) *
        (0.85 + 0.15 * Math.sin(this.tWall * 1.7 + d.wob));

      const dA = clamp(om * dts * 2.4 + 0.028, 0.028, 0.5);
      ctx.globalAlpha = clamp(alpha, 0, 0.95);
      ctx.strokeStyle = `hsla(${hue}, 95%, ${lit}%, 1)`;
      ctx.lineWidth = d.s * lwK;
      ctx.beginPath();
      ctx.ellipse(dcx, dcy, rpx, rpx * cosId, 0, d.th - dA, d.th);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

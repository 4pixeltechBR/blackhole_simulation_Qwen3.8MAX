import { type CSSProperties, type ReactNode, useState } from "react";

/* ---------- Slider com leitura numérica ---------- */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  accent = "#f59e0b",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  accent?: string;
  onChange: (v: number) => void;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label className="block group">
      <div className="flex items-baseline justify-between gap-3 mb-0.5">
        <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-400 group-hover:text-zinc-200 transition-colors">
          {label}
        </span>
        <span className="font-num text-[11px] text-amber-200/90 tabular-nums whitespace-nowrap">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--acc": accent, "--fill": `${fill}%` } as CSSProperties}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

/* ---------- Interruptor ---------- */
export function Toggle({
  label,
  on,
  accent = "#f59e0b",
  onChange,
}: {
  label: string;
  on: boolean;
  accent?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex items-center justify-between w-full py-1 group cursor-pointer"
    >
      <span
        className={`text-[11px] uppercase tracking-[0.14em] transition-colors ${
          on ? "text-zinc-200" : "text-zinc-500"
        } group-hover:text-zinc-100`}
      >
        {label}
      </span>
      <span
        className="relative inline-flex h-[16px] w-[30px] rounded-full transition-colors duration-200"
        style={{ background: on ? accent : "rgba(255,255,255,0.12)" }}
      >
        <span
          className="absolute top-[2px] h-[12px] w-[12px] rounded-full bg-[#fffbeb] shadow transition-all duration-200"
          style={{
            left: on ? "16px" : "2px",
            boxShadow: on ? `0 0 8px ${accent}` : "none",
          }}
        />
      </span>
    </button>
  );
}

/* ---------- Painel colapsável ---------- */
export function Panel({
  title,
  badge,
  defaultOpen = true,
  className = "",
  children,
}: {
  title: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`panel pointer-events-auto overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 pt-3 pb-2 cursor-pointer"
      >
        <span className="panel-title">{title}</span>
        <span className="flex items-center gap-2">
          {badge}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            className={`text-zinc-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M2.5 4.5L6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div
        className="grid transition-all duration-400 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Linha de telemetria ---------- */
export function Row({ label, value, tone = "text-zinc-100" }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[5px] border-b border-white/[0.05] last:border-0">
      <span className="text-[10.5px] uppercase tracking-[0.12em] text-zinc-500">{label}</span>
      <span className={`font-num text-[12px] tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

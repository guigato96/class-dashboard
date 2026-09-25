import React, { useState } from "react";
import { isHidden } from "../lib/privacy";

// Linguagem visual: preto/cinza com traço sólido, tracejado e pontilhado — o roxo fica só pra ação/destaque.
export const SERIES_STYLES = [
  { stroke: "var(--ink)", dash: null },
  { stroke: "var(--ink-muted)", dash: "5 4" },
  { stroke: "var(--ink-faint)", dash: "1.5 4" },
];

export function fmtValor(v, unidade, curto = false) {
  if (unidade === "money") {
    if (isHidden()) return curto ? "••••" : "R$ ••••";
    if (curto && Math.abs(v) >= 1000) return "R$ " + (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "k";
    return "R$ " + v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  }
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function caminhoSuave(pts, yMin, yMax) {
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const clamp = (y) => Math.min(yMax, Math.max(yMin, y));
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1y = clamp(p1[1] + (p2[1] - p0[1]) / 6);
    const c2y = clamp(p2[1] - (p3[1] - p1[1]) / 6);
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${c1y} ${p2[0] - (p3[0] - p1[0]) / 6},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function Amostra({ estilo, tipo }) {
  if (tipo === "bar") return <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: estilo.stroke }} />;
  return (
    <svg width="20" height="8" aria-hidden>
      <line x1="0" y1="4" x2="20" y2="4" strokeWidth="2" strokeLinecap="round" strokeDasharray={estilo.dash || undefined} style={{ stroke: estilo.stroke }} />
    </svg>
  );
}

// series: [{ key, label, values: number[] }]; labels: string[] (um por mês)
export default function MetricChart({ series, labels, tipo, unidade }) {
  const [hover, setHover] = useState(null);

  const width = 640;
  const height = 220;
  const padLeft = 48;
  const padBottom = 28;
  const padTop = 16;
  const plotW = width - padLeft - 12;
  const plotH = height - padTop - padBottom;
  const n = labels.length;

  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const niceMax = Math.ceil(max / 4) * 4 || 4;
  const bandW = plotW / n;
  const yFor = (v) => padTop + plotH - (v / niceMax) * plotH;
  const cxFor = (i) => padLeft + i * bandW + bandW / 2;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => niceMax * f);
  const base = yFor(0);

  const barW = Math.min(18, (bandW * 0.7) / series.length);
  const gap = 4;

  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-2 flex-wrap">
        {series.map((s, si) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ink-muted)" }}>
            <Amostra estilo={SERIES_STYLES[si % SERIES_STYLES.length]} tipo={tipo} /> {s.label}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ overflow: "visible" }}>
        <defs>
          <pattern id="hachura" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" strokeWidth="1" style={{ stroke: "var(--ink-muted)" }} opacity="0.45" />
          </pattern>
        </defs>

        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padLeft} x2={width - 8} y1={yFor(t)} y2={yFor(t)} stroke="var(--card-border)" strokeWidth="1" />
            <text x={padLeft - 8} y={yFor(t) + 3} textAnchor="end" fontSize="9" fill="var(--ink-muted)" fontFamily="Inter, sans-serif">
              {fmtValor(t, unidade, true)}
            </text>
          </g>
        ))}

        {hover !== null && tipo !== "bar" && (
          <line x1={cxFor(hover)} x2={cxFor(hover)} y1={padTop} y2={base} stroke="var(--ink-faint)" strokeWidth="1" strokeDasharray="3 3" />
        )}

        {tipo !== "bar" &&
          series.map((s, si) => {
            const estilo = SERIES_STYLES[si % SERIES_STYLES.length];
            const pts = s.values.map((v, i) => [cxFor(i), yFor(v)]);
            const linha = caminhoSuave(pts, padTop, base);
            return (
              <g key={s.key}>
                {tipo === "area" && si === 0 && n > 1 && (
                  <path d={`${linha} L${cxFor(n - 1)},${base} L${cxFor(0)},${base} Z`} fill="url(#hachura)" />
                )}
                <path d={linha} fill="none" strokeWidth="2" strokeLinecap="round" strokeDasharray={estilo.dash || undefined} style={{ stroke: estilo.stroke }} />
                {hover !== null && <circle cx={pts[hover][0]} cy={pts[hover][1]} r="3.5" style={{ fill: "var(--card-bg)", stroke: estilo.stroke }} strokeWidth="2" />}
              </g>
            );
          })}

        {labels.map((label, i) => {
          const cx = cxFor(i);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              <rect x={cx - bandW / 2} y={padTop} width={bandW} height={plotH} fill="transparent" />
              {tipo === "bar" &&
                series.map((s, si) => {
                  const total = series.length * barW + (series.length - 1) * gap;
                  const x = cx - total / 2 + si * (barW + gap);
                  const h = Math.max((s.values[i] / niceMax) * plotH, 1);
                  return (
                    <rect key={s.key} x={x} y={padTop + plotH - h} width={barW} height={h} rx="3" style={{ fill: SERIES_STYLES[si % SERIES_STYLES.length].stroke }} opacity={hover === i ? 1 : 0.85} />
                  );
                })}
              <text x={cx} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--ink-muted)" fontFamily="Inter, sans-serif">
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div
          className="absolute pointer-events-none rounded-md px-2.5 py-1.5 text-xs"
          style={{
            backgroundColor: "var(--header-bg)",
            border: "1px solid var(--hover-bg-soft)",
            color: "var(--ink)",
            left: `${((hover + 0.5) / n) * 100}%`,
            top: 0,
            transform: "translate(-50%, -110%)",
            whiteSpace: "nowrap",
            zIndex: 5,
          }}
        >
          <div style={{ color: "var(--ink-muted)" }}>{labels[hover]}</div>
          {series.map((s, si) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <Amostra estilo={SERIES_STYLES[si % SERIES_STYLES.length]} tipo={tipo} /> {s.label}: {fmtValor(s.values[hover], unidade)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

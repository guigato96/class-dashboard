import React, { useState } from "react";
import { isHidden } from "../lib/privacy";

export const SERIES_COLORS = ["#8B5CF6", "#D97706", "#0EA5E9"];

export function fmtValor(v, unidade, curto = false) {
  if (unidade === "money") {
    if (isHidden()) return curto ? "••••" : "R$ ••••";
    if (curto && Math.abs(v) >= 1000) return "R$ " + (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "k";
    return "R$ " + v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  }
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
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

  const barW = Math.min(18, (bandW * 0.7) / series.length);
  const gap = 4;

  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-2 flex-wrap">
        {series.map((s, si) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ink-muted)" }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SERIES_COLORS[si % SERIES_COLORS.length] }} /> {s.label}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ overflow: "visible" }}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padLeft} x2={width - 8} y1={yFor(t)} y2={yFor(t)} stroke="var(--card-border)" strokeWidth="1" />
            <text x={padLeft - 8} y={yFor(t) + 3} textAnchor="end" fontSize="9" fill="var(--ink-muted)" fontFamily="Inter, sans-serif">
              {fmtValor(t, unidade, true)}
            </text>
          </g>
        ))}

        {tipo !== "bar" &&
          series.map((s, si) => {
            const color = SERIES_COLORS[si % SERIES_COLORS.length];
            const pts = s.values.map((v, i) => `${cxFor(i)},${yFor(v)}`);
            return (
              <g key={s.key}>
                {tipo === "area" && (
                  <polygon points={`${cxFor(0)},${yFor(0)} ${pts.join(" ")} ${cxFor(n - 1)},${yFor(0)}`} fill={color} opacity="0.15" />
                )}
                <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {s.values.map((v, i) => (
                  <circle key={i} cx={cxFor(i)} cy={yFor(v)} r={hover === i ? 4 : 3} fill={color} />
                ))}
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
                    <rect key={s.key} x={x} y={padTop + plotH - h} width={barW} height={h} rx="3" fill={SERIES_COLORS[si % SERIES_COLORS.length]} opacity={hover === i ? 1 : 0.85} />
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
            <div key={s.key}>
              <span style={{ color: SERIES_COLORS[si % SERIES_COLORS.length] }}>●</span> {s.label}: {fmtValor(s.values[hover], unidade)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

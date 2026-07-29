import React, { useState } from "react";

const RECEITA_COLOR = "#8B5CF6";
const DESPESA_COLOR = "#D97706";

function fmtMoneyShort(v) {
  if (v >= 1000) return "R$ " + (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "k";
  return "R$ " + v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

export default function OverviewChart({ data }) {
  const [hover, setHover] = useState(null);

  const width = 640;
  const height = 220;
  const padLeft = 44;
  const padBottom = 28;
  const padTop = 16;
  const plotW = width - padLeft - 12;
  const plotH = height - padTop - padBottom;

  const max = Math.max(1, ...data.map((d) => Math.max(d.receita, d.despesa)));
  const niceMax = Math.ceil(max / 4) * 4 || 4;

  const bandW = plotW / data.length;
  const barW = Math.min(18, bandW * 0.28);
  const gap = 4;

  const yFor = (v) => padTop + plotH - (v / niceMax) * plotH;
  const ticks = [0, niceMax * 0.25, niceMax * 0.5, niceMax * 0.75, niceMax];

  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-2">
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "#8B8B93" }}>
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: RECEITA_COLOR }} /> Receita
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "#8B8B93" }}>
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: DESPESA_COLOR }} /> Despesa
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ overflow: "visible" }}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padLeft} x2={width - 8} y1={yFor(t)} y2={yFor(t)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <text x={padLeft - 8} y={yFor(t) + 3} textAnchor="end" fontSize="9" fill="#8B8B93" fontFamily="Inter, sans-serif">
              {fmtMoneyShort(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = padLeft + i * bandW + bandW / 2;
          const xR = cx - barW - gap / 2;
          const xD = cx + gap / 2;
          const hR = (d.receita / niceMax) * plotH;
          const hD = (d.despesa / niceMax) * plotH;
          const isHover = hover === i;

          return (
            <g
              key={d.mes}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              <rect x={cx - bandW / 2} y={padTop} width={bandW} height={plotH} fill="transparent" />
              <rect x={xR} y={padTop + plotH - Math.max(hR, 1)} width={barW} height={Math.max(hR, 1)} rx="3" fill={RECEITA_COLOR} opacity={isHover ? 1 : 0.85} />
              <rect x={xD} y={padTop + plotH - Math.max(hD, 1)} width={barW} height={Math.max(hD, 1)} rx="3" fill={DESPESA_COLOR} opacity={isHover ? 1 : 0.85} />
              <text x={cx} y={height - 8} textAnchor="middle" fontSize="10" fill="#8B8B93" fontFamily="Inter, sans-serif">
                {d.mes}
              </text>
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div
          className="absolute pointer-events-none rounded-md px-2.5 py-1.5 text-xs"
          style={{
            backgroundColor: "#17171B",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#F4F4F5",
            left: `${((hover + 0.5) / data.length) * 100}%`,
            top: 0,
            transform: "translate(-50%, -110%)",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ color: "#8B8B93" }}>{data[hover].mes}</div>
          <div>
            <span style={{ color: RECEITA_COLOR }}>●</span> {fmtMoneyShort(data[hover].receita)}
          </div>
          <div>
            <span style={{ color: DESPESA_COLOR }}>●</span> {fmtMoneyShort(data[hover].despesa)}
          </div>
        </div>
      )}
    </div>
  );
}

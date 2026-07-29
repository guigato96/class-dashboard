import React, { useState } from "react";

const PURPLE = "#8B5CF6";

function fmtMoneyShort(v) {
  if (v >= 1000) return "R$ " + (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "k";
  return "R$ " + v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

export default function RevenueChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const width = 640;
  const height = 200;
  const padLeft = 44;
  const padBottom = 28;
  const padTop = 16;
  const plotW = width - padLeft - 12;
  const plotH = height - padTop - padBottom;

  const max = Math.max(1, ...data.map((d) => d.total));
  const niceMax = Math.ceil(max / 4) * 4 || 4;

  const bandW = plotW / data.length;
  const barW = Math.min(24, bandW * 0.55);

  const yFor = (v) => padTop + plotH - (v / niceMax) * plotH;

  const ticks = [0, niceMax * 0.25, niceMax * 0.5, niceMax * 0.75, niceMax];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ overflow: "visible" }}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={padLeft}
              x2={width - 8}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
            <text x={padLeft - 8} y={yFor(t) + 3} textAnchor="end" fontSize="9" fill="#8B8B93" fontFamily="Inter, sans-serif">
              {fmtMoneyShort(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = padLeft + i * bandW + (bandW - barW) / 2;
          const barH = (d.total / niceMax) * plotH;
          const y = padTop + plotH - barH;
          const isLast = i === data.length - 1;
          const isHover = hoverIndex === i;
          return (
            <g
              key={d.mes}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              style={{ cursor: "pointer" }}
            >
              <rect x={x - 6} y={padTop} width={barW + 12} height={plotH} fill="transparent" />
              <rect
                x={x}
                y={barH > 0 ? y : padTop + plotH - 1}
                width={barW}
                height={Math.max(barH, 1)}
                rx="4"
                fill={PURPLE}
                opacity={isHover || isLast ? 1 : 0.65}
              />
              {isLast && d.total > 0 && (
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="#F4F4F5" fontFamily="'Space Grotesk', sans-serif">
                  {fmtMoneyShort(d.total)}
                </text>
              )}
              <text x={x + barW / 2} y={height - 8} textAnchor="middle" fontSize="10" fill="#8B8B93" fontFamily="Inter, sans-serif">
                {d.mes}
              </text>
            </g>
          );
        })}
      </svg>

      {hoverIndex !== null && (
        <div
          className="absolute pointer-events-none rounded-md px-2.5 py-1.5 text-xs"
          style={{
            backgroundColor: "#17171B",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#F4F4F5",
            left: `${((hoverIndex + 0.5) / data.length) * 100}%`,
            top: 0,
            transform: "translate(-50%, -110%)",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ color: "#8B8B93" }}>{data[hoverIndex].mes}</div>
          <div className="font-semibold">{fmtMoneyShort(data[hoverIndex].total)}</div>
        </div>
      )}
    </div>
  );
}

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMeses, labelMes } from "../lib/mes";

export default function MonthNav({ mesRef, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full px-1.5 py-1" style={{ border: "1px solid var(--border)" }}>
      <button
        onClick={() => onChange(addMeses(mesRef, -1))}
        className="flex items-center justify-center rounded-full p-1 transition-colors hover:bg-[var(--hover-bg)]"
        style={{ color: "var(--ink-muted)" }}
        title="Mês anterior"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-xs font-medium px-2" style={{ color: "var(--ink)" }}>{labelMes(mesRef)}</span>
      <button
        onClick={() => onChange(addMeses(mesRef, 1))}
        className="flex items-center justify-center rounded-full p-1 transition-colors hover:bg-[var(--hover-bg)]"
        style={{ color: "var(--ink-muted)" }}
        title="Próximo mês"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

import { useState, useEffect } from "react";
import { isHidden, MASK } from "../lib/privacy";

export const PURPLE = "#8B5CF6";
export const PURPLE_LIGHT = "#C4B5FD";

const THEME_KEY = "class-theme";

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // localStorage indisponível (modo privado, etc.) — tema não persiste, sem problema
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return [theme, toggleTheme];
}

export function fmtMoney(v) {
  if (isHidden()) return MASK;
  const n = Number(v) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function parseDate(str) {
  if (!str) return null;
  const d = new Date(str + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

export function diffDays(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export const inputCls = "rounded-md px-3 py-2 text-sm bg-transparent outline-none focus:ring-1";
export const inputStyle = { border: "1px solid var(--border)", color: "var(--ink)" };

export function Badge({ color, children }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: color + "22", color }}
    >
      {children}
    </span>
  );
}

export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="tracking-normal" style={{ color: "var(--ink-muted)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export function StatCard({ label, value, sub, icon: Icon, delta }) {
  return (
    <div
      className="rounded-xl flex flex-1 min-w-[220px] overflow-hidden"
      style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)" }}
    >
      <div className="flex-1 p-4 min-w-0">
        <div className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>{label}</div>
        <div className="text-3xl font-semibold truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--ink)" }}>{value}</div>
        {sub && <div className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>{sub}</div>}
        {delta}
      </div>
      {Icon && (
        <div className="w-20 shrink-0 flex items-center justify-center" style={{ backgroundColor: "var(--subtle-bg)", borderLeft: "1px solid var(--card-border)" }}>
          <span className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <Icon size={18} style={{ color: "var(--ink-muted)" }} />
          </span>
        </div>
      )}
    </div>
  );
}

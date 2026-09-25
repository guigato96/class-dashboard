import React, { useState } from "react";
import { Clock, LogOut, ChevronLeft, ChevronRight, LayoutDashboard, Users, Receipt, Banknote, GitBranch, BarChart3, Sun, Moon, Eye, EyeOff } from "lucide-react";
import logoClass from "../assets/logo-class.png";
import { mesAtualLabel } from "../lib/mes";

const PURPLE = "#8B5CF6";
const PURPLE_LIGHT = "#C4B5FD";

const ABAS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "funil", label: "Funil", icon: GitBranch },
  { id: "comercial", label: "Comercial", icon: BarChart3 },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "entradas", label: "Entradas", icon: Banknote },
  { id: "despesas", label: "Despesas", icon: Receipt },
];

export default function Layout({ aba, onAbaChange, onSignOut, children, theme, onToggleTheme, valoresOcultos, onToggleValores }) {
  const [aberta, setAberta] = useState(true);
  const mesLabel = mesAtualLabel();

  return (
    <div
      style={{
        backgroundColor: "var(--bg)",
        backgroundImage:
          "radial-gradient(circle at 20% -10%, var(--glow-purple), transparent 55%), radial-gradient(var(--hover-bg) 1px, transparent 1px)",
        backgroundSize: "auto, 24px 24px",
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
      }}
      className="flex"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        input:focus, select:focus, textarea:focus { border-color: ${PURPLE} !important; }
        ::placeholder { color: var(--ink-faint); }
      `}</style>

      <aside
        className="shrink-0 flex flex-col transition-[width] duration-200"
        style={{
          width: aberta ? 240 : 76,
          borderRight: "1px solid var(--card-border)",
          backgroundColor: "var(--sidebar-bg)",
          backdropFilter: "blur(6px)",
          minHeight: "100vh",
          padding: aberta ? "20px 16px" : "20px 14px",
        }}
      >
        <div className={`flex items-center mb-6 ${aberta ? "justify-between" : "justify-center"}`}>
          {aberta && <img src={logoClass} alt="Class" className="h-6 w-auto app-logo" />}
          <button
            onClick={() => setAberta((v) => !v)}
            title={aberta ? "Recolher menu" : "Expandir menu"}
            className="flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-[var(--hover-bg)] shrink-0"
            style={{ border: "1px solid var(--border)", color: "var(--ink-muted)" }}
          >
            {aberta ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {aberta && (
          <div className="flex flex-col items-start gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ border: `1px solid ${PURPLE}59`, backgroundColor: PURPLE + "1A" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PURPLE }} />
              <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: PURPLE_LIGHT }}>Gestão da operação</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ border: "1px solid var(--hover-bg-soft)", backgroundColor: "var(--chip-bg)" }}>
              <Clock size={11} style={{ color: "var(--ink-muted)" }} />
              <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--ink-muted)" }}>Ciclo {mesLabel}</span>
            </span>
          </div>
        )}

        <nav className="flex flex-col gap-1 flex-1">
          {ABAS.map((t) => {
            const ativo = aba === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onAbaChange(t.id)}
                title={!aberta ? t.label : undefined}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${aberta ? "" : "justify-center"}`}
                style={{
                  backgroundColor: ativo ? PURPLE : "transparent",
                  color: ativo ? "#fff" : "var(--ink-muted)",
                }}
                onMouseEnter={(e) => { if (!ativo) e.currentTarget.style.backgroundColor = "var(--hover-bg)"; }}
                onMouseLeave={(e) => { if (!ativo) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <t.icon size={18} className="shrink-0" />
                {aberta && t.label}
              </button>
            );
          })}
        </nav>

      </aside>

      <main className="flex-1 p-6 min-w-0">
        <div className="flex justify-end items-center gap-2 mb-4">
          {onToggleValores && (
            <button
              onClick={onToggleValores}
              title={valoresOcultos ? "Mostrar valores" : "Ocultar valores"}
              aria-label={valoresOcultos ? "Mostrar valores" : "Ocultar valores"}
              className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-[var(--hover-bg)]"
              style={{ border: "1px solid var(--border)", color: valoresOcultos ? PURPLE : "var(--ink-muted)" }}
            >
              {valoresOcultos ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
              aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-xs transition-colors hover:bg-[var(--hover-bg)]"
              style={{ border: "1px solid var(--border)", color: "var(--ink-muted)" }}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {theme === "dark" ? "Modo claro" : "Modo escuro"}
            </button>
          )}
          {onSignOut && (
            <button
              onClick={onSignOut}
              title="Sair"
              aria-label="Sair"
              className="flex items-center gap-2 rounded-full px-3 py-2 text-xs transition-colors hover:bg-[var(--hover-bg)]"
              style={{ border: "1px solid var(--border)", color: "var(--ink-muted)" }}
            >
              <LogOut size={16} /> Sair
            </button>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}

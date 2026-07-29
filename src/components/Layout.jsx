import React, { useState } from "react";
import { Clock, LogOut, ChevronLeft, ChevronRight, LayoutDashboard, Users, Receipt, Banknote } from "lucide-react";
import logoClass from "../assets/logo-class.png";
import { mesAtualLabel } from "../lib/mes";

const PURPLE = "#8B5CF6";
const PURPLE_LIGHT = "#C4B5FD";

const ABAS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "entradas", label: "Entradas", icon: Banknote },
  { id: "despesas", label: "Despesas", icon: Receipt },
];

export default function Layout({ aba, onAbaChange, onSignOut, children }) {
  const [aberta, setAberta] = useState(true);
  const mesLabel = mesAtualLabel();

  return (
    <div
      style={{
        backgroundColor: "#07070B",
        backgroundImage:
          "radial-gradient(circle at 20% -10%, rgba(139,92,246,0.16), transparent 55%), radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "auto, 24px 24px",
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
      }}
      className="flex"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        input:focus, select:focus, textarea:focus { border-color: ${PURPLE} !important; }
        ::placeholder { color: #55555C; }
      `}</style>

      <aside
        className="shrink-0 flex flex-col transition-[width] duration-200"
        style={{
          width: aberta ? 240 : 76,
          borderRight: "1px solid rgba(255,255,255,0.08)",
          backgroundColor: "rgba(10,10,13,0.5)",
          backdropFilter: "blur(6px)",
          minHeight: "100vh",
          padding: aberta ? "20px 16px" : "20px 14px",
        }}
      >
        <div className={`flex items-center mb-6 ${aberta ? "justify-between" : "justify-center"}`}>
          {aberta && <img src={logoClass} alt="Class" className="h-6 w-auto" />}
          <button
            onClick={() => setAberta((v) => !v)}
            title={aberta ? "Recolher menu" : "Expandir menu"}
            className="flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-white/5 shrink-0"
            style={{ border: "1px solid #2A2A2E", color: "#8B8B93" }}
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
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }}>
              <Clock size={11} style={{ color: "#8B8B93" }} />
              <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "#8B8B93" }}>Ciclo {mesLabel}</span>
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
                  color: ativo ? "#fff" : "#8B8B93",
                }}
                onMouseEnter={(e) => { if (!ativo) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { if (!ativo) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <t.icon size={18} className="shrink-0" />
                {aberta && t.label}
              </button>
            );
          })}
        </nav>

        {onSignOut && (
          <button
            onClick={onSignOut}
            title={!aberta ? "Sair" : undefined}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm mt-4 transition-colors hover:bg-white/5 ${aberta ? "" : "justify-center"}`}
            style={{ border: "1px solid #2A2A2E", color: "#8B8B93" }}
          >
            <LogOut size={18} className="shrink-0" />
            {aberta && "Sair"}
          </button>
        )}
      </aside>

      <main className="flex-1 p-6 min-w-0">{children}</main>
    </div>
  );
}

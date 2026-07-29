import React, { useState } from "react";
import { LogIn } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import logoClass from "../assets/logo-class.png";

const PURPLE = "#8B5CF6";
const PURPLE_LIGHT = "#C4B5FD";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro("E-mail ou senha inválidos.");
    setCarregando(false);
  };

  return (
    <div
      style={{
        backgroundColor: "#07070B",
        backgroundImage:
          "radial-gradient(circle at 50% -10%, rgba(139,92,246,0.16), transparent 55%), radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "auto, 24px 24px",
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
      }}
      className="flex items-center justify-center p-6"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        input:focus { border-color: ${PURPLE} !important; }
        ::placeholder { color: #55555C; }
      `}</style>

      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-6">
          <img src={logoClass} alt="Class" className="h-10 w-auto" />
        </div>

        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ border: `1px solid ${PURPLE}59`, backgroundColor: PURPLE + "1A" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PURPLE }} />
            <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: PURPLE_LIGHT }}>Gestão de carteira</span>
          </span>
        </div>

        <form
          onSubmit={entrar}
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ backgroundColor: "rgba(20,20,23,0.7)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(6px)" }}
        >
          <label className="flex flex-col gap-1 text-xs">
            <span className="uppercase tracking-wide" style={{ color: "#8B8B93" }}>E-mail</span>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md px-3 py-2 text-sm bg-transparent outline-none focus:ring-1"
              style={{ border: "1px solid #2A2A2E", color: "#F4F4F5" }}
              placeholder="voce@class.com"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="uppercase tracking-wide" style={{ color: "#8B8B93" }}>Senha</span>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="rounded-md px-3 py-2 text-sm bg-transparent outline-none focus:ring-1"
              style={{ border: "1px solid #2A2A2E", color: "#F4F4F5" }}
              placeholder="••••••••"
            />
          </label>

          {erro && <div className="text-xs" style={{ color: "#E11D2E" }}>{erro}</div>}

          <button
            type="submit"
            disabled={carregando}
            className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 transition-[filter] hover:brightness-110"
            style={{ backgroundColor: PURPLE, color: "#fff" }}
          >
            <LogIn size={16} /> {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

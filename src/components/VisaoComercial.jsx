import React, { useState, useEffect, useMemo } from "react";
import { Target, Trophy, Ban, Percent, Thermometer } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { ultimosMeses, mesDaData } from "../lib/mes";
import { fmtMoney, StatCard } from "./ui";
import { PESO_ETAPA } from "./Funil";

const ETAPA_LABEL = { novo: "Novo", contato_feito: "Contato feito", qualificado: "Qualificado", reuniao_marcada: "Reunião marcada", proposta_enviada: "Proposta enviada", negociacao: "Negociação" };
const ETAPA_ORDEM = ["novo", "contato_feito", "qualificado", "reuniao_marcada", "proposta_enviada", "negociacao"];
const ORIGEM_LABEL = { trafego_pago: "Tráfego pago", indicacao: "Indicação", instagram: "Instagram", outbound: "Outbound", networking: "Networking", site: "Site" };
const TEMP_COLOR = { quente: "#E11D2E", morno: "#EAB308", frio: "#3B82F6" };

function BarraHorizontal({ label, valor, total, cor }) {
  const pct = total > 0 ? (valor / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0 text-xs" style={{ color: "#8B8B93" }}>{label}</div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#232327" }}>
        <div style={{ width: `${pct}%`, backgroundColor: cor, height: "100%" }} />
      </div>
      <div className="w-8 shrink-0 text-xs text-right font-variant-numeric-tabular" style={{ color: "#F4F4F5" }}>{valor}</div>
    </div>
  );
}

function LeadsPorMesChart({ data }) {
  const [hover, setHover] = useState(null);
  const width = 640, height = 180, padLeft = 28, padBottom = 24, padTop = 14;
  const plotW = width - padLeft - 12, plotH = height - padTop - padBottom;
  const max = Math.max(1, ...data.map((d) => d.total));
  const niceMax = Math.ceil(max / 4) * 4 || 4;
  const bandW = plotW / data.length;
  const barW = Math.min(28, bandW * 0.55);
  const yFor = (v) => padTop + plotH - (v / niceMax) * plotH;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ overflow: "visible" }}>
        {[0, niceMax * 0.5, niceMax].map((t, i) => (
          <line key={i} x1={padLeft} x2={width - 8} y1={yFor(t)} y2={yFor(t)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        ))}
        {data.map((d, i) => {
          const x = padLeft + i * bandW + (bandW - barW) / 2;
          const barH = (d.total / niceMax) * plotH;
          const y = padTop + plotH - barH;
          const isHover = hover === i;
          return (
            <g key={d.mes} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              <rect x={x - 6} y={padTop} width={barW + 12} height={plotH} fill="transparent" />
              <rect x={x} y={barH > 0 ? y : padTop + plotH - 1} width={barW} height={Math.max(barH, 1)} rx="4" fill="#8B5CF6" opacity={isHover ? 1 : 0.7} />
              <text x={x + barW / 2} y={height - 6} textAnchor="middle" fontSize="10" fill="#8B8B93" fontFamily="Inter, sans-serif">{d.mes}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="absolute pointer-events-none rounded-md px-2.5 py-1.5 text-xs" style={{ backgroundColor: "#17171B", border: "1px solid rgba(255,255,255,0.1)", color: "#F4F4F5", left: `${((hover + 0.5) / data.length) * 100}%`, top: 0, transform: "translate(-50%, -110%)", whiteSpace: "nowrap" }}>
          <div style={{ color: "#8B8B93" }}>{data[hover].mes}</div>
          <div className="font-semibold">{data[hover].total} leads</div>
        </div>
      )}
    </div>
  );
}

export default function VisaoComercial() {
  const [leads, setLeads] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("leads").select("*");
      setLeads(data || []);
      setLoaded(true);
    })();
  }, []);

  const mesAtual = new Date().toISOString().slice(0, 7);

  const leadsNoMes = leads.filter((l) => (l.data_entrada || "").slice(0, 7) === mesAtual).length;
  const ganhosNoMes = leads.filter((l) => l.etapa === "ganho" && (l.updated_at || "").slice(0, 7) === mesAtual).length;
  const perdidosNoMes = leads.filter((l) => l.etapa === "perdido" && (l.updated_at || "").slice(0, 7) === mesAtual).length;
  const fechadosNoMes = ganhosNoMes + perdidosNoMes;
  const taxaConversao = fechadosNoMes > 0 ? Math.round((ganhosNoMes / fechadosNoMes) * 100) : null;

  const ativos = leads.filter((l) => l.etapa !== "ganho" && l.etapa !== "perdido");
  const quentes = ativos.filter((l) => l.temperatura === "quente").length;
  const mornos = ativos.filter((l) => l.temperatura === "morno").length;
  const frios = ativos.filter((l) => l.temperatura === "frio").length;

  const porEtapa = useMemo(() => {
    const total = ativos.length;
    return ETAPA_ORDEM.map((id) => ({ id, label: ETAPA_LABEL[id], valor: ativos.filter((l) => l.etapa === id).length, total }));
  }, [ativos]);

  const porOrigem = useMemo(() => {
    const ganhos = leads.filter((l) => l.etapa === "ganho");
    const total = ganhos.length;
    return Object.keys(ORIGEM_LABEL)
      .map((id) => ({ id, label: ORIGEM_LABEL[id], valor: ganhos.filter((l) => l.origem === id).length, total }))
      .filter((o) => o.valor > 0)
      .sort((a, b) => b.valor - a.valor);
  }, [leads]);

  const motivosPerda = useMemo(() => {
    const perdidos = leads.filter((l) => l.etapa === "perdido" && l.motivo_perda);
    const contagem = {};
    perdidos.forEach((l) => { contagem[l.motivo_perda] = (contagem[l.motivo_perda] || 0) + 1; });
    const total = perdidos.length;
    return Object.entries(contagem).map(([label, valor]) => ({ label, valor, total })).sort((a, b) => b.valor - a.valor);
  }, [leads]);

  const leadsPorMes = useMemo(() => {
    const meses = ultimosMeses(6).map((m) => ({ ...m, total: 0 }));
    leads.forEach((l) => {
      const ref = mesDaData(l.data_entrada);
      const item = meses.find((m) => m.ref === ref);
      if (item) item.total += 1;
    });
    return meses;
  }, [leads]);

  const cicloMedio = useMemo(() => {
    const ganhos = leads.filter((l) => l.etapa === "ganho" && l.data_entrada && l.updated_at);
    if (ganhos.length === 0) return null;
    const somaDias = ganhos.reduce((sum, l) => {
      const inicio = new Date(l.data_entrada);
      const fim = new Date(l.updated_at);
      return sum + Math.max(0, Math.round((fim - inicio) / 86400000));
    }, 0);
    return Math.round(somaDias / ganhos.length);
  }, [leads]);

  if (!loaded) return <div style={{ color: "#8B8B93" }} className="text-sm py-16 text-center">Carregando visão comercial...</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F4F4F5" }}>
        Visão geral <span style={{ color: "#8B5CF6" }}>comercial</span>
      </h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard label="Leads no mês" value={leadsNoMes} icon={Target} accent="#A78BFA" />
        <StatCard label="Ganhos no mês" value={ganhosNoMes} icon={Trophy} accent="#22C55E" />
        <StatCard label="Perdidos no mês" value={perdidosNoMes} icon={Ban} accent="#E11D2E" />
        <StatCard label="Taxa de conversão" value={taxaConversao === null ? "—" : `${taxaConversao}%`} sub={fechadosNoMes > 0 ? `${ganhosNoMes} de ${fechadosNoMes} fechados` : "nenhum fechamento ainda"} icon={Percent} accent="#EAB308" />
        {cicloMedio !== null && <StatCard label="Ciclo médio" value={`${cicloMedio}d`} sub="entrada até fechamento" icon={Thermometer} accent="#3B82F6" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(20,20,23,0.7)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(6px)" }}>
          <div className="text-xs uppercase tracking-wide mb-4" style={{ color: "#8B8B93" }}>Temperatura da carteira ativa ({ativos.length})</div>
          <div className="flex flex-col gap-3">
            <BarraHorizontal label="Quente" valor={quentes} total={ativos.length} cor={TEMP_COLOR.quente} />
            <BarraHorizontal label="Morno" valor={mornos} total={ativos.length} cor={TEMP_COLOR.morno} />
            <BarraHorizontal label="Frio" valor={frios} total={ativos.length} cor={TEMP_COLOR.frio} />
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(20,20,23,0.7)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(6px)" }}>
          <div className="text-xs uppercase tracking-wide mb-4" style={{ color: "#8B8B93" }}>Onde o funil está agora</div>
          <div className="flex flex-col gap-3">
            {porEtapa.map((e) => <BarraHorizontal key={e.id} label={e.label} valor={e.valor} total={e.total} cor="#8B5CF6" />)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "rgba(20,20,23,0.7)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(6px)" }}>
        <div className="text-xs uppercase tracking-wide mb-3" style={{ color: "#8B8B93" }}>Leads entrados · últimos 6 meses</div>
        <LeadsPorMesChart data={leadsPorMes} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(20,20,23,0.7)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(6px)" }}>
          <div className="text-xs uppercase tracking-wide mb-4" style={{ color: "#8B8B93" }}>Clientes fechados por origem</div>
          {porOrigem.length === 0
            ? <div className="text-xs py-4 text-center" style={{ color: "#55555C" }}>Nenhum fechamento ainda</div>
            : <div className="flex flex-col gap-3">{porOrigem.map((o) => <BarraHorizontal key={o.id} label={o.label} valor={o.valor} total={o.total} cor="#22C55E" />)}</div>}
        </div>

        <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(20,20,23,0.7)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(6px)" }}>
          <div className="text-xs uppercase tracking-wide mb-4" style={{ color: "#8B8B93" }}>Por que o funil vaza</div>
          {motivosPerda.length === 0
            ? <div className="text-xs py-4 text-center" style={{ color: "#55555C" }}>Nenhuma perda registrada ainda</div>
            : <div className="flex flex-col gap-3">{motivosPerda.map((m) => <BarraHorizontal key={m.label} label={m.label} valor={m.valor} total={m.total} cor="#E11D2E" />)}</div>}
        </div>
      </div>
    </div>
  );
}

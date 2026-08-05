import React, { useState, useEffect } from "react";
import { DollarSign, TrendingDown, TrendingUp, Minus, Wallet, Target } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { mesAtualRef, ultimosMeses, mesDaData } from "../lib/mes";
import OverviewChart from "./OverviewChart";

function fmtMoney(v) {
  const n = Number(v) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function Delta({ atual, anterior, invertido }) {
  if (!anterior) return null;
  const pct = ((atual - anterior) / Math.abs(anterior)) * 100;
  const subiu = pct > 0.5;
  const desceu = pct < -0.5;
  const positivo = invertido ? !subiu : !desceu;
  const cor = subiu || desceu ? (positivo ? "#22C55E" : "#E11D2E") : "#8B8B93";
  const Icon = subiu ? TrendingUp : desceu ? TrendingDown : Minus;
  const sinal = pct > 0 ? "+" : "";

  return (
    <div className="flex items-center gap-1 text-xs mt-1" style={{ color: cor }}>
      <Icon size={12} />
      <span>{sinal}{pct.toFixed(0)}% vs mês anterior</span>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent, delta }) {
  return (
    <div
      className="rounded-2xl p-4 flex-1 min-w-[160px] transition-transform duration-200 hover:-translate-y-0.5"
      style={{ backgroundColor: "rgba(20,20,23,0.7)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(6px)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wide" style={{ color: "#8B8B93" }}>{label}</span>
        {Icon && (
          <span className="flex items-center justify-center w-7 h-7 rounded-full shrink-0" style={{ backgroundColor: (accent || "#8B8B93") + "1A" }}>
            <Icon size={14} style={{ color: accent || "#8B8B93" }} />
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F4F4F5" }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: "#8B8B93" }}>{sub}</div>}
      {delta}
    </div>
  );
}

export default function Dashboard() {
  const [loaded, setLoaded] = useState(false);
  const [receitaMes, setReceitaMes] = useState(0);
  const [despesaMes, setDespesaMes] = useState(0);
  const [receitaMesAnterior, setReceitaMesAnterior] = useState(0);
  const [despesaMesAnterior, setDespesaMesAnterior] = useState(0);
  const [previsaoMes, setPrevisaoMes] = useState(0);
  const [historicoMensal, setHistoricoMensal] = useState([]);

  useEffect(() => {
    (async () => {
      const mesRef = mesAtualRef();
      const meses = ultimosMeses(6).map((m) => ({ ...m, receita: 0, despesa: 0 }));
      const inicioRef = meses[0].ref;

      const [{ data: pagamentos }, { data: despesas }, { data: entradas }, { data: clientesAtivos }] = await Promise.all([
        supabase.from("historico_pagamentos").select("mes_referencia, valor_pago, status").gte("mes_referencia", inicioRef),
        supabase.from("historico_despesas").select("mes_referencia, valor, pago").gte("mes_referencia", inicioRef),
        supabase.from("entradas_extras").select("mes_referencia, valor, recebido").eq("ativo", true).gte("mes_referencia", inicioRef),
        supabase.from("clientes").select("valor_mensal, data_inicio_contrato").eq("ativo", true),
      ]);

      (pagamentos || []).forEach((h) => {
        if (h.status !== "pago") return;
        const item = meses.find((m) => m.ref === h.mes_referencia);
        if (item) item.receita += Number(h.valor_pago) || 0;
      });

      (entradas || []).forEach((e) => {
        if (!e.recebido) return;
        const item = meses.find((m) => m.ref === e.mes_referencia);
        if (item) item.receita += Number(e.valor) || 0;
      });

      (despesas || []).forEach((h) => {
        if (!h.pago) return;
        const item = meses.find((m) => m.ref === h.mes_referencia);
        if (item) item.despesa += Number(h.valor) || 0;
      });

      const idxAtual = meses.findIndex((m) => m.ref === mesRef);
      const atual = meses[idxAtual];
      const anterior = idxAtual > 0 ? meses[idxAtual - 1] : null;

      // Previsão: contratos ativos (recorrentes) + entradas extras já lançadas nesse mês,
      // recebidas ou não — dá o total esperado mesmo que ainda esteja tudo pendente.
      const somaContratos = (clientesAtivos || [])
        .filter((c) => {
          const mesInicio = mesDaData(c.data_inicio_contrato);
          return !mesInicio || mesInicio <= mesRef;
        })
        .reduce((sum, c) => sum + (Number(c.valor_mensal) || 0), 0);
      const somaEntradasMes = (entradas || [])
        .filter((e) => e.mes_referencia === mesRef)
        .reduce((sum, e) => sum + (Number(e.valor) || 0), 0);

      setReceitaMes(atual?.receita || 0);
      setDespesaMes(atual?.despesa || 0);
      setReceitaMesAnterior(anterior?.receita || 0);
      setDespesaMesAnterior(anterior?.despesa || 0);
      setPrevisaoMes(somaContratos + somaEntradasMes);
      setHistoricoMensal(meses);
      setLoaded(true);
    })();
  }, []);

  const lucro = receitaMes - despesaMes;
  const lucroAnterior = receitaMesAnterior - despesaMesAnterior;

  if (!loaded) {
    return <div style={{ color: "#8B8B93" }} className="text-sm py-16 text-center">Carregando painel...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F4F4F5" }}>
        Visão geral
      </h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard
          label="Previsão do mês"
          value={fmtMoney(previsaoMes)}
          sub="Contratos ativos + entradas lançadas"
          icon={Target}
          accent="#A78BFA"
        />
        <StatCard
          label="Receita do mês"
          value={fmtMoney(receitaMes)}
          icon={DollarSign}
          accent="#8B5CF6"
          delta={<Delta atual={receitaMes} anterior={receitaMesAnterior} />}
        />
        <StatCard
          label="Despesa do mês"
          value={fmtMoney(despesaMes)}
          icon={TrendingDown}
          accent="#D97706"
          delta={<Delta atual={despesaMes} anterior={despesaMesAnterior} invertido />}
        />
        <StatCard
          label="Lucro líquido"
          value={fmtMoney(lucro)}
          icon={Wallet}
          accent={lucro >= 0 ? "#22C55E" : "#E11D2E"}
          delta={<Delta atual={lucro} anterior={lucroAnterior} />}
        />
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ backgroundColor: "rgba(20,20,23,0.7)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(6px)" }}
      >
        <div className="text-xs uppercase tracking-wide mb-3" style={{ color: "#8B8B93" }}>Receita x Despesa · últimos 6 meses</div>
        <OverviewChart data={historicoMensal} />
      </div>
    </div>
  );
}

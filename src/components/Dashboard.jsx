import React, { useState, useEffect } from "react";
import { isHidden, MASK } from "../lib/privacy";
import { DollarSign, TrendingDown, TrendingUp, Minus, Wallet, Target } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { mesAtualRef, ultimosMeses, mesDaData } from "../lib/mes";
import OverviewChart from "./OverviewChart";
import Graficos from "./Graficos";

function fmtMoney(v) {
  if (isHidden()) return MASK;
  const n = Number(v) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function Delta({ atual, anterior, invertido }) {
  if (!anterior) return null;
  const pct = ((atual - anterior) / Math.abs(anterior)) * 100;
  const subiu = pct > 0.5;
  const desceu = pct < -0.5;
  const positivo = invertido ? !subiu : !desceu;
  const cor = subiu || desceu ? (positivo ? "#22C55E" : "#E11D2E") : "var(--ink-muted)";
  const Icon = subiu ? TrendingUp : desceu ? TrendingDown : Minus;
  const sinal = pct > 0 ? "+" : "";

  return (
    <div className="flex items-center gap-1 text-xs mt-1" style={{ color: cor }}>
      <Icon size={12} />
      <span>{sinal}{pct.toFixed(0)}% vs mês anterior</span>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, delta }) {
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
        supabase.from("clientes").select("valor_mensal, data_inicio_contrato, data_fim_contrato").eq("ativo", true),
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
          const mesFim = mesDaData(c.data_fim_contrato);
          return (!mesInicio || mesInicio <= mesRef) && (!mesFim || mesRef <= mesFim);
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
    return <div style={{ color: "var(--ink-muted)" }} className="text-sm py-16 text-center">Carregando painel...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--ink)" }}>
        Visão geral
      </h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard
          label="Previsão do mês"
          value={fmtMoney(previsaoMes)}
          sub="Contratos ativos + entradas lançadas"
          icon={Target}
        />
        <StatCard
          label="Receita do mês"
          value={fmtMoney(receitaMes)}
          icon={DollarSign}
          delta={<Delta atual={receitaMes} anterior={receitaMesAnterior} />}
        />
        <StatCard
          label="Despesa do mês"
          value={fmtMoney(despesaMes)}
          icon={TrendingDown}
          delta={<Delta atual={despesaMes} anterior={despesaMesAnterior} invertido />}
        />
        <StatCard
          label="Lucro líquido"
          value={fmtMoney(lucro)}
          icon={Wallet}
          delta={<Delta atual={lucro} anterior={lucroAnterior} />}
        />
      </div>

      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)" }}
      >
        <div className="text-sm font-medium mb-3" style={{ color: "var(--ink)" }}>Receita x Despesa · últimos 6 meses</div>
        <OverviewChart data={historicoMensal} />
      </div>

      <Graficos />
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { Plus, X, BarChart3, LineChart, AreaChart, Trash2, Pencil, RotateCcw } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { ultimosMeses, mesDaData } from "../lib/mes";
import MetricChart from "./MetricChart";

const PURPLE = "#8B5CF6";
const STORAGE_KEY = "class-graficos-v2";
const STORAGE_KEY_V1 = "class-graficos"; // só gráficos criados por você, antes de os padrões serem editáveis

const METRICAS = {
  receita: { label: "Receita total", unidade: "money" },
  receita_clientes: { label: "Receita de clientes", unidade: "money" },
  receita_extras: { label: "Entradas extras", unidade: "money" },
  despesa: { label: "Despesas", unidade: "money" },
  lucro: { label: "Lucro líquido", unidade: "money" },
  receita_acum: { label: "Receita acumulada", unidade: "money" },
  ticket: { label: "Ticket médio", unidade: "money" },
  clientes: { label: "Clientes ativos", unidade: "int" },
  novos: { label: "Novos clientes", unidade: "int" },
  cancelados: { label: "Cancelamentos", unidade: "int" },
};

const TIPOS = [
  { id: "bar", label: "Barras", icon: BarChart3 },
  { id: "line", label: "Linha", icon: LineChart },
  { id: "area", label: "Área", icon: AreaChart },
];

const PADRAO = [
  { id: "p1", titulo: "Crescimento de clientes", metricas: ["clientes"], tipo: "area", meses: 12 },
  { id: "p2", titulo: "Faturamento acumulado", metricas: ["receita_acum"], tipo: "line", meses: 6 },
  { id: "p3", titulo: "Lucro líquido", metricas: ["lucro"], tipo: "bar", meses: 6 },
  { id: "p4", titulo: "Novos clientes x Cancelamentos", metricas: ["novos", "cancelados"], tipo: "bar", meses: 12 },
];

function carregarLista() {
  try {
    const v2 = localStorage.getItem(STORAGE_KEY);
    if (v2) return JSON.parse(v2);
    const antigos = JSON.parse(localStorage.getItem(STORAGE_KEY_V1) || "[]");
    return [...PADRAO, ...antigos];
  } catch {
    return PADRAO;
  }
}

function calcularMetricas(dados, meses) {
  const { pagamentos, despesas, entradas, clientes } = dados;
  const por = {};
  meses.forEach((m) => {
    por[m.ref] = { receita_clientes: 0, receita_extras: 0, despesa: 0, pagos: 0, ativos: new Set(), novos: 0, cancelados: 0 };
  });
  pagamentos.forEach((h) => {
    const m = por[h.mes_referencia];
    if (!m) return;
    m.ativos.add(h.cliente_id);
    if (h.status === "pago") {
      m.receita_clientes += Number(h.valor_pago) || 0;
      m.pagos += 1;
    }
  });
  entradas.forEach((e) => {
    if (e.recebido && por[e.mes_referencia]) por[e.mes_referencia].receita_extras += Number(e.valor) || 0;
  });
  despesas.forEach((d) => {
    if (d.pago && por[d.mes_referencia]) por[d.mes_referencia].despesa += Number(d.valor) || 0;
  });
  clientes.forEach((c) => {
    const ini = mesDaData(c.data_inicio_contrato);
    const fim = mesDaData(c.data_fim_contrato);
    if (ini && por[ini]) por[ini].novos += 1;
    if (fim && por[fim]) por[fim].cancelados += 1;
  });

  let acum = 0;
  const out = {};
  Object.keys(METRICAS).forEach((k) => (out[k] = []));
  meses.forEach((m) => {
    const x = por[m.ref];
    const receita = x.receita_clientes + x.receita_extras;
    acum += receita;
    out.receita.push(receita);
    out.receita_clientes.push(x.receita_clientes);
    out.receita_extras.push(x.receita_extras);
    out.despesa.push(x.despesa);
    out.lucro.push(receita - x.despesa);
    out.receita_acum.push(acum);
    out.ticket.push(x.pagos ? x.receita_clientes / x.pagos : 0);
    out.clientes.push(x.ativos.size);
    out.novos.push(x.novos);
    out.cancelados.push(x.cancelados);
  });
  return out;
}

function ChartCard({ config, dados, onEdit, onRemove }) {
  const meses = useMemo(() => ultimosMeses(12), []);
  const inicio = 12 - config.meses;
  const todas = useMemo(() => calcularMetricas(dados, meses.slice(inicio)), [dados, meses, inicio]);
  const unidade = METRICAS[config.metricas[0]].unidade;
  const series = config.metricas.map((k) => ({ key: k, label: METRICAS[k].label, values: todas[k] }));

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium" style={{ color: "var(--ink)" }}>
          {config.titulo} <span style={{ color: "var(--ink-muted)", fontWeight: 400 }}>· {config.meses} meses</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} title="Editar gráfico" className="rounded-md p-1 hover:bg-[var(--hover-bg)]" style={{ color: "var(--ink-muted)" }}>
            <Pencil size={14} />
          </button>
          <button onClick={onRemove} title="Remover gráfico" className="rounded-md p-1 hover:bg-[var(--hover-bg)]" style={{ color: "var(--ink-muted)" }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <MetricChart series={series} labels={meses.slice(inicio).map((m) => m.mes)} tipo={config.tipo} unidade={unidade} />
    </div>
  );
}

function Chip({ ativo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs transition-colors"
      style={{
        border: "1px solid var(--border)",
        backgroundColor: ativo ? PURPLE : "transparent",
        color: ativo ? "#fff" : "var(--ink-muted)",
      }}
    >
      {children}
    </button>
  );
}

function Construtor({ inicial, onSalvar, onFechar }) {
  const [metricas, setMetricas] = useState(inicial?.metricas || ["receita"]);
  const [tipo, setTipo] = useState(inicial?.tipo || "bar");
  const [meses, setMeses] = useState(inicial?.meses || 6);
  const [titulo, setTitulo] = useState(inicial?.titulo || "");

  const alternar = (k) => {
    setMetricas((prev) => {
      // Só dá pra comparar métricas da mesma unidade (R$ com R$, contagem com contagem).
      if (METRICAS[prev[0]].unidade !== METRICAS[k].unidade) return [k];
      if (prev.includes(k)) return prev.length > 1 ? prev.filter((x) => x !== k) : prev;
      return prev.length < 3 ? [...prev, k] : prev;
    });
  };

  const tituloFinal = titulo.trim() || metricas.map((k) => METRICAS[k].label).join(" x ");

  return (
    <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "var(--card-bg)", border: `1px solid ${PURPLE}55` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium" style={{ color: "var(--ink)" }}>{inicial ? "Editar gráfico" : "Novo gráfico"}</div>
        <button onClick={onFechar} className="rounded-md p-1 hover:bg-[var(--hover-bg)]" style={{ color: "var(--ink-muted)" }}><X size={16} /></button>
      </div>

      <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--ink-muted)" }}>Métricas (até 3, mesma unidade)</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(METRICAS).map(([k, m]) => (
          <Chip key={k} ativo={metricas.includes(k)} onClick={() => alternar(k)}>{m.label}</Chip>
        ))}
      </div>

      <div className="flex flex-wrap gap-6 mb-4">
        <div>
          <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--ink-muted)" }}>Tipo</div>
          <div className="flex gap-2">
            {TIPOS.map((t) => (
              <Chip key={t.id} ativo={tipo === t.id} onClick={() => setTipo(t.id)}>{t.label}</Chip>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--ink-muted)" }}>Período</div>
          <div className="flex gap-2">
            {[6, 12].map((m) => (
              <Chip key={m} ativo={meses === m} onClick={() => setMeses(m)}>{m} meses</Chip>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--ink-muted)" }}>Título (opcional)</div>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder={tituloFinal}
            className="w-full rounded-md px-3 py-1.5 text-sm bg-transparent outline-none"
            style={{ border: "1px solid var(--border)", color: "var(--ink)" }}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onSalvar({ id: inicial?.id || "c" + Date.now(), titulo: tituloFinal, metricas, tipo, meses })}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md transition-[filter] hover:brightness-110"
          style={{ backgroundColor: PURPLE, color: "#fff" }}
        >
          {inicial ? "Salvar alterações" : <><Plus size={14} /> Adicionar ao painel</>}
        </button>
      </div>
    </div>
  );
}

export default function Graficos() {
  const [dados, setDados] = useState(null);
  const [lista, setLista] = useState(carregarLista);
  const [construindo, setConstruindo] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    (async () => {
      const inicioRef = ultimosMeses(12)[0].ref;
      const [{ data: pagamentos }, { data: despesas }, { data: entradas }, { data: clientes }] = await Promise.all([
        supabase.from("historico_pagamentos").select("cliente_id, mes_referencia, valor_pago, status").gte("mes_referencia", inicioRef),
        supabase.from("historico_despesas").select("mes_referencia, valor, pago").gte("mes_referencia", inicioRef),
        supabase.from("entradas_extras").select("mes_referencia, valor, recebido").eq("ativo", true).gte("mes_referencia", inicioRef),
        supabase.from("clientes").select("data_inicio_contrato, data_fim_contrato"),
      ]);
      setDados({ pagamentos: pagamentos || [], despesas: despesas || [], entradas: entradas || [], clientes: clientes || [] });
    })();
  }, []);

  const persistir = (nova) => {
    setLista(nova);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nova));
    } catch {
      // sem persistência (modo privado) — os gráficos valem só nesta sessão
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--ink)" }}>Gráficos</h2>
        {!construindo && !editandoId && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => persistir(PADRAO)}
              title="Voltar aos 4 gráficos originais"
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md hover:bg-[var(--hover-bg)]"
              style={{ border: "1px solid var(--border)", color: "var(--ink-muted)" }}
            >
              <RotateCcw size={13} /> Restaurar padrão
            </button>
          <button
            onClick={() => setConstruindo(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md transition-[filter] hover:brightness-110"
            style={{ backgroundColor: PURPLE, color: "#fff" }}
          >
            <Plus size={14} /> Novo gráfico
          </button>
          </div>
        )}
      </div>

      {(construindo || editandoId) && (
        <Construtor
          key={editandoId || "novo"}
          inicial={editandoId ? lista.find((g) => g.id === editandoId) : null}
          onFechar={() => { setConstruindo(false); setEditandoId(null); }}
          onSalvar={(cfg) => {
            persistir(editandoId ? lista.map((g) => (g.id === editandoId ? cfg : g)) : [...lista, cfg]);
            setConstruindo(false);
            setEditandoId(null);
          }}
        />
      )}

      {!dados ? (
        <div className="text-sm py-8 text-center" style={{ color: "var(--ink-muted)" }}>Carregando gráficos...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {lista.map((cfg) => (
            <ChartCard
              key={cfg.id}
              config={cfg}
              dados={dados}
              onEdit={() => { setConstruindo(false); setEditandoId(cfg.id); }}
              onRemove={() => persistir(lista.filter((g) => g.id !== cfg.id))}
            />
          ))}
          {lista.length === 0 && (
            <div className="text-sm py-8 text-center col-span-full" style={{ color: "var(--ink-muted)" }}>
              Nenhum gráfico. Clique em "Novo gráfico" ou "Restaurar padrão".
            </div>
          )}
        </div>
      )}
    </div>
  );
}

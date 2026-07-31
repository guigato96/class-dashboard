import React, { useState, useEffect, useMemo } from "react";
import { Plus, ChevronDown, ChevronUp, Users, TrendingUp, TrendingDown, Minus, AlertTriangle, Calendar, DollarSign, Trash2, Save, Search } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { mesAtualRef, mesAtualLabel } from "../lib/mes";
import PaymentSwitch from "./PaymentSwitch";

const PURPLE = "#8B5CF6";
const PURPLE_LIGHT = "#C4B5FD";

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtDate(date) {
  if (!date) return "—";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function diffDays(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function fmtMoney(v) {
  const n = Number(v) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function toNumberOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function toDateOrNull(v) {
  return v ? v : null;
}

const emptyClient = () => ({
  nome: "",
  nicho: "",
  grupo_whatsapp: "",
  id_grupo: "",
  contato_nome: "",
  contato_telefone: "",
  plataformas: [],
  valor_mensal: "",
  dia_vencimento: "",
  status_pagamento_mes: "pendente",
  status_saude: "neutro",
  tendencia: "estavel",
  motivo_observacao: "",
  data_ultima_reuniao: "",
  data_inicio_contrato: "",
  prazo_contrato_meses: 3,
  data_proxima_renovacao: "",
  oportunidade_upsell: "",
});

function buildPayload(c) {
  return {
    nome: c.nome || "",
    nicho: c.nicho || null,
    grupo_whatsapp: c.grupo_whatsapp || null,
    id_grupo: c.id_grupo || null,
    contato_nome: c.contato_nome || null,
    contato_telefone: c.contato_telefone || null,
    plataformas: c.plataformas || [],
    valor_mensal: c.valor_mensal === "" || c.valor_mensal === null || c.valor_mensal === undefined ? 0 : Number(c.valor_mensal),
    dia_vencimento: toNumberOrNull(c.dia_vencimento),
    status_pagamento_mes: c.status_pagamento_mes,
    status_saude: c.status_saude,
    tendencia: c.tendencia,
    motivo_observacao: c.motivo_observacao || null,
    data_ultima_reuniao: toDateOrNull(c.data_ultima_reuniao),
    data_inicio_contrato: toDateOrNull(c.data_inicio_contrato),
    prazo_contrato_meses: toNumberOrNull(c.prazo_contrato_meses),
    data_proxima_renovacao: toDateOrNull(c.data_proxima_renovacao),
    oportunidade_upsell: c.oportunidade_upsell || null,
  };
}

function computeDerived(c, hoje) {
  const ultimaReuniao = parseDate(c.data_ultima_reuniao);
  const proximaReuniao = ultimaReuniao ? addDays(ultimaReuniao, 30) : null;
  const renovacao = parseDate(c.data_proxima_renovacao);
  const diasRenovacao = renovacao ? diffDays(renovacao, hoje) : null;

  let nivel = "baixo";
  const pagamentoRuim = c.status_pagamento_mes === "atrasado";
  const pagamentoAtencao = c.status_pagamento_mes === "pendente";
  const saudeRuim = c.status_saude === "risco";
  const renovacaoUrgente = diasRenovacao !== null && diasRenovacao <= 15;
  const renovacaoProxima = diasRenovacao !== null && diasRenovacao <= 30;

  // Cor da linha reflete pagamento (e saúde só quando negativa) — saúde "neutra" não deixa a linha em atenção.
  if (pagamentoRuim || saudeRuim || renovacaoUrgente) nivel = "alto";
  else if (pagamentoAtencao || renovacaoProxima) nivel = "medio";

  return { proximaReuniao, diasRenovacao, nivel };
}

const RISCO_STYLE = {
  alto: { border: "#E11D2E", bg: "rgba(225,29,46,0.10)", label: "Risco alto" },
  medio: { border: "#EAB308", bg: "rgba(234,179,8,0.10)", label: "Atenção" },
  baixo: { border: "#22C55E", bg: "rgba(34,197,94,0.08)", label: "Saudável" },
};

const SAUDE_LABEL = { positivo: "Positivo", neutro: "Neutro", risco: "Risco de churn" };
const SAUDE_COLOR = { positivo: "#22C55E", neutro: "#EAB308", risco: "#E11D2E" };
const PAG_LABEL = { pago: "Pago", pendente: "Pendente", atrasado: "Atrasado" };
const PAG_COLOR = { pago: "#22C55E", pendente: "#EAB308", atrasado: "#E11D2E" };

function Badge({ color, children }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: color + "22", color }}
    >
      {children}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="uppercase tracking-wide" style={{ color: "#8B8B93", fontFamily: "Inter, sans-serif" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls = "rounded-md px-3 py-2 text-sm bg-transparent outline-none focus:ring-1";

function ClientForm({ client, onSave, onDelete, onCancel, isNew, salvando, mesLabel }) {
  const [local, setLocal] = useState(client);
  useEffect(() => setLocal(client), [client.id]);

  const set = (field, value) => setLocal((prev) => ({ ...prev, [field]: value }));
  const togglePlataforma = (p) =>
    setLocal((prev) => ({
      ...prev,
      plataformas: prev.plataformas.includes(p)
        ? prev.plataformas.filter((x) => x !== p)
        : [...prev.plataformas, p],
    }));

  const inputStyle = { border: "1px solid #2A2A2E", color: "#F4F4F5" };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5" style={{ backgroundColor: "rgba(17,17,20,0.75)", backdropFilter: "blur(6px)" }}>
      <Field label="Nome do cliente">
        <input className={inputCls} style={inputStyle} value={local.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Clínica Vitalis" />
      </Field>
      <Field label="Nicho">
        <input className={inputCls} style={inputStyle} value={local.nicho || ""} onChange={(e) => set("nicho", e.target.value)} placeholder="Saúde, jurídico..." />
      </Field>
      <Field label="Plataformas">
        <div className="flex gap-2 pt-1">
          {["Google", "Meta"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePlataforma(p)}
              className="rounded-md px-3 py-1.5 text-sm"
              style={{
                border: "1px solid #2A2A2E",
                backgroundColor: local.plataformas.includes(p) ? PURPLE + "22" : "transparent",
                color: local.plataformas.includes(p) ? PURPLE : "#8B8B93",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Grupo de WhatsApp">
        <input className={inputCls} style={inputStyle} value={local.grupo_whatsapp || ""} onChange={(e) => set("grupo_whatsapp", e.target.value)} placeholder="Nome do grupo" />
      </Field>
      <Field label="ID do grupo (automação)">
        <input className={inputCls} style={inputStyle} value={local.id_grupo || ""} onChange={(e) => set("id_grupo", e.target.value)} placeholder="120363..." />
      </Field>
      <Field label="Contato responsável">
        <input className={inputCls} style={inputStyle} value={local.contato_nome || ""} onChange={(e) => set("contato_nome", e.target.value)} placeholder="Nome" />
      </Field>
      <Field label="Telefone do contato">
        <input className={inputCls} style={inputStyle} value={local.contato_telefone || ""} onChange={(e) => set("contato_telefone", e.target.value)} placeholder="(21) 9...." />
      </Field>

      <Field label="Valor mensal (R$)">
        <input className={inputCls} style={inputStyle} type="number" value={local.valor_mensal} onChange={(e) => set("valor_mensal", e.target.value)} placeholder="1500" />
      </Field>
      <Field label="Dia de vencimento">
        <input className={inputCls} style={inputStyle} type="number" min="1" max="31" value={local.dia_vencimento || ""} onChange={(e) => set("dia_vencimento", e.target.value)} placeholder="10" />
      </Field>
      <Field label={`Status do pagamento (${mesLabel})`}>
        <select className={inputCls} style={inputStyle} value={local.status_pagamento_mes} onChange={(e) => set("status_pagamento_mes", e.target.value)}>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
          <option value="atrasado">Atrasado</option>
        </select>
      </Field>

      <Field label="Status de saúde do cliente">
        <select className={inputCls} style={inputStyle} value={local.status_saude} onChange={(e) => set("status_saude", e.target.value)}>
          <option value="positivo">Positivo</option>
          <option value="neutro">Neutro</option>
          <option value="risco">Risco de churn</option>
        </select>
      </Field>
      <Field label="Tendência">
        <select className={inputCls} style={inputStyle} value={local.tendencia} onChange={(e) => set("tendencia", e.target.value)}>
          <option value="subindo">Subindo</option>
          <option value="estavel">Estável</option>
          <option value="caindo">Caindo</option>
        </select>
      </Field>
      <Field label="Data da última reunião">
        <input className={inputCls} style={inputStyle} type="date" value={local.data_ultima_reuniao || ""} onChange={(e) => set("data_ultima_reuniao", e.target.value)} />
      </Field>

      <Field label="Início do contrato">
        <input className={inputCls} style={inputStyle} type="date" value={local.data_inicio_contrato || ""} onChange={(e) => set("data_inicio_contrato", e.target.value)} />
      </Field>
      <Field label="Prazo do contrato (meses)">
        <input className={inputCls} style={inputStyle} type="number" value={local.prazo_contrato_meses || ""} onChange={(e) => set("prazo_contrato_meses", e.target.value)} placeholder="3" />
      </Field>
      <Field label="Próxima renovação">
        <input className={inputCls} style={inputStyle} type="date" value={local.data_proxima_renovacao || ""} onChange={(e) => set("data_proxima_renovacao", e.target.value)} />
      </Field>

      <div className="col-span-2 md:col-span-3">
        <Field label="Observação / motivo do status">
          <textarea className={inputCls} style={{ ...inputStyle, minHeight: 60 }} value={local.motivo_observacao || ""} onChange={(e) => set("motivo_observacao", e.target.value)} placeholder="Ex: reclamou do CPL na última reunião, pediu revisão de oferta..." />
        </Field>
      </div>
      <div className="col-span-2 md:col-span-3">
        <Field label="Oportunidade de upsell">
          <input className={inputCls} style={inputStyle} value={local.oportunidade_upsell || ""} onChange={(e) => set("oportunidade_upsell", e.target.value)} placeholder="Ex: só tem Meta, dá pra oferecer Google Ads" />
        </Field>
      </div>

      <div className="col-span-2 md:col-span-3 flex justify-between items-center pt-2">
        <div>
          {!isNew && (
            <button
              onClick={() => onDelete(local.id)}
              disabled={salvando}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md disabled:opacity-50"
              style={{ color: "#E11D2E", border: "1px solid #E11D2E33" }}
            >
              <Trash2 size={14} /> Remover cliente
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={salvando} className="text-xs px-3 py-2 rounded-md disabled:opacity-50" style={{ color: "#8B8B93", border: "1px solid #2A2A2E" }}>
            Cancelar
          </button>
          <button
            onClick={() => onSave(local, isNew)}
            disabled={salvando}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md disabled:opacity-50 transition-[filter] hover:brightness-110"
            style={{ backgroundColor: PURPLE, color: "#fff" }}
          >
            <Save size={14} /> {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent }) {
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
    </div>
  );
}

function SaudeCard({ positivos, neutros, criticos }) {
  const total = positivos + neutros + criticos;
  const score = total > 0 ? Math.round((positivos * 100 + neutros * 50) / total) : 0;
  const pPos = total > 0 ? (positivos / total) * 100 : 0;
  const pNeu = total > 0 ? (neutros / total) * 100 : 0;
  const pRisco = total > 0 ? (criticos / total) * 100 : 0;

  return (
    <div
      className="rounded-2xl p-4 flex-1 min-w-[200px] transition-transform duration-200 hover:-translate-y-0.5"
      style={{ backgroundColor: "rgba(20,20,23,0.7)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(6px)" }}
    >
      <div className="text-xs uppercase tracking-wide mb-3" style={{ color: "#8B8B93" }}>Saúde da carteira</div>
      <div className="text-2xl font-semibold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F4F4F5" }}>{score}%</div>
      <div className="flex h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: "#232327" }}>
        {pPos > 0 && <div style={{ width: `${pPos}%`, backgroundColor: "#22C55E" }} />}
        {pNeu > 0 && <div style={{ width: `${pNeu}%`, backgroundColor: "#EAB308" }} />}
        {pRisco > 0 && <div style={{ width: `${pRisco}%`, backgroundColor: "#E11D2E" }} />}
      </div>
      <div className="text-xs" style={{ color: "#8B8B93" }}>{positivos} positivos · {neutros} neutros · {criticos} críticos</div>
    </div>
  );
}

export default function GestaoClientes() {
  const [clientes, setClientes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState("risco");
  const [erro, setErro] = useState("");

  const hoje = useMemo(() => new Date(new Date().toDateString()), []);
  const mesLabel = mesAtualLabel();

  useEffect(() => {
    (async () => {
      const { data: clientesData, error: clientesError } = await supabase
        .from("clientes")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (clientesError) {
        setErro("Erro ao carregar clientes: " + clientesError.message);
        setLoaded(true);
        return;
      }

      const lista = clientesData || [];
      const mesRef = mesAtualRef();

      const { data: historicoData, error: historicoError } = await supabase
        .from("historico_pagamentos")
        .select("*")
        .eq("mes_referencia", mesRef)
        .in("cliente_id", lista.length ? lista.map((c) => c.id) : [""]);

      if (historicoError) {
        setErro("Erro ao carregar pagamentos do mês: " + historicoError.message);
        setClientes(lista);
        setLoaded(true);
        return;
      }

      const historicoMap = new Map((historicoData || []).map((h) => [h.cliente_id, h]));
      const semRegistro = lista.filter((c) => !historicoMap.has(c.id));

      if (semRegistro.length > 0) {
        const novosRegistros = semRegistro.map((c) => ({
          cliente_id: c.id,
          mes_referencia: mesRef,
          status: "pendente",
        }));
        const { data: criados } = await supabase.from("historico_pagamentos").insert(novosRegistros).select();
        (criados || []).forEach((h) => historicoMap.set(h.cliente_id, h));
      }

      const comPagamentoDoMes = lista.map((c) => ({
        ...c,
        status_pagamento_mes: historicoMap.get(c.id)?.status || "pendente",
      }));

      setClientes(comPagamentoDoMes);
      setLoaded(true);
    })();
  }, []);

  const salvarCliente = async (cliente, isNew) => {
    setSalvando(true);
    setErro("");
    const payload = buildPayload(cliente);
    const mesRef = mesAtualRef();
    let clienteId = cliente.id;

    if (isNew) {
      const { data, error } = await supabase.from("clientes").insert(payload).select().single();
      if (error) {
        setErro("Erro ao criar cliente: " + error.message);
        setSalvando(false);
        return;
      }
      clienteId = data.id;
    } else {
      const { error } = await supabase.from("clientes").update(payload).eq("id", cliente.id);
      if (error) {
        setErro("Erro ao salvar cliente: " + error.message);
        setSalvando(false);
        return;
      }
    }

    const { data: historico, error: historicoError } = await supabase
      .from("historico_pagamentos")
      .upsert(
        {
          cliente_id: clienteId,
          mes_referencia: mesRef,
          status: payload.status_pagamento_mes,
          valor_pago: payload.status_pagamento_mes === "pago" ? payload.valor_mensal : null,
          data_pagamento: payload.status_pagamento_mes === "pago" ? new Date().toISOString().slice(0, 10) : null,
        },
        { onConflict: "cliente_id,mes_referencia" }
      )
      .select()
      .single();

    if (historicoError) {
      setErro("Cliente salvo, mas houve erro ao registrar o pagamento do mês: " + historicoError.message);
    }

    const clienteFinal = { ...payload, id: clienteId, status_pagamento_mes: historico?.status || payload.status_pagamento_mes };

    setClientes((prev) => {
      const existe = prev.some((c) => c.id === clienteId);
      return existe ? prev.map((c) => (c.id === clienteId ? { ...c, ...clienteFinal } : c)) : [...prev, clienteFinal];
    });

    setSalvando(false);
    setExpandedId(null);
    setNovoAberto(false);
  };

  const alternarPagamento = async (cliente) => {
    const novoStatus = cliente.status_pagamento_mes === "pago" ? "pendente" : "pago";
    setErro("");
    setClientes((prev) => prev.map((c) => (c.id === cliente.id ? { ...c, status_pagamento_mes: novoStatus } : c)));

    const { error } = await supabase.from("historico_pagamentos").upsert(
      {
        cliente_id: cliente.id,
        mes_referencia: mesAtualRef(),
        status: novoStatus,
        valor_pago: novoStatus === "pago" ? cliente.valor_mensal : null,
        data_pagamento: novoStatus === "pago" ? new Date().toISOString().slice(0, 10) : null,
      },
      { onConflict: "cliente_id,mes_referencia" }
    );

    if (error) {
      setErro("Erro ao atualizar pagamento: " + error.message);
      setClientes((prev) => prev.map((c) => (c.id === cliente.id ? { ...c, status_pagamento_mes: cliente.status_pagamento_mes } : c)));
    }
  };

  const removerCliente = async (id) => {
    setSalvando(true);
    setErro("");
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) {
      setErro("Erro ao remover cliente: " + error.message);
      setSalvando(false);
      return;
    }
    setClientes((prev) => prev.filter((c) => c.id !== id));
    setSalvando(false);
    setExpandedId(null);
  };

  const enriquecidos = useMemo(
    () => clientes.map((c) => ({ ...c, _d: computeDerived(c, hoje) })),
    [clientes, hoje]
  );

  const filtrados = useMemo(() => {
    let lista = enriquecidos;
    if (filtro === "risco") lista = lista.filter((c) => c._d.nivel === "alto");
    else if (filtro === "pendencia") lista = lista.filter((c) => c.status_pagamento_mes !== "pago");
    else if (filtro === "renovacao") lista = lista.filter((c) => c._d.diasRenovacao !== null && c._d.diasRenovacao <= 30);

    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      lista = lista.filter((c) => (c.nome || "").toLowerCase().includes(termo));
    }
    return lista;
  }, [enriquecidos, filtro, busca]);

  const ordenados = useMemo(() => {
    const peso = { alto: 0, medio: 1, baixo: 2 };
    const lista = [...filtrados];
    if (ordenacao === "nome") return lista.sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
    if (ordenacao === "valor") return lista.sort((a, b) => (Number(b.valor_mensal) || 0) - (Number(a.valor_mensal) || 0));
    if (ordenacao === "renovacao") {
      return lista.sort((a, b) => {
        if (a._d.diasRenovacao === null) return 1;
        if (b._d.diasRenovacao === null) return -1;
        return a._d.diasRenovacao - b._d.diasRenovacao;
      });
    }
    return lista.sort((a, b) => peso[a._d.nivel] - peso[b._d.nivel]);
  }, [filtrados, ordenacao]);

  const totalAtivos = clientes.length;
  const receitaPrevista = clientes.reduce((sum, c) => sum + (Number(c.valor_mensal) || 0), 0);
  const recebidoMes = clientes.filter((c) => c.status_pagamento_mes === "pago").reduce((sum, c) => sum + (Number(c.valor_mensal) || 0), 0);
  const aReceberMes = clientes.filter((c) => c.status_pagamento_mes !== "pago").reduce((sum, c) => sum + (Number(c.valor_mensal) || 0), 0);
  const emRiscoAlto = enriquecidos.filter((c) => c._d.nivel === "alto").length;
  const positivos = clientes.filter((c) => c.status_saude === "positivo").length;
  const neutros = clientes.filter((c) => c.status_saude === "neutro").length;
  const criticos = clientes.filter((c) => c.status_saude === "risco").length;

  if (!loaded) {
    return <div style={{ color: "#8B8B93" }} className="text-sm py-16 text-center">Carregando carteira de clientes...</div>;
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F4F4F5" }}>
          Clientes{" "}
          <span style={{ background: `linear-gradient(90deg, ${PURPLE_LIGHT}, ${PURPLE})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            ativos
          </span>
        </h1>
        <button
          onClick={() => { setNovoAberto(true); setExpandedId(null); }}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-[filter] hover:brightness-110"
          style={{ backgroundColor: PURPLE, color: "#fff" }}
        >
          <Plus size={16} /> Novo cliente
        </button>
      </div>

      {erro && <div className="text-xs mb-3" style={{ color: "#E11D2E" }}>{erro}</div>}

      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard label="Clientes ativos" value={totalAtivos} icon={Users} accent={PURPLE} />
        <StatCard label="Receita prevista (próx. mês)" value={fmtMoney(receitaPrevista)} icon={DollarSign} accent="#22C55E" />
        <StatCard label="Recebido (mês)" value={fmtMoney(recebidoMes)} icon={DollarSign} accent="#22C55E" />
        <StatCard label="A receber (mês)" value={fmtMoney(aReceberMes)} icon={Calendar} accent="#EAB308" />
        <StatCard label="Em risco alto" value={emRiscoAlto} icon={AlertTriangle} accent="#E11D2E" />
        <SaudeCard positivos={positivos} neutros={neutros} criticos={criticos} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
        {[
          { id: "todos", label: "Todos" },
          { id: "risco", label: "Risco alto" },
          { id: "pendencia", label: "Pendência de pagamento" },
          { id: "renovacao", label: "Renovação em até 30 dias" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className="px-3 py-1.5 rounded-full transition-colors"
            style={{
              border: "1px solid #2A2A2E",
              backgroundColor: filtro === f.id ? PURPLE : "transparent",
              color: filtro === f.id ? "#fff" : "#8B8B93",
            }}
            onMouseEnter={(e) => { if (filtro !== f.id) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { if (filtro !== f.id) e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            {f.label}
          </button>
        ))}

        <div className="flex items-center gap-1.5 ml-auto rounded-md px-2.5 py-1.5" style={{ border: "1px solid #2A2A2E" }}>
          <Search size={13} style={{ color: "#8B8B93" }} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="bg-transparent outline-none text-xs w-36"
            style={{ color: "#F4F4F5" }}
          />
        </div>
        <select
          value={ordenacao}
          onChange={(e) => setOrdenacao(e.target.value)}
          className="rounded-md px-2.5 py-1.5 text-xs bg-transparent outline-none"
          style={{ border: "1px solid #2A2A2E", color: "#8B8B93" }}
        >
          <option value="risco" style={{ backgroundColor: "#141417" }}>Ordenar: Risco</option>
          <option value="nome" style={{ backgroundColor: "#141417" }}>Ordenar: Nome</option>
          <option value="valor" style={{ backgroundColor: "#141417" }}>Ordenar: Valor mensal</option>
          <option value="renovacao" style={{ backgroundColor: "#141417" }}>Ordenar: Renovação</option>
        </select>
      </div>

      {novoAberto && (
        <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: "1px solid #2A2A2E" }}>
          <div className="px-5 py-3 text-sm font-medium" style={{ backgroundColor: "#17171B", color: "#F4F4F5", borderBottom: `1px solid ${PURPLE}33` }}>Novo cliente</div>
          <ClientForm client={emptyClient()} onSave={salvarCliente} onCancel={() => setNovoAberto(false)} onDelete={() => {}} isNew salvando={salvando} mesLabel={mesLabel} />
        </div>
      )}

      {ordenados.length === 0 && !novoAberto && (
        <div className="text-sm text-center py-16" style={{ color: "#55555C" }}>
          {clientes.length === 0
            ? 'Nenhum cliente cadastrado ainda. Clique em "Novo cliente" para começar.'
            : "Nenhum cliente encontrado com esse filtro ou busca."}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {ordenados.map((c) => {
          const risco = RISCO_STYLE[c._d.nivel];
          const aberto = expandedId === c.id;
          return (
            <div
              key={c.id}
              className="rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
              style={{ border: `1px solid ${risco.border}55`, borderLeft: `3px solid ${risco.border}`, backgroundColor: risco.bg }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => { setExpandedId(aberto ? null : c.id); setNovoAberto(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") { setExpandedId(aberto ? null : c.id); setNovoAberto(false); } }}
                className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: risco.border }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#F4F4F5" }}>{c.nome || "Sem nome"}</div>
                    <div className="text-xs" style={{ color: "#8B8B93" }}>{c.nicho || "Nicho não definido"} · {fmtMoney(c.valor_mensal)}/mês</div>
                  </div>
                  <Badge color={SAUDE_COLOR[c.status_saude]}>{SAUDE_LABEL[c.status_saude]}</Badge>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Badge color={PAG_COLOR[c.status_pagamento_mes]}>{PAG_LABEL[c.status_pagamento_mes]}</Badge>
                    <PaymentSwitch
                      checked={c.status_pagamento_mes === "pago"}
                      onChange={() => alternarPagamento(c)}
                      disabled={salvando}
                      title={c.status_pagamento_mes === "pago" ? "Marcar como pendente" : "Marcar como pago"}
                    />
                  </div>
                  {c._d.diasRenovacao !== null && c._d.diasRenovacao <= 30 && (
                    <Badge color="#EAB308">Renova em {c._d.diasRenovacao}d</Badge>
                  )}
                  <span className="hidden md:flex items-center gap-1 text-xs" style={{ color: "#8B8B93" }}>
                    {c.tendencia === "subindo" && <TrendingUp size={14} style={{ color: "#22C55E" }} />}
                    {c.tendencia === "caindo" && <TrendingDown size={14} style={{ color: "#E11D2E" }} />}
                    {c.tendencia === "estavel" && <Minus size={14} />}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden md:block text-xs" style={{ color: "#8B8B93" }}>
                    Próx. reunião: {fmtDate(c._d.proximaReuniao)}
                  </span>
                  {aberto ? <ChevronUp size={18} color="#8B8B93" /> : <ChevronDown size={18} color="#8B8B93" />}
                </div>
              </div>
              {aberto && (
                <ClientForm client={c} onSave={salvarCliente} onCancel={() => setExpandedId(null)} onDelete={removerCliente} salvando={salvando} mesLabel={mesLabel} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

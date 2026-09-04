import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, X, Users, TrendingUp, AlertTriangle, Trophy, Search, Save,
  Phone, Mail, Clock, MessageSquare, Ban, Check, Trash2,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { PURPLE, PURPLE_LIGHT, fmtMoney, parseDate, diffDays, inputCls, inputStyle, Badge, Field, StatCard } from "./ui";

const ETAPAS = [
  { id: "novo", label: "Novo", prazoDias: 1 },
  { id: "contato_feito", label: "Contato feito", prazoDias: 5 },
  { id: "qualificado", label: "Qualificado", prazoDias: 7 },
  { id: "reuniao_marcada", label: "Reunião marcada", prazoDias: 7 },
  { id: "proposta_enviada", label: "Proposta enviada", prazoDias: 7 },
  { id: "negociacao", label: "Negociação", prazoDias: 10 },
];
const ETAPA_LABEL = Object.fromEntries(ETAPAS.map((e) => [e.id, e.label]));
const ETAPA_PRAZO = Object.fromEntries(ETAPAS.map((e) => [e.id, e.prazoDias]));
export const PESO_ETAPA = { novo: 0.05, contato_feito: 0.10, qualificado: 0.20, reuniao_marcada: 0.35, proposta_enviada: 0.55, negociacao: 0.75 };

const ORIGEM_LABEL = { trafego_pago: "Tráfego pago", indicacao: "Indicação", instagram: "Instagram", outbound: "Outbound", networking: "Networking", site: "Site" };
const TEMP_LABEL = { quente: "Quente", morno: "Morno", frio: "Frio" };
const TEMP_COLOR = { quente: "#E11D2E", morno: "#EAB308", frio: "#3B82F6" };
const MOTIVOS_PERDA = ["Sem verba", "Achou caro", "Escolheu concorrente", "Sumiu / não respondeu mais", "Não era o perfil", "Momento errado"];

function emptyLead() {
  return {
    nome: "", contato_nome: "", contato_telefone: "", contato_email: "",
    etapa: "novo", origem: "trafego_pago", temperatura: "morno", nicho: "",
    plataformas_interesse: [], valor_mensal_estimado: "",
    proxima_acao: "", data_proxima_acao: "",
  };
}

function alertaLead(lead, hoje) {
  if (lead.etapa === "ganho" || lead.etapa === "perdido") return "neutro";
  if (!lead.data_proxima_acao) return "vermelho";
  const data = parseDate(lead.data_proxima_acao);
  if (data && diffDays(data, hoje) < 0) return "vermelho";
  const referencia = parseDate((lead.data_ultima_interacao || lead.data_entrada || "").slice(0, 10)) || hoje;
  const diasNaEtapa = diffDays(hoje, referencia);
  const prazo = ETAPA_PRAZO[lead.etapa];
  if (prazo && diasNaEtapa > prazo) return "amarelo";
  return "verde";
}

const ALERTA_STYLE = {
  vermelho: { border: "#E11D2E", bg: "var(--card-bg)" },
  amarelo: { border: "#EAB308", bg: "var(--card-bg)" },
  verde: { border: "#22C55E", bg: "var(--card-bg)" },
  neutro: { border: "#3B3448", bg: "var(--card-bg-soft)" },
};

function buildLeadPayload(l) {
  return {
    nome: l.nome || "",
    contato_nome: l.contato_nome || null,
    contato_telefone: l.contato_telefone || null,
    contato_email: l.contato_email || null,
    etapa: l.etapa,
    origem: l.origem,
    temperatura: l.temperatura,
    nicho: l.nicho || null,
    plataformas_interesse: l.plataformas_interesse || [],
    valor_mensal_estimado: l.valor_mensal_estimado === "" || l.valor_mensal_estimado == null ? null : Number(l.valor_mensal_estimado),
    proxima_acao: l.proxima_acao || null,
    data_proxima_acao: l.data_proxima_acao || null,
  };
}

function LeadForm({ lead, onChange }) {
  const set = (field, value) => onChange({ ...lead, [field]: value });
  const togglePlataforma = (p) =>
    onChange({
      ...lead,
      plataformas_interesse: lead.plataformas_interesse.includes(p)
        ? lead.plataformas_interesse.filter((x) => x !== p)
        : [...lead.plataformas_interesse, p],
    });

  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Nome / empresa">
        <input className={inputCls} style={inputStyle} value={lead.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Clínica Vitalis" />
      </Field>
      <Field label="Nicho">
        <input className={inputCls} style={inputStyle} value={lead.nicho || ""} onChange={(e) => set("nicho", e.target.value)} placeholder="Saúde, jurídico..." />
      </Field>
      <Field label="Contato">
        <input className={inputCls} style={inputStyle} value={lead.contato_nome || ""} onChange={(e) => set("contato_nome", e.target.value)} placeholder="Nome" />
      </Field>
      <Field label="Telefone">
        <input className={inputCls} style={inputStyle} value={lead.contato_telefone || ""} onChange={(e) => set("contato_telefone", e.target.value)} placeholder="(21) 9...." />
      </Field>
      <Field label="E-mail">
        <input className={inputCls} style={inputStyle} value={lead.contato_email || ""} onChange={(e) => set("contato_email", e.target.value)} placeholder="contato@empresa.com" />
      </Field>
      <Field label="Valor mensal estimado (R$)">
        <input className={inputCls} style={inputStyle} type="number" value={lead.valor_mensal_estimado || ""} onChange={(e) => set("valor_mensal_estimado", e.target.value)} placeholder="1500" />
      </Field>

      <Field label="Origem">
        <select className={inputCls} style={inputStyle} value={lead.origem} onChange={(e) => set("origem", e.target.value)}>
          {Object.entries(ORIGEM_LABEL).map(([v, l]) => <option key={v} value={v} style={{ backgroundColor: "var(--dropdown-bg)" }}>{l}</option>)}
        </select>
      </Field>
      <Field label="Temperatura">
        <select className={inputCls} style={inputStyle} value={lead.temperatura} onChange={(e) => set("temperatura", e.target.value)}>
          {Object.entries(TEMP_LABEL).map(([v, l]) => <option key={v} value={v} style={{ backgroundColor: "var(--dropdown-bg)" }}>{l}</option>)}
        </select>
      </Field>
      <Field label="Plataformas de interesse">
        <div className="flex gap-2 pt-1">
          {["Google", "Meta"].map((p) => (
            <button key={p} type="button" onClick={() => togglePlataforma(p)}
              className="rounded-md px-3 py-1.5 text-sm"
              style={{ border: "1px solid var(--border)", backgroundColor: lead.plataformas_interesse.includes(p) ? PURPLE + "22" : "transparent", color: lead.plataformas_interesse.includes(p) ? PURPLE : "var(--ink-muted)" }}>
              {p}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Etapa">
        <select className={inputCls} style={inputStyle} value={lead.etapa} onChange={(e) => set("etapa", e.target.value)}>
          {ETAPAS.map((e) => <option key={e.id} value={e.id} style={{ backgroundColor: "var(--dropdown-bg)" }}>{e.label}</option>)}
          <option value="ganho" style={{ backgroundColor: "var(--dropdown-bg)" }}>Ganho</option>
          <option value="perdido" style={{ backgroundColor: "var(--dropdown-bg)" }}>Perdido</option>
        </select>
      </Field>

      <div className="col-span-2">
        <Field label="Próxima ação">
          <input className={inputCls} style={inputStyle} value={lead.proxima_acao || ""} onChange={(e) => set("proxima_acao", e.target.value)} placeholder="Ex: ligar cobrando resposta da proposta" />
        </Field>
      </div>
      <Field label="Data da próxima ação">
        <input className={inputCls} style={inputStyle} type="date" value={lead.data_proxima_acao || ""} onChange={(e) => set("data_proxima_acao", e.target.value)} />
      </Field>
    </div>
  );
}

function ConversaoForm({ lead, dados, onChange }) {
  const set = (field, value) => onChange({ ...dados, [field]: value });
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Nome do cliente"><input className={inputCls} style={inputStyle} value={dados.nome} onChange={(e) => set("nome", e.target.value)} /></Field>
      <Field label="Nicho"><input className={inputCls} style={inputStyle} value={dados.nicho || ""} onChange={(e) => set("nicho", e.target.value)} /></Field>
      <Field label="Contato responsável"><input className={inputCls} style={inputStyle} value={dados.contato_nome || ""} onChange={(e) => set("contato_nome", e.target.value)} /></Field>
      <Field label="Telefone do contato"><input className={inputCls} style={inputStyle} value={dados.contato_telefone || ""} onChange={(e) => set("contato_telefone", e.target.value)} /></Field>
      <Field label="Valor mensal (R$)"><input className={inputCls} style={inputStyle} type="number" value={dados.valor_mensal} onChange={(e) => set("valor_mensal", e.target.value)} /></Field>
      <Field label="Dia de vencimento"><input className={inputCls} style={inputStyle} type="number" min="1" max="31" value={dados.dia_vencimento} onChange={(e) => set("dia_vencimento", e.target.value)} placeholder="10" /></Field>
      <Field label="Início do contrato"><input className={inputCls} style={inputStyle} type="date" value={dados.data_inicio_contrato} onChange={(e) => set("data_inicio_contrato", e.target.value)} /></Field>
      <Field label="Prazo do contrato (meses)"><input className={inputCls} style={inputStyle} type="number" value={dados.prazo_contrato_meses} onChange={(e) => set("prazo_contrato_meses", e.target.value)} /></Field>
      <div className="col-span-2 text-xs" style={{ color: "var(--ink-muted)" }}>
        Depois de criado, o resto (grupo de WhatsApp, renovação, etc.) você completa direto na aba Clientes.
      </div>
    </div>
  );
}

function LeadModal({ lead, isNew, atividades, onClose, onSave, onExcluir, salvando, onRegistrarAtividade, onConverter, onMarcarPerdido }) {
  const [local, setLocal] = useState(lead);
  const [nota, setNota] = useState("");
  const [modo, setModo] = useState("editar"); // editar | converter | perder | excluir
  const [motivoPerda, setMotivoPerda] = useState("");
  const [conv, setConv] = useState(() => ({
    nome: lead.nome, nicho: lead.nicho || "", contato_nome: lead.contato_nome || "",
    contato_telefone: lead.contato_telefone || "", valor_mensal: lead.valor_mensal_estimado || "",
    dia_vencimento: "", data_inicio_contrato: new Date().toISOString().slice(0, 10), prazo_contrato_meses: 3,
  }));

  useEffect(() => setLocal(lead), [lead.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "var(--modal-overlay)" }} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl" style={{ backgroundColor: "var(--dropdown-bg)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 sticky top-0" style={{ backgroundColor: "var(--header-bg)", borderBottom: `1px solid ${PURPLE}33` }}>
          <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{isNew ? "Novo lead" : local.nome || "Lead"}</div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--hover-bg)]" style={{ color: "var(--ink-muted)" }}><X size={18} /></button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {modo === "editar" && (
            <>
              <LeadForm lead={local} onChange={setLocal} />

              {!isNew && (
                <div className="flex flex-col gap-2">
                  <div className="text-xs uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>Registrar interação</div>
                  <div className="flex gap-2">
                    <input className={inputCls + " flex-1"} style={inputStyle} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ex: liguei, disse que vai decidir semana que vem..." />
                    <button
                      onClick={() => { if (nota.trim()) { onRegistrarAtividade(local.id, nota.trim()); setNota(""); } }}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md"
                      style={{ border: "1px solid var(--border)", color: "var(--ink)" }}>
                      <MessageSquare size={14} /> Registrar
                    </button>
                  </div>
                </div>
              )}

              {!isNew && atividades.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-xs uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>Linha do tempo</div>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {atividades.map((a) => (
                      <div key={a.id} className="text-xs rounded-md px-3 py-2" style={{ backgroundColor: "var(--subtle-bg)", color: "var(--ink-muted)" }}>
                        <span style={{ color: "var(--ink-faint)" }}>{new Date(a.data).toLocaleDateString("pt-BR")} · </span>
                        {a.tipo === "mudanca_etapa"
                          ? <>Etapa: <b style={{ color: "var(--ink)" }}>{ETAPA_LABEL[a.etapa_de] || a.etapa_de}</b> → <b style={{ color: "var(--ink)" }}>{ETAPA_LABEL[a.etapa_para] || a.etapa_para}</b></>
                          : a.descricao}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="flex gap-2">
                  {!isNew && local.etapa !== "ganho" && local.etapa !== "perdido" && (
                    <>
                      <button onClick={() => setModo("converter")} disabled={salvando}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md"
                        style={{ backgroundColor: "#22C55E22", color: "#22C55E", border: "1px solid #22C55E44" }}>
                        <Trophy size={14} /> Ganhou
                      </button>
                      <button onClick={() => setModo("perder")} disabled={salvando}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md"
                        style={{ color: "#E11D2E", border: "1px solid #E11D2E33" }}>
                        <Ban size={14} /> Perdido
                      </button>
                    </>
                  )}
                  {!isNew && (
                    <button onClick={() => setModo("excluir")} disabled={salvando}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md"
                      style={{ color: "var(--ink-muted)", border: "1px solid var(--border)" }}>
                      <Trash2 size={14} /> Excluir
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={onClose} disabled={salvando} className="text-xs px-3 py-2 rounded-md disabled:opacity-50" style={{ color: "var(--ink-muted)", border: "1px solid var(--border)" }}>Cancelar</button>
                  <button onClick={() => onSave(local, isNew)} disabled={salvando}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md disabled:opacity-50 transition-[filter] hover:brightness-110"
                    style={{ backgroundColor: PURPLE, color: "#fff" }}>
                    <Save size={14} /> {salvando ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            </>
          )}

          {modo === "converter" && (
            <>
              <div className="text-sm" style={{ color: "var(--ink-muted)" }}>Confirma os dados e o lead vira cliente ativo na aba Clientes.</div>
              <ConversaoForm lead={local} dados={conv} onChange={setConv} />
              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <button onClick={() => setModo("editar")} disabled={salvando} className="text-xs px-3 py-2 rounded-md disabled:opacity-50" style={{ color: "var(--ink-muted)", border: "1px solid var(--border)" }}>Voltar</button>
                <button onClick={() => onConverter(local, conv)} disabled={salvando}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md disabled:opacity-50"
                  style={{ backgroundColor: "#22C55E", color: "#fff" }}>
                  <Check size={14} /> {salvando ? "Convertendo..." : "Confirmar e criar cliente"}
                </button>
              </div>
            </>
          )}

          {modo === "perder" && (
            <>
              <Field label="Motivo da perda">
                <select className={inputCls} style={inputStyle} value={motivoPerda} onChange={(e) => setMotivoPerda(e.target.value)}>
                  <option value="" style={{ backgroundColor: "var(--dropdown-bg)" }}>Selecione...</option>
                  {MOTIVOS_PERDA.map((m) => <option key={m} value={m} style={{ backgroundColor: "var(--dropdown-bg)" }}>{m}</option>)}
                </select>
              </Field>
              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <button onClick={() => setModo("editar")} disabled={salvando} className="text-xs px-3 py-2 rounded-md disabled:opacity-50" style={{ color: "var(--ink-muted)", border: "1px solid var(--border)" }}>Voltar</button>
                <button onClick={() => onMarcarPerdido(local, motivoPerda)} disabled={salvando || !motivoPerda}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md disabled:opacity-50"
                  style={{ backgroundColor: "#E11D2E", color: "#fff" }}>
                  <Ban size={14} /> {salvando ? "Salvando..." : "Confirmar perda"}
                </button>
              </div>
            </>
          )}

          {modo === "excluir" && (
            <>
              <div className="text-sm" style={{ color: "var(--ink)" }}>
                Excluir <b>{local.nome || "este lead"}</b> permanentemente?
              </div>
              <div className="text-xs" style={{ color: "var(--ink-muted)" }}>
                Isso apaga o lead e toda a linha do tempo de interações — não pode ser desfeito. Se é só pra tirar do funil ativo mantendo o histórico, use "Perdido" em vez disso.
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <button onClick={() => setModo("editar")} disabled={salvando} className="text-xs px-3 py-2 rounded-md disabled:opacity-50" style={{ color: "var(--ink-muted)", border: "1px solid var(--border)" }}>Cancelar</button>
                <button onClick={() => onExcluir(local.id)} disabled={salvando}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md disabled:opacity-50"
                  style={{ backgroundColor: "#E11D2E", color: "#fff" }}>
                  <Trash2 size={14} /> {salvando ? "Excluindo..." : "Excluir permanentemente"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Funil() {
  const [leads, setLeads] = useState([]);
  const [atividadesPorLead, setAtividadesPorLead] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState("");
  const [arrastando, setArrastando] = useState(null);
  const [colunaSobre, setColunaSobre] = useState(null);

  const hoje = useMemo(() => new Date(new Date().toDateString()), []);

  const carregar = async () => {
    setLoaded(false);
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (error) { setErro("Erro ao carregar leads: " + error.message); setLoaded(true); return; }
    setLeads(data || []);
    setLoaded(true);
  };

  useEffect(() => { carregar(); }, []);

  const carregarAtividades = async (leadId) => {
    const { data } = await supabase.from("lead_atividades").select("*").eq("lead_id", leadId).order("data", { ascending: false });
    setAtividadesPorLead((prev) => ({ ...prev, [leadId]: data || [] }));
  };

  const abrirLead = (lead) => { setSelecionado(lead); carregarAtividades(lead.id); };

  const enriquecidos = useMemo(() => leads.map((l) => ({ ...l, _alerta: alertaLead(l, hoje) })), [leads, hoje]);

  const filtrados = useMemo(() => {
    let lista;
    if (filtro === "perdidos") lista = enriquecidos.filter((l) => l.etapa === "perdido");
    else if (filtro === "fechados") lista = enriquecidos.filter((l) => l.etapa === "ganho");
    else lista = enriquecidos.filter((l) => l.etapa !== "ganho" && l.etapa !== "perdido");
    if (filtro === "atrasados") lista = lista.filter((l) => l._alerta === "vermelho");
    if (filtro === "quente") lista = lista.filter((l) => l.temperatura === "quente");
    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      lista = lista.filter((l) => (l.nome || "").toLowerCase().includes(termo));
    }
    return lista;
  }, [enriquecidos, filtro, busca]);

  const colunas = useMemo(() => ETAPAS.map((e) => ({ ...e, leads: filtrados.filter((l) => l.etapa === e.id) })), [filtrados]);

  const totalAtivos = leads.filter((l) => l.etapa !== "ganho" && l.etapa !== "perdido").length;
  const mrrPonderado = leads
    .filter((l) => l.etapa !== "ganho" && l.etapa !== "perdido")
    .reduce((sum, l) => sum + (Number(l.valor_mensal_estimado) || 0) * (PESO_ETAPA[l.etapa] || 0), 0);
  const atrasados = enriquecidos.filter((l) => l._alerta === "vermelho").length;
  const mesAtualStr = new Date().toISOString().slice(0, 7);
  const ganhosNoMes = leads.filter((l) => l.etapa === "ganho" && (l.updated_at || "").slice(0, 7) === mesAtualStr).length;

  const salvarLead = async (lead, isNew) => {
    setSalvando(true);
    setErro("");
    const payload = buildLeadPayload(lead);
    if (isNew) {
      const { data, error } = await supabase.from("leads").insert(payload).select().single();
      if (error) { setErro("Erro ao criar lead: " + error.message); setSalvando(false); return; }
      setLeads((prev) => [data, ...prev]);
    } else {
      const { data, error } = await supabase.from("leads").update(payload).eq("id", lead.id).select().single();
      if (error) { setErro("Erro ao salvar lead: " + error.message); setSalvando(false); return; }
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? data : l)));
    }
    setSalvando(false);
    setSelecionado(null);
    setNovoAberto(false);
  };

  const registrarAtividade = async (leadId, descricao) => {
    const { data, error } = await supabase.from("lead_atividades").insert({ lead_id: leadId, tipo: "nota", descricao }).select().single();
    if (error) { setErro("Erro ao registrar interação: " + error.message); return; }
    await supabase.from("leads").update({ data_ultima_interacao: new Date().toISOString() }).eq("id", leadId);
    setAtividadesPorLead((prev) => ({ ...prev, [leadId]: [data, ...(prev[leadId] || [])] }));
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, data_ultima_interacao: new Date().toISOString() } : l)));
  };

  const converterEmCliente = async (lead, dados) => {
    setSalvando(true);
    setErro("");
    const payload = {
      nome: dados.nome, nicho: dados.nicho || null, grupo_whatsapp: null, id_grupo: null,
      contato_nome: dados.contato_nome || null, contato_telefone: dados.contato_telefone || null,
      plataformas: lead.plataformas_interesse || [],
      valor_mensal: dados.valor_mensal === "" ? 0 : Number(dados.valor_mensal),
      dia_vencimento: dados.dia_vencimento === "" ? null : Number(dados.dia_vencimento),
      status_pagamento_mes: "pendente", status_saude: "positivo", tendencia: "estavel",
      data_inicio_contrato: dados.data_inicio_contrato || null,
      prazo_contrato_meses: dados.prazo_contrato_meses === "" ? null : Number(dados.prazo_contrato_meses),
      ativo: true,
    };
    const { data: cliente, error: erroCliente } = await supabase.from("clientes").insert(payload).select().single();
    if (erroCliente) { setErro("Erro ao criar cliente: " + erroCliente.message); setSalvando(false); return; }

    const { error: erroLead } = await supabase.from("leads").update({ etapa: "ganho", cliente_id: cliente.id }).eq("id", lead.id);
    if (erroLead) { setErro("Cliente criado, mas houve erro ao atualizar o lead: " + erroLead.message); }

    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, etapa: "ganho", cliente_id: cliente.id } : l)));
    setSalvando(false);
    setSelecionado(null);
  };

  const moverEtapa = async (leadId, novaEtapa) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.etapa === novaEtapa) return;
    const etapaAnterior = lead.etapa;
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, etapa: novaEtapa } : l)));
    const { error } = await supabase.from("leads").update({ etapa: novaEtapa }).eq("id", leadId);
    if (error) {
      setErro("Erro ao mover lead: " + error.message);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, etapa: etapaAnterior } : l)));
    }
  };

  const alterarTemperatura = async (leadId, novaTemp) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.temperatura === novaTemp) return;
    const anterior = lead.temperatura;
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, temperatura: novaTemp } : l)));
    const { error } = await supabase.from("leads").update({ temperatura: novaTemp }).eq("id", leadId);
    if (error) {
      setErro("Erro ao atualizar temperatura: " + error.message);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, temperatura: anterior } : l)));
    }
  };

  const excluirLead = async (leadId) => {
    setSalvando(true);
    setErro("");
    const { error } = await supabase.from("leads").delete().eq("id", leadId);
    if (error) { setErro("Erro ao excluir lead: " + error.message); setSalvando(false); return; }
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    setSalvando(false);
    setSelecionado(null);
  };

  const marcarPerdido = async (lead, motivo) => {
    setSalvando(true);
    setErro("");
    const { error } = await supabase.from("leads").update({ etapa: "perdido", motivo_perda: motivo }).eq("id", lead.id);
    if (error) { setErro("Erro ao marcar como perdido: " + error.message); setSalvando(false); return; }
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, etapa: "perdido", motivo_perda: motivo } : l)));
    setSalvando(false);
    setSelecionado(null);
  };

  if (!loaded) return <div style={{ color: "var(--ink-muted)" }} className="text-sm py-16 text-center">Carregando funil...</div>;

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--ink)" }}>
          Funil <span style={{ background: `linear-gradient(90deg, ${PURPLE_LIGHT}, ${PURPLE})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>comercial</span>
        </h1>
        <button onClick={() => setNovoAberto(true)} className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-[filter] hover:brightness-110" style={{ backgroundColor: PURPLE, color: "#fff" }}>
          <Plus size={16} /> Novo lead
        </button>
      </div>

      {erro && <div className="text-xs mb-3" style={{ color: "#E11D2E" }}>{erro}</div>}

      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard label="Leads ativos" value={totalAtivos} icon={Users} accent={PURPLE} />
        <StatCard label="MRR ponderado" value={fmtMoney(mrrPonderado)} sub="previsão honesta do funil" icon={TrendingUp} accent="#22C55E" />
        <StatCard label="Atrasados" value={atrasados} sub="sem próxima ação ou vencidos" icon={AlertTriangle} accent="#E11D2E" />
        <StatCard label="Ganhos no mês" value={ganhosNoMes} icon={Trophy} accent="#EAB308" />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
        {[{ id: "todos", label: "Todos" }, { id: "atrasados", label: "Atrasados" }, { id: "quente", label: "Quentes" }, { id: "fechados", label: "Contratos fechados" }, { id: "perdidos", label: "Perdidos" }].map((f) => (
          <button key={f.id} onClick={() => setFiltro(f.id)} className="px-3 py-1.5 rounded-full transition-colors"
            style={{ border: "1px solid var(--border)", backgroundColor: filtro === f.id ? PURPLE : "transparent", color: filtro === f.id ? "#fff" : "var(--ink-muted)" }}>
            {f.label}
          </button>
        ))}
        <div className="flex items-center gap-1.5 ml-auto rounded-md px-2.5 py-1.5" style={{ border: "1px solid var(--border)" }}>
          <Search size={13} style={{ color: "var(--ink-muted)" }} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome..." className="bg-transparent outline-none text-xs w-36" style={{ color: "var(--ink)" }} />
        </div>
      </div>

      {filtro === "perdidos" && (
        <div className="flex flex-col gap-2">
          {filtrados.length === 0 && (
            <div className="text-sm text-center py-16" style={{ color: "var(--ink-faint)" }}>Nenhum lead perdido ainda.</div>
          )}
          {filtrados.map((l) => (
            <div key={l.id} onClick={() => abrirLead(l)}
              className="rounded-xl p-3 cursor-pointer transition-transform duration-150 hover:-translate-y-0.5"
              style={{ border: "1px solid #E11D2E33", borderLeft: "3px solid #E11D2E", backgroundColor: "rgba(225,29,46,0.06)" }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--ink)" }}>{l.nome}</div>
                  <div className="text-xs" style={{ color: "var(--ink-muted)" }}>{l.nicho || "—"}{l.valor_mensal_estimado ? ` · ${fmtMoney(l.valor_mensal_estimado)}` : ""}</div>
                </div>
                <Badge color={TEMP_COLOR[l.temperatura]}>{TEMP_LABEL[l.temperatura]}</Badge>
              </div>
              {l.motivo_perda && (
                <div className="text-xs mt-2" style={{ color: "var(--ink-muted)" }}>Motivo: <b style={{ color: "var(--ink)" }}>{l.motivo_perda}</b></div>
              )}
            </div>
          ))}
        </div>
      )}

      {filtro === "fechados" && (
        <div className="flex flex-col gap-2">
          {filtrados.length === 0 && (
            <div className="text-sm text-center py-16" style={{ color: "var(--ink-faint)" }}>Nenhum contrato fechado ainda.</div>
          )}
          {filtrados.map((l) => (
            <div key={l.id} onClick={() => abrirLead(l)}
              className="rounded-xl p-3 cursor-pointer transition-transform duration-150 hover:-translate-y-0.5"
              style={{ border: "1px solid #22C55E33", borderLeft: "3px solid #22C55E", backgroundColor: "var(--card-bg)" }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--ink)" }}>{l.nome}</div>
                  <div className="text-xs" style={{ color: "var(--ink-muted)" }}>{l.nicho || "—"}{l.valor_mensal_estimado ? ` · ${fmtMoney(l.valor_mensal_estimado)}` : ""}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge color="#22C55E">Fechado</Badge>
                  <span className="text-xs" style={{ color: "var(--ink-faint)" }}>{l.updated_at ? new Date(l.updated_at).toLocaleDateString("pt-BR") : ""}</span>
                </div>
              </div>
              <div className="text-xs mt-2" style={{ color: "var(--ink-muted)" }}>Origem: <b style={{ color: "var(--ink)" }}>{ORIGEM_LABEL[l.origem] || l.origem}</b></div>
            </div>
          ))}
        </div>
      )}

      {filtro !== "perdidos" && filtro !== "fechados" && (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {colunas.map((col) => {
          const emFoco = colunaSobre === col.id;
          return (
            <div key={col.id} className="flex flex-col gap-2 w-[240px] shrink-0">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>{col.label}</span>
                <span className="text-xs" style={{ color: "var(--ink-faint)" }}>{col.leads.length}</span>
              </div>
              <div
                className="flex flex-col gap-2 rounded-xl transition-colors duration-100 min-h-[60px]"
                style={{
                  outline: emFoco ? `2px dashed ${PURPLE}` : "2px dashed transparent",
                  outlineOffset: 4,
                  backgroundColor: emFoco ? PURPLE + "14" : "transparent",
                }}
                onDragOver={(e) => { e.preventDefault(); if (colunaSobre !== col.id) setColunaSobre(col.id); }}
                onDragLeave={() => setColunaSobre((c) => (c === col.id ? null : c))}
                onDrop={(e) => {
                  e.preventDefault();
                  const leadId = e.dataTransfer.getData("text/plain");
                  moverEtapa(leadId, col.id);
                  setColunaSobre(null);
                  setArrastando(null);
                }}
              >
                {col.leads.map((l) => {
                  const estilo = ALERTA_STYLE[l._alerta];
                  const sendoArrastado = arrastando === l.id;
                  return (
                    <div key={l.id}
                      draggable
                      onDragStart={(e) => { setArrastando(l.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", l.id); }}
                      onDragEnd={() => { setArrastando(null); setColunaSobre(null); }}
                      onClick={() => abrirLead(l)}
                      className="rounded-xl p-3 cursor-grab active:cursor-grabbing transition-transform duration-150 hover:-translate-y-0.5"
                      style={{
                        border: `1px solid ${estilo.border}55`, borderLeft: `3px solid ${estilo.border}`, backgroundColor: estilo.bg,
                        opacity: sendoArrastado ? 0.35 : 1,
                      }}>
                      <div className="text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>{l.nome}</div>
                      <div className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>{l.nicho || "—"}{l.valor_mensal_estimado ? ` · ${fmtMoney(l.valor_mensal_estimado)}` : ""}</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <select
                          value={l.temperatura}
                          draggable={false}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onChange={(e) => alterarTemperatura(l.id, e.target.value)}
                          title="Mudar temperatura"
                          className="text-xs font-medium rounded-full pl-2.5 pr-1.5 py-0.5 outline-none cursor-pointer appearance-none"
                          style={{ backgroundColor: TEMP_COLOR[l.temperatura] + "22", color: TEMP_COLOR[l.temperatura], border: "none" }}
                        >
                          {Object.entries(TEMP_LABEL).map(([value, label]) => (
                            <option key={value} value={value} style={{ backgroundColor: "var(--dropdown-bg)", color: "var(--ink)" }}>{label}</option>
                          ))}
                        </select>
                        {l.data_proxima_acao && <span className="text-xs flex items-center gap-1" style={{ color: "var(--ink-muted)" }}><Clock size={11} /> {new Date(l.data_proxima_acao + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>}
                      </div>
                    </div>
                  );
                })}
                {col.leads.length === 0 && <div className="text-xs text-center py-6 rounded-xl" style={{ color: "#3B3448", border: "1px dashed var(--border)" }}>vazio</div>}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {novoAberto && (
        <LeadModal lead={emptyLead()} isNew atividades={[]} onClose={() => setNovoAberto(false)} onSave={salvarLead} salvando={salvando}
          onRegistrarAtividade={() => {}} onConverter={() => {}} onMarcarPerdido={() => {}} onExcluir={() => {}} />
      )}

      {selecionado && (
        <LeadModal lead={selecionado} isNew={false} atividades={atividadesPorLead[selecionado.id] || []}
          onClose={() => setSelecionado(null)} onSave={salvarLead} salvando={salvando}
          onRegistrarAtividade={registrarAtividade} onConverter={converterEmCliente} onMarcarPerdido={marcarPerdido} onExcluir={excluirLead} />
      )}
    </div>
  );
}

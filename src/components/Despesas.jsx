import React, { useState, useEffect, useMemo } from "react";
import { Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trash2, Save, Repeat, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { mesAtualRef, addMeses, labelMes } from "../lib/mes";

const PURPLE = "#8B5CF6";

function fmtMoney(v) {
  const n = Number(v) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

const CATEGORIA_LABEL = {
  ferramentas: "Ferramentas",
  trafego: "Tráfego próprio",
  folha: "Folha/equipe",
  aluguel: "Aluguel/infra",
  impostos: "Impostos",
  outros: "Outros",
};

const CATEGORIAS_SUGERIDAS = ["Ferramentas", "Tráfego próprio", "Folha/equipe", "Aluguel/infra", "Impostos", "Curso", "Outros"];

function categoriaLabel(cat) {
  return CATEGORIA_LABEL[cat] || cat || "Outros";
}

function fmtMesAno(ref) {
  if (!ref) return "";
  const d = new Date(ref + "T00:00:00");
  const label = d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function primeiroDiaDoMes(mesInput) {
  return mesInput ? `${mesInput}-01` : null;
}

const emptyDespesa = () => ({
  descricao: "",
  categoria: "Outros",
  valor: "",
  recorrente: true,
  mes_final: null,
  observacao: "",
  pago: false,
});

function buildPayload(d) {
  return {
    descricao: d.descricao || "",
    categoria: d.categoria || "Outros",
    valor: d.valor === "" || d.valor === null || d.valor === undefined ? 0 : Number(d.valor),
    recorrente: !!d.recorrente,
    mes_final: d.recorrente ? d.mes_final || null : null,
    observacao: d.observacao || null,
  };
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="uppercase tracking-wide" style={{ color: "#8B8B93" }}>{label}</span>
      {children}
    </label>
  );
}

const inputCls = "rounded-md px-3 py-2 text-sm bg-transparent outline-none focus:ring-1";

function StatCard({ label, value, icon: Icon, accent }) {
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
    </div>
  );
}

function MonthNav({ mesRef, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full px-1.5 py-1" style={{ border: "1px solid #2A2A2E" }}>
      <button
        onClick={() => onChange(addMeses(mesRef, -1))}
        className="flex items-center justify-center rounded-full p-1 transition-colors hover:bg-white/5"
        style={{ color: "#8B8B93" }}
        title="Mês anterior"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-xs font-medium px-2" style={{ color: "#F4F4F5" }}>{labelMes(mesRef)}</span>
      <button
        onClick={() => onChange(addMeses(mesRef, 1))}
        className="flex items-center justify-center rounded-full p-1 transition-colors hover:bg-white/5"
        style={{ color: "#8B8B93" }}
        title="Próximo mês"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function DespesaForm({ despesa, onSave, onDelete, onCancel, isNew, salvando, mesLabel }) {
  const [local, setLocal] = useState(despesa);
  useEffect(() => setLocal(despesa), [despesa.id]);

  const set = (field, value) => setLocal((prev) => ({ ...prev, [field]: value }));
  const inputStyle = { border: "1px solid #2A2A2E", color: "#F4F4F5" };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5" style={{ backgroundColor: "rgba(17,17,20,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="col-span-2 md:col-span-3">
        <Field label="Descrição">
          <input className={inputCls} style={inputStyle} value={local.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex: Assinatura Meta Ads Manager" />
        </Field>
      </div>

      <Field label="Categoria">
        <input
          className={inputCls}
          style={inputStyle}
          list="categorias-sugeridas"
          value={local.categoria}
          onChange={(e) => set("categoria", e.target.value)}
          placeholder="Ex: Curso, Ferramentas..."
        />
        <datalist id="categorias-sugeridas">
          {CATEGORIAS_SUGERIDAS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field label={`Valor (${mesLabel})`}>
        <input className={inputCls} style={inputStyle} type="number" value={local.valor} onChange={(e) => set("valor", e.target.value)} placeholder="500" />
      </Field>
      <Field label={`Status (${mesLabel})`}>
        <select className={inputCls} style={inputStyle} value={local.pago ? "pago" : "pendente"} onChange={(e) => set("pago", e.target.value === "pago")}>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
        </select>
      </Field>

      <div className="col-span-2 md:col-span-3 flex flex-col gap-3">
        <label className="flex items-center gap-2 text-xs" style={{ color: "#8B8B93" }}>
          <input
            type="checkbox"
            checked={local.recorrente}
            onChange={(e) => set("recorrente", e.target.checked)}
          />
          Despesa recorrente (repete automaticamente todo mês)
        </label>

        {local.recorrente && (
          <div className="flex flex-col gap-2 pl-5">
            <label className="flex items-center gap-2 text-xs" style={{ color: "#8B8B93" }}>
              <input
                type="checkbox"
                checked={!!local.mes_final}
                onChange={(e) => set("mes_final", e.target.checked ? primeiroDiaDoMes(new Date().toISOString().slice(0, 7)) : null)}
              />
              Parcelado (tem última parcela)
            </label>
            {local.mes_final && (
              <div className="max-w-[200px]">
                <Field label="Última parcela (mês)">
                  <input
                    className={inputCls}
                    style={inputStyle}
                    type="month"
                    value={local.mes_final.slice(0, 7)}
                    onChange={(e) => set("mes_final", primeiroDiaDoMes(e.target.value))}
                  />
                </Field>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="col-span-2 md:col-span-3">
        <Field label="Observação">
          <textarea className={inputCls} style={{ ...inputStyle, minHeight: 60 }} value={local.observacao || ""} onChange={(e) => set("observacao", e.target.value)} placeholder="Opcional" />
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
              <Trash2 size={14} /> Remover despesa
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

export default function Despesas() {
  const [mesRef, setMesRef] = useState(mesAtualRef());
  const [despesas, setDespesas] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const [erro, setErro] = useState("");

  const mesLabel = labelMes(mesRef);

  useEffect(() => {
    setLoaded(false);
    setExpandedId(null);
    setNovoAberto(false);
    (async () => {
      const { data: despesasData, error: despesasError } = await supabase
        .from("despesas")
        .select("*")
        .eq("ativo", true)
        .order("descricao");

      if (despesasError) {
        setErro("Erro ao carregar despesas: " + despesasError.message);
        setLoaded(true);
        return;
      }

      const lista = despesasData || [];

      const { data: historicoData, error: historicoError } = await supabase
        .from("historico_despesas")
        .select("*")
        .eq("mes_referencia", mesRef)
        .in("despesa_id", lista.length ? lista.map((d) => d.id) : [""]);

      if (historicoError) {
        setErro("Erro ao carregar lançamentos do mês: " + historicoError.message);
        setLoaded(true);
        return;
      }

      const historicoMap = new Map((historicoData || []).map((h) => [h.despesa_id, h]));

      // Só gera lançamentos automáticos de despesas recorrentes para o mês atual de verdade —
      // navegar por meses passados/futuros nunca deve fabricar histórico.
      if (mesRef === mesAtualRef()) {
        const semRegistro = lista.filter(
          (d) => d.recorrente && !historicoMap.has(d.id) && (!d.mes_final || mesRef <= d.mes_final)
        );

        if (semRegistro.length > 0) {
          const novosRegistros = semRegistro.map((d) => ({
            despesa_id: d.id,
            mes_referencia: mesRef,
            valor: d.valor,
            pago: false,
          }));
          const { data: criados } = await supabase.from("historico_despesas").insert(novosRegistros).select();
          (criados || []).forEach((h) => historicoMap.set(h.despesa_id, h));
        }
      }

      const comHistorico = lista
        .filter((d) => historicoMap.has(d.id))
        .map((d) => {
          const h = historicoMap.get(d.id);
          return { ...d, valor: h.valor, pago: h.pago };
        });

      setDespesas(comHistorico);
      setLoaded(true);
    })();
  }, [mesRef]);

  const salvarDespesa = async (despesa, isNew) => {
    setSalvando(true);
    setErro("");
    const payload = buildPayload(despesa);
    let despesaId = despesa.id;

    if (isNew) {
      const { data, error } = await supabase.from("despesas").insert(payload).select().single();
      if (error) {
        setErro("Erro ao criar despesa: " + error.message);
        setSalvando(false);
        return;
      }
      despesaId = data.id;
    } else {
      const { error } = await supabase.from("despesas").update(payload).eq("id", despesa.id);
      if (error) {
        setErro("Erro ao salvar despesa: " + error.message);
        setSalvando(false);
        return;
      }
    }

    const { data: historico, error: historicoError } = await supabase
      .from("historico_despesas")
      .upsert(
        {
          despesa_id: despesaId,
          mes_referencia: mesRef,
          valor: payload.valor,
          pago: !!despesa.pago,
          data_pagamento: despesa.pago ? new Date().toISOString().slice(0, 10) : null,
        },
        { onConflict: "despesa_id,mes_referencia" }
      )
      .select()
      .single();

    if (historicoError) {
      setErro("Despesa salva, mas houve erro ao registrar o lançamento do mês: " + historicoError.message);
    }

    const despesaFinal = { ...payload, id: despesaId, valor: historico?.valor ?? payload.valor, pago: historico?.pago ?? !!despesa.pago };

    setDespesas((prev) => {
      const existe = prev.some((d) => d.id === despesaId);
      return existe ? prev.map((d) => (d.id === despesaId ? { ...d, ...despesaFinal } : d)) : [...prev, despesaFinal];
    });

    setSalvando(false);
    setExpandedId(null);
    setNovoAberto(false);
  };

  const removerDespesa = async (id) => {
    setSalvando(true);
    setErro("");
    const { error } = await supabase.from("despesas").update({ ativo: false }).eq("id", id);
    if (error) {
      setErro("Erro ao remover despesa: " + error.message);
      setSalvando(false);
      return;
    }
    setDespesas((prev) => prev.filter((d) => d.id !== id));
    setSalvando(false);
    setExpandedId(null);
  };

  const totalMes = useMemo(() => despesas.reduce((sum, d) => sum + (Number(d.valor) || 0), 0), [despesas]);
  const pagas = despesas.filter((d) => d.pago).length;
  const pendentes = despesas.filter((d) => !d.pago).length;
  const recorrentes = despesas.filter((d) => d.recorrente).length;

  const ordenadas = useMemo(() => [...despesas].sort((a, b) => (a.descricao || "").localeCompare(b.descricao || "", "pt-BR")), [despesas]);

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F4F4F5" }}>
          Despesas da operação
        </h1>
        <button
          onClick={() => { setNovoAberto(true); setExpandedId(null); }}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-[filter] hover:brightness-110"
          style={{ backgroundColor: PURPLE, color: "#fff" }}
        >
          <Plus size={16} /> Nova despesa
        </button>
      </div>

      <div className="mb-5">
        <MonthNav mesRef={mesRef} onChange={setMesRef} />
      </div>

      {erro && <div className="text-xs mb-3" style={{ color: "#E11D2E" }}>{erro}</div>}

      {!loaded ? (
        <div style={{ color: "#8B8B93" }} className="text-sm py-16 text-center">Carregando despesas...</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-6">
            <StatCard label={`Total (${mesLabel})`} value={fmtMoney(totalMes)} icon={DollarSign} accent="#D97706" />
            <StatCard label="Pagas" value={pagas} icon={CheckCircle2} accent="#22C55E" />
            <StatCard label="Pendentes" value={pendentes} icon={Clock} accent="#EAB308" />
            <StatCard label="Recorrentes ativas" value={recorrentes} icon={Repeat} accent={PURPLE} />
          </div>

          {novoAberto && (
            <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: "1px solid #2A2A2E" }}>
              <div className="px-5 py-3 text-sm font-medium" style={{ backgroundColor: "#17171B", color: "#F4F4F5", borderBottom: `1px solid ${PURPLE}33` }}>Nova despesa</div>
              <DespesaForm despesa={emptyDespesa()} onSave={salvarDespesa} onCancel={() => setNovoAberto(false)} onDelete={() => {}} isNew salvando={salvando} mesLabel={mesLabel} />
            </div>
          )}

          {ordenadas.length === 0 && !novoAberto && (
            <div className="text-sm text-center py-16" style={{ color: "#55555C" }}>
              Nenhuma despesa lançada em {mesLabel}. Clique em "Nova despesa" para começar.
            </div>
          )}

          <div className="flex flex-col gap-3">
            {ordenadas.map((d) => {
              const aberto = expandedId === d.id;
              const corStatus = d.pago ? "#22C55E" : "#EAB308";
              return (
                <div
                  key={d.id}
                  className="rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ border: `1px solid ${corStatus}55`, borderLeft: `3px solid ${corStatus}`, backgroundColor: `${corStatus}1A` }}
                >
                  <button
                    onClick={() => { setExpandedId(aberto ? null : d.id); setNovoAberto(false); }}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: corStatus }} />
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "#F4F4F5" }}>{d.descricao || "Sem descrição"}</div>
                        <div className="text-xs" style={{ color: "#8B8B93" }}>{categoriaLabel(d.categoria)} · {fmtMoney(d.valor)}</div>
                      </div>
                      {d.recorrente && (
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#8B8B93" }}>
                          <Repeat size={12} /> {d.mes_final ? `Até ${fmtMesAno(d.mes_final)}` : "Recorrente"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: corStatus }}>{d.pago ? "Pago" : "Pendente"}</span>
                      {aberto ? <ChevronUp size={18} color="#8B8B93" /> : <ChevronDown size={18} color="#8B8B93" />}
                    </div>
                  </button>
                  {aberto && (
                    <DespesaForm despesa={d} onSave={salvarDespesa} onCancel={() => setExpandedId(null)} onDelete={removerDespesa} salvando={salvando} mesLabel={mesLabel} />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

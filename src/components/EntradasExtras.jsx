import React, { useState, useEffect, useMemo } from "react";
import { Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trash2, Save, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { mesAtualRef, addMeses, labelMes } from "../lib/mes";

const PURPLE = "#8B5CF6";

function fmtMoney(v) {
  const n = Number(v) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function fmtDate(str) {
  if (!str) return "—";
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function mesReferenciaDe(dataEntrada) {
  const d = dataEntrada || hoje();
  return d.slice(0, 7) + "-01";
}

const CATEGORIAS_SUGERIDAS = ["Venda de site", "Serviço avulso", "Consultoria", "Curso/mentoria (venda)", "Outros"];

const emptyEntrada = (mesRef) => ({
  descricao: "",
  categoria: "Outros",
  valor: "",
  data_entrada: mesRef === mesAtualRef() ? hoje() : mesRef,
  recebido: false,
  observacao: "",
});

function buildPayload(e) {
  return {
    descricao: e.descricao || "",
    categoria: e.categoria || "Outros",
    valor: e.valor === "" || e.valor === null || e.valor === undefined ? 0 : Number(e.valor),
    data_entrada: e.data_entrada || hoje(),
    recebido: !!e.recebido,
    data_recebimento: e.recebido ? new Date().toISOString().slice(0, 10) : null,
    observacao: e.observacao || null,
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

function EntradaForm({ entrada, onSave, onDelete, onCancel, isNew, salvando }) {
  const [local, setLocal] = useState(entrada);
  useEffect(() => setLocal(entrada), [entrada.id]);

  const set = (field, value) => setLocal((prev) => ({ ...prev, [field]: value }));
  const inputStyle = { border: "1px solid #2A2A2E", color: "#F4F4F5" };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5" style={{ backgroundColor: "rgba(17,17,20,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="col-span-2 md:col-span-3">
        <Field label="Descrição">
          <input className={inputCls} style={inputStyle} value={local.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex: Venda de página para Clínica X" />
        </Field>
      </div>

      <Field label="Categoria">
        <input
          className={inputCls}
          style={inputStyle}
          list="categorias-entradas-sugeridas"
          value={local.categoria}
          onChange={(e) => set("categoria", e.target.value)}
          placeholder="Ex: Venda de site..."
        />
        <datalist id="categorias-entradas-sugeridas">
          {CATEGORIAS_SUGERIDAS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field label="Valor">
        <input className={inputCls} style={inputStyle} type="number" value={local.valor} onChange={(e) => set("valor", e.target.value)} placeholder="800" />
      </Field>
      <Field label="Data da entrada">
        <input className={inputCls} style={inputStyle} type="date" value={local.data_entrada || hoje()} onChange={(e) => set("data_entrada", e.target.value)} />
      </Field>

      <div className="col-span-2 md:col-span-3">
        <Field label="Status do recebimento">
          <select className={inputCls} style={{ ...inputStyle, maxWidth: 220 }} value={local.recebido ? "recebido" : "pendente"} onChange={(e) => set("recebido", e.target.value === "recebido")}>
            <option value="pendente">Pendente</option>
            <option value="recebido">Recebido</option>
          </select>
        </Field>
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
              <Trash2 size={14} /> Remover entrada
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

export default function EntradasExtras() {
  const [mesRef, setMesRef] = useState(mesAtualRef());
  const [entradas, setEntradas] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    setLoaded(false);
    setExpandedId(null);
    setNovoAberto(false);
    (async () => {
      const { data, error } = await supabase
        .from("entradas_extras")
        .select("*")
        .eq("ativo", true)
        .eq("mes_referencia", mesRef)
        .order("data_entrada", { ascending: false });

      if (error) {
        setErro("Erro ao carregar entradas: " + error.message);
        setLoaded(true);
        return;
      }

      setEntradas(data || []);
      setLoaded(true);
    })();
  }, [mesRef]);

  const salvarEntrada = async (entrada, isNew) => {
    setSalvando(true);
    setErro("");
    const payload = buildPayload(entrada);
    const mesRefEntrada = mesReferenciaDe(payload.data_entrada);

    if (isNew) {
      const { data, error } = await supabase
        .from("entradas_extras")
        .insert({ ...payload, mes_referencia: mesRefEntrada })
        .select()
        .single();
      if (error) {
        setErro("Erro ao criar entrada: " + error.message);
        setSalvando(false);
        return;
      }
      if (mesRefEntrada === mesRef) setEntradas((prev) => [...prev, data]);
    } else {
      const { data, error } = await supabase
        .from("entradas_extras")
        .update({ ...payload, mes_referencia: mesRefEntrada })
        .eq("id", entrada.id)
        .select()
        .single();
      if (error) {
        setErro("Erro ao salvar entrada: " + error.message);
        setSalvando(false);
        return;
      }
      setEntradas((prev) => (mesRefEntrada === mesRef ? prev.map((e) => (e.id === entrada.id ? data : e)) : prev.filter((e) => e.id !== entrada.id)));
    }

    setSalvando(false);
    setExpandedId(null);
    setNovoAberto(false);
  };

  const removerEntrada = async (id) => {
    setSalvando(true);
    setErro("");
    const { error } = await supabase.from("entradas_extras").update({ ativo: false }).eq("id", id);
    if (error) {
      setErro("Erro ao remover entrada: " + error.message);
      setSalvando(false);
      return;
    }
    setEntradas((prev) => prev.filter((e) => e.id !== id));
    setSalvando(false);
    setExpandedId(null);
  };

  const totalMes = useMemo(() => entradas.reduce((sum, e) => sum + (Number(e.valor) || 0), 0), [entradas]);
  const recebidas = entradas.filter((e) => e.recebido).length;
  const pendentes = entradas.filter((e) => !e.recebido).length;

  const ordenadas = useMemo(() => [...entradas].sort((a, b) => (b.data_entrada || "").localeCompare(a.data_entrada || "")), [entradas]);

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F4F4F5" }}>
          Entradas extras
        </h1>
        <button
          onClick={() => { setNovoAberto(true); setExpandedId(null); }}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-[filter] hover:brightness-110"
          style={{ backgroundColor: PURPLE, color: "#fff" }}
        >
          <Plus size={16} /> Nova entrada
        </button>
      </div>

      <div className="mb-5">
        <MonthNav mesRef={mesRef} onChange={setMesRef} />
      </div>

      {erro && <div className="text-xs mb-3" style={{ color: "#E11D2E" }}>{erro}</div>}

      {!loaded ? (
        <div style={{ color: "#8B8B93" }} className="text-sm py-16 text-center">Carregando entradas extras...</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-6">
            <StatCard label={`Total (${labelMes(mesRef)})`} value={fmtMoney(totalMes)} icon={DollarSign} accent={PURPLE} />
            <StatCard label="Recebidas" value={recebidas} icon={CheckCircle2} accent="#22C55E" />
            <StatCard label="Pendentes" value={pendentes} icon={Clock} accent="#EAB308" />
          </div>

          {novoAberto && (
            <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: "1px solid #2A2A2E" }}>
              <div className="px-5 py-3 text-sm font-medium" style={{ backgroundColor: "#17171B", color: "#F4F4F5", borderBottom: `1px solid ${PURPLE}33` }}>Nova entrada</div>
              <EntradaForm entrada={emptyEntrada(mesRef)} onSave={salvarEntrada} onCancel={() => setNovoAberto(false)} onDelete={() => {}} isNew salvando={salvando} />
            </div>
          )}

          {ordenadas.length === 0 && !novoAberto && (
            <div className="text-sm text-center py-16" style={{ color: "#55555C" }}>
              Nenhuma entrada extra em {labelMes(mesRef)}. Clique em "Nova entrada" para começar.
            </div>
          )}

          <div className="flex flex-col gap-3">
            {ordenadas.map((e) => {
              const aberto = expandedId === e.id;
              const corStatus = e.recebido ? "#22C55E" : "#EAB308";
              return (
                <div
                  key={e.id}
                  className="rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ border: `1px solid ${corStatus}55`, borderLeft: `3px solid ${corStatus}`, backgroundColor: `${corStatus}1A` }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setExpandedId(aberto ? null : e.id); setNovoAberto(false); }}
                    onKeyDown={(ev) => { if (ev.key === "Enter") { setExpandedId(aberto ? null : e.id); setNovoAberto(false); } }}
                    className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: corStatus }} />
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "#F4F4F5" }}>{e.descricao || "Sem descrição"}</div>
                        <div className="text-xs" style={{ color: "#8B8B93" }}>{e.categoria} · {fmtMoney(e.valor)} · {fmtDate(e.data_entrada)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: corStatus }}>{e.recebido ? "Recebido" : "Pendente"}</span>
                      {aberto ? <ChevronUp size={18} color="#8B8B93" /> : <ChevronDown size={18} color="#8B8B93" />}
                    </div>
                  </div>
                  {aberto && (
                    <EntradaForm entrada={e} onSave={salvarEntrada} onCancel={() => setExpandedId(null)} onDelete={removerEntrada} salvando={salvando} />
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

export const PURPLE = "#8B5CF6";
export const PURPLE_LIGHT = "#C4B5FD";

export function fmtMoney(v) {
  const n = Number(v) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function parseDate(str) {
  if (!str) return null;
  const d = new Date(str + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

export function diffDays(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export const inputCls = "rounded-md px-3 py-2 text-sm bg-transparent outline-none focus:ring-1";
export const inputStyle = { border: "1px solid #2A2A2E", color: "#F4F4F5" };

export function Badge({ color, children }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: color + "22", color }}
    >
      {children}
    </span>
  );
}

export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="uppercase tracking-wide" style={{ color: "#8B8B93" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export function StatCard({ label, value, sub, icon: Icon, accent }) {
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

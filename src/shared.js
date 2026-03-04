// shared.js
export const API_URL =
  "https://script.google.com/macros/s/AKfycbwDJZilqySP8zZBHetfQyd-xloh3dz_eKbpwwkLiKohqeQDIRPM8L_H6AjtTU7CSYaT/exec";

export const T = {
  gold:    "#D4AF37",
  goldDim: "#a88a20",
  goldBg:  "rgba(212,175,55,0.10)",
  bg:      "#07080a",
  card:    "#0e1015",
  surface: "#13161d",
  border:  "#1e2330",
  borderHi:"#2e3550",
  text:    "#e8eaf0",
  muted:   "#6b7394",
  danger:  "#ef4444",
  success: "#22c55e",
  warn:    "#f59e0b",
};

export const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: ${T.bg}; color: ${T.text}; font-family: 'Inter', system-ui, sans-serif; }
  input, select, textarea, button { font-family: inherit; }
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
  input[type=time]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pop     { 0%{transform:scale(0.88);opacity:0} 60%{transform:scale(1.03)} 100%{transform:scale(1);opacity:1} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .fadeUp { animation: fadeUp 0.3s ease both; }
  .pop    { animation: pop 0.35s cubic-bezier(.34,1.56,.64,1) both; }
`;

export function injectGlobalStyles() {
  if (document.getElementById("bd-css")) return;
  const s = document.createElement("style");
  s.id = "bd-css";
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 16, color = T.gold }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size, flexShrink: 0,
      border: `2px solid rgba(255,255,255,0.08)`, borderTop: `2px solid ${color}`,
      borderRadius: "50%", animation: "spin 0.7s linear infinite",
    }}/>
  );
}

// ── Label ────────────────────────────────────────────────────────────────────
export function Label({ text, required }) {
  return (
    <div style={{
      color: T.muted, fontSize: 10, fontWeight: 600,
      letterSpacing: "0.12em", textTransform: "uppercase",
      marginTop: 14, marginBottom: 5,
    }}>
      {text}{required && <span style={{ color: T.danger }}> ✱</span>}
    </div>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────
export function Input({ style, ...props }) {
  return (
    <input
      style={{
        width: "100%", padding: "10px 12px", background: T.surface,
        border: `1px solid ${T.border}`, color: T.text,
        borderRadius: 8, fontSize: 14, outline: "none",
        transition: "border-color 0.15s", ...style,
      }}
      onFocus={e => (e.target.style.borderColor = T.goldDim)}
      onBlur={e  => (e.target.style.borderColor = T.border)}
      {...props}
    />
  );
}

// ── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ style, ...props }) {
  return (
    <textarea
      style={{
        width: "100%", padding: "10px 12px", background: T.surface,
        border: `1px solid ${T.border}`, color: T.text,
        borderRadius: 8, fontSize: 14, resize: "vertical",
        minHeight: 100, outline: "none", lineHeight: 1.6,
        transition: "border-color 0.15s", ...style,
      }}
      onFocus={e => (e.target.style.borderColor = T.goldDim)}
      onBlur={e  => (e.target.style.borderColor = T.border)}
      {...props}
    />
  );
}

// ── Select ───────────────────────────────────────────────────────────────────
export function Select({ children, style, ...props }) {
  return (
    <select
      style={{
        width: "100%", padding: "10px 12px", background: T.surface,
        border: `1px solid ${T.border}`, color: T.text,
        borderRadius: 8, fontSize: 14, outline: "none", appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7394' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
        transition: "border-color 0.15s", ...style,
      }}
      onFocus={e => (e.target.style.borderColor = T.goldDim)}
      onBlur={e  => (e.target.style.borderColor = T.border)}
      {...props}
    >
      {children}
    </select>
  );
}

// ── GoldBtn ──────────────────────────────────────────────────────────────────
export function GoldBtn({ children, disabled, loading, onClick, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%", padding: "13px 16px",
        background: disabled ? "#1e2230" : T.gold,
        color: disabled ? T.muted : "#000",
        border: "none", borderRadius: 8,
        fontWeight: 800, fontSize: 13, letterSpacing: "0.1em",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "all 0.15s", opacity: loading ? 0.85 : 1, ...style,
      }}
    >
      {loading && <Spinner size={14} color={disabled ? T.muted : "#000"} />}
      {children}
    </button>
  );
}

// ── GhostBtn ─────────────────────────────────────────────────────────────────
export function GhostBtn({ children, onClick, danger, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: "11px 16px", background: "transparent",
        color: danger ? T.danger : T.text,
        border: `1px solid ${danger ? "rgba(239,68,68,0.3)" : T.border}`,
        borderRadius: 8, fontWeight: 600, fontSize: 13, letterSpacing: "0.06em",
        cursor: "pointer", transition: "all 0.15s", ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = T.surface;
        e.currentTarget.style.borderColor = danger ? T.danger : T.borderHi;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = danger ? "rgba(239,68,68,0.3)" : T.border;
      }}
    >
      {children}
    </button>
  );
}

// ── Card shell ───────────────────────────────────────────────────────────────
export function PageShell({ children, maxW = 480, animate = "fadeUp" }) {
  return (
    <div style={{
      background: T.bg, minHeight: "100vh", width: "100%",
      display: "flex", justifyContent: "center", alignItems: "flex-start",
      padding: "24px 12px 60px", boxSizing: "border-box",
    }}>
      <div
        className={animate}
        style={{
          width: "100%", maxWidth: maxW, background: T.card,
          borderRadius: 14, border: `1px solid ${T.border}`,
          borderLeft: `3px solid ${T.gold}`, padding: "24px 20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Logo ─────────────────────────────────────────────────────────────────────
export function Logo({ sub = "FIELD COMMAND" }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      <div style={{ color: T.gold, fontSize: 10, fontWeight: 700, letterSpacing: "0.45em" }}>
        BLACK DROP TRUCKING
      </div>
      <div style={{ color: T.gold, fontSize: 22, fontWeight: 800, letterSpacing: "0.2em", marginTop: 2 }}>
        {sub}
      </div>
      <div style={{ width: 36, height: 2, background: T.gold, margin: "8px auto 0" }} />
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    PENDING:      { color: T.warn,    bg: "rgba(245,158,11,0.12)",  dot: T.warn },
    APPROVED:     { color: T.success, bg: "rgba(34,197,94,0.12)",   dot: T.success },
    "BOUNCE BACK":{ color: T.danger,  bg: "rgba(239,68,68,0.12)",   dot: T.danger },
  };
  const s = map[status] ?? { color: T.muted, bg: T.surface, dot: T.muted };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99,
      background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0,
        animation: status === "PENDING" ? "pulse 1.5s ease infinite" : "none",
      }}/>
      {status}
    </span>
  );
}

// ── ErrorMsg ─────────────────────────────────────────────────────────────────
export function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      color: T.danger, fontSize: 12, marginTop: 8, padding: "8px 12px",
      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
      borderRadius: 6, textAlign: "center",
    }}>
      ⚠ {msg}
    </div>
  );
}

// ── SectionCard ───────────────────────────────────────────────────────────────
export function SectionCard({ title, children, right }) {
  return (
    <div style={{
      background: T.surface, borderRadius: 10, padding: 16,
      border: `1px solid ${T.border}`, marginBottom: 12,
    }}>
      {title && (
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 14,
        }}>
          <div style={{
            color: T.gold, fontSize: 12, fontWeight: 700, letterSpacing: "0.15em",
          }}>
            {title}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

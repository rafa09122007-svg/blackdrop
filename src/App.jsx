import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_URL =
  "https://script.google.com/macros/s/AKfycbwDJZilqySP8zZBHetfQyd-xloh3dz_eKbpwwkLiKohqeQDIRPM8L_H6AjtTU7CSYaT/exec";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const T = {
  gold: "#D4AF37",
  goldDim: "#a88a20",
  goldGlow: "rgba(212,175,55,0.12)",
  bg: "#07080a",
  card: "#0e1015",
  surface: "#13161d",
  border: "#1e2330",
  borderHi: "#2e3550",
  text: "#e8eaf0",
  muted: "#6b7394",
  danger: "#ef4444",
  success: "#22c55e",
  warn: "#f59e0b",
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { height: -webkit-fill-available; }
  body {
    background: ${T.bg}; color: ${T.text}; font-family: 'DM Sans', sans-serif;
    min-height: 100vh; min-height: -webkit-fill-available;
    -webkit-text-size-adjust: 100%;
  }
  input, select, textarea, button { font-family: inherit; }
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.7); }
  input[type=time]::-webkit-calendar-picker-indicator { filter: invert(0.7); }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pop { 0%{transform:scale(0.9);opacity:0} 60%{transform:scale(1.02)} 100%{transform:scale(1);opacity:1} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .fadeUp { animation: fadeUp 0.3s ease both; }
  .pop { animation: pop 0.35s cubic-bezier(.34,1.56,.64,1) both; }

  /* Photo capture modal */
  .bd-photo-modal {
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(0,0,0,0.92); backdrop-filter: blur(8px);
    display: flex; flex-direction: column;
    transition: opacity 0.2s ease;
  }
  .bd-photo-modal[data-open="false"] { opacity:0; pointer-events:none; }
  .bd-photo-modal[data-open="true"] { opacity:1; pointer-events:all; }

  body.bd-locked {
    position: fixed;
    top: var(--bd-scroll-y, 0px);
    left: 0; right: 0;
    overflow: hidden;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
`;

function injectGlobalStyles() {
  if (document.getElementById("bd-global")) return;
  const s = document.createElement("style");
  s.id = "bd-global";
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

// ─── SESSION STORAGE HELPERS (survives refreshes within tab) ─────────────────
// Using sessionStorage so form state persists if you accidentally navigate away
// but clears when you close the tab (clean slate next session).
const SESSION_KEY = "bd_form_draft";

function saveDraft(data) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
}
function loadDraft() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function clearDraft() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────────
function useVW() {
  const [vw, setVw] = useState(window.innerWidth);
  useEffect(() => {
    const fn = () => setVw(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return { vw, small: vw < 400 };
}

// ─── SHARED UI COMPONENTS ────────────────────────────────────────────────────
function Spinner({ size = 16, color = T.gold }) {
  return (
    <span
      style={{
        display: "inline-block", width: size, height: size,
        border: `2px solid rgba(255,255,255,0.08)`,
        borderTop: `2px solid ${color}`,
        borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0,
      }}
    />
  );
}

function Label({ text, required }) {
  return (
    <div
      style={{
        color: T.muted, fontSize: 10, fontWeight: 600,
        letterSpacing: "0.12em", textTransform: "uppercase",
        marginTop: 14, marginBottom: 5,
      }}
    >
      {text}
      {required && <span style={{ color: T.danger }}> ✱</span>}
    </div>
  );
}

function Input({ style, ...props }) {
  return (
    <input
      style={{
        width: "100%", padding: "10px 12px", background: T.surface,
        border: `1px solid ${T.border}`, color: T.text, borderRadius: 8,
        fontSize: 14, outline: "none", transition: "border-color 0.2s",
        WebkitAppearance: "none", appearance: "none", ...style,
      }}
      onFocus={(e) => (e.target.style.borderColor = T.goldDim)}
      onBlur={(e) => (e.target.style.borderColor = T.border)}
      {...props}
    />
  );
}

function Textarea({ style, ...props }) {
  return (
    <textarea
      style={{
        width: "100%", padding: "10px 12px", background: T.surface,
        border: `1px solid ${T.border}`, color: T.text, borderRadius: 8,
        fontSize: 14, resize: "vertical", minHeight: 72, outline: "none",
        lineHeight: 1.5, transition: "border-color 0.2s", ...style,
      }}
      onFocus={(e) => (e.target.style.borderColor = T.goldDim)}
      onBlur={(e) => (e.target.style.borderColor = T.border)}
      {...props}
    />
  );
}

function Select({ children, style, ...props }) {
  return (
    <select
      style={{
        width: "100%", padding: "10px 34px 10px 12px", background: T.surface,
        border: `1px solid ${T.border}`, color: T.text, borderRadius: 8,
        fontSize: 14, outline: "none", appearance: "none", WebkitAppearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7394' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
        transition: "border-color 0.2s", ...style,
      }}
      onFocus={(e) => (e.target.style.borderColor = T.goldDim)}
      onBlur={(e) => (e.target.style.borderColor = T.border)}
      {...props}
    >
      {children}
    </select>
  );
}

function GoldBtn({ children, disabled, loading, onClick, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%", padding: "14px 14px",
        background: disabled ? "#2a2d38" : `linear-gradient(135deg, ${T.gold}, #c9a52e)`,
        color: disabled ? T.muted : "#000",
        border: "none", borderRadius: 10,
        fontWeight: 700, fontSize: 13, letterSpacing: "0.1em",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "all 0.2s", opacity: loading ? 0.85 : 1,
        fontFamily: "'Rajdhani',sans-serif",
        WebkitTapHighlightColor: "transparent",
        boxShadow: disabled ? "none" : "0 4px 20px rgba(212,175,55,0.25)",
        ...style,
      }}
    >
      {loading && <Spinner size={14} color={disabled ? "#6b7394" : "#000"} />}
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, style }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", padding: "13px 14px", background: hovered ? T.surface : "transparent",
        color: T.text, border: `1px solid ${hovered ? T.borderHi : T.border}`, borderRadius: 10,
        fontWeight: 600, fontSize: 13, letterSpacing: "0.08em",
        cursor: "pointer", transition: "all 0.2s",
        fontFamily: "'Rajdhani',sans-serif",
        WebkitTapHighlightColor: "transparent", ...style,
      }}
    >
      {children}
    </button>
  );
}

function PageShell({ children, maxW = 480 }) {
  return (
    <div
      style={{
        background: T.bg, minHeight: "100vh",
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        padding: "14px 10px 60px",
      }}
    >
      <div
        className="fadeUp"
        style={{
          width: "100%", maxWidth: maxW, background: T.card,
          borderRadius: 14, border: `1px solid ${T.border}`,
          borderLeft: `3px solid ${T.gold}`, padding: "18px 14px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Logo({ sub }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 20 }}>
      <div
        style={{
          color: T.gold, fontSize: 10, fontWeight: 700,
          letterSpacing: "0.4em", fontFamily: "'Rajdhani',sans-serif",
        }}
      >
        BLACK DROP TRUCKING
      </div>
      <div
        style={{
          color: T.gold, fontSize: 21, fontWeight: 700,
          letterSpacing: "0.18em", fontFamily: "'Rajdhani',sans-serif", marginTop: 3,
        }}
      >
        {sub}
      </div>
      <div style={{ width: 36, height: 2, background: T.gold, margin: "8px auto 0", borderRadius: 1 }} />
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING: { color: T.warn, bg: "rgba(245,158,11,0.12)", dot: "#f59e0b" },
    APPROVED: { color: T.success, bg: "rgba(34,197,94,0.12)", dot: "#22c55e" },
    "BOUNCE BACK": { color: T.danger, bg: "rgba(239,68,68,0.12)", dot: "#ef4444" },
  };
  const s = map[status] || { color: T.muted, bg: T.surface, dot: T.muted };
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 9px", borderRadius: 99, background: s.bg,
        color: s.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0,
          animation: status === "PENDING" ? "pulse 1.5s ease infinite" : "none",
        }}
      />
      {status}
    </span>
  );
}

// ─── PHOTO CAPTURE MODAL (replaces the old scanner) ─────────────────────────
// Simple: take/choose a photo, see it with an alignment guide box, confirm or retake.
function PhotoCaptureModal({ open, onClose, onUse }) {
  const [photoSrc, setPhotoSrc] = useState(null);
  const fileRef = useRef(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    if (open) {
      setPhotoSrc(null);
      scrollRef.current = window.scrollY;
      document.documentElement.style.setProperty("--bd-scroll-y", `-${scrollRef.current}px`);
      document.body.classList.add("bd-locked");
    } else {
      document.body.classList.remove("bd-locked");
      document.documentElement.style.removeProperty("--bd-scroll-y");
      window.scrollTo(0, scrollRef.current);
    }
    return () => {
      document.body.classList.remove("bd-locked");
      document.documentElement.style.removeProperty("--bd-scroll-y");
    };
  }, [open]);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoSrc(ev.target.result);
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  function handleUse() {
    if (photoSrc) {
      onUse(photoSrc);
      onClose();
    }
  }

  return (
    <div className="bd-photo-modal" data-open={open ? "true" : "false"}>
      {/* Header */}
      <div
        style={{
          flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingTop: "max(14px, env(safe-area-inset-top, 14px))",
          paddingBottom: 12, paddingLeft: 14, paddingRight: 14,
          background: T.card, borderBottom: `1px solid ${T.border}`,
        }}
      >
        <button
          onClick={onClose}
          style={{
            width: 40, height: 40, borderRadius: 10, background: T.surface,
            border: `1px solid ${T.border}`, color: T.text, fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", WebkitTapHighlightColor: "transparent", flexShrink: 0,
          }}
        >
          ✕
        </button>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ color: T.gold, fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", fontFamily: "'Rajdhani',sans-serif" }}>
            {photoSrc ? "REVIEW PHOTO" : "CAPTURE DOCUMENT"}
          </div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
            {photoSrc ? "Make sure the document is clear and readable" : "Take a photo or choose from gallery"}
          </div>
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Image area */}
      <div
        style={{
          flex: 1, minHeight: 0, position: "relative", background: "#050505",
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
        }}
      >
        {!photoSrc && (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              textAlign: "center", color: T.muted, cursor: "pointer", padding: 32, gap: 16,
            }}
          >
            {/* Alignment guide hint */}
            <div
              style={{
                width: 180, height: 240, border: `2px dashed ${T.goldDim}`,
                borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}
            >
              <div style={{ fontSize: 48, opacity: 0.5 }}>📄</div>
              {/* Corner marks */}
              {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y], i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    [y === 0 ? "top" : "bottom"]: -2,
                    [x === 0 ? "left" : "right"]: -2,
                    width: 16, height: 16,
                    borderColor: T.gold, borderStyle: "solid", borderWidth: 0,
                    [y === 0 ? "borderTopWidth" : "borderBottomWidth"]: 3,
                    [x === 0 ? "borderLeftWidth" : "borderRightWidth"]: 3,
                    borderRadius: x === 0 && y === 0 ? "6px 0 0 0" : x === 1 && y === 0 ? "0 6px 0 0" : x === 0 && y === 1 ? "0 0 0 6px" : "0 0 6px 0",
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
              Photograph your document
            </div>
            <div style={{ fontSize: 12, opacity: 0.6, lineHeight: 1.5 }}>
              Align the document within the frame for best results
            </div>
            <div
              style={{
                marginTop: 4, padding: "14px 36px", background: T.goldGlow,
                border: `1px solid ${T.goldDim}`, borderRadius: 12,
                color: T.gold, fontWeight: 700, fontSize: 14, letterSpacing: "0.08em",
                fontFamily: "'Rajdhani',sans-serif",
              }}
            >
              TAP TO CAPTURE
            </div>
          </div>
        )}

        {photoSrc && (
          <div style={{ position: "relative", maxWidth: "100%", maxHeight: "100%", display: "flex" }}>
            <img
              src={photoSrc}
              alt="Captured document"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
            />
            {/* Alignment overlay guide */}
            <div
              style={{
                position: "absolute", inset: "6%",
                border: `2px dashed rgba(212,175,55,0.35)`,
                borderRadius: 8, pointerEvents: "none",
              }}
            >
              {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y], i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    [y === 0 ? "top" : "bottom"]: -2,
                    [x === 0 ? "left" : "right"]: -2,
                    width: 20, height: 20,
                    borderColor: T.gold, borderStyle: "solid", borderWidth: 0,
                    [y === 0 ? "borderTopWidth" : "borderBottomWidth"]: 3,
                    [x === 0 ? "borderLeftWidth" : "borderRightWidth"]: 3,
                    borderRadius: x === 0 && y === 0 ? "6px 0 0 0" : x === 1 && y === 0 ? "0 6px 0 0" : x === 0 && y === 1 ? "0 0 0 6px" : "0 0 6px 0",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div
        style={{
          flexShrink: 0, background: T.card, borderTop: `1px solid ${T.border}`,
          padding: `12px 14px max(14px, env(safe-area-inset-bottom, 14px)) 14px`,
          display: "flex", flexDirection: "column", gap: 8,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              setPhotoSrc(null);
              if (!photoSrc) fileRef.current?.click();
            }}
            style={{
              flex: 1, height: 50, background: T.surface, color: T.text,
              border: `1px solid ${T.border}`, borderRadius: 10,
              fontWeight: 600, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              WebkitTapHighlightColor: "transparent",
              fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.05em",
            }}
          >
            {photoSrc ? "🔄 RETAKE" : "📁 GALLERY"}
          </button>
          {photoSrc ? (
            <button
              onClick={handleUse}
              style={{
                flex: 2, height: 50, background: `linear-gradient(135deg, ${T.gold}, #c9a52e)`,
                color: "#000", border: "none", borderRadius: 10,
                fontWeight: 800, fontSize: 14, letterSpacing: "0.08em",
                cursor: "pointer", WebkitTapHighlightColor: "transparent",
                fontFamily: "'Rajdhani',sans-serif",
                boxShadow: "0 4px 16px rgba(212,175,55,0.3)",
              }}
            >
              ✓ USE THIS PHOTO
            </button>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                flex: 2, height: 50, background: `linear-gradient(135deg, ${T.gold}, #c9a52e)`,
                color: "#000", border: "none", borderRadius: 10,
                fontWeight: 800, fontSize: 14, letterSpacing: "0.08em",
                cursor: "pointer", WebkitTapHighlightColor: "transparent",
                fontFamily: "'Rajdhani',sans-serif",
                boxShadow: "0 4px 16px rgba(212,175,55,0.3)",
              }}
            >
              📷 TAKE PHOTO
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            width: "100%", height: 42, background: "transparent",
            color: T.muted, border: `1px solid ${T.border}`, borderRadius: 10,
            fontWeight: 600, fontSize: 13, cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            fontFamily: "'Rajdhani',sans-serif",
          }}
        >
          CANCEL
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFile}
      />
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!phone || phone.length < 7) {
      setError("Enter a valid phone number.");
      return;
    }
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(API_URL + "?t=" + Date.now());
      if (!res.ok) throw new Error("Server error");
      const list = await res.json();
      const ok = list.some((p) => String(p).trim() === phone.trim());
      if (ok) {
        onLogin(phone.trim());
      } else {
        setError("This number is not authorized.");
        setLoading(false);
      }
    } catch {
      setError("Connection failed. Check your signal.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: T.bg, minHeight: "100vh",
        display: "flex", justifyContent: "center", alignItems: "center", padding: 16,
      }}
    >
      <div
        className="pop"
        style={{
          width: "100%", maxWidth: 360, background: T.card,
          borderRadius: 16, border: `1px solid ${T.border}`,
          borderLeft: `3px solid ${T.gold}`, padding: "30px 20px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
        }}
      >
        <Logo sub="FIELD COMMAND" />
        <Label text="Phone Number" required />
        <Input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="e.g. 4325551234"
          value={phone}
          maxLength={15}
          onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, ""));
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
        {error && (
          <div style={{ color: T.danger, fontSize: 12, marginTop: 8, textAlign: "center" }}>
            ⚠ {error}
          </div>
        )}
        <GoldBtn style={{ marginTop: 18 }} loading={loading} onClick={handleLogin}>
          {loading ? "VERIFYING..." : "ENTER FIELD COMMAND"}
        </GoldBtn>
        <div style={{ color: T.muted, fontSize: 11, textAlign: "center", marginTop: 14, letterSpacing: "0.05em" }}>
          Authorized personnel only
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ phone, onLogout, onStartTicket, onOpenQueue }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div
      style={{
        background: T.bg, minHeight: "100vh",
        display: "flex", justifyContent: "center", alignItems: "center", padding: 16,
      }}
    >
      <div
        className="pop"
        style={{
          width: "100%", maxWidth: 360, background: T.card,
          borderRadius: 16, border: `1px solid ${T.border}`,
          borderLeft: `3px solid ${T.gold}`, padding: "28px 20px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
        }}
      >
        <Logo sub="FIELD COMMAND" />
        <div
          style={{
            background: T.surface, borderRadius: 10, padding: "12px 14px",
            marginBottom: 20, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", gap: 11,
          }}
        >
          <div
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: T.goldGlow, border: `1px solid ${T.goldDim}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}
          >
            👷
          </div>
          <div>
            <div style={{ color: T.muted, fontSize: 10, letterSpacing: "0.1em" }}>{greeting}</div>
            <div style={{ color: T.text, fontWeight: 600, fontSize: 14 }}>{phone}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <GoldBtn onClick={onStartTicket}>SUBMIT NEW TICKET</GoldBtn>
          <GhostBtn onClick={onOpenQueue}>SUBMISSION QUEUE</GhostBtn>
          <GhostBtn onClick={onLogout} style={{ color: T.muted, borderColor: "#1a1d26" }}>
            ← LOG OUT
          </GhostBtn>
        </div>
        <div
          style={{
            marginTop: 20, paddingTop: 14, borderTop: `1px solid ${T.border}`,
            color: T.muted, fontSize: 10, textAlign: "center", letterSpacing: "0.1em",
          }}
        >
          BLACK DROP TRUCKING LLC
        </div>
      </div>
    </div>
  );
}

// ─── QUEUE ────────────────────────────────────────────────────────────────────
function Queue({ phone, onEdit, onBack }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}?mode=queue&phone=${phone}&t=${Date.now()}`);
        const data = await res.json();
        if (!cancelled) setTickets(Array.isArray(data) ? [...data].reverse() : []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [phone]);

  const counts = useMemo(
    () => ({
      total: tickets.length,
      pending: tickets.filter((t) => t["Status"] === "PENDING").length,
      bounce: tickets.filter((t) => t["Status"] === "BOUNCE BACK").length,
      approved: tickets.filter((t) => t["Status"] === "APPROVED").length,
    }),
    [tickets]
  );

  return (
    <PageShell maxW={520}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent", border: `1px solid ${T.border}`,
            color: T.muted, borderRadius: 8, padding: "7px 12px",
            cursor: "pointer", fontSize: 13, flexShrink: 0,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          ← Back
        </button>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: T.gold, fontFamily: "'Rajdhani',sans-serif",
              fontSize: 16, fontWeight: 700, letterSpacing: "0.12em",
            }}
          >
            SUBMISSION QUEUE
          </div>
          <div style={{ color: T.muted, fontSize: 11 }}>{counts.total} submissions found</div>
        </div>
      </div>

      {!loading && !error && counts.total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginBottom: 16 }}>
          {[
            { label: "Pending", val: counts.pending, color: T.warn },
            { label: "Approved", val: counts.approved, color: T.success },
            { label: "Bounce", val: counts.bounce, color: T.danger },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: T.surface, borderRadius: 8, padding: "9px 10px",
                border: `1px solid ${T.border}`, textAlign: "center",
              }}
            >
              <div
                style={{
                  color: s.color, fontSize: 22, fontWeight: 700,
                  fontFamily: "'Space Mono',monospace",
                }}
              >
                {s.val}
              </div>
              <div style={{ color: T.muted, fontSize: 10, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div
          style={{
            textAlign: "center", padding: 40, display: "flex",
            flexDirection: "column", alignItems: "center", gap: 12, color: T.muted,
          }}
        >
          <Spinner size={24} /> Loading queue...
        </div>
      )}
      {error && (
        <div style={{ color: T.danger, textAlign: "center", padding: 32 }}>
          ⚠ Failed to load. Check your connection.
        </div>
      )}
      {!loading && !error && tickets.length === 0 && (
        <div style={{ color: T.muted, textAlign: "center", padding: 40 }}>
          No submissions found for this number.
        </div>
      )}

      {tickets.map((ticket, i) => {
        const status = ticket["Status"] || "";
        const isBounce = status === "BOUNCE BACK";
        return (
          <div
            key={ticket["Submission ID"] || i}
            style={{
              background: T.surface, borderRadius: 10, padding: 14, marginBottom: 10,
              border: `1px solid ${isBounce ? "rgba(239,68,68,0.3)" : T.border}`,
              borderLeft: `3px solid ${isBounce ? T.danger : status === "APPROVED" ? T.success : T.warn}`,
            }}
          >
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 10, gap: 7,
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Mono',monospace", color: T.text,
                  fontSize: 11, fontWeight: 700, wordBreak: "break-all",
                }}
              >
                {ticket["Submission ID"]}
              </div>
              <StatusBadge status={status} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
              {[
                ["Client", ticket["Client"]],
                ["Created", ticket["Timestamp"] ? new Date(ticket["Timestamp"]).toLocaleString() : "—"],
                ticket["Field Ticket #"] ? ["Field Ticket", ticket["Field Ticket #"]] : null,
                ticket["Driver"] ? ["Driver", ticket["Driver"]] : null,
              ]
                .filter(Boolean)
                .map(([k, v]) => (
                  <div key={k}>
                    <div style={{ color: T.muted, fontSize: 10 }}>{k}</div>
                    <div style={{ color: T.text, fontSize: 12 }}>{v}</div>
                  </div>
                ))}
            </div>
            {ticket["Notes"] && (
              <div
                style={{
                  marginTop: 8, padding: "7px 10px", background: T.bg,
                  borderRadius: 6, color: T.muted, fontSize: 12, fontStyle: "italic",
                }}
              >
                {ticket["Notes"]}
              </div>
            )}
            {isBounce && (
              <button
                onClick={() => onEdit(ticket)}
                style={{
                  marginTop: 10, width: "100%", padding: "10px 14px",
                  background: T.goldGlow, border: `1px solid ${T.goldDim}`,
                  color: T.gold, borderRadius: 8, fontWeight: 700, fontSize: 12,
                  letterSpacing: "0.1em", cursor: "pointer",
                  fontFamily: "'Rajdhani',sans-serif",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                EDIT & RESUBMIT
              </button>
            )}
          </div>
        );
      })}
    </PageShell>
  );
}

// ─── TICKET SUCCESS ───────────────────────────────────────────────────────────
function TicketSuccess({ onBack }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: T.bg,
        display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999,
      }}
    >
      <div
        className="pop"
        style={{
          background: T.card, padding: "40px 30px", borderRadius: 16,
          textAlign: "center", border: `1px solid ${T.border}`,
          borderLeft: `3px solid ${T.gold}`, maxWidth: 340, width: "90%",
        }}
      >
        <div
          style={{
            width: 60, height: 60, borderRadius: "50%", margin: "0 auto 16px",
            background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, color: T.success,
          }}
        >
          ✓
        </div>
        <div
          style={{
            color: T.gold, fontFamily: "'Rajdhani',sans-serif",
            fontSize: 22, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8,
          }}
        >
          TICKET SUBMITTED
        </div>
        <div style={{ color: T.muted, fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
          Your field ticket has been received and is pending review.
        </div>
        <GoldBtn onClick={onBack}>BACK TO DASHBOARD</GoldBtn>
      </div>
    </div>
  );
}

// ─── SUBMIT TICKET ────────────────────────────────────────────────────────────
function SubmitTicket({ phone, onComplete, editTicket, onBack }) {
  const { small } = useVW();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const today = useMemo(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  }, []);

  const defaultForm = useMemo(() => {
    if (editTicket) {
      return {
        client: editTicket["Client"] || "",
        fieldTicket: editTicket["Field Ticket #"] || "",
        dispatch: editTicket["Dispatch #"] || "",
        unit: editTicket["Unit #"] || "",
        driver: editTicket["Driver"] || "",
        workDate: editTicket["Service Date"] || today,
        wellLease: editTicket["Well/Lease"] || "",
        notes: editTicket["Notes"] || "",
        fieldTicketImage: "",
        startTime: editTicket["Start Time"] || "",
        endTime: editTicket["End Time"] || "",
        hourlyRate: editTicket["Hourly Rate"] || "",
      };
    }
    // Try to restore from session draft
    const draft = loadDraft();
    if (draft && draft.form) return draft.form;
    return {
      client: "", fieldTicket: "", dispatch: "", unit: "",
      driver: "", workDate: today, wellLease: "", notes: "",
      fieldTicketImage: "", startTime: "", endTime: "", hourlyRate: "",
    };
  }, [editTicket, today]);

  const defaultLoads = useMemo(() => {
    if (editTicket) {
      return [{
        id: 1, geminiRef: "", loadTicket: "", fluid: "Fresh Water",
        bbls: "", manifestOps: { washOut: false, unload: false }, verificationImage: "",
      }];
    }
    const draft = loadDraft();
    if (draft && draft.loads) return draft.loads;
    return [{
      id: 1, geminiRef: "", loadTicket: "", fluid: "Fresh Water",
      bbls: "", manifestOps: { washOut: false, unload: false }, verificationImage: "",
    }];
  }, [editTicket]);

  const [form, setForm] = useState(defaultForm);
  const [loads, setLoads] = useState(defaultLoads);
  const [submissionId] = useState(editTicket ? editTicket["Submission ID"] : null);
  const [photoTarget, setPhotoTarget] = useState(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const sigRef = useRef(null);
  const drawing = useRef(false);

  // Auto-save draft to sessionStorage whenever form or loads change
  useEffect(() => {
    if (!editTicket) {
      saveDraft({ form, loads });
    }
  }, [form, loads, editTicket]);

  const isExxon = form.client === "Exxon";

  function update(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }
  function updateLoad(i, k, v) {
    setLoads((p) => {
      const c = [...p];
      c[i] = { ...c[i], [k]: v };
      return c;
    });
  }
  function addLoad() {
    setLoads((p) => [
      ...p,
      {
        id: p.length + 1, geminiRef: "", loadTicket: "", fluid: "Fresh Water",
        bbls: "", manifestOps: { washOut: false, unload: false }, verificationImage: "",
      },
    ]);
  }
  function deleteLoad(i) {
    setLoads((p) => p.filter((_, idx) => idx !== i));
  }
  function toggleOp(i, op) {
    setLoads((p) => {
      const c = [...p];
      c[i] = { ...c[i], manifestOps: { ...c[i].manifestOps, [op]: !c[i].manifestOps[op] } };
      return c;
    });
  }

  const totalBBLS = useMemo(
    () => loads.reduce((s, l) => s + (parseFloat(l.bbls) || 0), 0),
    [loads]
  );

  function nonEmpty(v) {
    return String(v ?? "").trim().length > 0;
  }
  function loadOk(l) {
    const base =
      (!isExxon || nonEmpty(l.geminiRef)) &&
      nonEmpty(l.loadTicket) &&
      nonEmpty(l.bbls) &&
      !isNaN(parseFloat(l.bbls)) &&
      parseFloat(l.bbls) > 0;
    return l.fluid === "Manifest" ? base && (l.manifestOps.washOut || l.manifestOps.unload) : base;
  }

  const checks = useMemo(
    () => [
      { key: "client", ok: nonEmpty(form.client) },
      { key: "fieldTicket", ok: nonEmpty(form.fieldTicket) },
      { key: "dispatch", ok: nonEmpty(form.dispatch) },
      { key: "unit", ok: nonEmpty(form.unit) },
      { key: "driver", ok: nonEmpty(form.driver) },
      { key: "workDate", ok: nonEmpty(form.workDate) },
      { key: "wellLease", ok: nonEmpty(form.wellLease) },
      { key: "fieldTicketImage", ok: nonEmpty(form.fieldTicketImage) },
      { key: "signature", ok: hasSignature },
      ...loads.map((l, i) => ({ key: `load_${i}`, ok: loadOk(l) })),
    ],
    [form, loads, hasSignature, isExxon]
  );

  const progress = useMemo(
    () => (checks.length > 0 ? Math.round((checks.filter((c) => c.ok).length / checks.length) * 100) : 0),
    [checks]
  );
  const isComplete = useMemo(() => checks.every((c) => c.ok), [checks]);

  const dispatchLabel =
    { Exxon: "GEMINI DISPATCH #", Oxy: "IRONSIGHT JOB #", "Western Midstream": "IRONSIGHT JOB #" }[form.client] || "DISPATCH #";

  // ─── Compute hours and total pay ──────────────────────────
  const timeCalc = useMemo(() => {
    if (!form.startTime || !form.endTime) return null;
    const parts1 = form.startTime.split(":");
    const parts2 = form.endTime.split(":");
    if (parts1.length < 2 || parts2.length < 2) return null;
    const sh = parseInt(parts1[0], 10);
    const sm = parseInt(parts1[1], 10);
    const eh = parseInt(parts2[0], 10);
    const em = parseInt(parts2[1], 10);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
    let mins = eh * 60 + em - (sh * 60 + sm);
    if (mins < 0) mins += 1440;
    if (mins === 0) return null;
    const hrs = mins / 60;
    const rate = parseFloat(form.hourlyRate);
    const total = !isNaN(rate) && rate > 0 ? hrs * rate : null;
    return { hrs: hrs.toFixed(2), total: total !== null ? total.toFixed(2) : null };
  }, [form.startTime, form.endTime, form.hourlyRate]);

  // ─── Signature drawing ────────────────────────────────────
  function pt(e, canvas) {
    const r = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (cx - r.left) * (canvas.width / r.width),
      y: (cy - r.top) * (canvas.height / r.height),
    };
  }
  function startDraw(e) {
    if (e.type === "touchstart") e.preventDefault();
    const c = sigRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    drawing.current = true;
    const p = pt(e, c);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function draw(e) {
    if (!drawing.current) return;
    if (e.type === "touchmove") e.preventDefault();
    const c = sigRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const p = pt(e, c);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasSignature(true);
  }
  function endDraw() {
    drawing.current = false;
  }
  function clearSig() {
    const c = sigRef.current;
    if (!c) return;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    setHasSignature(false);
  }

  // ─── Submit ───────────────────────────────────────────────
  async function handleSubmit() {
    if (!isComplete || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError("");
    const sigCanvas = sigRef.current;
    const payload = {
      submissionId,
      phone,
      ...form,
      loads,
      totalBBLS,
      signature: sigCanvas ? sigCanvas.toDataURL("image/png") : "",
    };
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      clearDraft();
      onComplete();
    } catch {
      try {
        const q = JSON.parse(sessionStorage.getItem("offlineTickets") || "[]");
        q.push(payload);
        sessionStorage.setItem("offlineTickets", JSON.stringify(q));
        alert("No internet — ticket saved offline and will sync when reconnected.");
        clearDraft();
        onComplete();
      } catch {
        setSubmitError("Submission failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Offline sync ────────────────────────────────────────
  useEffect(() => {
    async function syncOffline() {
      const raw = sessionStorage.getItem("offlineTickets");
      const q = raw ? JSON.parse(raw) : [];
      if (!q.length) return;
      const remaining = [];
      for (const t of q) {
        try {
          await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(t),
          });
        } catch {
          remaining.push(t);
        }
      }
      if (remaining.length > 0) {
        sessionStorage.setItem("offlineTickets", JSON.stringify(remaining));
      } else {
        sessionStorage.removeItem("offlineTickets");
      }
    }
    window.addEventListener("online", syncOffline);
    syncOffline();
    return () => window.removeEventListener("online", syncOffline);
  }, []);

  function openPhoto(target) {
    setPhotoTarget(target);
    setPhotoOpen(true);
  }

  const G2 = {
    display: "grid",
    gridTemplateColumns: small ? "1fr" : "1fr 1fr",
    gap: small ? "0px" : "10px",
  };
  const S = {
    background: T.surface, borderRadius: 10,
    padding: small ? "12px 11px" : "14px 13px",
    border: `1px solid ${T.border}`, marginBottom: 12,
  };
  const ST = {
    color: T.gold, fontFamily: "'Rajdhani',sans-serif",
    fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 12,
  };

  return (
    <PageShell maxW={520}>
      {/* Header with back button */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button
          onClick={() => {
            if (window.confirm("Leave form? Your progress is saved as a draft.")) {
              onBack();
            }
          }}
          style={{
            background: "transparent", border: `1px solid ${T.border}`,
            color: T.muted, borderRadius: 8, padding: "7px 12px",
            cursor: "pointer", fontSize: 13, flexShrink: 0,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          ← Back
        </button>
        <div>
          <div
            style={{
              color: T.gold, fontFamily: "'Rajdhani',sans-serif",
              fontSize: 17, fontWeight: 700, letterSpacing: "0.12em",
            }}
          >
            {editTicket ? "EDIT & RESUBMIT" : "NEW FIELD TICKET"}
          </div>
          <div style={{ color: T.muted, fontSize: 11 }}>
            {editTicket ? `Editing ${submissionId}` : "Complete all required fields"}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          marginBottom: 14, position: "sticky", top: 0, zIndex: 10,
          background: T.card, paddingBottom: 6, paddingTop: 3,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, marginBottom: 4 }}>
          <span>FORM COMPLETION</span>
          <span style={{ color: progress === 100 ? T.success : T.gold, fontWeight: 700 }}>
            {progress}%
          </span>
        </div>
        <div style={{ height: 3, background: T.bg, borderRadius: 99, overflow: "hidden" }}>
          <div
            style={{
              height: "100%", borderRadius: 99,
              background: progress === 100 ? T.success : `linear-gradient(90deg, ${T.goldDim}, ${T.gold})`,
              width: `${progress}%`, transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* ── JOB INFORMATION ── */}
      <div style={S}>
        <div style={ST}>JOB INFORMATION</div>
        <Label text="Client Organization" required />
        <Select value={form.client} onChange={(e) => update("client", e.target.value)}>
          <option value="">Select client…</option>
          {["Exxon", "Oxy", "Western Midstream", "Chevron", "Other"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>

        <div style={G2}>
          <div>
            <Label text="Field Ticket #" required />
            <Input value={form.fieldTicket} onChange={(e) => update("fieldTicket", e.target.value)} />
          </div>
          <div>
            <Label text={dispatchLabel} required />
            <Input value={form.dispatch} onChange={(e) => update("dispatch", e.target.value)} />
          </div>
        </div>
        <div style={G2}>
          <div>
            <Label text="Unit / Truck #" required />
            <Input value={form.unit} onChange={(e) => update("unit", e.target.value)} />
          </div>
          <div>
            <Label text="Driver Name" required />
            <Input value={form.driver} onChange={(e) => update("driver", e.target.value)} />
          </div>
        </div>
        <div style={G2}>
          <div>
            <Label text="Work Date" required />
            <Input type="date" value={form.workDate} onChange={(e) => update("workDate", e.target.value)} />
          </div>
          <div>
            <Label text="Well / Lease" required />
            <Input value={form.wellLease} onChange={(e) => update("wellLease", e.target.value)} />
          </div>
        </div>

        <Label text="Notes / Description" />
        <Textarea
          placeholder="Add job specifics…"
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          style={{ minHeight: 68 }}
        />

        <div style={G2}>
          <div>
            <Label text="Start Time" />
            <Input type="time" value={form.startTime} onChange={(e) => update("startTime", e.target.value)} />
          </div>
          <div>
            <Label text="End Time" />
            <Input type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} />
          </div>
        </div>

        <Label text="Hourly Rate ($)" />
        <Input
          type="number"
          inputMode="decimal"
          placeholder="e.g. 85"
          value={form.hourlyRate}
          onChange={(e) => update("hourlyRate", e.target.value)}
        />

        {timeCalc && (
          <div
            style={{
              marginTop: 10, padding: "9px 12px",
              background: "rgba(212,175,55,0.06)",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            <div>
              <div style={{ color: T.muted, fontSize: 10 }}>TOTAL HOURS</div>
              <div
                style={{
                  color: T.gold, fontFamily: "'Space Mono',monospace",
                  fontWeight: 700, fontSize: 17,
                }}
              >
                {timeCalc.hrs} hrs
              </div>
            </div>
            {timeCalc.total && (
              <div style={{ textAlign: "right" }}>
                <div style={{ color: T.muted, fontSize: 10 }}>PAY TOTAL</div>
                <div
                  style={{
                    color: T.success, fontFamily: "'Space Mono',monospace",
                    fontWeight: 700, fontSize: 17,
                  }}
                >
                  ${timeCalc.total}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FIELD TICKET PHOTO ── */}
      <div style={S}>
        <div style={ST}>
          FIELD TICKET PHOTO <span style={{ color: T.danger }}>✱</span>
        </div>
        <div
          onClick={() => openPhoto({ type: "field" })}
          style={{
            border: `1px dashed ${form.fieldTicketImage ? T.goldDim : T.border}`,
            borderRadius: 10, padding: form.fieldTicketImage ? 0 : 20,
            cursor: "pointer", textAlign: "center", background: T.bg,
            transition: "border-color 0.2s", WebkitTapHighlightColor: "transparent",
            overflow: "hidden",
          }}
        >
          {form.fieldTicketImage ? (
            <img src={form.fieldTicketImage} style={{ width: "100%", display: "block", borderRadius: 9 }} alt="" />
          ) : (
            <div style={{ color: T.muted, fontSize: 13, padding: "10px 0" }}>
              Tap to capture or upload ticket photo
            </div>
          )}
        </div>
        {form.fieldTicketImage && (
          <button
            onClick={() => update("fieldTicketImage", "")}
            style={{
              marginTop: 7, background: "transparent", border: "none",
              color: T.danger, fontSize: 12, cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            ✕ Remove photo
          </button>
        )}
      </div>

      {/* ── LOAD MANIFEST ── */}
      <div style={S}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={ST}>LOAD MANIFEST</div>
          <div
            style={{
              background: T.goldGlow, border: `1px solid ${T.goldDim}`,
              borderRadius: 6, padding: "4px 10px", color: T.gold,
              fontFamily: "'Space Mono',monospace", fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}
          >
            {totalBBLS.toFixed(2)} BBL
          </div>
        </div>

        {loads.map((load, idx) => (
          <div
            key={idx}
            style={{
              background: T.bg, borderRadius: 9, padding: 12,
              border: `1px solid ${T.border}`, marginBottom: 10,
              borderLeft: `3px solid ${T.gold}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span
                style={{
                  background: T.gold, color: "#000", padding: "3px 8px",
                  borderRadius: 5, fontWeight: 800, fontSize: 11,
                  fontFamily: "'Rajdhani',sans-serif",
                }}
              >
                LOAD {String(idx + 1).padStart(2, "0")}
              </span>
              {loads.length > 1 && (
                <button
                  onClick={() => deleteLoad(idx)}
                  style={{
                    marginLeft: "auto", background: "transparent",
                    border: `1px solid ${T.border}`, color: T.danger,
                    borderRadius: 6, padding: "3px 8px", cursor: "pointer",
                    fontSize: 12, WebkitTapHighlightColor: "transparent",
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {isExxon && (
              <>
                <Label text="Gemini Dispatch Ref #" required />
                <Input value={load.geminiRef} onChange={(e) => updateLoad(idx, "geminiRef", e.target.value)} />
              </>
            )}

            <Label text="Load Ticket Number" required />
            <Input value={load.loadTicket} onChange={(e) => updateLoad(idx, "loadTicket", e.target.value)} />

            <div style={G2}>
              <div>
                <Label text="Fluid Type" />
                <Select value={load.fluid} onChange={(e) => updateLoad(idx, "fluid", e.target.value)}>
                  {["Fresh Water", "Brine Water", "Disposal Water", "Manifest"].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label text="BBLs" required />
                <Input
                  type="number"
                  inputMode="decimal"
                  value={load.bbls}
                  onChange={(e) => updateLoad(idx, "bbls", e.target.value)}
                />
              </div>
            </div>

            {/* Quick BBL presets */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
              {[90, 100, 120, 130, 150, 200].map((q) => (
                <button
                  key={q}
                  onClick={() => updateLoad(idx, "bbls", String(q))}
                  style={{
                    padding: "5px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                    background: String(load.bbls) === String(q) ? "rgba(212,175,55,0.15)" : T.surface,
                    border: `1px solid ${String(load.bbls) === String(q) ? T.gold : T.border}`,
                    color: String(load.bbls) === String(q) ? T.gold : T.muted,
                    transition: "all 0.15s", WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            <Label text="Verification Image" />
            <div
              onClick={() => openPhoto({ type: "load", index: idx })}
              style={{
                border: `1px dashed ${load.verificationImage ? T.goldDim : T.border}`,
                borderRadius: 8, padding: load.verificationImage ? 0 : 14,
                cursor: "pointer", textAlign: "center", background: T.card,
                overflow: "hidden", WebkitTapHighlightColor: "transparent",
              }}
            >
              {load.verificationImage ? (
                <img src={load.verificationImage} style={{ width: "100%", display: "block" }} alt="" />
              ) : (
                <div style={{ color: T.muted, fontSize: 12 }}>Tap to capture load ticket</div>
              )}
            </div>

            {load.fluid === "Manifest" && (
              <div style={{ marginTop: 10, border: `1px solid ${T.border}`, borderRadius: 8, padding: 11 }}>
                <div
                  style={{
                    display: "flex", justifyContent: "space-between",
                    color: T.muted, fontSize: 10, marginBottom: 8,
                  }}
                >
                  <span>MANIFEST OPERATIONS</span>
                  <span style={{ color: T.danger }}>REQUIRED</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    ["washOut", "WASH OUT"],
                    ["unload", "UNLOAD"],
                  ].map(([op, label]) => (
                    <button
                      key={op}
                      onClick={() => toggleOp(idx, op)}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 8,
                        fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: "0.05em",
                        border: `1px solid ${load.manifestOps[op] ? T.gold : T.border}`,
                        background: load.manifestOps[op] ? T.goldGlow : "transparent",
                        color: load.manifestOps[op] ? T.gold : T.muted,
                        transition: "all 0.15s", WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={addLoad}
          style={{
            width: "100%", padding: 12, border: `1px dashed ${T.border}`,
            borderRadius: 8, cursor: "pointer", textAlign: "center",
            background: "transparent", color: T.muted, fontSize: 13,
            WebkitTapHighlightColor: "transparent", transition: "border-color 0.2s",
          }}
        >
          + ADD ADDITIONAL LOAD
        </button>
      </div>

      {/* ── SIGNATURE ── */}
      <div style={S}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={ST}>
            OPERATOR SIGNATURE <span style={{ color: T.danger }}>✱</span>
          </div>
          {hasSignature && (
            <button
              onClick={clearSig}
              style={{
                background: "transparent", border: "none",
                color: T.danger, fontSize: 12, cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
        <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
          <canvas
            ref={sigRef}
            width={900}
            height={240}
            style={{
              width: "100%", height: 120, background: "#fff",
              display: "block", touchAction: "none",
            }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
        {!hasSignature && (
          <div style={{ color: T.muted, fontSize: 11, textAlign: "center", marginTop: 6 }}>
            Sign above with your finger or mouse
          </div>
        )}
      </div>

      {/* ── TOTALS ── */}
      <div style={{ ...S, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: T.muted, fontSize: 12 }}>TOTAL LOADS</div>
          <div style={{ color: T.text, fontWeight: 700, fontSize: 18, marginTop: 3 }}>{loads.length}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: T.muted, fontSize: 12 }}>TOTAL VOLUME</div>
          <div
            style={{
              color: T.gold, fontFamily: "'Space Mono',monospace",
              fontSize: 26, fontWeight: 700, marginTop: 3,
            }}
          >
            {totalBBLS.toFixed(2)}{" "}
            <span style={{ fontSize: 13 }}>BBL</span>
          </div>
        </div>
      </div>

      {submitError && (
        <div style={{ color: T.danger, fontSize: 12, textAlign: "center", marginBottom: 10 }}>
          ⚠ {submitError}
        </div>
      )}

      <GoldBtn disabled={!isComplete} loading={isSubmitting} onClick={handleSubmit}>
        {isSubmitting
          ? "SUBMITTING…"
          : isComplete
          ? "SUBMIT FINAL TICKET"
          : `COMPLETE FORM (${progress}%)`}
      </GoldBtn>

      {/* Photo capture modal */}
      <PhotoCaptureModal
        open={photoOpen}
        onClose={() => {
          setPhotoOpen(false);
          setPhotoTarget(null);
        }}
        onUse={(img) => {
          if (photoTarget?.type === "field") update("fieldTicketImage", img);
          if (photoTarget?.type === "load") {
            setLoads((p) => {
              const c = [...p];
              c[photoTarget.index] = { ...c[photoTarget.index], verificationImage: img };
              return c;
            });
          }
          setPhotoOpen(false);
          setPhotoTarget(null);
        }}
      />
    </PageShell>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  injectGlobalStyles();

  const [phone, setPhone] = useState(() => {
    try { return sessionStorage.getItem("bd_phone"); } catch { return null; }
  });
  const [page, setPage] = useState(() => {
    try { return sessionStorage.getItem("bd_phone") ? "dashboard" : "login"; } catch { return "login"; }
  });
  const [editTicket, setEditTicket] = useState(null);

  function login(p) {
    try { sessionStorage.setItem("bd_phone", p); } catch {}
    setPhone(p);
    setPage("dashboard");
  }
  function logout() {
    try {
      sessionStorage.removeItem("bd_phone");
      clearDraft();
    } catch {}
    setPhone(null);
    setPage("login");
  }

  if (!phone || page === "login") return <Login onLogin={login} />;
  if (page === "dashboard")
    return (
      <Dashboard
        phone={phone}
        onLogout={logout}
        onStartTicket={() => { setEditTicket(null); setPage("submit"); }}
        onOpenQueue={() => setPage("queue")}
      />
    );
  if (page === "queue")
    return (
      <Queue
        phone={phone}
        onBack={() => setPage("dashboard")}
        onEdit={(t) => { setEditTicket(t); setPage("submit"); }}
      />
    );
  if (page === "submit")
    return (
      <SubmitTicket
        phone={phone}
        editTicket={editTicket}
        onComplete={() => { setEditTicket(null); clearDraft(); setPage("success"); }}
        onBack={() => setPage("dashboard")}
      />
    );
  if (page === "success") return <TicketSuccess onBack={() => setPage("dashboard")} />;
  return null;
}

import React, { useState, useMemo, useEffect, useRef } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_URL =
  "https://script.google.com/macros/s/AKfycbwDJZilqySP8zZBHetfQyd-xloh3dz_eKbpwwkLiKohqeQDIRPM8L_H6AjtTU7CSYaT/exec";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const T = {
  gold:    "#D4AF37",
  goldDim: "#a88a20",
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

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { height: -webkit-fill-available; }
  body {
    background: #07080a; color: #e8eaf0; font-family: 'Inter', sans-serif;
    min-height: 100vh; min-height: -webkit-fill-available;
    -webkit-text-size-adjust: 100%;
  }
  input, select, textarea, button { font-family: inherit; }
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.7); }

  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pop    { 0%{transform:scale(0.85);opacity:0} 60%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .fadeUp { animation: fadeUp 0.35s ease both; }
  .pop    { animation: pop 0.4s cubic-bezier(.34,1.56,.64,1) both; }

  /* Scanner modal — CSS-driven fullscreen, works on iOS Safari with browser chrome */
  .bd-scanner {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100%; height: 100%;
    /* dvh = dynamic viewport height — accounts for iOS address bar */
    height: 100dvh;
    z-index: 99999;
    background: #000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: opacity 0.15s ease;
  }
  .bd-scanner[data-open="false"] { opacity:0; pointer-events:none; }
  .bd-scanner[data-open="true"]  { opacity:1; pointer-events:all; }

  /* iOS body scroll-lock */
  body.bd-locked {
    position: fixed;
    top: var(--bd-scroll-y, 0px);
    left: 0; right: 0;
    overflow: hidden;
  }
`;

function injectGlobalStyles() {
  if (document.getElementById("bd-global")) return;
  const s = document.createElement("style");
  s.id = "bd-global";
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

// ─── RESPONSIVE SCREEN SIZE HOOK ─────────────────────────────────────────────
function useVW() {
  const [vw, setVw] = useState(window.innerWidth);
  useEffect(() => {
    const fn = () => setVw(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  // small = phones under 390px (SE, older Android)
  return { vw, small: vw < 390 };
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Spinner({ size = 16, color = T.gold }) {
  return (
    <span style={{
      display:"inline-block", width:size, height:size,
      border:`2px solid rgba(255,255,255,0.08)`, borderTop:`2px solid ${color}`,
      borderRadius:"50%", animation:"spin 0.7s linear infinite", flexShrink:0
    }}/>
  );
}

function Label({ text, required }) {
  return (
    <div style={{
      color: T.muted, fontSize: 10, fontWeight: 600,
      letterSpacing:"0.12em", textTransform:"uppercase",
      marginTop: 13, marginBottom: 5
    }}>
      {text}{required && <span style={{ color:T.danger }}> ✱</span>}
    </div>
  );
}

function Input({ style, ...props }) {
  return (
    <input
      style={{
        width:"100%", padding:"9px 11px", background:T.surface,
        border:`1px solid ${T.border}`, color:T.text, borderRadius:7,
        fontSize:14, outline:"none", transition:"border-color 0.15s",
        WebkitAppearance:"none", appearance:"none",
        ...style
      }}
      onFocus={e => e.target.style.borderColor = T.goldDim}
      onBlur={e  => e.target.style.borderColor = T.border}
      {...props}
    />
  );
}

function Textarea({ style, ...props }) {
  return (
    <textarea
      style={{
        width:"100%", padding:"9px 11px", background:T.surface,
        border:`1px solid ${T.border}`, color:T.text, borderRadius:7,
        fontSize:14, resize:"vertical", minHeight:72, outline:"none",
        lineHeight:1.5, transition:"border-color 0.15s", ...style
      }}
      onFocus={e => e.target.style.borderColor = T.goldDim}
      onBlur={e  => e.target.style.borderColor = T.border}
      {...props}
    />
  );
}

function Select({ children, style, ...props }) {
  return (
    <select
      style={{
        width:"100%", padding:"9px 34px 9px 11px", background:T.surface,
        border:`1px solid ${T.border}`, color:T.text, borderRadius:7,
        fontSize:14, outline:"none", appearance:"none", WebkitAppearance:"none",
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7394' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center",
        transition:"border-color 0.15s", ...style
      }}
      onFocus={e => e.target.style.borderColor = T.goldDim}
      onBlur={e  => e.target.style.borderColor = T.border}
      {...props}
    >
      {children}
    </select>
  );
}

function GoldBtn({ children, disabled, loading, onClick, style }) {
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{
      width:"100%", padding:"13px 14px",
      background: disabled ? "#2a2d38" : T.gold,
      color: disabled ? T.muted : "#000",
      border:"none", borderRadius:8,
      fontWeight:700, fontSize:13, letterSpacing:"0.1em",
      cursor: disabled ? "not-allowed" : "pointer",
      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      transition:"all 0.15s", opacity: loading ? 0.85 : 1,
      fontFamily:"'Rajdhani',sans-serif",
      WebkitTapHighlightColor:"transparent",
      ...style
    }}>
      {loading && <Spinner size={14} color={disabled?"#6b7394":"#000"}/>}
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      width:"100%", padding:"12px 14px", background:"transparent",
      color:T.text, border:`1px solid ${T.border}`, borderRadius:8,
      fontWeight:600, fontSize:13, letterSpacing:"0.08em",
      cursor:"pointer", transition:"all 0.15s",
      fontFamily:"'Rajdhani',sans-serif",
      WebkitTapHighlightColor:"transparent",
      ...style
    }}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderHi;e.currentTarget.style.background=T.surface;}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background="transparent";}}
    >
      {children}
    </button>
  );
}

function PageShell({ children, maxW = 480 }) {
  return (
    <div style={{
      background:T.bg, minHeight:"100vh",
      display:"flex", justifyContent:"center", alignItems:"flex-start",
      padding:"14px 10px 40px",
    }}>
      <div className="fadeUp" style={{
        width:"100%", maxWidth:maxW, background:T.card,
        borderRadius:12, border:`1px solid ${T.border}`,
        borderLeft:`3px solid ${T.gold}`, padding:"16px 13px",
        boxShadow:"0 20px 60px rgba(0,0,0,0.6)"
      }}>
        {children}
      </div>
    </div>
  );
}

function Logo({ sub }) {
  return (
    <div style={{ textAlign:"center", marginBottom:18 }}>
      <div style={{ color:T.gold, fontSize:10, fontWeight:700,
        letterSpacing:"0.4em", fontFamily:"'Rajdhani',sans-serif" }}>
        BLACK DROP TRUCKING
      </div>
      <div style={{ color:T.gold, fontSize:20, fontWeight:700,
        letterSpacing:"0.18em", fontFamily:"'Rajdhani',sans-serif", marginTop:2 }}>
        {sub}
      </div>
      <div style={{ width:34, height:2, background:T.gold, margin:"7px auto 0" }}/>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    "PENDING":     { color:T.warn,    bg:"rgba(245,158,11,0.12)",  dot:"#f59e0b" },
    "APPROVED":    { color:T.success, bg:"rgba(34,197,94,0.12)",   dot:"#22c55e" },
    "BOUNCE BACK": { color:T.danger,  bg:"rgba(239,68,68,0.12)",   dot:"#ef4444" },
  };
  const s = map[status] || { color:T.muted, bg:T.surface, dot:T.muted };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 8px", borderRadius:99, background:s.bg,
      color:s.color, fontSize:10, fontWeight:700, letterSpacing:"0.08em", flexShrink:0
    }}>
      <span style={{
        width:5, height:5, borderRadius:"50%", background:s.dot, flexShrink:0,
        animation: status==="PENDING" ? "pulse 1.5s ease infinite" : "none"
      }}/>
      {status}
    </span>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleLogin() {
    if (!phone || phone.length < 7) { setError("Enter a valid phone number."); return; }
    if (loading) return;
    setError(""); setLoading(true);
    try {
      const res  = await fetch(API_URL + "?t=" + Date.now());
      if (!res.ok) throw new Error("Server error");
      const list = await res.json();
      const ok   = list.some(p => String(p).trim() === phone.trim());
      if (ok)  { onLogin(phone.trim()); }
      else     { setError("This number is not authorized."); setLoading(false); }
    } catch {
      setError("Connection failed. Check your signal.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      background:T.bg, minHeight:"100vh",
      display:"flex", justifyContent:"center", alignItems:"center", padding:16
    }}>
      <div className="pop" style={{
        width:"100%", maxWidth:340, background:T.card,
        borderRadius:16, border:`1px solid ${T.border}`,
        borderLeft:`3px solid ${T.gold}`, padding:"28px 18px",
        boxShadow:"0 24px 80px rgba(0,0,0,0.7)"
      }}>
        <Logo sub="FIELD COMMAND"/>
        <Label text="Phone Number" required/>
        <Input
          type="tel" inputMode="numeric" autoComplete="tel"
          placeholder="e.g. 4325551234"
          value={phone} maxLength={15}
          onChange={e=>{setPhone(e.target.value.replace(/\D/g,"")); setError("");}}
          onKeyDown={e=>e.key==="Enter"&&handleLogin()}
        />
        {error && (
          <div style={{ color:T.danger, fontSize:12, marginTop:8, textAlign:"center" }}>
            ⚠ {error}
          </div>
        )}
        <GoldBtn style={{ marginTop:16 }} loading={loading} onClick={handleLogin}>
          {loading ? "VERIFYING..." : "ENTER FIELD COMMAND"}
        </GoldBtn>
        <div style={{ color:T.muted, fontSize:11, textAlign:"center", marginTop:12 }}>
          🔒 Authorized personnel only
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
    <div style={{
      background:T.bg, minHeight:"100vh",
      display:"flex", justifyContent:"center", alignItems:"center", padding:16
    }}>
      <div className="pop" style={{
        width:"100%", maxWidth:340, background:T.card,
        borderRadius:16, border:`1px solid ${T.border}`,
        borderLeft:`3px solid ${T.gold}`, padding:"26px 18px",
        boxShadow:"0 24px 80px rgba(0,0,0,0.7)"
      }}>
        <Logo sub="FIELD COMMAND"/>
        <div style={{
          background:T.surface, borderRadius:10, padding:"11px 13px",
          marginBottom:18, border:`1px solid ${T.border}`,
          display:"flex", alignItems:"center", gap:10
        }}>
          <div style={{
            width:32, height:32, borderRadius:"50%",
            background:`rgba(212,175,55,0.12)`, border:`1px solid ${T.goldDim}`,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:15
          }}>👷</div>
          <div>
            <div style={{ color:T.muted, fontSize:10, letterSpacing:"0.1em" }}>{greeting}</div>
            <div style={{ color:T.text, fontWeight:600, fontSize:13 }}>{phone}</div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <GoldBtn onClick={onStartTicket}>📋 SUBMIT NEW TICKET</GoldBtn>
          <GhostBtn onClick={onOpenQueue}>📥 SUBMISSION QUEUE</GhostBtn>
          <GhostBtn onClick={onLogout} style={{ color:T.muted, borderColor:"#1a1d26" }}>← LOG OUT</GhostBtn>
        </div>
        <div style={{
          marginTop:18, paddingTop:13, borderTop:`1px solid ${T.border}`,
          color:T.muted, fontSize:10, textAlign:"center", letterSpacing:"0.1em"
        }}>
          BLACK DROP TRUCKING LLC · FIELD SYSTEM
        </div>
      </div>
    </div>
  );
}

// ─── QUEUE ────────────────────────────────────────────────────────────────────
function Queue({ phone, onEdit, onBack }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_URL}?mode=queue&phone=${phone}&t=${Date.now()}`);
        const data = await res.json();
        setTickets(data.reverse());
      } catch { setError(true); }
      finally  { setLoading(false); }
    })();
  }, [phone]);

  const counts = useMemo(() => ({
    total:    tickets.length,
    pending:  tickets.filter(t=>t["Status"]==="PENDING").length,
    bounce:   tickets.filter(t=>t["Status"]==="BOUNCE BACK").length,
    approved: tickets.filter(t=>t["Status"]==="APPROVED").length,
  }), [tickets]);

  return (
    <PageShell maxW={520}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <button onClick={onBack} style={{
          background:"transparent", border:`1px solid ${T.border}`,
          color:T.muted, borderRadius:7, padding:"6px 10px",
          cursor:"pointer", fontSize:13, flexShrink:0,
          WebkitTapHighlightColor:"transparent"
        }}>← Back</button>
        <div style={{ minWidth:0 }}>
          <div style={{ color:T.gold, fontFamily:"'Rajdhani',sans-serif",
            fontSize:16, fontWeight:700, letterSpacing:"0.12em" }}>
            SUBMISSION QUEUE
          </div>
          <div style={{ color:T.muted, fontSize:11 }}>{counts.total} submissions found</div>
        </div>
      </div>

      {!loading && !error && counts.total > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:7, marginBottom:16 }}>
          {[
            { label:"Pending",  val:counts.pending,  color:T.warn },
            { label:"Approved", val:counts.approved, color:T.success },
            { label:"Bounce",   val:counts.bounce,   color:T.danger },
          ].map(s => (
            <div key={s.label} style={{
              background:T.surface, borderRadius:8, padding:"8px 10px",
              border:`1px solid ${T.border}`, textAlign:"center"
            }}>
              <div style={{ color:s.color, fontSize:20, fontWeight:700,
                fontFamily:"'Space Mono',monospace" }}>{s.val}</div>
              <div style={{ color:T.muted, fontSize:10, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ textAlign:"center", padding:40, display:"flex",
          flexDirection:"column", alignItems:"center", gap:12, color:T.muted }}>
          <Spinner size={24}/> Loading queue...
        </div>
      )}
      {error && (
        <div style={{ color:T.danger, textAlign:"center", padding:32 }}>
          ⚠ Failed to load. Check your connection.
        </div>
      )}
      {!loading && !error && tickets.length === 0 && (
        <div style={{ color:T.muted, textAlign:"center", padding:40 }}>
          No submissions found for this number.
        </div>
      )}

      {tickets.map((ticket, i) => {
        const status   = ticket["Status"];
        const isBounce = status === "BOUNCE BACK";
        return (
          <div key={ticket["Submission ID"]||i} style={{
            background:T.surface, borderRadius:10, padding:13, marginBottom:9,
            border:`1px solid ${isBounce?"rgba(239,68,68,0.3)":T.border}`,
            borderLeft:`3px solid ${isBounce?T.danger:status==="APPROVED"?T.success:T.warn}`
          }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"flex-start", marginBottom:9, gap:7 }}>
              <div style={{ fontFamily:"'Space Mono',monospace", color:T.text,
                fontSize:11, fontWeight:700, wordBreak:"break-all" }}>
                {ticket["Submission ID"]}
              </div>
              <StatusBadge status={status}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5px 12px" }}>
              {[
                ["Client",  ticket["Client"]],
                ["Created", ticket["Timestamp"] ? new Date(ticket["Timestamp"]).toLocaleString() : "—"],
                ticket["Field Ticket #"] ? ["Field Ticket", ticket["Field Ticket #"]] : null,
                ticket["Driver"]         ? ["Driver",       ticket["Driver"]]         : null,
              ].filter(Boolean).map(([k,v]) => (
                <div key={k}>
                  <div style={{ color:T.muted, fontSize:10 }}>{k}</div>
                  <div style={{ color:T.text,  fontSize:12 }}>{v}</div>
                </div>
              ))}
            </div>
            {ticket["Notes"] && (
              <div style={{
                marginTop:8, padding:"6px 9px", background:T.bg,
                borderRadius:6, color:T.muted, fontSize:12, fontStyle:"italic"
              }}>
                "{ticket["Notes"]}"
              </div>
            )}
            {isBounce && (
              <button onClick={()=>onEdit(ticket)} style={{
                marginTop:9, width:"100%", padding:"9px 13px",
                background:`rgba(212,175,55,0.1)`, border:`1px solid ${T.goldDim}`,
                color:T.gold, borderRadius:8, fontWeight:700, fontSize:12,
                letterSpacing:"0.1em", cursor:"pointer",
                fontFamily:"'Rajdhani',sans-serif",
                WebkitTapHighlightColor:"transparent"
              }}>
                ✎ EDIT & RESUBMIT
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
    <div style={{
      position:"fixed", inset:0, background:T.bg,
      display:"flex", justifyContent:"center", alignItems:"center", zIndex:9999
    }}>
      <div className="pop" style={{
        background:T.card, padding:"36px 28px", borderRadius:16,
        textAlign:"center", border:`1px solid ${T.border}`,
        borderLeft:`3px solid ${T.gold}`, maxWidth:320, width:"90%"
      }}>
        <div style={{ fontSize:44, marginBottom:12 }}>✓</div>
        <div style={{ color:T.gold, fontFamily:"'Rajdhani',sans-serif",
          fontSize:21, fontWeight:700, letterSpacing:"0.1em", marginBottom:7 }}>
          TICKET SUBMITTED
        </div>
        <div style={{ color:T.muted, fontSize:13, marginBottom:24, lineHeight:1.6 }}>
          Your field ticket has been received and is pending review.
        </div>
        <GoldBtn onClick={onBack}>← BACK TO DASHBOARD</GoldBtn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCSCAN ENGINE  v3  —  ground-up rewrite, every bug fixed
//
// Architecture:
//   • All heavy pixel loops broken into async chunks via yieldFrame()
//     so iOS Safari never kills the tab / freezes the spinner
//   • Output capped at 1600px on longest side (sweet-spot: sharp but fast)
//   • Homography solver replaced with a clean Gaussian elimination that
//     correctly handles an 8×9 augmented matrix (not 16-row)
//   • highContrast fixed: Otsu on proper grayscale, no broken Laplacian
//   • Fallback path (no corners found) just re-enhances the original
// ═══════════════════════════════════════════════════════════════════════════
const DocScan = {

  // ── Yield to browser between heavy steps so spinner can repaint ──────────
  yieldFrame() {
    return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
  },

  // ── Grayscale  (ITU-R BT.601) ────────────────────────────────────────────
  toGray(rgba, n) {
    const g = new Uint8Array(n);
    for (let i = 0; i < n; i++)
      g[i] = (77 * rgba[i*4] + 150 * rgba[i*4+1] + 29 * rgba[i*4+2]) >> 8;
    return g;
  },

  // ── Separable box blur  r = half-width ───────────────────────────────────
  // Sliding-window O(n) per row/col — no off-by-one
  blur(src, w, h, r) {
    const tmp = new Uint8Array(w * h);
    const dst = new Uint8Array(w * h);

    // horizontal
    for (let y = 0; y < h; y++) {
      let sum = 0;
      const row = y * w;
      // prime the window
      for (let x = 0; x <= r && x < w; x++) sum += src[row + x];
      let left = 0, right = r;
      for (let x = 0; x < w; x++) {
        tmp[row + x] = (sum / (right - left + 1) + 0.5) | 0;
        if (right + 1 < w) { right++; sum += src[row + right]; }
        if (x >= r)        { sum -= src[row + left]; left++; }
      }
    }

    // vertical
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let y = 0; y <= r && y < h; y++) sum += tmp[y * w + x];
      let top = 0, bot = r;
      for (let y = 0; y < h; y++) {
        dst[y * w + x] = (sum / (bot - top + 1) + 0.5) | 0;
        if (bot + 1 < h) { bot++; sum += tmp[bot * w + x]; }
        if (y >= r)      { sum -= tmp[top * w + x]; top++; }
      }
    }
    return dst;
  },

  // ── Sobel edge magnitude (normalised 0-255) ───────────────────────────────
  sobel(g, w, h) {
    const mag = new Float32Array(w * h);
    let mx = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const a = g[(y-1)*w+(x-1)], b = g[(y-1)*w+x], c = g[(y-1)*w+(x+1)];
        const d = g[  y  *w+(x-1)],                   f = g[  y  *w+(x+1)];
        const gg= g[(y+1)*w+(x-1)], hh= g[(y+1)*w+x], k = g[(y+1)*w+(x+1)];
        const gx = -a - 2*d - gg + c + 2*f + k;
        const gy = -a - 2*b - c  + gg + 2*hh + k;
        const m  = Math.sqrt(gx*gx + gy*gy);
        mag[y*w+x] = m;
        if (m > mx) mx = m;
      }
    }
    // normalise
    const out = new Uint8Array(w * h);
    if (mx > 0) {
      const inv = 255 / mx;
      for (let i = 0; i < out.length; i++) out[i] = (mag[i] * inv + 0.5) | 0;
    }
    return out;
  },

  // ── Find the 4 document corners from edge map ─────────────────────────────
  // Strategy: collect all strong edge pixels, then find extremes
  // in each of the 4 diagonal directions.
  findCorners(edges, w, h) {
    const THRESH = 80; // minimum edge strength to count
    // collect a sampled set of strong edge points
    const step = Math.max(1, Math.sqrt((w * h) / 6000) | 0);
    const pts = [];
    for (let y = 0; y < h; y += step)
      for (let x = 0; x < w; x += step)
        if (edges[y*w+x] >= THRESH) pts.push(x, y); // flat [x,y,x,y,...]

    if (pts.length < 40) return null; // not enough edge evidence

    // 4 extreme corners: TL(min x+y), TR(max x-y), BR(max x+y), BL(min x-y)
    let tlV= Infinity, trV=-Infinity, brV=-Infinity, blV=-Infinity;
    let tlX=0, tlY=0, trX=0, trY=0, brX=0, brY=0, blX=0, blY=0;
    for (let i = 0; i < pts.length; i += 2) {
      const x = pts[i], y = pts[i+1];
      const s = x + y, d = x - y;
      if (s < tlV) { tlV=s; tlX=x; tlY=y; }
      if (d > trV) { trV=d; trX=x; trY=y; }
      if (s > brV) { brV=s; brX=x; brY=y; }
      if (d < blV) { blV=d; blX=x; blY=y; }
    }

    const corners = [[tlX,tlY],[trX,trY],[brX,brY],[blX,blY]];

    // Reject if quad is tiny (< 15% of image area)
    // Use shoelace to compute quad area
    const qa = this._quadArea(corners);
    if (qa < w * h * 0.15) return null;

    return corners; // [TL, TR, BR, BL]
  },

  _quadArea([[x0,y0],[x1,y1],[x2,y2],[x3,y3]]) {
    return Math.abs(
      (x0*y1 - x1*y0) + (x1*y2 - x2*y1) +
      (x2*y3 - x3*y2) + (x3*y0 - x0*y3)
    ) / 2;
  },

  // ── Perspective warp via homography ──────────────────────────────────────
  // corners = [TL,TR,BR,BL] in source image pixels
  // outW, outH = desired output size
  warpToRect(srcRgba, sw, sh, corners, outW, outH) {
    const [tl,tr,br,bl] = corners;
    // We need H mapping dst→src so we can loop over output pixels and
    // look up where each one came from in the source image.
    // DLT for H: dst→src
    //   xs = (h0*xd + h1*yd + h2) / (h6*xd + h7*yd + 1)
    //   ys = (h3*xd + h4*yd + h5) / (h6*xd + h7*yd + 1)
    // Each correspondence (xd,yd)→(xs,ys) gives two linear equations:
    //   xd*h0 + yd*h1 + h2             - xd*xs*h6 - yd*xs*h7 = xs
    //   xd*h3 + yd*h4 + h5             - xd*ys*h6 - yd*ys*h7 = ys
    const srcCorners = [tl,tr,br,bl];
    const dstCorners = [[0,0],[outW-1,0],[outW-1,outH-1],[0,outH-1]];

    const rows = [];
    for (let i = 0; i < 4; i++) {
      const [xs,ys] = srcCorners[i];
      const [xd,yd] = dstCorners[i];
      rows.push([xd, yd, 1, 0,  0,  0, -xd*xs, -yd*xs, xs]);
      rows.push([0,  0,  0, xd, yd, 1, -xd*ys, -yd*ys, ys]);
    }

    const H = this._solveH(rows);
    if (!H) return null;

    const out = new Uint8ClampedArray(outW * outH * 4);

    for (let yd = 0; yd < outH; yd++) {
      for (let xd = 0; xd < outW; xd++) {
        const w_ = H[6]*xd + H[7]*yd + H[8];
        if (Math.abs(w_) < 1e-10) continue;
        const xs = (H[0]*xd + H[1]*yd + H[2]) / w_;
        const ys = (H[3]*xd + H[4]*yd + H[5]) / w_;

        // bilinear interpolation
        const x0 = xs | 0, y0 = ys | 0;
        if (x0 < 0 || y0 < 0 || x0+1 >= sw || y0+1 >= sh) continue;
        const fx = xs - x0, fy = ys - y0;
        const i00 = (y0*sw + x0)*4, i10 = (y0*sw + x0+1)*4;
        const i01 = ((y0+1)*sw + x0)*4, i11 = ((y0+1)*sw + x0+1)*4;
        const oi  = (yd*outW + xd)*4;
        const w00=(1-fx)*(1-fy), w10=fx*(1-fy), w01=(1-fx)*fy, w11=fx*fy;
        out[oi]   = (srcRgba[i00]  *w00 + srcRgba[i10]  *w10 + srcRgba[i01]  *w01 + srcRgba[i11]  *w11 + 0.5)|0;
        out[oi+1] = (srcRgba[i00+1]*w00 + srcRgba[i10+1]*w10 + srcRgba[i01+1]*w01 + srcRgba[i11+1]*w11 + 0.5)|0;
        out[oi+2] = (srcRgba[i00+2]*w00 + srcRgba[i10+2]*w10 + srcRgba[i01+2]*w01 + srcRgba[i11+2]*w11 + 0.5)|0;
        out[oi+3] = 255;
      }
    }
    return { data: out, width: outW, height: outH };
  },

  // ── Gaussian elimination on an 8×9 augmented matrix ─────────────────────
  // Returns 9-vector H (last element forced to 1, so truly 8 unknowns)
  _solveH(rows) {
    // rows: 8 rows, 9 cols (last col = RHS, already embedded as col 8)
    const M = rows.map(r => [...r]);  // 8×9
    const n = 8;

    for (let col = 0; col < n; col++) {
      // find pivot
      let pivotRow = -1, pivotVal = 0;
      for (let row = col; row < n; row++) {
        if (Math.abs(M[row][col]) > pivotVal) {
          pivotVal = Math.abs(M[row][col]);
          pivotRow = row;
        }
      }
      if (pivotRow < 0 || pivotVal < 1e-12) return null;

      // swap
      [M[col], M[pivotRow]] = [M[pivotRow], M[col]];

      // scale pivot row
      const scale = M[col][col];
      for (let j = col; j <= n; j++) M[col][j] /= scale;

      // eliminate
      for (let row = 0; row < n; row++) {
        if (row === col) continue;
        const f = M[row][col];
        if (Math.abs(f) < 1e-15) continue;
        for (let j = col; j <= n; j++) M[row][j] -= f * M[col][j];
      }
    }

    // solution is the last column
    const h = M.map(r => r[n]);
    h.push(1); // h[8] = 1
    return h;
  },

  // ── Enhancement: Adaptive B&W (integral image, handles uneven light) ─────
  adaptiveBW(rgba, w, h) {
    const gray = this.toGray(rgba, w * h);
    const HALF = 15, C = 9;

    // Build integral image
    const S = new Float64Array((w+1) * (h+1));
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        S[(y+1)*(w+1)+(x+1)] = gray[y*w+x]
          + S[y*(w+1)+(x+1)] + S[(y+1)*(w+1)+x] - S[y*(w+1)+x];

    const out = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const x1=Math.max(0,x-HALF), y1=Math.max(0,y-HALF);
        const x2=Math.min(w-1,x+HALF), y2=Math.min(h-1,y+HALF);
        const area = (x2-x1+1) * (y2-y1+1);
        const sum  = S[(y2+1)*(w+1)+(x2+1)] - S[y1*(w+1)+(x2+1)]
                   - S[(y2+1)*(w+1)+x1]     + S[y1*(w+1)+x1];
        const v = gray[y*w+x] < (sum/area) - C ? 0 : 255;
        const i = (y*w+x)*4;
        out[i] = out[i+1] = out[i+2] = v; out[i+3] = 255;
      }
    }
    return new ImageData(out, w, h);
  },

  // ── Enhancement: High-contrast B&W (Otsu + sharpen) ──────────────────────
  highContrastBW(rgba, w, h) {
    const gray = this.toGray(rgba, w * h);

    // Otsu's threshold
    const hist = new Int32Array(256);
    for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
    const N = gray.length;
    let total = 0;
    for (let i = 0; i < 256; i++) total += i * hist[i];
    let sumB = 0, wB = 0, best = 0, th = 128;
    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      const wF = N - wB;
      if (!wB || !wF) continue;
      sumB += t * hist[t];
      const mB = sumB / wB;
      const mF = (total - sumB) / wF;
      const between = wB * wF * (mB - mF) * (mB - mF);
      if (between > best) { best = between; th = t; }
    }

    // Unsharp mask: sharpen gray before thresholding
    const blurred = this.blur(gray, w, h, 1);
    const sharp = new Uint8Array(w * h);
    const amt = 1.5; // sharpening amount
    for (let i = 0; i < gray.length; i++) {
      sharp[i] = Math.max(0, Math.min(255, gray[i] + amt * (gray[i] - blurred[i]) + 0.5 | 0));
    }

    const out = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < sharp.length; i++) {
      const v = sharp[i] > th ? 255 : 0;
      out[i*4] = out[i*4+1] = out[i*4+2] = v; out[i*4+3] = 255;
    }
    return new ImageData(out, w, h);
  },

  // ── Enhancement: Colour boost (percentile stretch per channel) ────────────
  colourBoost(rgba, w, h) {
    const n = w * h;
    const out = new Uint8ClampedArray(rgba.length);
    for (let c = 0; c < 3; c++) {
      // collect channel values
      const vals = new Uint8Array(n);
      for (let i = 0; i < n; i++) vals[i] = rgba[i*4+c];
      // sort a copy for percentile
      const sorted = vals.slice().sort((a, b) => a - b);
      const lo = sorted[Math.floor(n * 0.02)];
      const hi = sorted[Math.floor(n * 0.98)];
      const rng = hi - lo || 1;
      for (let i = 0; i < n; i++)
        out[i*4+c] = Math.max(0, Math.min(255, ((rgba[i*4+c] - lo) / rng * 255 + 0.5) | 0));
    }
    for (let i = 0; i < n; i++) out[i*4+3] = 255;
    return new ImageData(out, w, h);
  },

  // ── Master pipeline ───────────────────────────────────────────────────────
  // manualCorners: [[x,y],…] in *original* image coordinates, or null
  async process(dataURL, mode, onProgress, manualCorners) {
    onProgress(5, "Loading image…");
    await this.yieldFrame();

    // ── Load ────────────────────────────────────────────────────────────────
    const img = await new Promise((res, rej) => {
      const el = new Image();
      el.onload  = () => res(el);
      el.onerror = () => rej(new Error("Image failed to load"));
      el.src = dataURL;
    });

    const origW = img.width, origH = img.height;

    // ── Working canvas: cap at 900px for fast processing ───────────────────
    const WORK = 900;
    const wScale = Math.min(1, WORK / Math.max(origW, origH));
    const wW = Math.round(origW * wScale);
    const wH = Math.round(origH * wScale);

    const wCanvas = document.createElement("canvas");
    wCanvas.width = wW; wCanvas.height = wH;
    const wCtx = wCanvas.getContext("2d");
    wCtx.drawImage(img, 0, 0, wW, wH);
    const wImgData = wCtx.getImageData(0, 0, wW, wH);
    const wRgba = wImgData.data;

    onProgress(15, "Grayscale + blur…");
    await this.yieldFrame();

    const gray    = this.toGray(wRgba, wW * wH);
    const blurred = this.blur(gray, wW, wH, 2);

    onProgress(30, "Detecting edges…");
    await this.yieldFrame();

    const edges = this.sobel(blurred, wW, wH);

    onProgress(45, "Finding document…");
    await this.yieldFrame();

    // Scale manual corners to working canvas coordinates
    let corners = null;
    if (manualCorners && manualCorners.length === 4) {
      corners = manualCorners.map(([x, y]) => [
        Math.round(x * wScale),
        Math.round(y * wScale)
      ]);
    } else {
      corners = this.findCorners(edges, wW, wH);
    }

    onProgress(58, "Perspective correction…");
    await this.yieldFrame();

    // ── Output canvas: cap at 1600px on longest side ───────────────────────
    const OUT_MAX = 1600;
    let warpedRgba = null;
    let warpedW = 0, warpedH = 0;
    let found = false;

    if (corners) {
      const [tl, tr, br, bl] = corners;
      const rawW = Math.max(
        Math.hypot(tr[0]-tl[0], tr[1]-tl[1]),
        Math.hypot(br[0]-bl[0], br[1]-bl[1])
      );
      const rawH = Math.max(
        Math.hypot(bl[0]-tl[0], bl[1]-tl[1]),
        Math.hypot(br[0]-tr[0], br[1]-tr[1])
      );

      // Scale up from working coords, but cap output
      const upscale = Math.min(1 / wScale, OUT_MAX / Math.max(rawW, rawH));
      const outW = Math.round(rawW * upscale);
      const outH = Math.round(rawH * upscale);

      if (outW >= 20 && outH >= 20) {
        const result = this.warpToRect(wRgba, wW, wH, corners, outW, outH);
        if (result) {
          warpedRgba = result.data;
          warpedW    = result.width;
          warpedH    = result.height;
          found      = true;
        }
      }
    }

    onProgress(72, "Enhancing image…");
    await this.yieldFrame();

    // ── Apply filter ───────────────────────────────────────────────────────
    let finalData;
    if (found) {
      switch (mode) {
        case "highContrast": finalData = this.highContrastBW(warpedRgba, warpedW, warpedH); break;
        case "colour":       finalData = this.colourBoost(warpedRgba, warpedW, warpedH);    break;
        case "original": {
          const id = new ImageData(warpedRgba, warpedW, warpedH);
          finalData = id; break;
        }
        default:             finalData = this.adaptiveBW(warpedRgba, warpedW, warpedH);     break;
      }
    } else {
      // No document found — apply filter on original full image
      // Redraw original at output size
      const oScale = Math.min(1, OUT_MAX / Math.max(origW, origH));
      const oW = Math.round(origW * oScale);
      const oH = Math.round(origH * oScale);
      const oC = document.createElement("canvas");
      oC.width = oW; oC.height = oH;
      oC.getContext("2d").drawImage(img, 0, 0, oW, oH);
      const oRgba = oC.getContext("2d").getImageData(0, 0, oW, oH).data;

      switch (mode) {
        case "highContrast": finalData = this.highContrastBW(oRgba, oW, oH); break;
        case "colour":       finalData = this.colourBoost(oRgba, oW, oH);    break;
        case "original": {
          finalData = new ImageData(new Uint8ClampedArray(oRgba), oW, oH); break;
        }
        default:             finalData = this.adaptiveBW(oRgba, oW, oH);     break;
      }
    }

    onProgress(92, "Rendering output…");
    await this.yieldFrame();

    const outCanvas = document.createElement("canvas");
    outCanvas.width  = finalData.width;
    outCanvas.height = finalData.height;
    outCanvas.getContext("2d").putImageData(finalData, 0, 0);

    onProgress(100, "Done!");
    return {
      dataURL:  outCanvas.toDataURL("image/jpeg", 0.92),
      found,
      outW: finalData.width,
      outH: finalData.height,
    };
  }
};

// ─── CROP OVERLAY ────────────────────────────────────────────────────────────
// Draggable 4-corner overlay rendered in a canvas element
// (Canvas rather than SVG avoids React reconciliation overhead on drag)
function CropOverlay({ dispW, dispH, imgW, imgH, corners, onChange }) {
  const canvasRef = useRef(null);
  const dragging  = useRef(-1);

  // corners are in image coords; we draw in display coords
  const toDisp  = ([x, y]) => [x * dispW / imgW, y * dispH / imgH];
  const toImage = ([x, y]) => [x * imgW / dispW, y * imgH / dispH];

  // Redraw on every render
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    ctx.clearRect(0, 0, dispW, dispH);

    const pts = corners.map(toDisp);

    // Semi-transparent overlay outside the quad
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, dispW, dispH);

    // Cut out the quad (show image through)
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Quad border
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Corner handles
    const R = Math.min(dispW, dispH) * 0.04;
    pts.forEach(([cx, cy], i) => {
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = dragging.current === i ? "#D4AF37" : "rgba(0,0,0,0.7)";
      ctx.fill();
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Cross-hair inside handle
      ctx.beginPath();
      ctx.moveTo(cx - R*0.5, cy); ctx.lineTo(cx + R*0.5, cy);
      ctx.moveTo(cx, cy - R*0.5); ctx.lineTo(cx, cy + R*0.5);
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  });

  function getPos(e) {
    const r = canvasRef.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return [
      Math.max(0, Math.min(dispW, t.clientX - r.left)),
      Math.max(0, Math.min(dispH, t.clientY - r.top))
    ];
  }

  function hitTest([px, py]) {
    const R = Math.min(dispW, dispH) * 0.07; // larger hit area than visual
    return corners.findIndex((c) => {
      const [dx, dy] = toDisp(c);
      return Math.hypot(px - dx, py - dy) < R;
    });
  }

  function onDown(e) {
    e.preventDefault();
    const pos = getPos(e);
    const hit = hitTest(pos);
    if (hit >= 0) dragging.current = hit;
  }

  function onMove(e) {
    e.preventDefault();
    if (dragging.current < 0) return;
    const [dx, dy] = getPos(e);
    const newCorners = corners.map((c, i) =>
      i === dragging.current ? toImage([dx, dy]) : c
    );
    onChange(newCorners);
  }

  function onUp(e) {
    e.preventDefault();
    dragging.current = -1;
  }

  return (
    <canvas
      ref={canvasRef}
      width={dispW} height={dispH}
      style={{ position:"absolute", inset:0, touchAction:"none", cursor:"crosshair" }}
      onMouseDown={onDown}  onMouseMove={onMove}  onMouseUp={onUp}
      onTouchStart={onDown} onTouchMove={onMove}  onTouchEnd={onUp}
    />
  );
}

// ─── SCANNER MODAL ────────────────────────────────────────────────────────────
function ScannerModal({ open, onClose, onUse }) {
  // stage: idle | preview | crop | processing | done
  const [stage,       setStage]       = useState("idle");
  const [original,    setOriginal]    = useState(null);  // raw dataURL
  const [origSize,    setOrigSize]    = useState([1,1]); // [w,h] in px
  const [result,      setResult]      = useState(null);  // processed dataURL
  const [progress,    setProgress]    = useState(0);
  const [progLabel,   setProgLabel]   = useState("");
  const [scanMode,    setScanMode]    = useState("adaptive");
  const [found,       setFound]       = useState(false);
  const [cropCorners, setCropCorners] = useState(null);  // [[x,y]×4] image coords
  const [cropDisp,    setCropDisp]    = useState([300,400]); // display size of crop canvas

  const fileRef    = useRef(null);
  const scrollRef  = useRef(0);
  const previewRef = useRef(null); // <img> for measuring display size

  // ── iOS scroll lock ────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setStage("idle");
      setOriginal(null); setResult(null);
      setProgress(0); setCropCorners(null);
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

  // ── Load file ──────────────────────────────────────────────────────────
  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setStage("preview"); setResult(null); setCropCorners(null);
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target.result;
      const tempImg = new Image();
      tempImg.onload = () => {
        setOrigSize([tempImg.naturalWidth, tempImg.naturalHeight]);
        setOriginal(src);
      };
      tempImg.src = src;
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  // ── Enter crop mode ────────────────────────────────────────────────────
  function enterCrop() {
    const [iw, ih] = origSize;
    const pad = Math.min(iw, ih) * 0.06;
    // Default corners = slightly inset rectangle
    setCropCorners([
      [pad,    pad   ],
      [iw-pad, pad   ],
      [iw-pad, ih-pad],
      [pad,    ih-pad],
    ]);

    // Measure the displayed image to size the crop canvas
    if (previewRef.current) {
      const r = previewRef.current.getBoundingClientRect();
      // Use the actual rendered image size (object-fit:contain gives letterboxing)
      const scaleToFit = Math.min(r.width / iw, r.height / ih);
      setCropDisp([Math.round(iw * scaleToFit), Math.round(ih * scaleToFit)]);
    }
    setStage("crop");
  }

  // ── Run scan ───────────────────────────────────────────────────────────
  async function handleScan() {
    if (!original) return;
    setStage("processing");
    setProgress(5);
    setProgLabel("Starting…");
    try {
      const res = await DocScan.process(
        original,
        scanMode,
        (pct, label) => { setProgress(pct); setProgLabel(label); },
        cropCorners   // null → auto-detect
      );
      setResult(res.dataURL);
      setFound(res.found);
      setStage("done");
    } catch (err) {
      console.error("DocScan error:", err);
      setStage("preview");
    }
  }

  function handleUse()    { if (result) { onUse(result); onClose(); } }
  function handleRetake() {
    setStage("idle");
    setOriginal(null); setResult(null); setCropCorners(null);
  }

  const MODES = [
    { id:"adaptive",     icon:"🔳", label:"AUTO B&W",    sub:"Best for most docs"  },
    { id:"highContrast", icon:"⬛", label:"HIGH CONTRAST",sub:"Max ink on white"    },
    { id:"colour",       icon:"🌈", label:"COLOUR",       sub:"Keep colours"        },
    { id:"original",     icon:"📷", label:"ORIGINAL",     sub:"No filter"           },
  ];

  return (
    <div className="bd-scanner" data-open={open ? "true" : "false"}>

      {/* ── HEADER ── */}
      <div style={{
        flexShrink: 0,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        paddingTop: "max(14px, env(safe-area-inset-top, 14px))",
        paddingBottom: 10, paddingLeft: 12, paddingRight: 12,
        background: T.card, borderBottom: `1px solid ${T.border}`,
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          width:40, height:40, borderRadius:9, background:T.surface,
          border:`1px solid ${T.border}`, color:T.text,
          fontSize:18, display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", WebkitTapHighlightColor:"transparent", flexShrink:0,
        }}>✕</button>

        {/* Title */}
        <div style={{ textAlign:"center", flex:1 }}>
          <div style={{ color:T.gold, fontSize:13, fontWeight:700, letterSpacing:"0.1em" }}>
            { stage==="crop"       ? "✂ MANUAL CROP"
            : stage==="done"       ? "✅ SCAN COMPLETE"
            : stage==="processing" ? "⚙ PROCESSING…"
            :                        "📷 SCAN DOCUMENT" }
          </div>
          <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>
            { stage==="crop"       ? "Drag corners · tap Confirm when ready"
            : stage==="done"       ? (found ? "✓ Document detected & corrected" : "⚠ No doc border found · full image used")
            : stage==="preview"    ? "Choose scan mode · tap Scan It"
            :                        "" }
          </div>
        </div>

        {/* Right action: Crop toggle or redo */}
        <div style={{ flexShrink:0, width:50, display:"flex", justifyContent:"flex-end" }}>
          {stage === "preview" && (
            <button onClick={enterCrop} style={{
              height:36, padding:"0 10px", borderRadius:8,
              background:T.surface, border:`1px solid ${T.border}`,
              color:T.gold, fontSize:11, fontWeight:700, letterSpacing:"0.05em",
              cursor:"pointer", WebkitTapHighlightColor:"transparent",
            }}>✂</button>
          )}
          {stage === "done" && (
            <button onClick={()=>{ setStage("preview"); setResult(null); }} style={{
              height:36, padding:"0 10px", borderRadius:8,
              background:T.surface, border:`1px solid ${T.border}`,
              color:T.muted, fontSize:11, fontWeight:700,
              cursor:"pointer", WebkitTapHighlightColor:"transparent",
            }}>REDO</button>
          )}
        </div>
      </div>

      {/* ── MAIN PREVIEW AREA — takes ALL remaining height ── */}
      <div style={{
        flex: 1, minHeight: 0,
        position: "relative",
        background: "#050505",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>

        {/* IDLE — tap to choose */}
        {stage === "idle" && (
          <div onClick={() => fileRef.current?.click()} style={{
            display:"flex", flexDirection:"column", alignItems:"center",
            textAlign:"center", color:T.muted, cursor:"pointer", padding:32, gap:14,
          }}>
            <div style={{ fontSize:64, lineHeight:1 }}>📄</div>
            <div style={{ fontSize:16, fontWeight:600, color:T.text }}>
              Photograph a document
            </div>
            <div style={{ fontSize:13, opacity:0.6 }}>
              Field ticket · Load ticket · Any paper doc
            </div>
            <div style={{
              marginTop:8, padding:"14px 32px",
              background:`rgba(212,175,55,0.12)`, border:`1px solid ${T.goldDim}`,
              borderRadius:12, color:T.gold, fontWeight:700, fontSize:14,
              letterSpacing:"0.08em",
            }}>📁 Choose / Take Photo</div>
          </div>
        )}

        {/* PREVIEW — show image */}
        {(stage === "preview" || stage === "crop") && original && (
          <div style={{ position:"relative", width:"100%", height:"100%",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <img
              ref={previewRef}
              src={original} alt="preview"
              style={{
                maxWidth:"100%", maxHeight:"100%",
                objectFit:"contain", display:"block",
              }}
            />
            {/* Crop overlay rendered on top when in crop mode */}
            {stage === "crop" && cropCorners && (
              <div style={{
                position:"absolute",
                left:"50%", top:"50%",
                transform:"translate(-50%,-50%)",
                width:  cropDisp[0],
                height: cropDisp[1],
              }}>
                <CropOverlay
                  dispW={cropDisp[0]}
                  dispH={cropDisp[1]}
                  imgW={origSize[0]}
                  imgH={origSize[1]}
                  corners={cropCorners}
                  onChange={setCropCorners}
                />
              </div>
            )}
          </div>
        )}

        {/* PROCESSING overlay */}
        {stage === "processing" && (
          <div style={{
            position:"absolute", inset:0,
            background:"rgba(5,5,5,0.90)",
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:20,
          }}>
            {/* Blurred original behind spinner */}
            {original && (
              <img src={original} alt="" style={{
                position:"absolute", inset:0,
                width:"100%", height:"100%",
                objectFit:"contain",
                opacity:0.07, filter:"blur(6px)",
                pointerEvents:"none",
              }}/>
            )}

            <div style={{ position:"relative" }}>
              <Spinner size={48} color={T.gold}/>
            </div>

            <div style={{ position:"relative", textAlign:"center" }}>
              <div style={{
                color:T.gold, fontWeight:800, fontSize:16,
                letterSpacing:"0.15em", marginBottom:10,
              }}>PROCESSING</div>
              <div style={{
                color:T.muted, fontSize:13, marginBottom:18, minHeight:20,
              }}>{progLabel}</div>
              {/* Progress bar */}
              <div style={{
                width:220, height:4,
                background:"rgba(255,255,255,0.07)",
                borderRadius:99, overflow:"hidden", margin:"0 auto",
              }}>
                <div style={{
                  height:"100%", borderRadius:99,
                  background:`linear-gradient(90deg, ${T.goldDim}, ${T.gold})`,
                  width:`${progress}%`,
                  transition:"width 0.3s ease",
                }}/>
              </div>
              <div style={{ color:T.muted, fontSize:12, marginTop:8 }}>
                {progress}%
              </div>
            </div>
          </div>
        )}

        {/* DONE — show result */}
        {stage === "done" && result && (
          <img src={result} alt="Scanned result"
            style={{
              maxWidth:"100%", maxHeight:"100%",
              objectFit:"contain", display:"block",
              boxShadow:"0 0 0 1px rgba(212,175,55,0.2)",
            }}
          />
        )}
      </div>

      {/* ── BOTTOM CONTROLS ── */}
      <div style={{
        flexShrink: 0,
        background: T.card,
        borderTop: `1px solid ${T.border}`,
        padding: `10px 12px max(12px, env(safe-area-inset-bottom, 12px)) 12px`,
      }}>

        {/* Scan mode strip — visible on preview/crop/done */}
        {(stage === "preview" || stage === "crop" || stage === "done") && (
          <div style={{
            display:"flex", gap:6, marginBottom:9,
            overflowX:"auto", WebkitOverflowScrolling:"touch",
            scrollbarWidth:"none", msOverflowStyle:"none",
          }}>
            {MODES.map(m => (
              <button key={m.id} onClick={() => setScanMode(m.id)} style={{
                flexShrink:0, minWidth:70, padding:"7px 10px",
                borderRadius:8, cursor:"pointer", textAlign:"center",
                border:`1px solid ${scanMode===m.id ? T.gold : T.border}`,
                background: scanMode===m.id ? "rgba(212,175,55,0.12)" : "transparent",
                WebkitTapHighlightColor:"transparent",
              }}>
                <div style={{ fontSize:15 }}>{m.icon}</div>
                <div style={{
                  fontSize:9, fontWeight:700, letterSpacing:"0.05em",
                  color: scanMode===m.id ? T.gold : T.text,
                  marginTop:3, whiteSpace:"nowrap",
                }}>{m.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* Main action buttons */}
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>

          {/* Left button */}
          <button
            disabled={stage === "processing"}
            onClick={
              stage === "done"      ? handleRetake :
              stage === "crop"      ? () => setStage("preview") :
              () => fileRef.current?.click()
            }
            style={{
              flex:1, height:50,
              background:T.surface, color:T.text,
              border:`1px solid ${T.border}`, borderRadius:10,
              fontWeight:600, fontSize:13,
              cursor: stage==="processing" ? "not-allowed" : "pointer",
              opacity: stage==="processing" ? 0.4 : 1,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              WebkitTapHighlightColor:"transparent",
            }}>
            { stage === "done" ? "🔄 Retake"
            : stage === "crop" ? "← Back"
            :                    "📁 Choose Photo" }
          </button>

          {/* Right button */}
          { stage === "crop" && (
            <button onClick={() => setStage("preview")} style={{
              flex:1, height:50,
              background:T.gold, color:"#000",
              border:"none", borderRadius:10,
              fontWeight:800, fontSize:13, letterSpacing:"0.06em",
              cursor:"pointer", WebkitTapHighlightColor:"transparent",
            }}>✓ CONFIRM CROP</button>
          )}
          { stage === "preview" && (
            <button onClick={handleScan} style={{
              flex:1, height:50,
              background:T.gold, color:"#000",
              border:"none", borderRadius:10,
              fontWeight:800, fontSize:14, letterSpacing:"0.06em",
              cursor:"pointer", WebkitTapHighlightColor:"transparent",
              display:"flex", alignItems:"center", justifyContent:"center", gap:7,
            }}>✦ SCAN IT</button>
          )}
          { stage === "done" && (
            <button onClick={handleUse} style={{
              flex:2, height:50,
              background:T.gold, color:"#000",
              border:"none", borderRadius:10,
              fontWeight:800, fontSize:14, letterSpacing:"0.06em",
              cursor:"pointer", WebkitTapHighlightColor:"transparent",
            }}>✓ USE THIS SCAN</button>
          )}
          { (stage === "idle" || stage === "processing") && (
            <button disabled style={{
              flex:1, height:50,
              background:T.surface, color:T.muted,
              border:`1px solid ${T.border}`, borderRadius:10,
              fontWeight:800, fontSize:13, cursor:"not-allowed",
            }}>✦ SCAN IT</button>
          )}
        </div>

        {/* Cancel */}
        <button onClick={onClose} style={{
          width:"100%", height:40,
          background:"transparent", color:T.muted,
          border:`1px solid ${T.border}`, borderRadius:9,
          fontWeight:600, fontSize:13, cursor:"pointer",
          WebkitTapHighlightColor:"transparent",
        }}>✕ CANCEL</button>
      </div>

      <input
        ref={fileRef}
        type="file" accept="image/*" capture="environment"
        style={{ display:"none" }}
        onChange={handleFile}
      />
    </div>
  );
}

// ─── SUBMIT TICKET ────────────────────────────────────────────────────────────
function SubmitTicket({ phone, onComplete, editTicket }) {
  const { small } = useVW();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState("");

  const today = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
  })();

  const [form, setForm] = useState(() => editTicket ? {
    client:           editTicket["Client"]         || "",
    fieldTicket:      editTicket["Field Ticket #"]  || "",
    dispatch:         editTicket["Dispatch #"]      || "",
    unit:             editTicket["Unit #"]           || "",
    driver:           editTicket["Driver"]           || "",
    workDate:         editTicket["Service Date"]     || today,
    wellLease:        editTicket["Well/Lease"]       || "",
    notes:            editTicket["Notes"]            || "",
    fieldTicketImage: "",
    startTime:        editTicket["Start Time"]       || "",
    endTime:          editTicket["End Time"]         || "",
    hourlyRate:       editTicket["Hourly Rate"]      || "",
  } : {
    client:"", fieldTicket:"", dispatch:"", unit:"",
    driver:"", workDate:today, wellLease:"", notes:"",
    fieldTicketImage:"", startTime:"", endTime:"", hourlyRate:"",
  });

  const [loads, setLoads] = useState([{
    id:1, geminiRef:"", loadTicket:"", fluid:"Fresh Water",
    bbls:"", manifestOps:{ washOut:false, unload:false }, verificationImage:""
  }]);

  const [submissionId] = useState(editTicket ? editTicket["Submission ID"] : null);
  const [scanTarget, setScanTarget] = useState(null);
  const [scanOpen,   setScanOpen]   = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const sigRef  = useRef(null);
  const drawing = useRef(false);

  const isExxon = form.client === "Exxon";

  function update(k,v)     { setForm(p => ({...p, [k]:v})); }
  function updateLoad(i,k,v){ setLoads(p => { const c=[...p]; c[i][k]=v; return c; }); }
  function addLoad() {
    setLoads(p => [...p, {
      id:p.length+1, geminiRef:"", loadTicket:"",
      fluid:"Fresh Water", bbls:"", manifestOps:{washOut:false,unload:false}, verificationImage:""
    }]);
  }
  function deleteLoad(i) { setLoads(p => p.filter((_,idx)=>idx!==i)); }
  function toggleOp(i, op) {
    setLoads(p => { const c=[...p]; c[i].manifestOps[op]=!c[i].manifestOps[op]; return c; });
  }

  const totalBBLS = useMemo(() =>
    loads.reduce((s,l)=>{ const n=parseFloat(l.bbls); return s+(isNaN(n)?0:n); }, 0)
  , [loads]);

  function nonEmpty(v) { return String(v??"").trim().length > 0; }
  function loadOk(l) {
    const base = (!isExxon || nonEmpty(l.geminiRef)) && nonEmpty(l.loadTicket)
      && nonEmpty(l.bbls) && !isNaN(parseFloat(l.bbls));
    return l.fluid==="Manifest" ? base && (l.manifestOps.washOut||l.manifestOps.unload) : base;
  }

  const checks = useMemo(() => [
    { key:"client",           ok: nonEmpty(form.client) },
    { key:"fieldTicket",      ok: nonEmpty(form.fieldTicket) },
    { key:"dispatch",         ok: nonEmpty(form.dispatch) },
    { key:"unit",             ok: nonEmpty(form.unit) },
    { key:"driver",           ok: nonEmpty(form.driver) },
    { key:"workDate",         ok: nonEmpty(form.workDate) },
    { key:"wellLease",        ok: nonEmpty(form.wellLease) },
    { key:"fieldTicketImage", ok: nonEmpty(form.fieldTicketImage) },
    { key:"signature",        ok: hasSignature },
    ...loads.map((l,i) => ({ key:`load_${i}`, ok:loadOk(l) }))
  ], [form, loads, hasSignature]);

  const progress   = useMemo(()=>Math.round(checks.filter(c=>c.ok).length/checks.length*100), [checks]);
  const isComplete = useMemo(()=>checks.every(c=>c.ok), [checks]);

  const dispatchLabel = {
    "Exxon":"GEMINI DISPATCH #","Oxy":"IRONSIGHT JOB #","Western Midstream":"IRONSIGHT JOB #"
  }[form.client] || "DISPATCH #";

  function pt(e, canvas) {
    const r = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x:(cx-r.left)*(canvas.width/r.width), y:(cy-r.top)*(canvas.height/r.height) };
  }
  function startDraw(e) {
    if (e.type==="touchstart") e.preventDefault();
    const c=sigRef.current, ctx=c.getContext("2d");
    drawing.current=true;
    const p=pt(e,c);
    ctx.lineWidth=2.5; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.strokeStyle="#000";
    ctx.beginPath(); ctx.moveTo(p.x,p.y);
  }
  function draw(e) {
    if (!drawing.current) return;
    if (e.type==="touchmove") e.preventDefault();
    const c=sigRef.current, ctx=c.getContext("2d"), p=pt(e,c);
    ctx.lineTo(p.x,p.y); ctx.stroke(); setHasSignature(true);
  }
  function endDraw() { drawing.current=false; }
  function clearSig() {
    sigRef.current.getContext("2d").clearRect(0,0,sigRef.current.width,sigRef.current.height);
    setHasSignature(false);
  }

  async function handleSubmit() {
    if (!isComplete||isSubmitting) return;
    setIsSubmitting(true); setSubmitError("");
    const payload = {
      submissionId, phone, ...form, loads, totalBBLS,
      signature: sigRef.current.toDataURL("image/png")
    };
    try {
      await fetch(API_URL, {
        method:"POST", mode:"no-cors",
        headers:{"Content-Type":"text/plain;charset=utf-8"},
        body:JSON.stringify(payload)
      });
      onComplete();
    } catch {
      try {
        const q = JSON.parse(localStorage.getItem("offlineTickets")||"[]");
        q.push(payload);
        localStorage.setItem("offlineTickets", JSON.stringify(q));
        alert("No internet — ticket saved offline and will sync automatically.");
        onComplete();
      } catch { setSubmitError("Submission failed. Please try again."); }
    } finally { setIsSubmitting(false); }
  }

  useEffect(() => {
    async function syncOffline() {
      const q = JSON.parse(localStorage.getItem("offlineTickets")||"[]");
      if (!q.length) return;
      for (const t of q) {
        try {
          await fetch(API_URL,{method:"POST",mode:"no-cors",
            headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(t)});
        } catch { return; }
      }
      localStorage.removeItem("offlineTickets");
    }
    window.addEventListener("online", syncOffline);
    syncOffline();
    return () => window.removeEventListener("online", syncOffline);
  }, []);

  function openScanner(target) { setScanTarget(target); setScanOpen(true); }

  // Responsive helpers
  // On phones < 390px, stack to single column to avoid cramped overlapping inputs
  const G2 = {
    display:"grid",
    gridTemplateColumns: small ? "1fr" : "1fr 1fr",
    gap: small ? "0px" : "10px"
  };

  const S = {
    background:T.surface, borderRadius:10,
    padding: small ? "11px 10px" : "13px 12px",
    border:`1px solid ${T.border}`, marginBottom:10
  };
  const ST = {
    color:T.gold, fontFamily:"'Rajdhani',sans-serif",
    fontSize:12, fontWeight:700, letterSpacing:"0.15em", marginBottom:11
  };

  return (
    <PageShell maxW={520}>
      {/* Header */}
      <div style={{ marginBottom:14 }}>
        <div style={{ color:T.gold, fontFamily:"'Rajdhani',sans-serif",
          fontSize:17, fontWeight:700, letterSpacing:"0.12em" }}>
          {editTicket ? "EDIT & RESUBMIT" : "NEW FIELD TICKET"}
        </div>
        <div style={{ color:T.muted, fontSize:11 }}>
          {editTicket ? `Editing ${submissionId}` : "Complete all required fields"}
        </div>
      </div>

      {/* Progress */}
      <div style={{
        marginBottom:14, position:"sticky", top:0, zIndex:10,
        background:T.card, paddingBottom:5, paddingTop:2
      }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          fontSize:10, color:T.muted, marginBottom:4 }}>
          <span>FORM COMPLETION</span>
          <span style={{ color:progress===100?T.success:T.gold, fontWeight:700 }}>{progress}%</span>
        </div>
        <div style={{ height:3, background:T.surface, borderRadius:99 }}>
          <div style={{
            height:"100%", borderRadius:99,
            background:progress===100?T.success:T.gold,
            width:`${progress}%`, transition:"width 0.3s ease"
          }}/>
        </div>
      </div>

      {/* ── JOB INFO ── */}
      <div style={S}>
        <div style={ST}>📋 JOB INFORMATION</div>

        <Label text="Client Organization" required/>
        <Select value={form.client} onChange={e=>update("client",e.target.value)}>
          <option value="">Select client…</option>
          {["Exxon","Oxy","Western Midstream","Chevron","Other"].map(c=>(
            <option key={c}>{c}</option>
          ))}
        </Select>

        <div style={G2}>
          <div>
            <Label text="Field Ticket #" required/>
            <Input value={form.fieldTicket} onChange={e=>update("fieldTicket",e.target.value)}/>
          </div>
          <div>
            <Label text={dispatchLabel} required/>
            <Input value={form.dispatch} onChange={e=>update("dispatch",e.target.value)}/>
          </div>
        </div>

        <div style={G2}>
          <div>
            <Label text="Unit / Truck #" required/>
            <Input value={form.unit} onChange={e=>update("unit",e.target.value)}/>
          </div>
          <div>
            <Label text="Driver Name" required/>
            <Input value={form.driver} onChange={e=>update("driver",e.target.value)}/>
          </div>
        </div>

        <div style={G2}>
          <div>
            <Label text="Work Date" required/>
            <Input type="date" value={form.workDate} onChange={e=>update("workDate",e.target.value)}/>
          </div>
          <div>
            <Label text="Well / Lease" required/>
            <Input value={form.wellLease} onChange={e=>update("wellLease",e.target.value)}/>
          </div>
        </div>

        <Label text="Notes / Description"/>
        <Textarea placeholder="Add job specifics…" value={form.notes}
          onChange={e=>update("notes",e.target.value)} style={{ minHeight:68 }}/>

        <div style={G2}>
          <div>
            <Label text="Start Time"/>
            <Input type="time" value={form.startTime} onChange={e=>update("startTime",e.target.value)}/>
          </div>
          <div>
            <Label text="End Time"/>
            <Input type="time" value={form.endTime} onChange={e=>update("endTime",e.target.value)}/>
          </div>
        </div>

        <Label text="Hourly Rate ($)"/>
        <Input type="number" placeholder="e.g. 85" value={form.hourlyRate}
          onChange={e=>update("hourlyRate",e.target.value)}/>

        {form.startTime && form.endTime && (() => {
          const [sh,sm] = form.startTime.split(":").map(Number);
          const [eh,em] = form.endTime.split(":").map(Number);
          let mins = (eh*60+em)-(sh*60+sm);
          if (mins < 0) mins += 1440;
          const hrs   = (mins/60).toFixed(2);
          const total = form.hourlyRate ? (parseFloat(hrs)*parseFloat(form.hourlyRate)).toFixed(2) : null;
          return (
            <div style={{
              marginTop:8, padding:"8px 11px",
              background:"rgba(212,175,55,0.08)",
              border:"1px solid rgba(212,175,55,0.25)", borderRadius:7,
              display:"flex", justifyContent:"space-between", alignItems:"center"
            }}>
              <div>
                <div style={{ color:T.muted, fontSize:10 }}>TOTAL HOURS</div>
                <div style={{ color:T.gold, fontFamily:"'Space Mono',monospace",
                  fontWeight:700, fontSize:16 }}>{hrs} hrs</div>
              </div>
              {total && (
                <div style={{ textAlign:"right" }}>
                  <div style={{ color:T.muted, fontSize:10 }}>HOURS TOTAL</div>
                  <div style={{ color:T.success, fontFamily:"'Space Mono',monospace",
                    fontWeight:700, fontSize:16 }}>${total}</div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── FIELD TICKET PHOTO ── */}
      <div style={S}>
        <div style={ST}>📄 FIELD TICKET PHOTO <span style={{color:T.danger}}>✱</span></div>
        <div onClick={()=>openScanner({type:"field"})} style={{
          border:`1px dashed ${form.fieldTicketImage?T.goldDim:T.border}`,
          borderRadius:8, padding:18, cursor:"pointer", textAlign:"center",
          background:T.bg, transition:"border-color 0.2s",
          WebkitTapHighlightColor:"transparent",
        }}>
          {form.fieldTicketImage
            ? <img src={form.fieldTicketImage} style={{ width:"100%", borderRadius:5 }} alt=""/>
            : <div style={{ color:T.muted, fontSize:13 }}>📄 Tap to scan or upload ticket</div>
          }
        </div>
        {form.fieldTicketImage && (
          <button onClick={()=>update("fieldTicketImage","")} style={{
            marginTop:6, background:"transparent", border:"none",
            color:T.danger, fontSize:12, cursor:"pointer",
            WebkitTapHighlightColor:"transparent"
          }}>✕ Remove photo</button>
        )}
      </div>

      {/* ── LOAD MANIFEST ── */}
      <div style={S}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:11 }}>
          <div style={ST}>🚛 LOAD MANIFEST</div>
          <div style={{
            background:`rgba(212,175,55,0.1)`, border:`1px solid ${T.goldDim}`,
            borderRadius:6, padding:"3px 9px", color:T.gold,
            fontFamily:"'Space Mono',monospace", fontSize:11, fontWeight:700, flexShrink:0
          }}>
            {totalBBLS.toFixed(2)} BBL
          </div>
        </div>

        {loads.map((load, idx) => (
          <div key={load.id} style={{
            background:T.bg, borderRadius:8, padding:11,
            border:`1px solid ${T.border}`, marginBottom:9,
            borderLeft:`3px solid ${T.gold}`
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:9 }}>
              <span style={{
                background:T.gold, color:"#000", padding:"2px 7px",
                borderRadius:4, fontWeight:800, fontSize:11,
                fontFamily:"'Rajdhani',sans-serif"
              }}>
                LOAD {String(idx+1).padStart(2,"0")}
              </span>
              {loads.length > 1 && (
                <button onClick={()=>deleteLoad(idx)} style={{
                  marginLeft:"auto", background:"transparent",
                  border:`1px solid ${T.border}`, color:T.danger,
                  borderRadius:5, padding:"2px 7px", cursor:"pointer", fontSize:12,
                  WebkitTapHighlightColor:"transparent"
                }}>✕</button>
              )}
            </div>

            {isExxon && (
              <>
                <Label text="Gemini Dispatch Ref #" required/>
                <Input value={load.geminiRef} onChange={e=>updateLoad(idx,"geminiRef",e.target.value)}/>
              </>
            )}

            <Label text="Load Ticket Number" required/>
            <Input value={load.loadTicket} onChange={e=>updateLoad(idx,"loadTicket",e.target.value)}/>

            <div style={G2}>
              <div>
                <Label text="Fluid Type"/>
                <Select value={load.fluid} onChange={e=>updateLoad(idx,"fluid",e.target.value)}>
                  {["Fresh Water","Brine Water","Disposal Water","Manifest"].map(f=>(
                    <option key={f}>{f}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label text="BBLs" required/>
                <Input type="number" value={load.bbls}
                  onChange={e=>updateLoad(idx,"bbls",e.target.value)}/>
              </div>
            </div>

            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:7 }}>
              {[90,100,120,130,150,200].map(q=>(
                <button key={q} onClick={()=>updateLoad(idx,"bbls",String(q))} style={{
                  padding:"4px 9px", borderRadius:5, fontSize:12, cursor:"pointer",
                  background: String(load.bbls)===String(q)?"rgba(212,175,55,0.2)":T.surface,
                  border:`1px solid ${String(load.bbls)===String(q)?T.gold:T.border}`,
                  color: String(load.bbls)===String(q)?T.gold:T.muted,
                  transition:"all 0.15s", WebkitTapHighlightColor:"transparent"
                }}>{q}</button>
              ))}
            </div>

            <Label text="Verification Image"/>
            <div onClick={()=>openScanner({type:"load",index:idx})} style={{
              border:`1px dashed ${load.verificationImage?T.goldDim:T.border}`,
              borderRadius:8, padding:load.verificationImage?0:12,
              cursor:"pointer", textAlign:"center", background:T.card, overflow:"hidden",
              WebkitTapHighlightColor:"transparent",
            }}>
              {load.verificationImage
                ? <img src={load.verificationImage} style={{ width:"100%", display:"block" }} alt=""/>
                : <div style={{ color:T.muted, fontSize:12 }}>🧾 Scan load ticket</div>
              }
            </div>

            {load.fluid==="Manifest" && (
              <div style={{
                marginTop:9, border:`1px solid ${T.border}`, borderRadius:8, padding:10
              }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  color:T.muted, fontSize:10, marginBottom:8 }}>
                  <span>MANIFEST OPERATIONS</span>
                  <span style={{ color:T.danger }}>REQUIRED</span>
                </div>
                <div style={{ display:"flex", gap:7 }}>
                  {[["washOut","WASH OUT"],["unload","UNLOAD"]].map(([op,label])=>(
                    <button key={op} onClick={()=>toggleOp(idx,op)} style={{
                      flex:1, padding:"8px 0", borderRadius:7, fontWeight:700,
                      fontSize:12, cursor:"pointer", letterSpacing:"0.05em",
                      border:`1px solid ${load.manifestOps[op]?T.gold:T.border}`,
                      background: load.manifestOps[op]?"rgba(212,175,55,0.12)":"transparent",
                      color: load.manifestOps[op]?T.gold:T.muted,
                      transition:"all 0.15s", WebkitTapHighlightColor:"transparent"
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <button onClick={addLoad} style={{
          width:"100%", padding:11, border:`1px dashed ${T.border}`,
          borderRadius:8, cursor:"pointer", textAlign:"center",
          background:"transparent", color:T.muted, fontSize:13,
          WebkitTapHighlightColor:"transparent"
        }}>+ ADD ADDITIONAL LOAD</button>
      </div>

      {/* ── SIGNATURE ── */}
      <div style={S}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:8 }}>
          <div style={ST}>✍ OPERATOR SIGNATURE <span style={{color:T.danger}}>✱</span></div>
          {hasSignature && (
            <button onClick={clearSig} style={{
              background:"transparent", border:"none",
              color:T.danger, fontSize:12, cursor:"pointer",
              WebkitTapHighlightColor:"transparent"
            }}>✕ Clear</button>
          )}
        </div>
        <div style={{ borderRadius:8, overflow:"hidden", border:`1px solid ${T.border}` }}>
          <canvas ref={sigRef} width={900} height={240}
            style={{ width:"100%", height:110, background:"#fff",
              display:"block", touchAction:"none" }}
            onMouseDown={startDraw} onMouseMove={draw}
            onMouseUp={endDraw}    onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          />
        </div>
        {!hasSignature && (
          <div style={{ color:T.muted, fontSize:11, textAlign:"center", marginTop:5 }}>
            Sign above with your finger or mouse
          </div>
        )}
      </div>

      {/* ── VOLUME SUMMARY ── */}
      <div style={{ ...S, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ color:T.muted, fontSize:12 }}>
          <div>TOTAL LOADS</div>
          <div style={{ color:T.text, fontWeight:700, fontSize:17, marginTop:2 }}>
            {loads.length}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:T.muted, fontSize:12 }}>TOTAL VOLUME</div>
          <div style={{ color:T.gold, fontFamily:"'Space Mono',monospace",
            fontSize:24, fontWeight:700, marginTop:2 }}>
            {totalBBLS.toFixed(2)} <span style={{ fontSize:13 }}>BBL</span>
          </div>
        </div>
      </div>

      {submitError && (
        <div style={{ color:T.danger, fontSize:12, textAlign:"center", marginBottom:8 }}>
          ⚠ {submitError}
        </div>
      )}

      <GoldBtn disabled={!isComplete} loading={isSubmitting} onClick={handleSubmit}>
        {isSubmitting?"SUBMITTING…":isComplete?"✓ SUBMIT FINAL TICKET":`COMPLETE FORM (${progress}%)`}
      </GoldBtn>

      <ScannerModal
        open={scanOpen}
        onClose={()=>{ setScanOpen(false); setScanTarget(null); }}
        onUse={img=>{
          if (scanTarget?.type==="field") update("fieldTicketImage", img);
          if (scanTarget?.type==="load") {
            setLoads(p=>{ const c=[...p]; c[scanTarget.index].verificationImage=img; return c; });
          }
          setScanOpen(false); setScanTarget(null);
        }}
      />
    </PageShell>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  injectGlobalStyles();

  const [phone,      setPhone]      = useState(()=>localStorage.getItem("bd_phone"));
  const [page,       setPage]       = useState(()=>localStorage.getItem("bd_phone")?"dashboard":"login");
  const [editTicket, setEditTicket] = useState(null);

  function login(p)  { localStorage.setItem("bd_phone",p); setPhone(p); setPage("dashboard"); }
  function logout()  { localStorage.removeItem("bd_phone"); setPhone(null); setPage("login"); }

  if (!phone||page==="login")
    return <Login onLogin={login}/>;
  if (page==="dashboard")
    return <Dashboard phone={phone} onLogout={logout}
      onStartTicket={()=>{ setEditTicket(null); setPage("submit"); }}
      onOpenQueue={()=>setPage("queue")}/>;
  if (page==="queue")
    return <Queue phone={phone} onBack={()=>setPage("dashboard")}
      onEdit={t=>{ setEditTicket(t); setPage("submit"); }}/>;
  if (page==="submit")
    return <SubmitTicket phone={phone} editTicket={editTicket}
      onComplete={()=>{ setEditTicket(null); setPage("success"); }}/>;
  if (page==="success")
    return <TicketSuccess onBack={()=>setPage("dashboard")}/>;

  return null;
}

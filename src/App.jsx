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
// DOCSCAN ENGINE — pure Canvas/JS image processing (no external libs)
// Steps: Grayscale → Gaussian Blur → Sobel Edges → Corner Detection →
//        Perspective Warp → Adaptive Threshold / Colour Enhance
// ═══════════════════════════════════════════════════════════════════════════
const DocScan = {
  // Step 1 — Grayscale (ITU-R BT.601 weighted luminance)
  toGrayscale(imageData) {
    const { data, width, height } = imageData;
    const gray = new Uint8ClampedArray(width * height);
    for (let i = 0; i < gray.length; i++) {
      gray[i] = Math.round(0.299*data[i*4] + 0.587*data[i*4+1] + 0.114*data[i*4+2]);
    }
    return gray;
  },

  // Step 2 — 5×5 Gaussian blur (σ≈1.0) — suppresses noise before edge detection
  gaussianBlur(gray, width, height) {
    const k = [2,4,5,4,2, 4,9,12,9,4, 5,12,15,12,5, 4,9,12,9,4, 2,4,5,4,2];
    const out = new Uint8ClampedArray(width * height);
    for (let y = 2; y < height-2; y++) {
      for (let x = 2; x < width-2; x++) {
        let sum = 0, ki = 0;
        for (let ky = -2; ky <= 2; ky++)
          for (let kx = -2; kx <= 2; kx++)
            sum += gray[(y+ky)*width+(x+kx)] * k[ki++];
        out[y*width+x] = Math.round(sum / 159);
      }
    }
    return out;
  },

  // Step 3 — Sobel edge detection + auto-threshold + dilation
  detectEdges(blurred, width, height) {
    const mag = new Float32Array(width * height);
    let maxMag = 0;
    for (let y = 1; y < height-1; y++) {
      for (let x = 1; x < width-1; x++) {
        const gx = -blurred[(y-1)*width+(x-1)] + blurred[(y-1)*width+(x+1)]
                   -2*blurred[y*width+(x-1)]   + 2*blurred[y*width+(x+1)]
                   -blurred[(y+1)*width+(x-1)] + blurred[(y+1)*width+(x+1)];
        const gy = -blurred[(y-1)*width+(x-1)] - 2*blurred[(y-1)*width+x] - blurred[(y-1)*width+(x+1)]
                   +blurred[(y+1)*width+(x-1)] + 2*blurred[(y+1)*width+x] + blurred[(y+1)*width+(x+1)];
        mag[y*width+x] = Math.sqrt(gx*gx+gy*gy);
        if (mag[y*width+x] > maxMag) maxMag = mag[y*width+x];
      }
    }
    const thresh = maxMag * 0.20;
    const edges  = new Uint8ClampedArray(width * height);
    for (let i = 0; i < mag.length; i++) edges[i] = mag[i] > thresh ? 255 : 0;
    // Dilate to close outline gaps
    const d = new Uint8ClampedArray(width * height);
    for (let y = 1; y < height-1; y++)
      for (let x = 1; x < width-1; x++) {
        const n = y*width+x;
        if (edges[n]||edges[n-1]||edges[n+1]||edges[n-width]||edges[n+width]) d[n]=255;
      }
    return d;
  },

  // Step 3b — Find document corners (TL, TR, BR, BL) from edge map
  findDocumentCorners(edges, width, height) {
    let minX=width,maxX=0,minY=height,maxY=0,count=0;
    for (let y=0;y<height;y++) for (let x=0;x<width;x++) {
      if (edges[y*width+x]===255) {
        if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;count++;
      }
    }
    if ((maxX-minX)*(maxY-minY) < width*height*0.15 || count<500) return null;
    const mx=(minX+maxX)/2, my=(minY+maxY)/2;
    function best(xs,ys,score){let b=null,bs=-Infinity;for(const y of ys)for(const x of xs){if(edges[y*width+x]===255){const s=score(x,y);if(s>bs){bs=s;b=[x,y];}}}return b||[xs[0],ys[0]];}
    const yt=[...Array(Math.floor(my)).keys()], yb=[...Array(height-Math.ceil(my)).keys()].map(i=>Math.ceil(my)+i);
    const xl=[...Array(Math.floor(mx)).keys()], xr=[...Array(width-Math.ceil(mx)).keys()].map(i=>Math.ceil(mx)+i);
    return [best(xl,yt,(x,y)=>-(x+y)),best(xr,yt,(x,y)=>x-y),best(xr,yb,(x,y)=>x+y),best(xl,yb,(x,y)=>-x+y)];
  },

  // Step 4 — Perspective warp via homography (bilinear interpolation)
  perspectiveWarp(srcData, srcW, srcH, corners) {
    const [tl,tr,br,bl] = corners;
    const outW = Math.round(Math.max(Math.hypot(tr[0]-tl[0],tr[1]-tl[1]),Math.hypot(br[0]-bl[0],br[1]-bl[1])));
    const outH = Math.round(Math.max(Math.hypot(bl[0]-tl[0],bl[1]-tl[1]),Math.hypot(br[0]-tr[0],br[1]-tr[1])));
    if (outW<10||outH<10) return null;
    const src=[tl[0],tl[1],tr[0],tr[1],br[0],br[1],bl[0],bl[1]];
    const dst=[0,0,outW-1,0,outW-1,outH-1,0,outH-1];
    const A=[];
    for(let i=0;i<4;i++){const[sx,sy]=[src[i*2],src[i*2+1]],[dx,dy]=[dst[i*2],dst[i*2+1]];A.push([-dx,-dy,-1,0,0,0,sx*dx,sx*dy,sx]);A.push([0,0,0,-dx,-dy,-1,sy*dx,sy*dy,sy]);}
    const h=this._solveH(A); if(!h) return null;
    const out=new Uint8ClampedArray(outW*outH*4);
    for(let dy=0;dy<outH;dy++) for(let dx=0;dx<outW;dx++){
      const w=h[6]*dx+h[7]*dy+h[8], sx=(h[0]*dx+h[1]*dy+h[2])/w, sy=(h[3]*dx+h[4]*dy+h[5])/w;
      const x0=Math.floor(sx),y0=Math.floor(sy),x1=x0+1,y1=y0+1,fx=sx-x0,fy=sy-y0;
      if(x0<0||y0<0||x1>=srcW||y1>=srcH) continue;
      const i00=(y0*srcW+x0)*4,i10=(y0*srcW+x1)*4,i01=(y1*srcW+x0)*4,i11=(y1*srcW+x1)*4,oi=(dy*outW+dx)*4;
      for(let c=0;c<3;c++) out[oi+c]=Math.round(srcData[i00+c]*(1-fx)*(1-fy)+srcData[i10+c]*fx*(1-fy)+srcData[i01+c]*(1-fx)*fy+srcData[i11+c]*fx*fy);
      out[oi+3]=255;
    }
    return {data:out,width:outW,height:outH};
  },

  _solveH(A) {
    const n=8, M=A.map(r=>[...r]);
    for(let col=0;col<n;col++){
      let p=-1,best=0;
      for(let row=col;row<n*2;row++) if(Math.abs(M[row][col])>best){best=Math.abs(M[row][col]);p=row;}
      if(p<0||best<1e-10) return null;
      [M[col],M[p]]=[M[p],M[col]];
      const d=M[col][col]; M[col]=M[col].map(v=>v/d);
      for(let row=0;row<n*2;row++){if(row===col) continue; const f=M[row][col]; M[row]=M[row].map((v,j)=>v-f*M[col][j]);}
    }
    return M.slice(0,8).map(r=>r[8]).concat([1]);
  },

  // Step 5a — Adaptive threshold (B&W scan look, handles shadows perfectly)
  // Uses integral image for O(1) local mean queries — fast even on mobile
  adaptiveThreshold(imageData) {
    const {data,width,height} = imageData;
    const gray = this.toGrayscale(imageData);
    const out  = new ImageData(width, height);
    const HALF=10, C=10;
    const integral = new Float64Array((width+1)*(height+1));
    for(let y=0;y<height;y++) for(let x=0;x<width;x++)
      integral[(y+1)*(width+1)+(x+1)] = gray[y*width+x]+integral[y*(width+1)+(x+1)]+integral[(y+1)*(width+1)+x]-integral[y*(width+1)+x];
    for(let y=0;y<height;y++) for(let x=0;x<width;x++){
      const x1=Math.max(0,x-HALF),y1=Math.max(0,y-HALF),x2=Math.min(width-1,x+HALF),y2=Math.min(height-1,y+HALF);
      const area=(x2-x1+1)*(y2-y1+1);
      const sum=integral[(y2+1)*(width+1)+(x2+1)]-integral[y1*(width+1)+(x2+1)]-integral[(y2+1)*(width+1)+x1]+integral[y1*(width+1)+x1];
      const val=gray[y*width+x]<(sum/area)-C?0:255;
      const i=(y*width+x)*4; out.data[i]=out.data[i+1]=out.data[i+2]=val; out.data[i+3]=255;
    }
    return out;
  },

  // Step 5b — Colour enhance: tile-based CLAHE in luminance only
  colorEnhance(imageData) {
    const {data,width,height} = imageData;
    const out = new ImageData(new Uint8ClampedArray(data), width, height);
    const TILE=64;
    for(let ty=0;ty<height;ty+=TILE) for(let tx=0;tx<width;tx+=TILE){
      const tw=Math.min(TILE,width-tx), th=Math.min(TILE,height-ty);
      let lo=255,hi=0;
      for(let y=ty;y<ty+th;y++) for(let x=tx;x<tx+tw;x++){
        const i=(y*width+x)*4, lum=0.299*data[i]+0.587*data[i+1]+0.114*data[i+2];
        if(lum<lo)lo=lum;if(lum>hi)hi=lum;
      }
      if(hi-lo<5) continue;
      const sc=255/(hi-lo);
      for(let y=ty;y<ty+th;y++) for(let x=tx;x<tx+tw;x++){
        const i=(y*width+x)*4;
        out.data[i]  =Math.min(255,Math.round((data[i]  -lo)*sc));
        out.data[i+1]=Math.min(255,Math.round((data[i+1]-lo)*sc));
        out.data[i+2]=Math.min(255,Math.round((data[i+2]-lo)*sc));
      }
    }
    return out;
  },

  // Master pipeline — returns { dataURL, contourFound }
  async process(dataURL, mode="adaptive", onProgress=()=>{}) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const MAX=1400;
        let w=img.width, h=img.height;
        if(Math.max(w,h)>MAX){const s=MAX/Math.max(w,h);w=Math.round(w*s);h=Math.round(h*s);}
        const c=document.createElement("canvas"); c.width=w; c.height=h;
        const ctx=c.getContext("2d"); ctx.drawImage(img,0,0,w,h);
        const imgData=ctx.getImageData(0,0,w,h);
        onProgress(15,"Grayscale + blur…");
        const gray=this.toGrayscale(imgData), blurred=this.gaussianBlur(gray,w,h);
        onProgress(35,"Edge detection…");
        const edges=this.detectEdges(blurred,w,h), corners=this.findDocumentCorners(edges,w,h);
        onProgress(55,"Perspective correction…");
        let warpedData=null, contourFound=false;
        if(corners){warpedData=this.perspectiveWarp(imgData.data,w,h,corners);if(warpedData)contourFound=true;}
        onProgress(75,"Enhancing…");
        let finalData;
        if(warpedData){
          const wi=new ImageData(warpedData.data,warpedData.width,warpedData.height);
          finalData=mode==="color"?this.colorEnhance(wi):this.adaptiveThreshold(wi);
        } else {
          finalData=mode==="color"?this.colorEnhance(imgData):this.adaptiveThreshold(imgData);
        }
        onProgress(95,"Finishing…");
        const oc=document.createElement("canvas"); oc.width=finalData.width; oc.height=finalData.height;
        oc.getContext("2d").putImageData(finalData,0,0);
        resolve({dataURL:oc.toDataURL("image/jpeg",0.92), contourFound});
      };
      img.onerror=()=>resolve(null);
      img.src=dataURL;
    });
  }
};

// ─── SCANNER MODAL (DocScan-powered) ─────────────────────────────────────────
function ScannerModal({ open, onClose, onUse }) {
  const [stage,     setStage]     = useState("idle"); // idle|preview|processing|done
  const [original,  setOriginal]  = useState(null);
  const [result,    setResult]    = useState(null);
  const [progress,  setProgress]  = useState(0);
  const [progLabel, setProgLabel] = useState("");
  const [scanMode,  setScanMode]  = useState("adaptive");
  const [found,     setFound]     = useState(false);
  const fileRef   = useRef(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    if (open) {
      setStage("idle"); setOriginal(null); setResult(null); setProgress(0);
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
    const f = e.target.files?.[0]; if (!f) return;
    setStage("preview"); setResult(null);
    const r = new FileReader();
    r.onload = ev => setOriginal(ev.target.result);
    r.readAsDataURL(f);
    e.target.value = "";
  }

  async function handleScan() {
    if (!original) return;
    setStage("processing"); setProgress(5); setProgLabel("Starting…");
    const res = await DocScan.process(original, scanMode, (pct, lbl) => {
      setProgress(pct); setProgLabel(lbl);
    });
    if (res) { setResult(res.dataURL); setFound(res.contourFound); setStage("done"); }
    else     { setStage("preview"); }
  }

  function handleUse()    { if (result) { onUse(result); onClose(); } }
  function handleRetake() { setStage("idle"); setOriginal(null); setResult(null); }

  const displaySrc = stage === "done" ? result : original;

  return (
    <div className="bd-scanner" data-open={open ? "true" : "false"}>

      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        paddingTop:"max(14px, env(safe-area-inset-top, 14px))",
        paddingBottom:12, paddingLeft:14, paddingRight:14,
        background:T.card, borderBottom:`1px solid ${T.border}`, flexShrink:0,
      }}>
        <button onClick={onClose} style={{
          width:44, height:44, borderRadius:10, background:T.surface,
          border:`1px solid ${T.border}`, color:T.text, cursor:"pointer",
          fontSize:18, display:"flex", alignItems:"center", justifyContent:"center",
          WebkitTapHighlightColor:"transparent", flexShrink:0,
        }}>✕</button>
        <div style={{ textAlign:"center" }}>
          <div style={{ color:T.gold, fontSize:13, fontWeight:700, letterSpacing:"0.12em" }}>
            {stage==="done" ? "✅ SCAN COMPLETE" : "📷 SCAN DOCUMENT"}
          </div>
          {stage==="done" && (
            <div style={{ color:found?T.success:T.warn, fontSize:10, marginTop:2 }}>
              {found ? "Document detected & corrected" : "No border found · full frame used"}
            </div>
          )}
        </div>
        <div style={{ width:44, flexShrink:0 }}/>
      </div>

      {/* Preview area */}
      <div style={{
        flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        background:"#060606", padding:12, overflow:"hidden", minHeight:0, position:"relative",
      }}>
        {stage === "idle" && (
          <div onClick={()=>fileRef.current?.click()}
            style={{ textAlign:"center", color:T.muted, cursor:"pointer", padding:16 }}>
            <div style={{ fontSize:52, lineHeight:1, marginBottom:14 }}>📄</div>
            <div style={{ fontSize:14, marginBottom:6 }}>Tap to photograph a document</div>
            <div style={{ fontSize:12, marginBottom:20, opacity:0.7 }}>Field ticket, load ticket, or any doc</div>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8, padding:"12px 22px",
              background:`rgba(212,175,55,0.12)`, border:`1px solid ${T.goldDim}`,
              borderRadius:10, color:T.gold, fontWeight:700, fontSize:13, letterSpacing:"0.08em"
            }}>📁 Choose / Take Photo</div>
          </div>
        )}

        {(stage==="preview"||stage==="done") && displaySrc && (
          <img src={displaySrc} alt="Preview" style={{
            maxWidth:"100%", maxHeight:"100%", objectFit:"contain",
            borderRadius:6, boxShadow:"0 0 0 1px rgba(212,175,55,0.2)"
          }}/>
        )}

        {stage === "processing" && (
          <div style={{
            position:"absolute", inset:0, background:"rgba(0,0,0,0.85)",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16,
          }}>
            {original && <img src={original} alt="" style={{
              position:"absolute", inset:0, width:"100%", height:"100%",
              objectFit:"contain", opacity:0.12, filter:"blur(3px)"
            }}/>}
            <div style={{ position:"relative" }}><Spinner size={40} color={T.gold}/></div>
            <div style={{ position:"relative", textAlign:"center" }}>
              <div style={{ color:T.gold, fontWeight:700, fontSize:14,
                letterSpacing:"0.1em", marginBottom:8 }}>PROCESSING</div>
              <div style={{ color:T.muted, fontSize:12, marginBottom:14 }}>{progLabel}</div>
              <div style={{ width:180, height:3, background:"rgba(255,255,255,0.1)", borderRadius:99 }}>
                <div style={{ height:"100%", background:T.gold, borderRadius:99,
                  width:`${progress}%`, transition:"width 0.2s ease" }}/>
              </div>
              <div style={{ color:T.muted, fontSize:11, marginTop:6 }}>{progress}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div style={{
        flexShrink:0, background:T.card, borderTop:`1px solid ${T.border}`,
        paddingTop:12, paddingLeft:14, paddingRight:14,
        paddingBottom:"max(16px, env(safe-area-inset-bottom, 16px))",
      }}>
        {/* Mode selector — only shown when photo is loaded but not yet scanned */}
        {stage === "preview" && (
          <div style={{ marginBottom:10 }}>
            <div style={{ color:T.muted, fontSize:10, fontWeight:700,
              letterSpacing:"0.12em", marginBottom:7 }}>SCAN MODE</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
              {[
                { id:"adaptive", icon:"🔳", label:"B&W SCAN",  sub:"Best for most docs" },
                { id:"color",    icon:"🌈", label:"COLOUR",    sub:"Keep colours" },
              ].map(m => (
                <button key={m.id} onClick={()=>setScanMode(m.id)} style={{
                  padding:"9px 10px", borderRadius:8, cursor:"pointer", textAlign:"left",
                  border:`1px solid ${scanMode===m.id?T.gold:T.border}`,
                  background: scanMode===m.id?"rgba(212,175,55,0.1)":"transparent",
                  WebkitTapHighlightColor:"transparent",
                }}>
                  <div style={{ fontSize:16, marginBottom:3 }}>{m.icon}</div>
                  <div style={{ color:scanMode===m.id?T.gold:T.text,
                    fontSize:11, fontWeight:700, letterSpacing:"0.06em" }}>{m.label}</div>
                  <div style={{ color:T.muted, fontSize:10, marginTop:1 }}>{m.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          {/* Left: retake or choose */}
          <button onClick={stage==="done"?handleRetake:()=>fileRef.current?.click()} style={{
            flex:1, height:50, background:T.surface, color:T.text,
            border:`1px solid ${T.border}`, borderRadius:10,
            fontWeight:600, fontSize:13, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            WebkitTapHighlightColor:"transparent",
          }}>
            {stage==="done" ? "🔄 Retake" : "📁 Choose Photo"}
          </button>

          {/* Right: scan or use */}
          {stage === "preview" && (
            <button onClick={handleScan} style={{
              flex:1, height:50, background:T.gold, color:"#000",
              border:"none", borderRadius:10,
              fontWeight:800, fontSize:13, letterSpacing:"0.06em",
              cursor:"pointer", WebkitTapHighlightColor:"transparent",
              display:"flex", alignItems:"center", justifyContent:"center", gap:7,
            }}>✦ SCAN IT</button>
          )}
          {stage === "done" && (
            <button onClick={handleUse} style={{
              flex:2, height:50, background:T.gold, color:"#000",
              border:"none", borderRadius:10,
              fontWeight:800, fontSize:13, letterSpacing:"0.06em",
              cursor:"pointer", WebkitTapHighlightColor:"transparent",
            }}>✓ USE THIS SCAN</button>
          )}
          {(stage==="idle"||stage==="processing") && (
            <button disabled style={{
              flex:1, height:50, background:T.surface, color:T.muted,
              border:`1px solid ${T.border}`, borderRadius:10,
              fontWeight:800, fontSize:13, cursor:"not-allowed",
            }}>✦ SCAN IT</button>
          )}
        </div>

        <button onClick={onClose} style={{
          width:"100%", height:42, background:"transparent", color:T.muted,
          border:`1px solid ${T.border}`, borderRadius:9,
          fontWeight:600, fontSize:13, cursor:"pointer",
          WebkitTapHighlightColor:"transparent",
        }}>✕ CANCEL</button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        style={{ display:"none" }} onChange={handleFile}/>
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

import React, { useState, useMemo, useEffect, useRef } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_URL =
  "https://script.google.com/macros/s/AKfycbwS0QFVxrOt0dPJhAMiPAvIEaX3AekuXCrLtn3jAydu4cqgwGHIeGpvF_kIudbM6-0aGw/exec";

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
  info:    "#3b82f6",
};

// ─── GLOBAL STYLES injected once ─────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: ${T.bg}; color: ${T.text}; font-family: 'Inter', sans-serif; }
  input, select, textarea, button { font-family: inherit; }
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.7); }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pop    { 0%{transform:scale(0.85);opacity:0} 60%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes shimmer{ 0%{background-position:-200% center} 100%{background-position:200% center} }
  .fadeUp   { animation: fadeUp 0.35s ease both; }
  .pop      { animation: pop 0.4s cubic-bezier(.34,1.56,.64,1) both; }
`;

function injectGlobalStyles() {
  if (document.getElementById("bd-global")) return;
  const s = document.createElement("style");
  s.id = "bd-global";
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

// ─── TINY SHARED UI ──────────────────────────────────────────────────────────

function Spinner({ size = 16, color = "#000" }) {
  return (
    <span style={{
      display:"inline-block", width:size, height:size,
      border:`2px solid rgba(0,0,0,0.2)`, borderTop:`2px solid ${color}`,
      borderRadius:"50%", animation:"spin 0.7s linear infinite", flexShrink:0
    }}/>
  );
}

function Label({ text, required }) {
  return (
    <div style={{ color: T.muted, fontSize: 10, fontWeight: 600,
      letterSpacing: "0.12em", textTransform:"uppercase", marginTop: 16, marginBottom: 6 }}>
      {text}{required && <span style={{ color: T.danger }}> ✱</span>}
    </div>
  );
}

function Input({ style, ...props }) {
  return (
    <input style={{
      width:"100%", padding:"10px 12px", background: T.surface,
      border:`1px solid ${T.border}`, color: T.text, borderRadius: 8,
      fontSize: 14, outline:"none", transition:"border-color 0.15s",
      ...style
    }}
    onFocus={e  => e.target.style.borderColor = T.goldDim}
    onBlur={e   => e.target.style.borderColor = T.border}
    {...props}
    />
  );
}

function Textarea({ style, ...props }) {
  return (
    <textarea style={{
      width:"100%", padding:"10px 12px", background: T.surface,
      border:`1px solid ${T.border}`, color: T.text, borderRadius: 8,
      fontSize: 14, resize:"vertical", minHeight: 100, outline:"none",
      lineHeight: 1.6, transition:"border-color 0.15s", ...style
    }}
    onFocus={e  => e.target.style.borderColor = T.goldDim}
    onBlur={e   => e.target.style.borderColor = T.border}
    {...props}
    />
  );
}

function Select({ children, style, ...props }) {
  return (
    <select style={{
      width:"100%", padding:"10px 12px", background: T.surface,
      border:`1px solid ${T.border}`, color: T.text, borderRadius: 8,
      fontSize: 14, outline:"none", appearance:"none",
      backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7394' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center",
      transition:"border-color 0.15s", ...style
    }}
    onFocus={e  => e.target.style.borderColor = T.goldDim}
    onBlur={e   => e.target.style.borderColor = T.border}
    {...props}
    >
      {children}
    </select>
  );
}

function GoldBtn({ children, disabled, loading, onClick, style }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{
        width:"100%", padding:"13px 16px", background: disabled ? "#2a2d38" : T.gold,
        color: disabled ? T.muted : "#000", border:"none", borderRadius: 8,
        fontWeight: 700, fontSize: 13, letterSpacing:"0.1em",
        cursor: disabled ? "not-allowed" : "pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap: 8,
        transition:"all 0.15s", opacity: loading ? 0.85 : 1,
        fontFamily:"'Rajdhani', sans-serif", ...style
      }}>
      {loading && <Spinner size={14} color={disabled?"#6b7394":"#000"}/>}
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, style }) {
  return (
    <button onClick={onClick}
      style={{
        width:"100%", padding:"12px 16px", background:"transparent",
        color: T.text, border:`1px solid ${T.border}`, borderRadius: 8,
        fontWeight: 600, fontSize: 13, letterSpacing:"0.08em",
        cursor:"pointer", transition:"all 0.15s",
        fontFamily:"'Rajdhani', sans-serif", ...style
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.background = T.surface; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

function PageShell({ children, maxW = 480 }) {
  return (
    <div style={{
      background: T.bg, minHeight:"100vh", width:"100%",
      display:"flex", justifyContent:"center", alignItems:"flex-start",
      padding:"24px 12px 48px", boxSizing:"border-box"
    }}>
      <div className="fadeUp" style={{
        width:"100%", maxWidth: maxW, background: T.card,
        borderRadius: 14, border:`1px solid ${T.border}`,
        borderLeft:`3px solid ${T.gold}`, padding: "24px 20px",
        boxShadow:"0 20px 60px rgba(0,0,0,0.6)"
      }}>
        {children}
      </div>
    </div>
  );
}

function Logo({ sub }) {
  return (
    <div style={{ textAlign:"center", marginBottom: 24 }}>
      <div style={{
        color: T.gold, fontSize: 11, fontWeight: 700,
        letterSpacing:"0.4em", fontFamily:"'Rajdhani',sans-serif"
      }}>BLACK DROP TRUCKING</div>
      <div style={{
        color: T.gold, fontSize: 22, fontWeight: 700,
        letterSpacing:"0.18em", fontFamily:"'Rajdhani',sans-serif", marginTop: 2
      }}>{sub}</div>
      <div style={{ width: 40, height: 2, background: T.gold, margin:"8px auto 0" }}/>
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    "PENDING":     { color: T.warn,    bg:"rgba(245,158,11,0.12)",  dot:"#f59e0b" },
    "APPROVED":    { color: T.success, bg:"rgba(34,197,94,0.12)",   dot:"#22c55e" },
    "BOUNCE BACK": { color: T.danger,  bg:"rgba(239,68,68,0.12)",   dot:"#ef4444" },
  };
  const s = map[status] || { color: T.muted, bg: T.surface, dot: T.muted };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap: 6,
      padding:"3px 10px", borderRadius: 99, background: s.bg,
      color: s.color, fontSize: 11, fontWeight: 700, letterSpacing:"0.08em"
    }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background: s.dot,
        animation: status === "PENDING" ? "pulse 1.5s ease infinite" : "none" }}/>
      {status}
    </span>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [phone, setPhone]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleLogin() {
    if (!phone || phone.length < 7) { setError("Enter a valid phone number."); return; }
    if (loading) return;
    setError(""); setLoading(true);
    try {
      const res  = await fetch(API_URL + "?t=" + Date.now());
      if (!res.ok) throw new Error("Server error");
      const list = await res.json();
      const ok   = list.some(p => String(p).trim() === phone.trim());
      if (ok) { onLogin(phone.trim()); }
      else    { setError("This number is not authorized."); setLoading(false); }
    } catch {
      setError("Connection failed. Check your signal.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: T.bg, minHeight:"100vh", display:"flex",
      justifyContent:"center", alignItems:"center", padding: 16
    }}>
      <div className="pop" style={{
        width:"100%", maxWidth: 360, background: T.card,
        borderRadius: 16, border:`1px solid ${T.border}`,
        borderLeft:`3px solid ${T.gold}`, padding: "32px 24px",
        boxShadow:"0 24px 80px rgba(0,0,0,0.7)"
      }}>
        <Logo sub="FIELD COMMAND" />

        <Label text="Phone Number" required/>
        <Input
          type="tel" inputMode="numeric" autoComplete="tel"
          placeholder="e.g. 4325551234"
          value={phone}
          maxLength={15}
          onChange={e => { setPhone(e.target.value.replace(/\D/g,"")); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
        />

        {error && (
          <div style={{ color: T.danger, fontSize: 12, marginTop: 8, textAlign:"center" }}>
            ⚠ {error}
          </div>
        )}

        <GoldBtn style={{ marginTop: 20 }} loading={loading} onClick={handleLogin}>
          {loading ? "VERIFYING..." : "ENTER FIELD COMMAND"}
        </GoldBtn>

        <div style={{ color: T.muted, fontSize: 11, textAlign:"center", marginTop: 16 }}>
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
      background: T.bg, minHeight:"100vh", display:"flex",
      justifyContent:"center", alignItems:"center", padding: 16
    }}>
      <div className="pop" style={{
        width:"100%", maxWidth: 380, background: T.card,
        borderRadius: 16, border:`1px solid ${T.border}`,
        borderLeft:`3px solid ${T.gold}`, padding:"32px 24px",
        boxShadow:"0 24px 80px rgba(0,0,0,0.7)"
      }}>
        <Logo sub="FIELD COMMAND" />

        <div style={{
          background: T.surface, borderRadius: 10, padding:"14px 16px",
          marginBottom: 24, border:`1px solid ${T.border}`,
          display:"flex", alignItems:"center", gap: 12
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background:`rgba(212,175,55,0.12)`, border:`1px solid ${T.goldDim}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize: 16
          }}>👷</div>
          <div>
            <div style={{ color: T.muted, fontSize: 10, letterSpacing:"0.1em" }}>{greeting}</div>
            <div style={{ color: T.text, fontWeight: 600, fontSize: 14 }}>{phone}</div>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap: 10 }}>
          <GoldBtn onClick={onStartTicket}>
            📋 SUBMIT NEW TICKET
          </GoldBtn>
          <GhostBtn onClick={onOpenQueue}>
            📥 SUBMISSION QUEUE
          </GhostBtn>
          <GhostBtn onClick={onLogout} style={{ color: T.muted, borderColor:"#1a1d26" }}>
            ← LOG OUT
          </GhostBtn>
        </div>

        <div style={{
          marginTop: 24, paddingTop: 16, borderTop:`1px solid ${T.border}`,
          color: T.muted, fontSize: 10, textAlign:"center", letterSpacing:"0.1em"
        }}>
          BLACK DROP TRUCKING LLC · FIELD SYSTEM
        </div>
      </div>
    </div>
  );
}

// ─── QUEUE PAGE ───────────────────────────────────────────────────────────────
function Queue({ phone, onEdit, onBack }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`${API_URL}?mode=queue&phone=${phone}&t=${Date.now()}`);
        const data = await res.json();
        setTickets(data.reverse());
      } catch { setError(true); }
      finally  { setLoading(false); }
    }
    load();
  }, [phone]);

  const counts = useMemo(() => ({
    total:   tickets.length,
    pending: tickets.filter(t => t["Status"] === "PENDING").length,
    bounce:  tickets.filter(t => t["Status"] === "BOUNCE BACK").length,
    approved:tickets.filter(t => t["Status"] === "APPROVED").length,
  }), [tickets]);

  return (
    <PageShell maxW={520}>
      <div style={{ display:"flex", alignItems:"center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{
          background:"transparent", border:`1px solid ${T.border}`,
          color: T.muted, borderRadius: 8, padding:"6px 10px", cursor:"pointer", fontSize: 13
        }}>← Back</button>
        <div>
          <div style={{ color: T.gold, fontFamily:"'Rajdhani',sans-serif",
            fontSize: 18, fontWeight: 700, letterSpacing:"0.12em" }}>SUBMISSION QUEUE</div>
          <div style={{ color: T.muted, fontSize: 11 }}>{counts.total} submissions found</div>
        </div>
      </div>

      {/* Stats row */}
      {!loading && !error && counts.total > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
          {[
            { label:"Pending",  val: counts.pending,  color: T.warn },
            { label:"Approved", val: counts.approved, color: T.success },
            { label:"Bounce",   val: counts.bounce,   color: T.danger },
          ].map(s => (
            <div key={s.label} style={{
              background: T.surface, borderRadius: 8, padding:"10px 12px",
              border:`1px solid ${T.border}`, textAlign:"center"
            }}>
              <div style={{ color: s.color, fontSize: 22, fontWeight: 700,
                fontFamily:"'Space Mono',monospace" }}>{s.val}</div>
              <div style={{ color: T.muted, fontSize: 10, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ color: T.muted, textAlign:"center", padding: 40,
          display:"flex", flexDirection:"column", alignItems:"center", gap: 12 }}>
          <Spinner size={24} color={T.gold}/>
          Loading queue...
        </div>
      )}

      {error && (
        <div style={{ color: T.danger, textAlign:"center", padding: 32 }}>
          ⚠ Failed to load. Check your connection.
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div style={{ color: T.muted, textAlign:"center", padding: 40 }}>
          No submissions found for this number.
        </div>
      )}

      {tickets.map((ticket, i) => {
        const status = ticket["Status"];
        const isBounce = status === "BOUNCE BACK";
        return (
          <div key={ticket["Submission ID"] || i} style={{
            background: T.surface, borderRadius: 10, padding: 16, marginBottom: 12,
            border:`1px solid ${isBounce ? "rgba(239,68,68,0.3)" : T.border}`,
            borderLeft:`3px solid ${isBounce ? T.danger : status === "APPROVED" ? T.success : T.warn}`
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: 10 }}>
              <div style={{ fontFamily:"'Space Mono',monospace", color: T.text, fontSize: 12, fontWeight: 700 }}>
                {ticket["Submission ID"]}
              </div>
              <StatusBadge status={status}/>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 16px" }}>
              {[
                ["Client",  ticket["Client"]],
                ["Created", ticket["Timestamp"] ? new Date(ticket["Timestamp"]).toLocaleString() : "—"],
                ticket["Field Ticket #"] ? ["Field Ticket", ticket["Field Ticket #"]] : null,
                ticket["Driver"]         ? ["Driver",       ticket["Driver"]]         : null,
              ].filter(Boolean).map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: T.muted, fontSize: 10 }}>{k}</div>
                  <div style={{ color: T.text, fontSize: 13 }}>{v}</div>
                </div>
              ))}
            </div>

            {ticket["Notes"] && (
              <div style={{
                marginTop: 10, padding:"8px 10px", background: T.bg,
                borderRadius: 6, color: T.muted, fontSize: 12, fontStyle:"italic"
              }}>
                "{ticket["Notes"]}"
              </div>
            )}

            {isBounce && (
              <button onClick={() => onEdit(ticket)} style={{
                marginTop: 12, width:"100%", padding:"10px 16px",
                background:`rgba(212,175,55,0.1)`, border:`1px solid ${T.goldDim}`,
                color: T.gold, borderRadius: 8, fontWeight: 700, fontSize: 12,
                letterSpacing:"0.1em", cursor:"pointer",
                fontFamily:"'Rajdhani',sans-serif", transition:"all 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = `rgba(212,175,55,0.2)`}
              onMouseLeave={e => e.currentTarget.style.background = `rgba(212,175,55,0.1)`}
              >
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
      position:"fixed", inset:0, background: T.bg,
      display:"flex", justifyContent:"center", alignItems:"center", zIndex: 9999
    }}>
      <div className="pop" style={{
        background: T.card, padding:"48px 40px", borderRadius: 16,
        textAlign:"center", border:`1px solid ${T.border}`,
        borderLeft:`3px solid ${T.gold}`, maxWidth: 360, width:"90%"
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✓</div>
        <div style={{
          color: T.gold, fontFamily:"'Rajdhani',sans-serif",
          fontSize: 24, fontWeight: 700, letterSpacing:"0.1em", marginBottom: 8
        }}>TICKET SUBMITTED</div>
        <div style={{ color: T.muted, fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
          Your field ticket has been received and is pending review.
        </div>
        <GoldBtn onClick={onBack}>← BACK TO DASHBOARD</GoldBtn>
      </div>
    </div>
  );
}

// ─── DOCUMENT SCANNER — Mobile-First v5 ─────────────────────────────────────
// Key fix: canvas always fills full screen width. Adjust stage zooms into
// detected document region. Pinch-to-zoom on adjust canvas.
function ScannerModal({ open, onClose, onUse }) {
  const [stage,      setStage]      = useState("capture");
  const [docFound,   setDocFound]   = useState(false);
  const [autoSnap,   setAutoSnap]   = useState(true);
  const [stableCnt,  setStableCnt]  = useState(0);
  const [corners,    setCorners]    = useState(null);
  const [filter,     setFilter]     = useState("document");
  const [processing, setProcessing] = useState(false);
  const [finalImage, setFinalImage] = useState(null);
  const [camReady,   setCamReady]   = useState(false);
  const [camErr,     setCamErr]     = useState(false);
  const [liveC,      setLiveC]      = useState(null);
  const [outSize,    setOutSize]    = useState({w:0,h:0});
  // zoom/pan state for adjust stage
  const [zoom,       setZoom]       = useState(1);
  const [pan,        setPan]        = useState({x:0,y:0});

  const vidRef    = useRef(null);
  const streamRef = useRef(null);
  const capCanv   = useRef(null);
  const adjCanv   = useRef(null);
  const adjWrap   = useRef(null);  // scrollable wrapper around canvas
  const outCanv   = useRef(null);
  const fileRef   = useRef(null);
  const imgRef    = useRef(null);
  const dragR     = useRef(null);  // corner drag index
  const loopR     = useRef(null);
  const stableR   = useRef(0);
  const prevPts   = useRef(null);
  const autoR     = useRef(true);
  const cornersR  = useRef(null);
  // pinch state
  const pinchRef  = useRef(null);
  autoR.current   = autoSnap;

  useEffect(() => {
    if (!open) return;
    reset(); boot();
    return () => killAll();
  }, [open]);

  function reset() {
    setStage("capture"); setDocFound(false); setCorners(null);
    setLiveC(null); setFilter("document"); setFinalImage(null);
    setProcessing(false); setCamReady(false); setCamErr(false);
    setZoom(1); setPan({x:0,y:0});
    stableR.current=0; prevPts.current=null; dragR.current=null; cornersR.current=null;
  }

  async function boot() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video:{facingMode:{ideal:"environment"},width:{ideal:1920,min:640},height:{ideal:1440,min:480}}
      });
      streamRef.current = stream;
      if (vidRef.current) { vidRef.current.srcObject=stream; await vidRef.current.play(); }
      setCamReady(true);
    } catch { setCamErr(true); }
  }

  function killAll() {
    if (loopR.current) { cancelAnimationFrame(loopR.current); loopR.current=null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null; }
  }

  // ── detection loop (throttled 220ms)
  const lastT = useRef(0);
  useEffect(()=>{
    if (!camReady || stage!=="capture") return;
    const tick = () => {
      const now = Date.now();
      if (now - lastT.current > 220) { lastT.current=now; runDetect(); }
      loopR.current = requestAnimationFrame(tick);
    };
    loopR.current = requestAnimationFrame(tick);
    return ()=>{ if(loopR.current) cancelAnimationFrame(loopR.current); };
  },[camReady,stage]);

  function runDetect() {
    const v=vidRef.current; if(!v||v.readyState<2||!v.videoWidth) return;
    const W=320, H=Math.round(320*v.videoHeight/Math.max(v.videoWidth,1));
    const c=document.createElement("canvas"); c.width=W; c.height=H;
    c.getContext("2d").drawImage(v,0,0,W,H);
    const found=sobelFind(c.getContext("2d"),W,H);
    if (found) {
      setLiveC(found); setDocFound(true);
      if (autoR.current && prevPts.current) {
        const moved=found.reduce((s,p,i)=>s+Math.hypot(p.x-prevPts.current[i].x,p.y-prevPts.current[i].y),0);
        if (moved<0.022) {
          stableR.current++; setStableCnt(stableR.current);
          if (stableR.current>=5) { snap(); return; }
        } else { stableR.current=0; setStableCnt(0); }
      }
      prevPts.current=found;
    } else {
      setDocFound(false); setLiveC(null);
      stableR.current=0; setStableCnt(0); prevPts.current=null;
    }
  }

  function sobelFind(ctx,W,H) {
    const px=ctx.getImageData(0,0,W,H).data;
    const g=new Float32Array(W*H);
    for(let i=0;i<W*H;i++) g[i]=0.299*px[i*4]+0.587*px[i*4+1]+0.114*px[i*4+2];
    const e=new Float32Array(W*H); let mx=0;
    for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
      const gx=-g[(y-1)*W+(x-1)]-2*g[y*W+(x-1)]-g[(y+1)*W+(x-1)]+g[(y-1)*W+(x+1)]+2*g[y*W+(x+1)]+g[(y+1)*W+(x+1)];
      const gy=-g[(y-1)*W+(x-1)]-2*g[(y-1)*W+x]-g[(y-1)*W+(x+1)]+g[(y+1)*W+(x-1)]+2*g[(y+1)*W+x]+g[(y+1)*W+(x+1)];
      const v=Math.sqrt(gx*gx+gy*gy); e[y*W+x]=v; if(v>mx)mx=v;
    }
    if(mx<8)return null;
    const th=mx*0.22; let x0=W,x1=0,y0=H,y1=0,ok=false;
    for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(e[y*W+x]>th){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;ok=true;}
    if(!ok||(x1-x0)/W<0.25||(y1-y0)/H<0.25)return null;
    const p=0.01;
    return [
      {x:Math.max(0,x0/W-p),y:Math.max(0,y0/H-p)},
      {x:Math.min(1,x1/W+p),y:Math.max(0,y0/H-p)},
      {x:Math.min(1,x1/W+p),y:Math.min(1,y1/H+p)},
      {x:Math.max(0,x0/W-p),y:Math.min(1,y1/H+p)},
    ];
  }

  function defCorners(){const p=0.07;return [{x:p,y:p},{x:1-p,y:p},{x:1-p,y:1-p},{x:p,y:1-p}];}

  function snap() {
    if(loopR.current){cancelAnimationFrame(loopR.current);loopR.current=null;}
    const v=vidRef.current; if(!v)return;
    const c=capCanv.current;
    c.width=v.videoWidth; c.height=v.videoHeight;
    c.getContext("2d").drawImage(v,0,0);
    setProcessing(true); killAll();
    const img=new Image();
    img.onload=()=>{
      imgRef.current=img;
      const S=800,sc=Math.min(1,S/Math.max(img.width,img.height));
      const tw=Math.round(img.width*sc),th=Math.round(img.height*sc);
      const tc=document.createElement("canvas");tc.width=tw;tc.height=th;
      tc.getContext("2d").drawImage(img,0,0,tw,th);
      const det=sobelFind(tc.getContext("2d"),tw,th)||defCorners();
      cornersR.current=det; setCorners(det);
      setProcessing(false); setStage("adjust");
    };
    img.src=c.toDataURL("image/jpeg",0.96);
  }

  function handleFile(e) {
    const f=e.target.files[0]; if(!f)return;
    killAll(); setProcessing(true);
    const r=new FileReader();
    r.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        imgRef.current=img;
        capCanv.current.width=img.width; capCanv.current.height=img.height;
        capCanv.current.getContext("2d").drawImage(img,0,0);
        const S=800,sc=Math.min(1,S/Math.max(img.width,img.height));
        const tw=Math.round(img.width*sc),th=Math.round(img.height*sc);
        const tc=document.createElement("canvas");tc.width=tw;tc.height=th;
        tc.getContext("2d").drawImage(img,0,0,tw,th);
        const det=sobelFind(tc.getContext("2d"),tw,th)||defCorners();
        cornersR.current=det; setCorners(det);
        setProcessing(false); setStage("adjust");
      };
      img.src=ev.target.result;
    };
    r.readAsDataURL(f); e.target.value="";
  }

  // ── Draw adjustment canvas: ALWAYS fills full screen width
  // Zoom is done via CSS transform on the canvas element — keeps canvas
  // resolution high and handles crisp on retina
  useEffect(()=>{
    if(stage!=="adjust"||!corners||!adjCanv.current||!imgRef.current)return;
    cornersR.current=corners;
    initAdjCanvas();
  },[stage,corners]);

  function initAdjCanvas() {
    const canvas=adjCanv.current, img=imgRef.current;
    if(!canvas||!img)return;

    // Canvas fills full screen width, maintains aspect ratio
    const sw = window.innerWidth;
    const sh = Math.round(sw * img.height / img.width);
    canvas.width  = sw;
    canvas.height = sh;
    // Override CSS size to match exactly
    canvas.style.width  = sw + "px";
    canvas.style.height = sh + "px";

    drawAdjFrame(cornersR.current);

    // Auto-zoom: compute scale so detected doc fills ~85% of screen height
    const docH = (cornersR.current[2].y - cornersR.current[0].y) * sh;
    const targetH = window.innerHeight * 0.82;
    const autoZ = Math.min(2.5, Math.max(1.0, targetH / Math.max(docH, 80)));
    setZoom(autoZ);

    // Auto-pan: center the detected doc vertically
    const docCY = ((cornersR.current[0].y + cornersR.current[2].y) / 2) * sh;
    const screenCY = window.innerHeight / 2;
    const offsetY = screenCY - docCY * autoZ;
    setPan({x:0, y:offsetY});
  }

  function drawAdjFrame(C) {
    const canvas=adjCanv.current, img=imgRef.current; if(!canvas||!img)return;
    const W=canvas.width, H=canvas.height;
    const ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,W,H);
    ctx.drawImage(img,0,0,W,H);
    const pts=C.map(c=>({x:c.x*W,y:c.y*H}));

    // Darken outside selection
    ctx.fillStyle="rgba(0,0,0,0.55)";
    ctx.fillRect(0,0,W,H);
    // Cut out inside
    ctx.save();
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath();
    ctx.globalCompositeOperation="destination-out"; ctx.fill(); ctx.restore();
    // Redraw image inside
    ctx.save();
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath();
    ctx.clip(); ctx.drawImage(img,0,0,W,H); ctx.restore();
    // Glowing gold border
    ctx.save();
    ctx.shadowColor="#D4AF37"; ctx.shadowBlur=14;
    ctx.strokeStyle="#D4AF37"; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath(); ctx.stroke();
    ctx.restore();
    // Corner handles: 56px outer touch zone, 22px visible circle
    pts.forEach((p,i)=>{
      // outer touch-zone ring (semi-transparent)
      ctx.beginPath(); ctx.arc(p.x,p.y,32,0,Math.PI*2);
      ctx.fillStyle="rgba(212,175,55,0.12)"; ctx.fill();
      // visible circle with glow
      ctx.save();
      ctx.shadowColor="rgba(0,0,0,0.7)"; ctx.shadowBlur=10;
      ctx.beginPath(); ctx.arc(p.x,p.y,22,0,Math.PI*2);
      ctx.fillStyle=dragR.current===i?"#ffffff":"#D4AF37";
      ctx.fill(); ctx.restore();
      ctx.strokeStyle="rgba(0,0,0,0.5)"; ctx.lineWidth=2.5; ctx.stroke();
      // crosshair
      ctx.strokeStyle=dragR.current===i?"#333":"rgba(0,0,0,0.65)";
      ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(p.x-11,p.y); ctx.lineTo(p.x+11,p.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x,p.y-11); ctx.lineTo(p.x,p.y+11); ctx.stroke();
    });
  }

  // ── pointer events — corrected for zoom/pan transform
  function getCanvasXY(e) {
    const canvas=adjCanv.current; if(!canvas)return{x:0,y:0};
    const rect=canvas.getBoundingClientRect();
    // getBoundingClientRect already accounts for CSS transform
    const src=e.touches?e.touches[0]:e;
    // map from screen coords into canvas coords
    const scaleX=canvas.width/rect.width;
    const scaleY=canvas.height/rect.height;
    return {
      x:(src.clientX-rect.left)*scaleX,
      y:(src.clientY-rect.top)*scaleY,
    };
  }

  function onDown(e) {
    if(e.touches&&e.touches.length===2){ startPinch(e); return; }
    e.preventDefault();
    const{x,y}=getCanvasXY(e), canvas=adjCanv.current;
    const pts=cornersR.current.map(p=>({x:p.x*canvas.width,y:p.y*canvas.height}));
    // Hit radius 40px in canvas space (scaled up by zoom so actually easier on screen)
    const hit=pts.findIndex(p=>Math.hypot(p.x-x,p.y-y)<40);
    if(hit!==-1) dragR.current=hit;
  }

  function onMove(e) {
    if(e.touches&&e.touches.length===2){ movePinch(e); return; }
    if(dragR.current===null||dragR.current===undefined)return;
    e.preventDefault();
    const{x,y}=getCanvasXY(e), canvas=adjCanv.current;
    const newC=cornersR.current.map((p,i)=>i===dragR.current
      ?{x:Math.max(0.01,Math.min(0.99,x/canvas.width)),y:Math.max(0.01,Math.min(0.99,y/canvas.height))}:p);
    cornersR.current=newC; setCorners([...newC]); drawAdjFrame(newC);
  }

  function onUp(e) {
    if(e&&e.touches&&e.touches.length===0) pinchRef.current=null;
    dragR.current=null;
  }

  // ── pinch-to-zoom
  function startPinch(e) {
    const t=e.touches;
    pinchRef.current={
      dist: Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY),
      zoom,
    };
  }
  function movePinch(e) {
    if(!pinchRef.current)return;
    e.preventDefault();
    const t=e.touches;
    const newDist=Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
    const newZoom=Math.max(1,Math.min(4,pinchRef.current.zoom*(newDist/pinchRef.current.dist)));
    setZoom(newZoom);
  }

  // ── warp + enhance
  function processDoc(f) {
    setProcessing(true);
    const C=cornersR.current||corners;
    setTimeout(()=>{
      try{
        const img=imgRef.current,IW=img.width,IH=img.height;
        const pts=C.map(c=>({x:c.x*IW,y:c.y*IH}));
        const wT=Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y);
        const wB=Math.hypot(pts[2].x-pts[3].x,pts[2].y-pts[3].y);
        const hL=Math.hypot(pts[3].x-pts[0].x,pts[3].y-pts[0].y);
        const hR=Math.hypot(pts[2].x-pts[1].x,pts[2].y-pts[1].y);
        const rawW=Math.max(wT,wB),rawH=Math.max(hL,hR);
        const SC=Math.min(2.2,2600/Math.max(rawW,rawH));
        const outW=Math.round(rawW*SC),outH=Math.round(rawH*SC);
        const srcC=document.createElement("canvas");srcC.width=IW;srcC.height=IH;
        srcC.getContext("2d").drawImage(img,0,0);
        const srcPx=srcC.getContext("2d").getImageData(0,0,IW,IH).data;
        const dstC=outCanv.current;dstC.width=outW;dstC.height=outH;
        const dstCtx=dstC.getContext("2d");
        const dstId=dstCtx.createImageData(outW,outH);const d=dstId.data;
        for(let dy=0;dy<outH;dy++){
          const v=dy/outH;
          for(let dx=0;dx<outW;dx++){
            const u=dx/outW;
            const sx=(1-u)*(1-v)*pts[0].x+u*(1-v)*pts[1].x+u*v*pts[2].x+(1-u)*v*pts[3].x;
            const sy=(1-u)*(1-v)*pts[0].y+u*(1-v)*pts[1].y+u*v*pts[2].y+(1-u)*v*pts[3].y;
            const x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(x0+1,IW-1),y1=Math.min(y0+1,IH-1);
            const fx=sx-x0,fy=sy-y0,di=(dy*outW+dx)*4;
            for(let ch=0;ch<3;ch++){
              const tl=srcPx[(y0*IW+x0)*4+ch],tr=srcPx[(y0*IW+x1)*4+ch];
              const bl=srcPx[(y1*IW+x0)*4+ch],br=srcPx[(y1*IW+x1)*4+ch];
              d[di+ch]=Math.round(tl*(1-fx)*(1-fy)+tr*fx*(1-fy)+bl*(1-fx)*fy+br*fx*fy);
            }
            d[di+3]=255;
          }
        }
        dstCtx.putImageData(dstId,0,0);
        enhance(dstCtx,outW,outH,f);
        setFinalImage(dstC.toDataURL("image/jpeg",0.92));
        setFilter(f);setOutSize({w:outW,h:outH});
        setProcessing(false);setStage("enhance");
      }catch(err){console.error(err);setProcessing(false);}
    },30);
  }

  function enhance(ctx,W,H,mode){
    if(mode==="original")return;
    const id=ctx.getImageData(0,0,W,H);const d=id.data;
    let bgSum=0,bgN=0;
    const cx=Math.round(W/2),cy=Math.round(H/2);
    const sw2=Math.round(W*0.3),sh2=Math.round(H*0.3);
    for(let y=cy-sh2;y<cy+sh2;y+=3)for(let x=cx-sw2;x<cx+sw2;x+=3){
      const i=(y*W+x)*4;const lum=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
      if(lum>100){bgSum+=lum;bgN++;}
    }
    const paperLum=bgN>20?bgSum/bgN:185;
    const boost=paperLum<220?Math.min(1.30,215/Math.max(paperLum,80)):1.0;
    for(let i=0;i<d.length;i+=4){
      let r=d[i],g=d[i+1],b=d[i+2];
      if(mode==="document"){
        r=Math.min(255,r*boost);g=Math.min(255,g*boost);b=Math.min(255,b*boost);
        const lum=0.299*r+0.587*g+0.114*b;
        const curve=lum<80?lum*0.60:lum<140?48+(lum-80)*0.85:lum<200?99+(lum-140)*1.35:Math.min(255,180+(lum-200)*2.5);
        const ratio=lum>0?curve/lum:1;
        r=Math.min(255,Math.max(0,r*ratio));g=Math.min(255,Math.max(0,g*ratio));b=Math.min(255,Math.max(0,b*ratio));
        const fl=0.299*r+0.587*g+0.114*b;
        d[i]=Math.round(r*0.25+fl*0.75);d[i+1]=Math.round(g*0.25+fl*0.75);d[i+2]=Math.round(b*0.25+fl*0.75);
      }else if(mode==="bw"){
        const lum=0.299*r+0.587*g+0.114*b;let v=lum*boost;
        v=v<70?Math.max(0,v*0.5):v<150?35+(v-70)*1.1:Math.min(255,112+(v-150)*1.8);
        d[i]=d[i+1]=d[i+2]=Math.round(Math.min(255,v));
      }else if(mode==="highcontrast"){
        const lum=0.299*r+0.587*g+0.114*b;let v=lum*boost;
        v=v<90?Math.max(0,v*0.40):v<160?36+(v-90)*1.4:Math.min(255,134+(v-160)*2.0);
        d[i]=d[i+1]=d[i+2]=Math.round(Math.min(255,v));
      }else if(mode==="sharp"){
        r=Math.min(255,r*boost);g=Math.min(255,g*boost);b=Math.min(255,b*boost);
        d[i]=Math.min(255,Math.max(0,(r-128)*1.45+133));
        d[i+1]=Math.min(255,Math.max(0,(g-128)*1.45+133));
        d[i+2]=Math.min(255,Math.max(0,(b-128)*1.35+128));
      }
    }
    ctx.putImageData(id,0,0);
    const str=mode==="highcontrast"?2.0:mode==="sharp"?2.5:1.6;
    unsharp(ctx,W,H,str);
  }

  function unsharp(ctx,W,H,s){
    const id=ctx.getImageData(0,0,W,H);const d=id.data;
    const bl=boxBlur(new Uint8ClampedArray(d),W,H,2);
    for(let i=0;i<d.length;i+=4)for(let c=0;c<3;c++)d[i+c]=Math.min(255,Math.max(0,d[i+c]*(1+s)-bl[i+c]*s));
    ctx.putImageData(id,0,0);
  }
  function boxBlur(src,W,H,r){
    const t=new Uint8ClampedArray(src.length),o=new Uint8ClampedArray(src.length);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){let a=0,b=0,c=0,n=0;for(let dx=-r;dx<=r;dx++){const xi=Math.max(0,Math.min(W-1,x+dx)),i=(y*W+xi)*4;a+=src[i];b+=src[i+1];c+=src[i+2];n++;}const i=(y*W+x)*4;t[i]=a/n;t[i+1]=b/n;t[i+2]=c/n;t[i+3]=255;}
    for(let x=0;x<W;x++)for(let y=0;y<H;y++){let a=0,b=0,c=0,n=0;for(let dy=-r;dy<=r;dy++){const yi=Math.max(0,Math.min(H-1,y+dy)),i=(yi*W+x)*4;a+=t[i];b+=t[i+1];c+=t[i+2];n++;}const i=(y*W+x)*4;o[i]=a/n;o[i+1]=b/n;o[i+2]=c/n;o[i+3]=255;}
    return o;
  }

  function refilter(f){if(processing)return;processDoc(f);}

  if(!open)return null;

  const FILTERS=[
    {id:"document",    icon:"📄",label:"Document",    desc:"White + sharp"},
    {id:"bw",          icon:"◑", label:"B&W",         desc:"Clean mono"},
    {id:"highcontrast",icon:"◆", label:"Hi-Contrast", desc:"Max legibility"},
    {id:"sharp",       icon:"🔍",label:"Sharpened",   desc:"Text focus"},
    {id:"original",    icon:"⬜",label:"Original",    desc:"No filter"},
  ];

  return (
    <div style={{
      position:"fixed",inset:0,
      background:"#000",
      display:"flex",flexDirection:"column",
      zIndex:9999,overflow:"hidden",
      fontFamily:"'Rajdhani','Inter',sans-serif",
      height:"100dvh",  // dynamic viewport height — handles iOS chrome bar
    }}>

      {/* ══ STAGE 1: CAMERA — full screen video ══ */}
      {stage==="capture"&&(
        <>
          {/* video fills everything */}
          <div style={{flex:"1 1 0",minHeight:0,position:"relative",overflow:"hidden",background:"#000"}}>
            <video ref={vidRef} playsInline autoPlay muted
              style={{
                position:"absolute",inset:0,
                width:"100%",height:"100%",
                objectFit:"cover",
                display:camErr?"none":"block",
              }}/>

            {/* Live SVG overlay */}
            {!camErr&&(
              <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
                {!liveC&&[
                  [6,10],[94,10],[94,90],[6,90]
                ].map(([cx,cy],i)=>{
                  const lx=cx<50?1:-1,ly=cy<50?1:-1,len=5;
                  return(
                    <g key={i} stroke="rgba(212,175,55,0.7)" strokeWidth="3.5" strokeLinecap="round">
                      <line x1={cx+"%"} y1={cy+"%"} x2={(cx+lx*len)+"%"} y2={cy+"%"}/>
                      <line x1={cx+"%"} y1={cy+"%"} x2={cx+"%"} y2={(cy+ly*len)+"%"}/>
                    </g>
                  );
                })}
                {liveC&&(()=>{
                  const pts=liveC.map(c=>`${(c.x*100).toFixed(1)}%,${(c.y*100).toFixed(1)}%`).join(" ");
                  return(
                    <>
                      <defs><filter id="glow3"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                      <polygon points={pts} fill="rgba(34,197,94,0.06)" stroke="#22c55e" strokeWidth="2.5" filter="url(#glow3)"/>
                      {liveC.map((c,i)=><circle key={i} cx={(c.x*100)+"%"} cy={(c.y*100)+"%"} r="5" fill="#22c55e"/>)}
                    </>
                  );
                })()}
              </svg>
            )}

            {/* Status badge */}
            {!camErr&&(
              <div style={{
                position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",
                background:docFound?"rgba(34,197,94,0.18)":"rgba(0,0,0,0.65)",
                border:`1px solid ${docFound?"#22c55e":"rgba(212,175,55,0.5)"}`,
                color:docFound?"#22c55e":T.gold,
                padding:"6px 18px",borderRadius:99,fontSize:12,fontWeight:700,
                letterSpacing:"0.1em",whiteSpace:"nowrap",
                backdropFilter:"blur(10px)",pointerEvents:"none",transition:"all 0.3s",
              }}>
                {docFound?(autoSnap&&stableCnt>0?"⏱ HOLD STILL...":"✓ TICKET FOUND"):"📷 POINT AT TICKET"}
              </div>
            )}

            {/* Auto-capture ring */}
            {docFound&&autoSnap&&stableCnt>0&&(
              <div style={{position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",width:54,height:54,pointerEvents:"none"}}>
                <svg viewBox="0 0 54 54" style={{transform:"rotate(-90deg)"}}>
                  <circle cx="27" cy="27" r="23" fill="none" stroke="rgba(34,197,94,0.2)" strokeWidth="4"/>
                  <circle cx="27" cy="27" r="23" fill="none" stroke="#22c55e" strokeWidth="4"
                    strokeDasharray={`${2*Math.PI*23}`}
                    strokeDashoffset={`${2*Math.PI*23*(1-stableCnt/5)}`}
                    style={{transition:"stroke-dashoffset 0.18s"}}/>
                </svg>
              </div>
            )}

            {camErr&&(
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:24}}>
                <div style={{fontSize:48}}>📷</div>
                <div style={{color:T.muted,fontSize:13,textAlign:"center",lineHeight:1.6}}>Camera unavailable.<br/>Upload a photo instead.</div>
                <button onClick={()=>fileRef.current.click()} style={{padding:"14px 32px",background:T.gold,color:"#000",border:"none",borderRadius:12,fontWeight:800,fontSize:15,cursor:"pointer"}}>📁 UPLOAD PHOTO</button>
              </div>
            )}
            {processing&&(
              <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.72)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
                <div style={{width:42,height:42,border:`3px solid rgba(212,175,55,0.15)`,borderTop:`3px solid ${T.gold}`,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
                <div style={{color:T.gold,fontSize:12,letterSpacing:"0.12em",fontWeight:700}}>DETECTING EDGES...</div>
              </div>
            )}
          </div>

          {/* Bottom controls — fixed height */}
          <div style={{flexShrink:0,background:T.card,borderTop:`1px solid ${T.border}`,padding:"10px 14px 14px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"9px 12px",background:T.surface,borderRadius:12,
              border:`1px solid ${T.border}`,marginBottom:10}}>
              <div>
                <div style={{color:T.text,fontSize:13,fontWeight:600}}>Auto-Capture</div>
                <div style={{color:T.muted,fontSize:10}}>Snaps when ticket is steady</div>
              </div>
              <div onClick={()=>setAutoSnap(v=>!v)} style={{
                width:48,height:27,borderRadius:14,cursor:"pointer",
                background:autoSnap?"#22c55e":T.border,position:"relative",transition:"background 0.2s",flexShrink:0}}>
                <div style={{position:"absolute",top:3.5,left:autoSnap?24:3.5,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:8}}>
              {!camErr&&(
                <button onClick={snap} disabled={!camReady||processing} style={{
                  flex:2,height:52,background:camReady&&!processing?T.gold:T.surface,
                  color:camReady&&!processing?"#000":T.muted,border:"none",borderRadius:12,
                  fontWeight:800,fontSize:16,letterSpacing:"0.1em",cursor:camReady&&!processing?"pointer":"not-allowed",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <span style={{fontSize:18}}>📸</span> CAPTURE
                </button>
              )}
              <button onClick={()=>fileRef.current.click()} style={{
                flex:1,height:52,background:T.surface,color:T.text,
                border:`1px solid ${T.border}`,borderRadius:12,fontWeight:600,
                fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <span>📁</span> Upload
              </button>
            </div>
            <button onClick={onClose} style={{width:"100%",height:40,background:"transparent",color:T.muted,border:`1px solid ${T.border}`,borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer"}}>✕ CANCEL</button>
          </div>
        </>
      )}

      {/* ══ STAGE 2: ADJUST — canvas fills full width, zoomed ══ */}
      {stage==="adjust"&&(
        <>
          {/* Header */}
          <div style={{flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:T.card,borderBottom:`1px solid ${T.border}`}}>
            <div>
              <div style={{color:T.gold,fontSize:14,fontWeight:700,letterSpacing:"0.12em"}}>✂ ADJUST EDGES</div>
              <div style={{color:T.muted,fontSize:10,marginTop:1}}>Drag handles · Pinch to zoom</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {/* Zoom controls */}
              <button onClick={()=>setZoom(z=>Math.max(1,+(z-0.25).toFixed(2)))} style={{width:34,height:34,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
              <span style={{color:T.muted,fontSize:11,minWidth:32,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
              <button onClick={()=>setZoom(z=>Math.min(4,+(z+0.25).toFixed(2)))} style={{width:34,height:34,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
              <button onClick={onClose} style={{height:34,padding:"0 12px",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,cursor:"pointer",fontSize:12}}>✕</button>
            </div>
          </div>

          {/* Scrollable canvas container — canvas is full width, CSS zoomed */}
          <div ref={adjWrap} style={{
            flex:"1 1 0",minHeight:0,
            overflow:"scroll",      // both axes scroll when zoomed
            background:"#080808",
            // center canvas when smaller than container
            display:"flex",
            alignItems:"flex-start",
            justifyContent:"center",
          }}>
            <canvas ref={adjCanv}
              style={{
                display:"block",
                // CSS transform zoom — keeps canvas resolution, scales visually
                transform:`scale(${zoom})`,
                transformOrigin:"top center",
                // When zoomed > 1 the canvas overflows — scroll handles it
                flexShrink:0,
                touchAction:"none",
                cursor:"crosshair",
              }}
              onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
              onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
            />
          </div>

          {/* Hint + buttons */}
          <div style={{flexShrink:0,background:T.card,borderTop:`1px solid ${T.border}`,padding:"10px 14px 14px"}}>
            <div style={{color:T.muted,fontSize:10,textAlign:"center",letterSpacing:"0.08em",marginBottom:10}}>
              ⊕ DRAG THE 4 GOLD HANDLES TO THE CORNERS OF YOUR TICKET
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{reset();boot();}} style={{flex:1,height:52,background:"transparent",color:T.text,border:`1px solid ${T.border}`,borderRadius:12,fontWeight:600,fontSize:14,cursor:"pointer"}}>↩ RETAKE</button>
              <button onClick={()=>processDoc("document")} disabled={processing} style={{
                flex:2,height:52,
                background:processing?T.surface:T.gold,
                color:processing?T.muted:"#000",
                border:"none",borderRadius:12,fontWeight:800,fontSize:15,
                cursor:processing?"not-allowed":"pointer",letterSpacing:"0.08em",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {processing
                  ?<><div style={{width:16,height:16,border:"2px solid rgba(0,0,0,0.25)",borderTop:"2px solid #000",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/> PROCESSING...</>
                  :"⚡ SCAN DOCUMENT"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══ STAGE 3: ENHANCE + CONFIRM ══ */}
      {stage==="enhance"&&(
        <>
          <div style={{flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:T.card,borderBottom:`1px solid ${T.border}`}}>
            <div>
              <div style={{color:T.gold,fontSize:14,fontWeight:700,letterSpacing:"0.12em"}}>🎨 ENHANCE & CONFIRM</div>
              <div style={{color:T.muted,fontSize:10,marginTop:1}}>Pick a filter · Confirm scan</div>
            </div>
            <button onClick={onClose} style={{height:34,padding:"0 12px",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,cursor:"pointer",fontSize:12}}>✕</button>
          </div>

          {/* Filter strip */}
          <div style={{flexShrink:0,display:"flex",gap:6,padding:"8px 10px",background:"#090909",borderBottom:`1px solid ${T.border}`,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            {FILTERS.map(f=>(
              <button key={f.id} onClick={()=>refilter(f.id)} style={{
                flexShrink:0,padding:"7px 12px",borderRadius:10,
                background:filter===f.id?"rgba(212,175,55,0.12)":"transparent",
                border:`1.5px solid ${filter===f.id?T.gold:T.border}`,
                color:filter===f.id?T.gold:T.muted,
                cursor:"pointer",fontFamily:"'Rajdhani',sans-serif"}}>
                <div style={{fontSize:12,fontWeight:filter===f.id?700:500,whiteSpace:"nowrap"}}>{f.icon} {f.label}</div>
                <div style={{fontSize:9,color:T.muted,marginTop:1}}>{f.desc}</div>
              </button>
            ))}
          </div>

          {/* Preview — fills remaining space, image fills it */}
          <div style={{
            flex:"1 1 0",minHeight:0,
            overflow:"hidden",
            background:"#060606",
            display:"flex",alignItems:"center",justifyContent:"center",
            padding:"8px",
          }}>
            {processing?(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
                <div style={{width:42,height:42,border:`3px solid rgba(212,175,55,0.15)`,borderTop:`3px solid ${T.gold}`,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
                <div style={{color:T.muted,fontSize:12,letterSpacing:"0.1em"}}>ENHANCING...</div>
              </div>
            ):finalImage&&(
              // Image fills the preview box — 95% width, contain aspect ratio
              <img src={finalImage} alt="Scan" style={{
                width:"95%",
                maxHeight:"100%",
                objectFit:"contain",
                borderRadius:4,
                boxShadow:"0 0 0 1px rgba(212,175,55,0.15),0 8px 32px rgba(0,0,0,0.8)",
              }}/>
            )}
          </div>

          {/* Metadata + actions */}
          {!processing&&finalImage&&(
            <div style={{flexShrink:0,padding:"5px 14px",background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:T.muted,fontSize:10}}>{outSize.w}×{outSize.h}px · {((outSize.w*outSize.h)/1e6).toFixed(1)}MP</span>
              <span style={{background:"rgba(34,197,94,0.1)",color:"#22c55e",fontSize:10,padding:"3px 10px",borderRadius:99,fontWeight:700}}>✓ READY</span>
            </div>
          )}
          <div style={{flexShrink:0,background:T.card,borderTop:`1px solid ${T.border}`,padding:"10px 14px 14px"}}>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setStage("adjust");setFinalImage(null);setZoom(1);}} style={{flex:1,height:52,background:"transparent",color:T.text,border:`1px solid ${T.border}`,borderRadius:12,fontWeight:600,fontSize:14,cursor:"pointer"}}>← RE-ADJUST</button>
              <button disabled={processing||!finalImage} onClick={()=>onUse(finalImage)} style={{
                flex:2,height:52,
                background:!processing&&finalImage?T.gold:T.surface,
                color:!processing&&finalImage?"#000":T.muted,
                border:"none",borderRadius:12,fontWeight:800,fontSize:15,
                cursor:!processing&&finalImage?"pointer":"not-allowed",
                letterSpacing:"0.08em"}}>✓ USE THIS SCAN</button>
            </div>
          </div>
        </>
      )}

      <canvas ref={capCanv} style={{display:"none"}}/>
      <canvas ref={outCanv} style={{display:"none"}}/>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleFile}/>
    </div>
  );
}

// ─── SUBMIT TICKET ────────────────────────────────────────────────────────────
function SubmitTicket({ phone, onComplete, editTicket }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState("");

  const today = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
  })();

  const [form, setForm] = useState(() => editTicket ? {
    client:         editTicket["Client"]       || "",
    fieldTicket:    editTicket["Field Ticket #"]|| "",
    dispatch:       editTicket["Dispatch #"]   || "",
    unit:           editTicket["Unit #"]       || "",
    driver:         editTicket["Driver"]       || "",
    workDate:       editTicket["Service Date"] || today,
    wellLease:      editTicket["Well/Lease"]   || "",
    notes:          editTicket["Notes"]        || "",
    fieldTicketImage: "",
    startTime:      editTicket["Start Time"]   || "",
    endTime:        editTicket["End Time"]     || "",
    hourlyRate:     editTicket["Hourly Rate"]  || "",
  } : {
    client:"", fieldTicket:"", dispatch:"", unit:"",
    driver:"", workDate: today, wellLease:"", notes:"", fieldTicketImage:"",
    startTime:"", endTime:"", hourlyRate:"",
  });

  const [loads, setLoads] = useState([{
    id:1, geminiRef:"", loadTicket:"", fluid:"Fresh Water",
    bbls:"", manifestOps:{ washOut:false, unload:false }, verificationImage:""
  }]);

  const [submissionId] = useState(editTicket ? editTicket["Submission ID"] : null);
  const [scanTarget,  setScanTarget]  = useState(null);
  const [scanOpen,    setScanOpen]    = useState(false);
  const [hasSignature,setHasSignature]= useState(false);
  const sigRef = useRef(null);
  const drawing = useRef(false);
  const lastPt  = useRef({ x:0, y:0 });

  const isExxon = form.client === "Exxon";

  function update(k, v) { setForm(p => ({ ...p, [k]: v })); }
  function updateLoad(i, k, v) { setLoads(p => { const c=[...p]; c[i][k]=v; return c; }); }
  function addLoad() {
    setLoads(p => [...p, {
      id: p.length+1, geminiRef:"", loadTicket:"",
      fluid:"Fresh Water", bbls:"", manifestOps:{washOut:false,unload:false}, verificationImage:""
    }]);
  }
  function deleteLoad(i) { setLoads(p => p.filter((_,idx)=>idx!==i)); }
  function toggleOp(i, op) {
    setLoads(p => { const c=[...p]; c[i].manifestOps[op]=!c[i].manifestOps[op]; return c; });
  }

  const totalBBLS = useMemo(() =>
    loads.reduce((s,l) => { const n=parseFloat(l.bbls); return s+(isNaN(n)?0:n); }, 0)
  , [loads]);

  function nonEmpty(v) { return String(v??""  ).trim().length > 0; }
  function loadOk(l) {
    const base = (!isExxon || nonEmpty(l.geminiRef)) && nonEmpty(l.loadTicket) &&
      nonEmpty(l.bbls) && !isNaN(parseFloat(l.bbls));
    return l.fluid === "Manifest" ? base && (l.manifestOps.washOut || l.manifestOps.unload) : base;
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
    ...loads.map((l,i) => ({ key:`load_${i}`, ok: loadOk(l) }))
  ], [form, loads, hasSignature]);

  const progress  = useMemo(() => Math.round(checks.filter(c=>c.ok).length / checks.length * 100), [checks]);
  const isComplete= useMemo(() => checks.every(c=>c.ok), [checks]);

  const dispatchLabel = {
    "Exxon":"GEMINI DISPATCH #", "Oxy":"IRONSIGHT JOB #",
    "Western Midstream":"IRONSIGHT JOB #"
  }[form.client] || "DISPATCH #";

  // Signature canvas
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
    const p=pt(e,c); lastPt.current=p;
    ctx.lineWidth=2.5; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.strokeStyle="#000";
    ctx.beginPath(); ctx.moveTo(p.x,p.y);
  }
  function draw(e) {
    if (!drawing.current) return;
    if (e.type==="touchmove") e.preventDefault();
    const c=sigRef.current, ctx=c.getContext("2d"), p=pt(e,c);
    ctx.lineTo(p.x,p.y); ctx.stroke(); lastPt.current=p; setHasSignature(true);
  }
  function endDraw() { drawing.current=false; }
  function clearSig() {
    const c=sigRef.current; c.getContext("2d").clearRect(0,0,c.width,c.height);
    setHasSignature(false);
  }

  async function handleSubmit() {
    if (!isComplete || isSubmitting) return;
    setIsSubmitting(true); setSubmitError("");
    const payload = {
      submissionId, phone, ...form, loads, totalBBLS,
      signature: sigRef.current.toDataURL("image/png")
    };
    try {
      await fetch(API_URL, {
        method:"POST",
        headers:{"Content-Type":"text/plain;charset=utf-8"},
        body: JSON.stringify(payload)
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

  // offline sync
  useEffect(() => {
    async function syncOffline() {
      const q = JSON.parse(localStorage.getItem("offlineTickets")||"[]");
      if (!q.length) return;
      for (const t of q) {
        try {
          await fetch(API_URL, { method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify(t) });
        } catch { return; }
      }
      localStorage.removeItem("offlineTickets");
    }
    window.addEventListener("online", syncOffline);
    syncOffline();
    return () => window.removeEventListener("online", syncOffline);
  }, []);

  const sectionStyle = {
    background: T.surface, borderRadius: 10, padding:"16px",
    border:`1px solid ${T.border}`, marginBottom: 12
  };
  const sectionTitle = {
    color: T.gold, fontFamily:"'Rajdhani',sans-serif",
    fontSize: 13, fontWeight: 700, letterSpacing:"0.15em", marginBottom: 14
  };

  return (
    <PageShell maxW={520}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ color: T.gold, fontFamily:"'Rajdhani',sans-serif",
            fontSize: 20, fontWeight: 700, letterSpacing:"0.12em" }}>
            {editTicket ? "EDIT & RESUBMIT" : "NEW FIELD TICKET"}
          </div>
          <div style={{ color: T.muted, fontSize: 11 }}>
            {editTicket ? `Editing ${submissionId}` : "Complete all required fields"}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 20, position:"sticky", top:0, zIndex:10,
        background: T.card, paddingTop: 4, paddingBottom: 8 }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          fontSize: 11, color: T.muted, marginBottom: 6 }}>
          <span>FORM COMPLETION</span>
          <span style={{ color: progress===100 ? T.success : T.gold, fontWeight: 700 }}>
            {progress}%
          </span>
        </div>
        <div style={{ height: 4, background: T.surface, borderRadius: 99 }}>
          <div style={{
            height:"100%", borderRadius: 99,
            background: progress===100 ? T.success : T.gold,
            width:`${progress}%`, transition:"width 0.3s ease"
          }}/>
        </div>
      </div>

      {/* ── JOB INFO ── */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>📋 JOB INFORMATION</div>

        <Label text="Client Organization" required/>
        <Select value={form.client} onChange={e=>update("client",e.target.value)}>
          <option value="">Select client…</option>
          {["Exxon","Oxy","Western Midstream","Chevron","Other"].map(c=>(
            <option key={c}>{c}</option>
          ))}
        </Select>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }}>
          <div>
            <Label text="Field Ticket #" required/>
            <Input value={form.fieldTicket} onChange={e=>update("fieldTicket",e.target.value)}/>
          </div>
          <div>
            <Label text={dispatchLabel} required/>
            <Input value={form.dispatch} onChange={e=>update("dispatch",e.target.value)}/>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }}>
          <div>
            <Label text="Unit / Truck #" required/>
            <Input value={form.unit} onChange={e=>update("unit",e.target.value)}/>
          </div>
          <div>
            <Label text="Driver Name" required/>
            <Input value={form.driver} onChange={e=>update("driver",e.target.value)}/>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }}>
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
          onChange={e=>update("notes",e.target.value)}/>

        {/* ── TIME & HOURS ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12, marginTop: 4 }}>
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
        <Input
          type="number"
          placeholder="e.g. 85"
          value={form.hourlyRate}
          onChange={e=>update("hourlyRate",e.target.value)}
        />

        {/* Live total hours display */}
        {form.startTime && form.endTime && (() => {
          const [sh,sm] = form.startTime.split(":").map(Number);
          const [eh,em] = form.endTime.split(":").map(Number);
          let mins = (eh*60+em) - (sh*60+sm);
          if (mins < 0) mins += 1440;
          const hrs = (mins/60).toFixed(2);
          const total = form.hourlyRate ? (parseFloat(hrs) * parseFloat(form.hourlyRate)).toFixed(2) : null;
          return (
            <div style={{
              marginTop: 10, padding:"10px 14px", background: "rgba(212,175,55,0.08)",
              border:"1px solid rgba(212,175,55,0.25)", borderRadius: 8,
              display:"flex", justifyContent:"space-between", alignItems:"center"
            }}>
              <div>
                <div style={{ color: T.muted, fontSize: 10 }}>TOTAL HOURS</div>
                <div style={{ color: T.gold, fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:18 }}>{hrs} hrs</div>
              </div>
              {total && (
                <div style={{ textAlign:"right" }}>
                  <div style={{ color: T.muted, fontSize: 10 }}>HOURS TOTAL</div>
                  <div style={{ color: T.success, fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:18 }}>${total}</div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── FIELD TICKET PHOTO ── */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>📄 FIELD TICKET PHOTO <span style={{color:T.danger}}>✱</span></div>
        <div onClick={() => { setScanTarget({type:"field"}); setScanOpen(true); }}
          style={{
            border:`1px dashed ${form.fieldTicketImage ? T.goldDim : T.border}`,
            borderRadius: 8, padding: 20, cursor:"pointer", textAlign:"center",
            background: T.bg, transition:"border-color 0.2s"
          }}>
          {form.fieldTicketImage
            ? <img src={form.fieldTicketImage} style={{ width:"100%", borderRadius: 6 }} alt=""/>
            : <div style={{ color: T.muted, fontSize: 13 }}>📄 Tap to scan or upload ticket</div>
          }
        </div>
        {form.fieldTicketImage && (
          <button onClick={()=>update("fieldTicketImage","")} style={{
            marginTop: 8, background:"transparent", border:"none",
            color: T.danger, fontSize: 12, cursor:"pointer"
          }}>✕ Remove photo</button>
        )}
      </div>

      {/* ── LOAD MANIFEST ── */}
      <div style={{ ...sectionStyle }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 14 }}>
          <div style={sectionTitle}>🚛 LOAD MANIFEST</div>
          <div style={{
            background:`rgba(212,175,55,0.1)`, border:`1px solid ${T.goldDim}`,
            borderRadius: 8, padding:"4px 12px", color: T.gold,
            fontFamily:"'Space Mono',monospace", fontSize: 13, fontWeight: 700
          }}>
            {totalBBLS.toFixed(2)} BBL
          </div>
        </div>

        {loads.map((load, idx) => (
          <div key={load.id} style={{
            background: T.bg, borderRadius: 8, padding: 14,
            border:`1px solid ${T.border}`, marginBottom: 10,
            borderLeft:`3px solid ${T.gold}`
          }}>
            <div style={{ display:"flex", alignItems:"center", gap: 8, marginBottom: 12 }}>
              <span style={{
                background: T.gold, color:"#000", padding:"2px 8px",
                borderRadius: 4, fontWeight: 800, fontSize: 11, fontFamily:"'Rajdhani',sans-serif"
              }}>LOAD {String(idx+1).padStart(2,"0")}</span>
              {loads.length > 1 && (
                <button onClick={()=>deleteLoad(idx)} style={{
                  marginLeft:"auto", background:"transparent",
                  border:`1px solid ${T.border}`, color: T.danger,
                  borderRadius: 6, padding:"2px 8px", cursor:"pointer", fontSize: 12
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

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }}>
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

            {/* Quick-fill buttons */}
            <div style={{ display:"flex", flexWrap:"wrap", gap: 6, marginTop: 8 }}>
              {[90,100,120,130,150,200].map(q=>(
                <button key={q} onClick={()=>updateLoad(idx,"bbls",String(q))}
                  style={{
                    padding:"5px 10px", borderRadius: 6, fontSize: 12, cursor:"pointer",
                    background: String(load.bbls)===String(q)
                      ? `rgba(212,175,55,0.2)` : T.surface,
                    border:`1px solid ${String(load.bbls)===String(q) ? T.gold : T.border}`,
                    color: String(load.bbls)===String(q) ? T.gold : T.muted,
                    transition:"all 0.15s"
                  }}>{q}</button>
              ))}
            </div>

            {/* Verification image */}
            <Label text="Verification Image"/>
            <div onClick={()=>{ setScanTarget({type:"load",index:idx}); setScanOpen(true); }}
              style={{
                border:`1px dashed ${load.verificationImage ? T.goldDim : T.border}`,
                borderRadius: 8, padding: load.verificationImage ? 0 : 14,
                cursor:"pointer", textAlign:"center", background: T.card, overflow:"hidden"
              }}>
              {load.verificationImage
                ? <img src={load.verificationImage} style={{ width:"100%", display:"block" }} alt=""/>
                : <div style={{ color: T.muted, fontSize: 12 }}>🧾 Scan load ticket</div>
              }
            </div>

            {/* Manifest ops */}
            {load.fluid === "Manifest" && (
              <div style={{
                marginTop: 10, border:`1px solid ${T.border}`, borderRadius: 8, padding: 12
              }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  color: T.muted, fontSize: 10, marginBottom: 10 }}>
                  <span>MANIFEST OPERATIONS</span>
                  <span style={{ color: T.danger }}>REQUIRED SELECTION</span>
                </div>
                <div style={{ display:"flex", gap: 8 }}>
                  {[["washOut","WASH OUT"],["unload","UNLOAD"]].map(([op,label])=>(
                    <button key={op} onClick={()=>toggleOp(idx,op)} style={{
                      flex:1, padding:"9px 0", borderRadius: 8, fontWeight: 700,
                      fontSize: 12, cursor:"pointer", letterSpacing:"0.05em",
                      border:`1px solid ${load.manifestOps[op] ? T.gold : T.border}`,
                      background: load.manifestOps[op] ? `rgba(212,175,55,0.12)` : "transparent",
                      color: load.manifestOps[op] ? T.gold : T.muted,
                      transition:"all 0.15s"
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <button onClick={addLoad} style={{
          width:"100%", padding: 12, border:`1px dashed ${T.border}`,
          borderRadius: 8, cursor:"pointer", textAlign:"center",
          background:"transparent", color: T.muted, fontSize: 13,
          transition:"all 0.15s"
        }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderHi; e.currentTarget.style.color=T.text;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.muted;}}
        >+ ADD ADDITIONAL LOAD</button>
      </div>

      {/* ── SIGNATURE ── */}
      <div style={sectionStyle}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 10 }}>
          <div style={sectionTitle}>✍ OPERATOR SIGNATURE <span style={{color:T.danger}}>✱</span></div>
          {hasSignature && (
            <button onClick={clearSig} style={{
              background:"transparent", border:"none",
              color: T.danger, fontSize: 12, cursor:"pointer"
            }}>✕ Clear</button>
          )}
        </div>
        <div style={{ borderRadius: 8, overflow:"hidden", border:`1px solid ${T.border}` }}>
          <canvas ref={sigRef} width={900} height={280}
            style={{ width:"100%", height: 140, background:"#fff", display:"block", touchAction:"none" }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          />
        </div>
        {!hasSignature && (
          <div style={{ color: T.muted, fontSize: 11, textAlign:"center", marginTop: 6 }}>
            Sign above with your finger or mouse
          </div>
        )}
      </div>

      {/* ── VOLUME SUMMARY ── */}
      <div style={{
        ...sectionStyle, display:"flex", justifyContent:"space-between", alignItems:"center"
      }}>
        <div style={{ color: T.muted, fontSize: 12 }}>
          <div>TOTAL LOADS</div>
          <div style={{ color: T.text, fontWeight: 700, fontSize: 18, marginTop: 2 }}>{loads.length}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color: T.muted, fontSize: 12 }}>TOTAL VOLUME</div>
          <div style={{
            color: T.gold, fontFamily:"'Space Mono',monospace",
            fontSize: 28, fontWeight: 700, marginTop: 2
          }}>{totalBBLS.toFixed(2)} <span style={{ fontSize: 14 }}>BBL</span></div>
        </div>
      </div>

      {/* ── SUBMIT ── */}
      {submitError && (
        <div style={{ color: T.danger, fontSize: 12, textAlign:"center", marginBottom: 10 }}>
          ⚠ {submitError}
        </div>
      )}

      <GoldBtn
        disabled={!isComplete}
        loading={isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? "SUBMITTING…" : isComplete ? "✓ SUBMIT FINAL TICKET" : `COMPLETE FORM (${progress}%)`}
      </GoldBtn>

      <ScannerModal
        open={scanOpen}
        onClose={()=>setScanOpen(false)}
        onUse={img => {
          if (scanTarget?.type === "field") update("fieldTicketImage", img);
          if (scanTarget?.type === "load") {
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

  const [phone,      setPhone]      = useState(() => localStorage.getItem("bd_phone"));
  const [page,       setPage]       = useState(() => localStorage.getItem("bd_phone") ? "dashboard" : "login");
  const [editTicket, setEditTicket] = useState(null);

  function login(p)   { localStorage.setItem("bd_phone",p); setPhone(p); setPage("dashboard"); }
  function logout()   { localStorage.removeItem("bd_phone"); setPhone(null); setPage("login"); }

  if (!phone || page === "login")
    return <Login onLogin={login}/>;
  if (page === "dashboard")
    return <Dashboard phone={phone} onLogout={logout}
      onStartTicket={()=>{ setEditTicket(null); setPage("submit"); }}
      onOpenQueue={()=>setPage("queue")}/>;
  if (page === "queue")
    return <Queue phone={phone} onBack={()=>setPage("dashboard")}
      onEdit={t=>{ setEditTicket(t); setPage("submit"); }}/>;
  if (page === "submit")
    return <SubmitTicket phone={phone} editTicket={editTicket}
      onComplete={()=>{ setEditTicket(null); setPage("success"); }}/>;
  if (page === "success")
    return <TicketSuccess onBack={()=>setPage("dashboard")}/>;

  return null;
}

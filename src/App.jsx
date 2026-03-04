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

// ─── SCANNER MODAL ────────────────────────────────────────────────────────────
// ─── ADVANCED DOCUMENT SCANNER ───────────────────────────────────────────────
function ScannerModal({ open, onClose, onUse }) {
  // stage: "capture" | "adjust" | "enhance"
  const [stage,      setStage]      = useState("capture");
  const [rawImage,   setRawImage]   = useState(null);
  const [corners,    setCorners]    = useState(null);
  const [dragIdx,    setDragIdx]    = useState(null);
  const [filter,     setFilter]     = useState("enhanced");
  const [processing, setProcessing] = useState(false);
  const [finalImage, setFinalImage] = useState(null);
  const [ready,      setReady]      = useState(false);
  const [camError,   setCamError]   = useState(false);
  const [imgSize,    setImgSize]    = useState({ w:0, h:0 });

  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const captureRef  = useRef(null);
  const adjustRef   = useRef(null);
  const outputRef   = useRef(null);
  const fileInputRef= useRef(null);
  const imgRef      = useRef(null);
  const dragRef     = useRef(null);

  // ── camera lifecycle
  useEffect(() => {
    if (!open) return;
    setStage("capture"); setRawImage(null); setCorners(null);
    setFilter("enhanced"); setFinalImage(null); setProcessing(false);
    setReady(false); setCamError(false);
    let active = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal:"environment" }, width:{ ideal:2560 }, height:{ ideal:1920 } }
        });
        if (!active) return;
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        setReady(true);
      } catch { setCamError(true); }
    })();
    return () => {
      active = false;
      if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null; }
    };
  }, [open]);

  // ── capture from live camera
  function capturePhoto() {
    const v = videoRef.current; if (!v || !captureRef.current) return;
    const c = captureRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    loadRawImage(c.toDataURL("image/jpeg", 0.96));
  }

  // ── upload file handler
  function handleFile(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => loadRawImage(ev.target.result);
    r.readAsDataURL(f);
    e.target.value = "";
  }

  // ── load raw image → run edge detection → go to adjust stage
  function loadRawImage(dataUrl) {
    setProcessing(true);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setRawImage(dataUrl);
      setImgSize({ w: img.width, h: img.height });
      const detected = detectCorners(img);
      setCorners(detected);
      if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null; }
      setProcessing(false);
      setStage("adjust");
    };
    img.src = dataUrl;
  }

  // ── EDGE DETECTION: Sobel gradient on downsampled image
  function detectCorners(img) {
    const MAX = 600;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const W = Math.round(img.width * scale), H = Math.round(img.height * scale);
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, W, H);

    try {
      const px = ctx.getImageData(0, 0, W, H).data;
      const gray = new Float32Array(W * H);
      for (let i = 0; i < W * H; i++)
        gray[i] = 0.299*px[i*4] + 0.587*px[i*4+1] + 0.114*px[i*4+2];

      // Sobel edge magnitude
      const edge = new Float32Array(W * H);
      let maxE = 0;
      for (let y = 1; y < H-1; y++) {
        for (let x = 1; x < W-1; x++) {
          const gx = -gray[(y-1)*W+(x-1)] - 2*gray[y*W+(x-1)] - gray[(y+1)*W+(x-1)]
                   +  gray[(y-1)*W+(x+1)] + 2*gray[y*W+(x+1)] + gray[(y+1)*W+(x+1)];
          const gy = -gray[(y-1)*W+(x-1)] - 2*gray[(y-1)*W+x] - gray[(y-1)*W+(x+1)]
                   +  gray[(y+1)*W+(x-1)] + 2*gray[(y+1)*W+x] + gray[(y+1)*W+(x+1)];
          const e = Math.sqrt(gx*gx + gy*gy);
          edge[y*W+x] = e;
          if (e > maxE) maxE = e;
        }
      }

      const thresh = maxE * 0.22;
      let minX=W, maxX=0, minY=H, maxY=0, found=false;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (edge[y*W+x] > thresh) {
            if (x < minX) minX=x; if (x > maxX) maxX=x;
            if (y < minY) minY=y; if (y > maxY) maxY=y;
            found = true;
          }
        }
      }

      if (found && (maxX-minX)/W > 0.35 && (maxY-minY)/H > 0.35) {
        const pad = 4;
        const nx = v => Math.max(0.01, Math.min(0.99, (v+pad)/W));
        const ny = v => Math.max(0.01, Math.min(0.99, (v+pad)/H));
        const fx = v => Math.max(0.01, Math.min(0.99, (v-pad)/W));
        const fy = v => Math.max(0.01, Math.min(0.99, (v-pad)/H));
        return [
          { x: nx(minX), y: ny(minY) },
          { x: fx(maxX), y: ny(minY) },
          { x: fx(maxX), y: fy(maxY) },
          { x: nx(minX), y: fy(maxY) },
        ];
      }
    } catch(_) {}

    // Fallback padded rect
    const p = 0.07;
    return [{ x:p,y:p },{ x:1-p,y:p },{ x:1-p,y:1-p },{ x:p,y:1-p }];
  }

  // ── draw corner adjustment overlay
  useEffect(() => {
    if (stage !== "adjust" || !corners || !adjustRef.current || !imgRef.current) return;
    requestAnimationFrame(drawAdjust);
  }, [stage, corners]);

  function drawAdjust() {
    const canvas = adjustRef.current, img = imgRef.current;
    if (!canvas || !img) return;
    const maxW = Math.min(window.innerWidth - 32, 500);
    const scale = Math.min(maxW / img.width, (window.innerHeight * 0.62) / img.height);
    canvas.width  = Math.round(img.width  * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Dim everything outside selection
    const pts = corners.map(c => ({ x: c.x*canvas.width, y: c.y*canvas.height }));
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear inside selection (show image clearly)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fill();
    ctx.restore();

    // Redraw image inside selection
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Animated gold border
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 4]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Edge lines solid
    ctx.strokeStyle = "rgba(212,175,55,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.stroke();

    // Corner handles
    const LABELS = ["TL","TR","BR","BL"];
    pts.forEach((p, i) => {
      // Shadow
      ctx.shadowBlur = 8; ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 18, 0, Math.PI*2);
      ctx.fillStyle = dragRef.current === i ? "#fff" : "#D4AF37";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.stroke();
      // Label
      ctx.fillStyle = "#000";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(LABELS[i], p.x, p.y);
    });
  }

  // ── pointer events for corner dragging
  function getCanvasXY(e) {
    const canvas = adjustRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    };
  }

  function onPtrDown(e) {
    e.preventDefault();
    const { x, y } = getCanvasXY(e);
    const canvas = adjustRef.current;
    const pts = corners.map(c => ({ x: c.x*canvas.width, y: c.y*canvas.height }));
    const hit = pts.findIndex(p => Math.hypot(p.x-x, p.y-y) < 28);
    if (hit !== -1) { dragRef.current = hit; setDragIdx(hit); }
  }

  function onPtrMove(e) {
    if (dragRef.current === null) return;
    e.preventDefault();
    const { x, y } = getCanvasXY(e);
    const canvas = adjustRef.current;
    const newC = corners.map((c, i) => i === dragRef.current
      ? { x: Math.max(0,Math.min(1, x/canvas.width)), y: Math.max(0,Math.min(1, y/canvas.height)) }
      : c
    );
    setCorners(newC);
    // Draw immediately without waiting for React re-render
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const pts2 = newC.map(c => ({ x: c.x*canvas.width, y: c.y*canvas.height }));
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(pts2[0].x,pts2[0].y); pts2.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath();
    ctx.globalCompositeOperation="destination-out"; ctx.fill(); ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.moveTo(pts2[0].x,pts2[0].y); pts2.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath();
    ctx.clip(); ctx.drawImage(img,0,0,canvas.width,canvas.height); ctx.restore();
    ctx.strokeStyle="#D4AF37"; ctx.lineWidth=2; ctx.setLineDash([10,4]);
    ctx.beginPath(); ctx.moveTo(pts2[0].x,pts2[0].y); pts2.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
    const LB=["TL","TR","BR","BL"];
    pts2.forEach((p,i)=>{
      ctx.beginPath(); ctx.arc(p.x,p.y,18,0,Math.PI*2);
      ctx.fillStyle=dragRef.current===i?"#fff":"#D4AF37"; ctx.fill();
      ctx.strokeStyle="#000"; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle="#000"; ctx.font="bold 9px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(LB[i],p.x,p.y);
    });
  }

  function onPtrUp() { dragRef.current = null; setDragIdx(null); }

  // ── PERSPECTIVE WARP using bilinear sampling
  function warpAndProcess(selectedFilter) {
    setProcessing(true);
    setTimeout(() => {
      try {
        const img = imgRef.current;
        const W = img.width, H = img.height;
        const pts = corners.map(c => ({ x: c.x*W, y: c.y*H }));

        // Compute output dimensions from corner distances
        const wT = Math.hypot(pts[1].x-pts[0].x, pts[1].y-pts[0].y);
        const wB = Math.hypot(pts[2].x-pts[3].x, pts[2].y-pts[3].y);
        const hL = Math.hypot(pts[3].x-pts[0].x, pts[3].y-pts[0].y);
        const hR = Math.hypot(pts[2].x-pts[1].x, pts[2].y-pts[1].y);
        const outW = Math.round(Math.max(wT, wB));
        const outH = Math.round(Math.max(hL, hR));

        // Get source pixels
        const srcC = document.createElement("canvas");
        srcC.width = W; srcC.height = H;
        const srcCtx = srcC.getContext("2d");
        srcCtx.drawImage(img, 0, 0);
        const srcPx = srcCtx.getImageData(0, 0, W, H).data;

        // Destination canvas
        const dstC = outputRef.current;
        dstC.width = outW; dstC.height = outH;
        const dstCtx = dstC.getContext("2d");
        const dstData = dstCtx.createImageData(outW, outH);
        const dstPx = dstData.data;

        // Bilinear interpolation perspective warp
        for (let dy = 0; dy < outH; dy++) {
          const v = dy / outH;
          for (let dx = 0; dx < outW; dx++) {
            const u = dx / outW;
            // Bilerp corner positions
            const sx = (1-u)*(1-v)*pts[0].x + u*(1-v)*pts[1].x + u*v*pts[2].x + (1-u)*v*pts[3].x;
            const sy = (1-u)*(1-v)*pts[0].y + u*(1-v)*pts[1].y + u*v*pts[2].y + (1-u)*v*pts[3].y;

            // Bilinear pixel sample from source
            const x0 = Math.floor(sx), y0 = Math.floor(sy);
            const x1 = Math.min(x0+1, W-1), y1 = Math.min(y0+1, H-1);
            const fx = sx-x0, fy = sy-y0;
            const di = (dy*outW+dx)*4;

            for (let ch = 0; ch < 3; ch++) {
              const tl = srcPx[(y0*W+x0)*4+ch];
              const tr = srcPx[(y0*W+x1)*4+ch];
              const bl = srcPx[(y1*W+x0)*4+ch];
              const br = srcPx[(y1*W+x1)*4+ch];
              dstPx[di+ch] = Math.round(tl*(1-fx)*(1-fy) + tr*fx*(1-fy) + bl*(1-fx)*fy + br*fx*fy);
            }
            dstPx[di+3] = 255;
          }
        }
        dstCtx.putImageData(dstData, 0, 0);

        // Apply filter + sharpening
        applyFilter(dstCtx, outW, outH, selectedFilter);

        setFinalImage(dstC.toDataURL("image/jpeg", 0.93));
        setFilter(selectedFilter);
        setProcessing(false);
        setStage("enhance");
      } catch(err) {
        console.error("Warp error:", err);
        setProcessing(false);
      }
    }, 30);
  }

  function applyFilter(ctx, W, H, f) {
    const id = ctx.getImageData(0, 0, W, H);
    const d  = id.data;

    if (f === "bw") {
      for (let i = 0; i < d.length; i+=4) {
        const g = Math.round(0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]);
        d[i]=d[i+1]=d[i+2]=g;
      }
    } else if (f === "enhanced") {
      for (let i = 0; i < d.length; i+=4) {
        d[i]   = Math.min(255, Math.max(0, (d[i]  -128)*1.3+148));
        d[i+1] = Math.min(255, Math.max(0, (d[i+1]-128)*1.25+138));
        d[i+2] = Math.min(255, Math.max(0, (d[i+2]-128)*1.15+128));
      }
    } else if (f === "highcontrast") {
      for (let i = 0; i < d.length; i+=4) {
        const g = 0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
        const v = g > 128 ? Math.min(255, g*1.5) : Math.max(0, g*0.4);
        d[i]=d[i+1]=d[i+2]=v;
      }
    }

    if (f !== "original") {
      // Unsharp mask: sharpen
      const blurred = boxBlur(d, W, H, 1);
      for (let i = 0; i < d.length; i+=4) {
        for (let c=0; c<3; c++)
          d[i+c] = Math.min(255, Math.max(0, d[i+c]*2.4 - blurred[i+c]*1.4));
      }
    }
    ctx.putImageData(id, 0, 0);
  }

  function boxBlur(data, W, H, r) {
    const out = new Uint8ClampedArray(data.length);
    const tmp = new Uint8ClampedArray(data.length);
    // Horizontal
    for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
      let rv=0,gv=0,bv=0,n=0;
      for (let dx=-r;dx<=r;dx++) {
        const xi=Math.max(0,Math.min(W-1,x+dx)), i=(y*W+xi)*4;
        rv+=data[i];gv+=data[i+1];bv+=data[i+2];n++;
      }
      const i=(y*W+x)*4; tmp[i]=rv/n;tmp[i+1]=gv/n;tmp[i+2]=bv/n;tmp[i+3]=255;
    }
    // Vertical
    for (let x=0;x<W;x++) for (let y=0;y<H;y++) {
      let rv=0,gv=0,bv=0,n=0;
      for (let dy=-r;dy<=r;dy++) {
        const yi=Math.max(0,Math.min(H-1,y+dy)), i=(yi*W+x)*4;
        rv+=tmp[i];gv+=tmp[i+1];bv+=tmp[i+2];n++;
      }
      const i=(y*W+x)*4; out[i]=rv/n;out[i+1]=gv/n;out[i+2]=bv/n;out[i+3]=255;
    }
    return out;
  }

  // ── change filter on enhance stage
  function changeFilter(f) {
    if (processing) return;
    setProcessing(true);
    setFilter(f);
    setTimeout(() => {
      const canvas = outputRef.current;
      const ctx    = canvas.getContext("2d");
      // Re-draw from warped base then apply new filter
      warpAndProcess(f);
    }, 20);
  }

  if (!open) return null;

  const FILTERS = [
    { id:"enhanced",     icon:"✨", label:"Enhanced",     desc:"Sharp + clear"  },
    { id:"bw",           icon:"◑",  label:"Black & White", desc:"Classic scan"   },
    { id:"highcontrast", icon:"◆",  label:"High Contrast", desc:"Max readability"},
    { id:"original",     icon:"⬜", label:"Original",      desc:"No processing"  },
  ];

  const doneW = outputRef.current?.width  || 0;
  const doneH = outputRef.current?.height || 0;
  const mpx   = doneW && doneH ? ((doneW*doneH)/1e6).toFixed(1) : null;

  return (
    <div style={{
      position:"fixed", inset:0, background:"#050608",
      display:"flex", flexDirection:"column", zIndex:9999,
      fontFamily:"'Rajdhani','Inter',sans-serif"
    }}>
      {/* ── TOP HEADER */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"12px 16px", background:T.card,
        borderBottom:`1px solid ${T.border}`, flexShrink:0
      }}>
        <div>
          <div style={{ color:T.gold, fontSize:14, fontWeight:700, letterSpacing:"0.15em" }}>
            {stage==="capture"?"📷 SCAN DOCUMENT": stage==="adjust"?"✂ ADJUST EDGES":"🎨 ENHANCE & CONFIRM"}
          </div>
          <div style={{ color:T.muted, fontSize:10, marginTop:1 }}>
            {stage==="capture"?"Align document in frame and capture"
            :stage==="adjust"?"Drag gold corners to fit the document edges"
            :"Select filter and confirm your scan"}
          </div>
        </div>
        <button onClick={onClose} style={{
          background:"transparent", border:`1px solid ${T.border}`,
          color:T.muted, borderRadius:8, padding:"6px 12px",
          cursor:"pointer", fontSize:12, letterSpacing:"0.05em"
        }}>✕ CANCEL</button>
      </div>

      {/* ── PROGRESS */}
      <div style={{ height:3, background:T.surface, flexShrink:0 }}>
        <div style={{
          height:"100%", background:`linear-gradient(90deg, ${T.goldDim}, ${T.gold})`,
          transition:"width 0.5s ease",
          width:stage==="capture"?"33%":stage==="adjust"?"66%":"100%"
        }}/>
      </div>

      {/* ══ STAGE 1: CAPTURE ══ */}
      {stage==="capture" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ flex:1, position:"relative", background:"#000", overflow:"hidden" }}>
            <video ref={videoRef} playsInline autoPlay muted
              style={{ width:"100%", height:"100%", objectFit:"cover",
                display:camError?"none":"block" }}/>

            {!camError && (
              <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none" }}>
                <defs>
                  <mask id="guideM">
                    <rect width="100%" height="100%" fill="white"/>
                    <rect x="6%" y="10%" width="88%" height="80%" rx="6" fill="black"/>
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.45)" mask="url(#guideM)"/>
                <rect x="6%" y="10%" width="88%" height="80%" rx="6"
                  fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="14 5"/>
                {[["6%","10%"],["94%","10%"],["94%","90%"],["6%","90%"]].map(([cx,cy],i) => (
                  <circle key={i} cx={cx} cy={cy} r="5" fill="#D4AF37"/>
                ))}
                <text x="50%" y="93%" textAnchor="middle"
                  style={{ fill:"#D4AF37", fontSize:"11px", letterSpacing:"0.15em", fontFamily:"'Rajdhani',sans-serif" }}>
                  ALIGN DOCUMENT WITHIN FRAME
                </text>
              </svg>
            )}

            {camError && (
              <div style={{
                position:"absolute",inset:0,display:"flex",flexDirection:"column",
                alignItems:"center",justifyContent:"center",gap:14
              }}>
                <div style={{ fontSize:44 }}>📷</div>
                <div style={{ color:T.muted, fontSize:13 }}>Camera unavailable</div>
                <button onClick={() => fileInputRef.current.click()} style={{
                  padding:"11px 28px", background:T.gold, color:"#000",
                  border:"none", borderRadius:8, fontWeight:800, cursor:"pointer",
                  fontSize:14, letterSpacing:"0.1em"
                }}>📁 UPLOAD PHOTO</button>
              </div>
            )}

            {processing && (
              <div style={{
                position:"absolute",inset:0,background:"rgba(0,0,0,0.7)",
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12
              }}>
                <div style={{ width:36,height:36,border:`3px solid rgba(212,175,55,0.2)`,
                  borderTop:`3px solid ${T.gold}`,borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>
                <div style={{ color:T.gold, fontSize:12, letterSpacing:"0.1em" }}>DETECTING EDGES...</div>
              </div>
            )}
          </div>

          <div style={{ padding:"14px 16px", background:T.card, borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
            <div style={{ display:"flex", gap:10 }}>
              {!camError && (
                <button onClick={capturePhoto} disabled={!ready||processing} style={{
                  flex:2, padding:"14px 0", background:ready&&!processing?T.gold:T.surface,
                  color:ready&&!processing?"#000":T.muted, border:"none", borderRadius:10,
                  fontWeight:800, fontSize:15, cursor:ready&&!processing?"pointer":"not-allowed",
                  letterSpacing:"0.1em"
                }}>📸 CAPTURE</button>
              )}
              <button onClick={() => fileInputRef.current.click()} style={{
                flex:1, padding:"14px 0", background:T.surface,
                color:T.text, border:`1px solid ${T.border}`, borderRadius:10,
                fontWeight:600, fontSize:13, cursor:"pointer"
              }}>📁 UPLOAD</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ STAGE 2: ADJUST CORNERS ══ */}
      {stage==="adjust" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{
            flex:1, overflow:"auto", display:"flex",
            alignItems:"center", justifyContent:"center",
            padding:"10px", background:"#0a0a0c"
          }}>
            <canvas ref={adjustRef}
              style={{ display:"block", maxWidth:"100%", touchAction:"none",
                cursor:"crosshair", borderRadius:4 }}
              onMouseDown={onPtrDown} onMouseMove={onPtrMove} onMouseUp={onPtrUp} onMouseLeave={onPtrUp}
              onTouchStart={onPtrDown} onTouchMove={onPtrMove} onTouchEnd={onPtrUp}
            />
          </div>

          <div style={{ padding:"12px 16px", background:T.card, borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
            <div style={{
              display:"flex", justifyContent:"center", gap:16, marginBottom:12
            }}>
              {["TL","TR","BR","BL"].map((lbl,i) => (
                <div key={lbl} style={{
                  width:30,height:30,borderRadius:"50%",background:T.gold,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:9,fontWeight:800,color:"#000",letterSpacing:"0.05em"
                }}>{lbl}</div>
              ))}
            </div>
            <div style={{ color:T.muted, fontSize:10, textAlign:"center", marginBottom:12, letterSpacing:"0.08em" }}>
              DRAG CORNERS TO FIT THE DOCUMENT
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setStage("capture"); setRawImage(null); }} style={{
                flex:1, padding:"12px 0", background:"transparent",
                color:T.text, border:`1px solid ${T.border}`, borderRadius:8,
                fontWeight:600, fontSize:13, cursor:"pointer"
              }}>↩ RETAKE</button>
              <button onClick={() => warpAndProcess("enhanced")} disabled={processing} style={{
                flex:2, padding:"12px 0",
                background:processing?T.surface:T.gold,
                color:processing?T.muted:"#000", border:"none", borderRadius:8,
                fontWeight:800, fontSize:14, cursor:processing?"not-allowed":"pointer",
                letterSpacing:"0.08em", display:"flex", alignItems:"center",
                justifyContent:"center", gap:8
              }}>
                {processing
                  ? <><div style={{ width:14,height:14,border:"2px solid rgba(0,0,0,0.3)",
                      borderTop:"2px solid #000",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/> PROCESSING...</>
                  : "⚡ PROCESS SCAN"
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ STAGE 3: ENHANCE + CONFIRM ══ */}
      {stage==="enhance" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Filter selector */}
          <div style={{
            display:"flex", gap:6, padding:"10px 12px",
            background:T.card, borderBottom:`1px solid ${T.border}`,
            flexShrink:0, overflowX:"auto"
          }}>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => changeFilter(f.id)} style={{
                flexShrink:0, padding:"8px 12px", borderRadius:8,
                background:filter===f.id?"rgba(212,175,55,0.12)":"transparent",
                border:`1px solid ${filter===f.id?T.gold:T.border}`,
                color:filter===f.id?T.gold:T.muted,
                cursor:"pointer", transition:"all 0.15s",
                fontFamily:"'Rajdhani',sans-serif"
              }}>
                <div style={{ fontSize:13, fontWeight:filter===f.id?700:400 }}>{f.icon} {f.label}</div>
                <div style={{ fontSize:9, color:T.muted, marginTop:1 }}>{f.desc}</div>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div style={{
            flex:1, overflow:"auto", background:"#0a0a0c",
            display:"flex", alignItems:"center", justifyContent:"center", padding:12
          }}>
            {processing ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
                <div style={{ width:36,height:36,border:`3px solid rgba(212,175,55,0.2)`,
                  borderTop:`3px solid ${T.gold}`,borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>
                <div style={{ color:T.muted, fontSize:12, letterSpacing:"0.1em" }}>APPLYING FILTER...</div>
              </div>
            ) : finalImage && (
              <img src={finalImage} alt="Scan preview" style={{
                maxWidth:"100%", maxHeight:"100%",
                borderRadius:4, boxShadow:"0 12px 48px rgba(0,0,0,0.9)"
              }}/>
            )}
          </div>

          {/* Metadata bar */}
          {!processing && finalImage && mpx && (
            <div style={{
              padding:"6px 14px", background:T.surface,
              borderTop:`1px solid ${T.border}`, flexShrink:0,
              display:"flex", justifyContent:"space-between", alignItems:"center"
            }}>
              <span style={{ color:T.muted, fontSize:10 }}>
                📐 {doneW}×{doneH}px &nbsp;·&nbsp; {mpx}MP
              </span>
              <span style={{
                background:"rgba(34,197,94,0.1)", color:"#22c55e",
                fontSize:10, padding:"2px 10px", borderRadius:99, fontWeight:700
              }}>✓ SCAN READY</span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ padding:"14px 16px", background:T.card, borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setStage("adjust"); setFinalImage(null); }} style={{
                flex:1, padding:"12px 0", background:"transparent",
                color:T.text, border:`1px solid ${T.border}`, borderRadius:8,
                fontWeight:600, fontSize:13, cursor:"pointer"
              }}>← RE-ADJUST</button>
              <button
                disabled={processing || !finalImage}
                onClick={() => { onUse(finalImage); }}
                style={{
                  flex:2, padding:"12px 0",
                  background:!processing&&finalImage?T.gold:T.surface,
                  color:!processing&&finalImage?"#000":T.muted,
                  border:"none", borderRadius:8,
                  fontWeight:800, fontSize:14,
                  cursor:!processing&&finalImage?"pointer":"not-allowed",
                  letterSpacing:"0.08em"
                }}>✓ USE THIS SCAN</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden elements */}
      <canvas ref={captureRef} style={{ display:"none" }}/>
      <canvas ref={outputRef}  style={{ display:"none" }}/>
      <input ref={fileInputRef} type="file" accept="image/*"
        capture="environment" style={{ display:"none" }} onChange={handleFile}/>
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

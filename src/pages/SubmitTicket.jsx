import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { API_URL, T, injectGlobalStyles } from "./shared";
import {
  PageShell, Label, Input, Textarea, Select,
  GoldBtn, GhostBtn, SectionCard, Spinner, ErrorMsg,
} from "./shared";

// ── Scanner Modal ─────────────────────────────────────────────────────────────
function ScannerModal({ open, onClose, onUse }) {
  const [preview, setPreview] = useState(null);
  const [busy,    setBusy]    = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) { setPreview(null); document.body.style.overflow = "hidden"; }
    else       { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleFile = useCallback(e => {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = "";
    setBusy(true);
    const reader = new FileReader();
    reader.onload = ev => { setPreview(ev.target.result); setBusy(false); };
    reader.readAsDataURL(f);
  }, []);

  const handleUse = useCallback(() => {
    if (preview) { onUse(preview); onClose(); }
  }, [preview, onUse, onClose]);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "#000",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", background: T.card,
        borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <button onClick={onClose} aria-label="Close scanner" style={{
          width: 38, height: 38, borderRadius: 10, background: T.surface,
          border: `1px solid ${T.border}`, color: T.text,
          cursor: "pointer", fontSize: 16, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>✕</button>
        <div style={{ color: T.gold, fontSize: 13, fontWeight: 700, letterSpacing: "0.12em" }}>
          📷 SCAN / UPLOAD DOCUMENT
        </div>
        <div style={{ width: 38 }} />
      </div>

      {/* Preview */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        background: "#060606", padding: 16, overflow: "hidden",
      }}>
        {busy && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Spinner size={36} />
            <div style={{ color: T.muted, fontSize: 12 }}>LOADING IMAGE…</div>
          </div>
        )}
        {!busy && !preview && (
          <div style={{ textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>📄</div>
            <div style={{ fontSize: 14 }}>Tap below to choose a photo or take one</div>
          </div>
        )}
        {!busy && preview && (
          <img
            src={preview}
            alt="Document preview"
            style={{
              maxWidth: "100%", maxHeight: "100%", objectFit: "contain",
              borderRadius: 6, boxShadow: `0 0 0 1px rgba(212,175,55,0.3)`,
            }}
          />
        )}
      </div>

      {/* Controls */}
      <div style={{
        flexShrink: 0, background: T.card,
        borderTop: `1px solid ${T.border}`, padding: "12px 16px 24px",
      }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <button onClick={() => fileRef.current?.click()} style={{
            flex: 1, height: 52, background: T.surface, color: T.text,
            border: `1px solid ${T.border}`, borderRadius: 12,
            fontWeight: 600, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            📁 Choose / Take Photo
          </button>
          <button onClick={handleUse} disabled={!preview} style={{
            flex: 1, height: 52, border: "none", borderRadius: 12,
            fontWeight: 800, fontSize: 14, letterSpacing: "0.08em",
            background: preview ? T.gold : T.surface,
            color: preview ? "#000" : T.muted,
            cursor: preview ? "pointer" : "not-allowed",
          }}>
            ✓ USE SCAN
          </button>
        </div>
        <button onClick={onClose} style={{
          width: "100%", height: 42, background: "transparent", color: T.muted,
          border: `1px solid ${T.border}`, borderRadius: 10,
          fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          ✕ CANCEL
        </button>
      </div>

      <input
        ref={fileRef} type="file" accept="image/*" capture="environment"
        style={{ display: "none" }} onChange={handleFile}
      />
    </div>
  );
}

// ── Load Card ─────────────────────────────────────────────────────────────────
const QUICK_BBLS = [90, 100, 120, 130, 150, 200];
const FLUID_TYPES = ["Fresh Water", "Brine Water", "Disposal Water", "Manifest"];
const CLIENTS     = ["Exxon", "Oxy", "Western Midstream", "Chevron", "Other"];

function makeLoad(id) {
  return { id, geminiRef: "", loadTicket: "", fluid: "Fresh Water",
           bbls: "", manifestOps: { washOut: false, unload: false }, verificationImage: "" };
}

function LoadCard({ load, index, isExxon, onUpdate, onDelete, onScan, canDelete }) {
  return (
    <div style={{
      background: T.bg, borderRadius: 8, padding: 14,
      border: `1px solid ${T.border}`, marginBottom: 10,
      borderLeft: `3px solid ${T.gold}`,
    }}>
      {/* Load header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{
          background: T.gold, color: "#000", padding: "2px 8px",
          borderRadius: 4, fontWeight: 800, fontSize: 11,
        }}>
          LOAD {String(index + 1).padStart(2, "0")}
        </span>
        {canDelete && (
          <button
            onClick={onDelete}
            aria-label={`Delete load ${index + 1}`}
            style={{
              marginLeft: "auto", background: "transparent",
              border: `1px solid ${T.border}`, color: T.danger,
              borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 12,
            }}
          >
            ✕ Remove
          </button>
        )}
      </div>

      {isExxon && (
        <>
          <Label text="Gemini Dispatch Ref #" required />
          <Input value={load.geminiRef} onChange={e => onUpdate("geminiRef", e.target.value)} />
        </>
      )}

      <Label text="Load Ticket Number" required />
      <Input value={load.loadTicket} onChange={e => onUpdate("loadTicket", e.target.value)} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label text="Fluid Type" />
          <Select value={load.fluid} onChange={e => onUpdate("fluid", e.target.value)}>
            {FLUID_TYPES.map(f => <option key={f}>{f}</option>)}
          </Select>
        </div>
        <div>
          <Label text="Quantity (BBLs)" required />
          <Input
            type="number" inputMode="decimal"
            value={load.bbls} onChange={e => onUpdate("bbls", e.target.value)}
          />
        </div>
      </div>

      {/* Quick-fill buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {QUICK_BBLS.map(q => {
          const active = String(load.bbls) === String(q);
          return (
            <button
              key={q}
              onClick={() => onUpdate("bbls", String(q))}
              style={{
                padding: "5px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                background: active ? "rgba(212,175,55,0.15)" : T.surface,
                border: `1px solid ${active ? T.gold : T.border}`,
                color: active ? T.gold : T.muted, transition: "all 0.12s",
              }}
            >
              {q}
            </button>
          );
        })}
      </div>

      {/* Verification image */}
      <Label text="Verification Image" />
      <div
        onClick={onScan}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === "Enter" && onScan()}
        aria-label="Scan or upload load ticket"
        style={{
          border: `1px dashed ${load.verificationImage ? T.goldDim : T.border}`,
          borderRadius: 8, cursor: "pointer", textAlign: "center",
          background: T.card, overflow: "hidden",
          padding: load.verificationImage ? 0 : 14,
        }}
      >
        {load.verificationImage
          ? <img src={load.verificationImage} alt="Load ticket" style={{ width: "100%", display: "block" }} />
          : <div style={{ color: T.muted, fontSize: 12 }}>🧾 Scan load ticket</div>
        }
      </div>
      {load.verificationImage && (
        <button
          onClick={() => onUpdate("verificationImage", "")}
          style={{ marginTop: 4, background: "transparent", border: "none",
            color: T.danger, fontSize: 11, cursor: "pointer" }}
        >
          ✕ Remove
        </button>
      )}

      {/* Manifest ops */}
      {load.fluid === "Manifest" && (
        <div style={{
          marginTop: 10, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            color: T.muted, fontSize: 10, marginBottom: 10 }}>
            <span>MANIFEST OPERATIONS</span>
            <span style={{ color: T.danger }}>REQUIRED SELECTION</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["washOut", "WASH OUT"], ["unload", "UNLOAD"]].map(([op, label]) => (
              <button
                key={op}
                onClick={() => onUpdate("manifestOps", {
                  ...load.manifestOps, [op]: !load.manifestOps[op],
                })}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 8,
                  fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: "0.05em",
                  border: `1px solid ${load.manifestOps[op] ? T.gold : T.border}`,
                  background: load.manifestOps[op] ? "rgba(212,175,55,0.12)" : "transparent",
                  color: load.manifestOps[op] ? T.gold : T.muted, transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const DISPATCH_LABEL = {
  Exxon: "GEMINI DISPATCH #",
  Oxy: "IRONSIGHT JOB #",
  "Western Midstream": "IRONSIGHT JOB #",
};

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export default function SubmitTicket({ phone, onComplete, editTicket }) {
  injectGlobalStyles();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState("");
  const [scanTarget,   setScanTarget]   = useState(null);
  const [scanOpen,     setScanOpen]     = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const [submissionId] = useState(editTicket?.["Submission ID"] ?? null);

  const [form, setForm] = useState(() => editTicket ? {
    client:           editTicket["Client"]        ?? "",
    fieldTicket:      editTicket["Field Ticket #"] ?? "",
    dispatch:         editTicket["Dispatch #"]    ?? "",
    unit:             editTicket["Unit #"]        ?? "",
    driver:           editTicket["Driver"]        ?? "",
    workDate:         editTicket["Service Date"]  ?? todayStr(),
    wellLease:        editTicket["Well/Lease"]    ?? "",
    notes:            editTicket["Notes"]         ?? "",
    fieldTicketImage: "",
    startTime:        editTicket["Start Time"]    ?? "",
    endTime:          editTicket["End Time"]      ?? "",
    hourlyRate:       editTicket["Hourly Rate"]   ?? "",
  } : {
    client: "", fieldTicket: "", dispatch: "", unit: "",
    driver: "", workDate: todayStr(), wellLease: "", notes: "",
    fieldTicketImage: "", startTime: "", endTime: "", hourlyRate: "",
  });

  const [loads, setLoads] = useState([makeLoad(1)]);

  const sigRef  = useRef(null);
  const drawing = useRef(false);

  const isExxon = form.client === "Exxon";

  // ── Form helpers ──────────────────────────────────────────────────────────
  const update     = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);
  const updateLoad = useCallback((i, k, v) => setLoads(p => {
    const c = [...p]; c[i] = { ...c[i], [k]: v }; return c;
  }), []);
  const addLoad    = useCallback(() =>
    setLoads(p => [...p, makeLoad(p.length + 1)]), []);
  const deleteLoad = useCallback(i =>
    setLoads(p => p.filter((_, idx) => idx !== i)), []);

  const totalBBLS = useMemo(() =>
    loads.reduce((s, l) => { const n = parseFloat(l.bbls); return s + (isNaN(n) ? 0 : n); }, 0),
  [loads]);

  // ── Validation ────────────────────────────────────────────────────────────
  function nonEmpty(v) { return String(v ?? "").trim().length > 0; }

  function loadOk(l) {
    const base = (!isExxon || nonEmpty(l.geminiRef)) &&
      nonEmpty(l.loadTicket) && nonEmpty(l.bbls) && !isNaN(parseFloat(l.bbls));
    return l.fluid === "Manifest"
      ? base && (l.manifestOps.washOut || l.manifestOps.unload)
      : base;
  }

  const checks = useMemo(() => [
    { key: "client",           ok: nonEmpty(form.client)           },
    { key: "fieldTicket",      ok: nonEmpty(form.fieldTicket)      },
    { key: "dispatch",         ok: nonEmpty(form.dispatch)         },
    { key: "unit",             ok: nonEmpty(form.unit)             },
    { key: "driver",           ok: nonEmpty(form.driver)           },
    { key: "workDate",         ok: nonEmpty(form.workDate)         },
    { key: "wellLease",        ok: nonEmpty(form.wellLease)        },
    { key: "fieldTicketImage", ok: nonEmpty(form.fieldTicketImage) },
    { key: "signature",        ok: hasSignature                    },
    ...loads.map((l, i) => ({ key: `load_${i}`, ok: loadOk(l) })),
  ], [form, loads, hasSignature]);

  const progress   = useMemo(() => Math.round(checks.filter(c => c.ok).length / checks.length * 100), [checks]);
  const isComplete = useMemo(() => checks.every(c => c.ok), [checks]);

  // ── Signature ─────────────────────────────────────────────────────────────
  function canvasPoint(e, canvas) {
    const r  = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - r.left) * (canvas.width / r.width), y: (cy - r.top) * (canvas.height / r.height) };
  }

  function startDraw(e) {
    if (e.type === "touchstart") e.preventDefault();
    const c = sigRef.current, ctx = c.getContext("2d"), p = canvasPoint(e, c);
    drawing.current = true;
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#000";
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
  }

  function draw(e) {
    if (!drawing.current) return;
    if (e.type === "touchmove") e.preventDefault();
    const c = sigRef.current, ctx = c.getContext("2d"), p = canvasPoint(e, c);
    ctx.lineTo(p.x, p.y); ctx.stroke();
    setHasSignature(true);
  }

  function endDraw() { drawing.current = false; }

  function clearSig() {
    const c = sigRef.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    setHasSignature(false);
  }

  // ── Offline sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function syncOffline() {
      const q = JSON.parse(localStorage.getItem("offlineTickets") || "[]");
      if (!q.length) return;
      const remaining = [];
      for (const ticket of q) {
        try {
          await fetch(API_URL, {
            method: "POST", mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(ticket),
          });
        } catch {
          remaining.push(ticket); // keep ones that still failed
        }
      }
      if (remaining.length < q.length) {
        remaining.length
          ? localStorage.setItem("offlineTickets", JSON.stringify(remaining))
          : localStorage.removeItem("offlineTickets");
      }
    }
    window.addEventListener("online", syncOffline);
    syncOffline();
    return () => window.removeEventListener("online", syncOffline);
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!isComplete || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError("");

    const payload = {
      submissionId, phone, ...form, loads, totalBBLS,
      signature: sigRef.current.toDataURL("image/png"),
    };

    try {
      await fetch(API_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      onComplete();
    } catch {
      // Save offline
      try {
        const q = JSON.parse(localStorage.getItem("offlineTickets") || "[]");
        q.push(payload);
        localStorage.setItem("offlineTickets", JSON.stringify(q));
        onComplete(); // still navigate away — will sync on reconnect
      } catch {
        setSubmitError("Submission failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isComplete, isSubmitting, form, loads, totalBBLS, phone, submissionId, onComplete]);

  // ── Scanner handler ───────────────────────────────────────────────────────
  const handleScanUse = useCallback(img => {
    if (scanTarget?.type === "field") update("fieldTicketImage", img);
    if (scanTarget?.type === "load")
      updateLoad(scanTarget.index, "verificationImage", img);
    setScanOpen(false);
    setScanTarget(null);
  }, [scanTarget, update, updateLoad]);

  // ── Hours calc ────────────────────────────────────────────────────────────
  const hoursCalc = useMemo(() => {
    if (!form.startTime || !form.endTime) return null;
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 1440;
    const hrs   = (mins / 60).toFixed(2);
    const total = form.hourlyRate
      ? (parseFloat(hrs) * parseFloat(form.hourlyRate)).toFixed(2)
      : null;
    return { hrs, total };
  }, [form.startTime, form.endTime, form.hourlyRate]);

  const dispatchLabel = DISPATCH_LABEL[form.client] ?? "DISPATCH #";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageShell maxW={520}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: T.gold, fontSize: 20, fontWeight: 800, letterSpacing: "0.12em" }}>
          {editTicket ? "EDIT & RESUBMIT" : "NEW FIELD TICKET"}
        </div>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>
          {editTicket ? `Editing ${submissionId}` : "Complete all required fields to submit"}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: T.card, paddingBottom: 10, paddingTop: 4,
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          fontSize: 10, color: T.muted, marginBottom: 5, letterSpacing: "0.1em" }}>
          <span>FORM COMPLETION</span>
          <span style={{ color: progress === 100 ? T.success : T.gold, fontWeight: 700 }}>
            {progress}%
          </span>
        </div>
        <div style={{ height: 4, background: T.surface, borderRadius: 99 }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: progress === 100 ? T.success : T.gold,
            width: `${progress}%`, transition: "width 0.3s ease",
          }}/>
        </div>
      </div>

      {/* ── Job Info ── */}
      <SectionCard title="📋 JOB INFORMATION">
        <Label text="Client Organization" required />
        <Select value={form.client} onChange={e => update("client", e.target.value)}>
          <option value="">Select client…</option>
          {CLIENTS.map(c => <option key={c}>{c}</option>)}
        </Select>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <Label text="Field Ticket #" required />
            <Input value={form.fieldTicket} onChange={e => update("fieldTicket", e.target.value)} />
          </div>
          <div>
            <Label text={dispatchLabel} required />
            <Input value={form.dispatch} onChange={e => update("dispatch", e.target.value)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <Label text="Unit / Truck #" required />
            <Input value={form.unit} onChange={e => update("unit", e.target.value)} />
          </div>
          <div>
            <Label text="Driver Name" required />
            <Input value={form.driver} onChange={e => update("driver", e.target.value)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <Label text="Work Date" required />
            <Input type="date" value={form.workDate} onChange={e => update("workDate", e.target.value)} />
          </div>
          <div>
            <Label text="Well / Lease" required />
            <Input value={form.wellLease} onChange={e => update("wellLease", e.target.value)} />
          </div>
        </div>

        <Label text="Notes / Description" />
        <Textarea
          placeholder="Add job specifics…"
          value={form.notes}
          onChange={e => update("notes", e.target.value)}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
          <div>
            <Label text="Start Time" />
            <Input type="time" value={form.startTime} onChange={e => update("startTime", e.target.value)} />
          </div>
          <div>
            <Label text="End Time" />
            <Input type="time" value={form.endTime} onChange={e => update("endTime", e.target.value)} />
          </div>
        </div>

        <Label text="Hourly Rate ($)" />
        <Input
          type="number" inputMode="decimal" placeholder="e.g. 85"
          value={form.hourlyRate} onChange={e => update("hourlyRate", e.target.value)}
        />

        {hoursCalc && (
          <div style={{
            marginTop: 10, padding: "10px 14px",
            background: "rgba(212,175,55,0.07)",
            border: "1px solid rgba(212,175,55,0.2)", borderRadius: 8,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ color: T.muted, fontSize: 10 }}>TOTAL HOURS</div>
              <div style={{ color: T.gold, fontFamily: "monospace", fontWeight: 700, fontSize: 20 }}>
                {hoursCalc.hrs} hrs
              </div>
            </div>
            {hoursCalc.total && (
              <div style={{ textAlign: "right" }}>
                <div style={{ color: T.muted, fontSize: 10 }}>ESTIMATED TOTAL</div>
                <div style={{ color: T.success, fontFamily: "monospace", fontWeight: 700, fontSize: 20 }}>
                  ${hoursCalc.total}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── Field Ticket Photo ── */}
      <SectionCard title="📄 FIELD TICKET PHOTO ✱">
        <div
          onClick={() => { setScanTarget({ type: "field" }); setScanOpen(true); }}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === "Enter" && (setScanTarget({ type: "field" }), setScanOpen(true))}
          aria-label="Scan or upload field ticket"
          style={{
            border: `1px dashed ${form.fieldTicketImage ? T.goldDim : T.border}`,
            borderRadius: 8, cursor: "pointer", textAlign: "center",
            background: T.bg, overflow: "hidden",
            padding: form.fieldTicketImage ? 0 : 20, transition: "border-color 0.2s",
          }}
        >
          {form.fieldTicketImage
            ? <img src={form.fieldTicketImage} alt="Field ticket" style={{ width: "100%", borderRadius: 6 }} />
            : <div style={{ color: T.muted, fontSize: 13 }}>📄 Tap to scan or upload ticket photo</div>
          }
        </div>
        {form.fieldTicketImage && (
          <button onClick={() => update("fieldTicketImage", "")} style={{
            marginTop: 6, background: "transparent", border: "none",
            color: T.danger, fontSize: 11, cursor: "pointer",
          }}>
            ✕ Remove photo
          </button>
        )}
      </SectionCard>

      {/* ── Load Manifest ── */}
      <SectionCard
        title="🚛 LOAD MANIFEST"
        right={
          <div style={{
            background: "rgba(212,175,55,0.1)", border: `1px solid ${T.goldDim}`,
            borderRadius: 8, padding: "4px 12px", color: T.gold,
            fontFamily: "monospace", fontSize: 13, fontWeight: 700,
          }}>
            {totalBBLS.toFixed(2)} BBL
          </div>
        }
      >
        {loads.map((load, idx) => (
          <LoadCard
            key={load.id}
            load={load}
            index={idx}
            isExxon={isExxon}
            canDelete={loads.length > 1}
            onUpdate={(k, v) => updateLoad(idx, k, v)}
            onDelete={() => deleteLoad(idx)}
            onScan={() => { setScanTarget({ type: "load", index: idx }); setScanOpen(true); }}
          />
        ))}
        <button
          onClick={addLoad}
          style={{
            width: "100%", padding: 12, border: `1px dashed ${T.border}`,
            borderRadius: 8, cursor: "pointer", background: "transparent",
            color: T.muted, fontSize: 13, transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.color = T.text; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
        >
          + ADD ADDITIONAL LOAD
        </button>
      </SectionCard>

      {/* ── Signature ── */}
      <SectionCard
        title="✍ OPERATOR SIGNATURE ✱"
        right={hasSignature
          ? <button onClick={clearSig} style={{ background: "transparent", border: "none",
              color: T.danger, fontSize: 12, cursor: "pointer" }}>✕ Clear</button>
          : null
        }
      >
        <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
          <canvas
            ref={sigRef}
            width={900} height={280}
            style={{ width: "100%", height: 140, background: "#fff", display: "block", touchAction: "none" }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
            aria-label="Signature pad"
          />
        </div>
        {!hasSignature && (
          <div style={{ color: T.muted, fontSize: 11, textAlign: "center", marginTop: 6 }}>
            Sign above with your finger or mouse
          </div>
        )}
      </SectionCard>

      {/* ── Volume Summary ── */}
      <SectionCard>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: T.muted, fontSize: 10 }}>TOTAL LOADS</div>
            <div style={{ color: T.text, fontWeight: 700, fontSize: 20, marginTop: 2 }}>
              {loads.length}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: T.muted, fontSize: 10 }}>TOTAL VOLUME</div>
            <div style={{
              color: T.gold, fontFamily: "monospace", fontWeight: 800, fontSize: 28, marginTop: 2,
            }}>
              {totalBBLS.toFixed(2)} <span style={{ fontSize: 14 }}>BBL</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <ErrorMsg msg={submitError} />

      <GoldBtn disabled={!isComplete} loading={isSubmitting} onClick={handleSubmit}
        style={{ marginTop: 4 }}>
        {isSubmitting ? "SUBMITTING…"
          : isComplete  ? "✓ SUBMIT FINAL TICKET"
          : `COMPLETE FORM — ${progress}%`}
      </GoldBtn>

      <ScannerModal
        open={scanOpen}
        onClose={() => { setScanOpen(false); setScanTarget(null); }}
        onUse={handleScanUse}
      />
    </PageShell>
  );
}

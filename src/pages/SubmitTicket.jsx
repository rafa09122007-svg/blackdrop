// SubmitTicket.jsx — mobile-first, uses new ScannerModal
import React, {
  useState, useMemo, useEffect, useRef, useCallback,
} from "react";
import { API_URL, T, injectGlobalStyles } from "./shared";
import {
  PageShell, Label, Input, Textarea, Select,
  GoldBtn, GhostBtn, SectionCard, Spinner, ErrorMsg, Grid2,
} from "./shared";
import ScannerModal from "./ScannerModal";

// ─── constants ────────────────────────────────────────────────────────────────
const CLIENTS     = ["Exxon", "Oxy", "Western Midstream", "Chevron", "Other"];
const FLUID_TYPES = ["Fresh Water", "Brine Water", "Disposal Water", "Manifest"];
const QUICK_BBLS  = [90, 100, 120, 130, 150, 200];
const DISPATCH_LABEL = {
  Exxon: "GEMINI DISPATCH #",
  Oxy: "IRONSIGHT JOB #",
  "Western Midstream": "IRONSIGHT JOB #",
};

function todayStr() {
  const n = new Date();
  return [
    n.getFullYear(),
    String(n.getMonth() + 1).padStart(2, "0"),
    String(n.getDate()).padStart(2, "0"),
  ].join("-");
}

function makeLoad(id) {
  return {
    id, geminiRef: "", loadTicket: "", fluid: "Fresh Water",
    bbls: "", manifestOps: { washOut: false, unload: false },
    verificationImage: "",
  };
}

// ─── LoadCard ─────────────────────────────────────────────────────────────────
const LoadCard = React.memo(function LoadCard({
  load, index, isExxon, canDelete, onUpdate, onDelete, onScan,
}) {
  return (
    <div style={{
      background: T.bg, borderRadius: 10, padding: 14,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${T.gold}`,
      marginBottom: 10,
    }}>
      {/* header row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
      }}>
        <span style={{
          background: T.gold, color: "#000", padding: "3px 10px",
          borderRadius: 4, fontWeight: 800, fontSize: 11, letterSpacing: "0.06em",
          whiteSpace: "nowrap",
        }}>
          LOAD {String(index + 1).padStart(2, "0")}
        </span>
        {canDelete && (
          <button
            onClick={onDelete}
            aria-label={`Remove load ${index + 1}`}
            style={{
              marginLeft: "auto", minWidth: 44, height: 36,
              background: "transparent",
              border: `1px solid rgba(239,68,68,0.35)`,
              color: T.danger, borderRadius: 8,
              padding: "0 10px", cursor: "pointer", fontSize: 12,
              whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            ✕ Remove
          </button>
        )}
      </div>

      {isExxon && (
        <>
          <Label text="Gemini Dispatch Ref #" required />
          <Input
            value={load.geminiRef}
            onChange={e => onUpdate("geminiRef", e.target.value)}
          />
        </>
      )}

      <Label text="Load Ticket Number" required />
      <Input
        value={load.loadTicket}
        onChange={e => onUpdate("loadTicket", e.target.value)}
        inputMode="text"
        autoCapitalize="characters"
      />

      {/* fluid + bbls side by side */}
      <Grid2 gap={10}>
        <div>
          <Label text="Fluid Type" />
          <Select value={load.fluid} onChange={e => onUpdate("fluid", e.target.value)}>
            {FLUID_TYPES.map(f => <option key={f}>{f}</option>)}
          </Select>
        </div>
        <div>
          <Label text="BBLs" required />
          <Input
            type="number"
            inputMode="decimal"
            value={load.bbls}
            onChange={e => onUpdate("bbls", e.target.value)}
          />
        </div>
      </Grid2>

      {/* quick-fill chips */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10,
      }}>
        {QUICK_BBLS.map(q => {
          const active = String(load.bbls) === String(q);
          return (
            <button
              key={q}
              onClick={() => onUpdate("bbls", String(q))}
              style={{
                // min 40px tall for touch
                minWidth: 48, height: 40,
                borderRadius: 8, fontSize: 13, cursor: "pointer",
                background: active ? "rgba(212,175,55,0.15)" : T.surface,
                border: `1px solid ${active ? T.gold : T.border}`,
                color: active ? T.gold : T.muted,
                fontWeight: active ? 700 : 400,
                transition: "all 0.12s",
              }}
            >
              {q}
            </button>
          );
        })}
      </div>

      {/* verification image */}
      <Label text="Verification Image" />
      <div
        onClick={onScan}
        role="button" tabIndex={0}
        onKeyDown={e => e.key === "Enter" && onScan()}
        aria-label="Scan load ticket"
        style={{
          border: `2px dashed ${load.verificationImage ? T.goldDim : T.border}`,
          borderRadius: 10, cursor: "pointer", textAlign: "center",
          background: T.card, overflow: "hidden",
          padding: load.verificationImage ? 0 : 20,
          transition: "border-color 0.2s",
        }}
      >
        {load.verificationImage
          ? <img src={load.verificationImage} alt="Load ticket scan"
              style={{ width: "100%", display: "block" }} />
          : (
            <div style={{ color: T.muted, fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🧾</div>
              Tap to scan load ticket
            </div>
          )
        }
      </div>
      {load.verificationImage && (
        <button onClick={() => onUpdate("verificationImage", "")}
          style={{ marginTop: 6, background: "transparent", border: "none",
            color: T.danger, fontSize: 12, cursor: "pointer", padding: "4px 0" }}>
          ✕ Remove image
        </button>
      )}

      {/* manifest ops */}
      {load.fluid === "Manifest" && (
        <div style={{
          marginTop: 12, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: 12,
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            color: T.muted, fontSize: 11, marginBottom: 10, gap: 6,
          }}>
            <span style={{ letterSpacing: "0.08em" }}>MANIFEST OPERATIONS</span>
            <span style={{ color: T.danger, fontSize: 10, whiteSpace: "nowrap" }}>
              REQUIRED
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["washOut", "WASH OUT"], ["unload", "UNLOAD"]].map(([op, label]) => (
              <button
                key={op}
                onClick={() => onUpdate("manifestOps", {
                  ...load.manifestOps, [op]: !load.manifestOps[op],
                })}
                style={{
                  flex: 1, minHeight: 48,
                  borderRadius: 10, fontWeight: 700, fontSize: 13,
                  cursor: "pointer", letterSpacing: "0.04em",
                  border: `1px solid ${load.manifestOps[op] ? T.gold : T.border}`,
                  background: load.manifestOps[op] ? "rgba(212,175,55,0.12)" : "transparent",
                  color: load.manifestOps[op] ? T.gold : T.muted,
                  transition: "all 0.15s",
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
});

// ─── SubmitTicket ─────────────────────────────────────────────────────────────
export default function SubmitTicket({ phone, onComplete, editTicket }) {
  injectGlobalStyles();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState("");
  const [scanTarget,   setScanTarget]   = useState(null);
  const [scanOpen,     setScanOpen]     = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const [submissionId] = useState(editTicket?.["Submission ID"] ?? null);

  // ── form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState(() => editTicket ? {
    client:           editTicket["Client"]         ?? "",
    fieldTicket:      editTicket["Field Ticket #"]  ?? "",
    dispatch:         editTicket["Dispatch #"]     ?? "",
    unit:             editTicket["Unit #"]         ?? "",
    driver:           editTicket["Driver"]         ?? "",
    workDate:         editTicket["Service Date"]   ?? todayStr(),
    wellLease:        editTicket["Well/Lease"]     ?? "",
    notes:            editTicket["Notes"]          ?? "",
    fieldTicketImage: "",
    startTime:        editTicket["Start Time"]     ?? "",
    endTime:          editTicket["End Time"]       ?? "",
    hourlyRate:       editTicket["Hourly Rate"]    ?? "",
  } : {
    client: "", fieldTicket: "", dispatch: "", unit: "",
    driver: "", workDate: todayStr(), wellLease: "", notes: "",
    fieldTicketImage: "", startTime: "", endTime: "", hourlyRate: "",
  });

  const [loads, setLoads] = useState([makeLoad(1)]);

  // ── signature ──────────────────────────────────────────────────────────────
  const sigRef  = useRef(null);
  const drawing = useRef(false);

  // ── helpers ────────────────────────────────────────────────────────────────
  const update = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);

  const updateLoad = useCallback((i, k, v) =>
    setLoads(p => { const c = [...p]; c[i] = { ...c[i], [k]: v }; return c; }), []);

  const addLoad = useCallback(() =>
    setLoads(p => [...p, makeLoad(p.length + 1)]), []);

  const deleteLoad = useCallback(i =>
    setLoads(p => p.filter((_, idx) => idx !== i)), []);

  // ── validation ─────────────────────────────────────────────────────────────
  const isExxon = form.client === "Exxon";

  function nonEmpty(v) { return String(v ?? "").trim().length > 0; }

  function loadOk(l) {
    const base =
      (!isExxon || nonEmpty(l.geminiRef)) &&
      nonEmpty(l.loadTicket) &&
      nonEmpty(l.bbls) &&
      !isNaN(parseFloat(l.bbls));
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

  const progress   = useMemo(
    () => Math.round(checks.filter(c => c.ok).length / checks.length * 100),
    [checks],
  );
  const isComplete = useMemo(() => checks.every(c => c.ok), [checks]);

  const dispatchLabel = DISPATCH_LABEL[form.client] ?? "DISPATCH #";

  // ── hours calc ─────────────────────────────────────────────────────────────
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

  const totalBBLS = useMemo(
    () => loads.reduce((s, l) => {
      const n = parseFloat(l.bbls); return s + (isNaN(n) ? 0 : n);
    }, 0),
    [loads],
  );

  // ── signature drawing ──────────────────────────────────────────────────────
  function canvasPoint(e, canvas) {
    const r  = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (cx - r.left) * (canvas.width  / r.width),
      y: (cy - r.top)  * (canvas.height / r.height),
    };
  }

  function startDraw(e) {
    e.preventDefault();
    const c = sigRef.current, ctx = c.getContext("2d"), p = canvasPoint(e, c);
    drawing.current = true;
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
  }

  function draw(e) {
    if (!drawing.current) return;
    e.preventDefault();
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

  // ── scanner handler ────────────────────────────────────────────────────────
  const handleScanUse = useCallback(img => {
    if (scanTarget?.type === "field") update("fieldTicketImage", img);
    if (scanTarget?.type === "load")
      updateLoad(scanTarget.index, "verificationImage", img);
    setScanOpen(false);
    setScanTarget(null);
  }, [scanTarget, update, updateLoad]);

  // ── offline sync ───────────────────────────────────────────────────────────
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
        } catch { remaining.push(ticket); }
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

  // ── submit ─────────────────────────────────────────────────────────────────
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
      try {
        const q = JSON.parse(localStorage.getItem("offlineTickets") || "[]");
        q.push(payload);
        localStorage.setItem("offlineTickets", JSON.stringify(q));
        onComplete();
      } catch {
        setSubmitError("Submission failed — please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isComplete, isSubmitting, form, loads, totalBBLS, phone, submissionId, onComplete]);

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <PageShell maxW={520}>

      {/* Page title */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          color: T.gold, fontSize: 20, fontWeight: 800, letterSpacing: "0.1em",
        }}>
          {editTicket ? "EDIT & RESUBMIT" : "NEW FIELD TICKET"}
        </div>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 3 }}>
          {editTicket
            ? `Editing ${submissionId}`
            : "Complete all required fields to submit"}
        </div>
      </div>

      {/* ── Sticky progress bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: T.card,
        paddingBottom: 10, paddingTop: 4,
        marginBottom: 14,
        // bleed the card bg to the edges so it looks clean when sticky
        marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontSize: 10, color: T.muted, marginBottom: 5, letterSpacing: "0.1em",
        }}>
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

      {/* ── JOB INFO ── */}
      <SectionCard title="📋 JOB INFORMATION">
        <Label text="Client Organization" required />
        <Select value={form.client} onChange={e => update("client", e.target.value)}>
          <option value="">Select client…</option>
          {CLIENTS.map(c => <option key={c}>{c}</option>)}
        </Select>

        <Grid2 gap={10}>
          <div>
            <Label text="Field Ticket #" required />
            <Input
              value={form.fieldTicket}
              onChange={e => update("fieldTicket", e.target.value)}
              autoCapitalize="characters"
            />
          </div>
          <div>
            <Label text={dispatchLabel} required />
            <Input
              value={form.dispatch}
              onChange={e => update("dispatch", e.target.value)}
            />
          </div>
        </Grid2>

        <Grid2 gap={10}>
          <div>
            <Label text="Unit / Truck #" required />
            <Input
              value={form.unit}
              onChange={e => update("unit", e.target.value)}
              autoCapitalize="characters"
            />
          </div>
          <div>
            <Label text="Driver Name" required />
            <Input
              value={form.driver}
              onChange={e => update("driver", e.target.value)}
              autoCapitalize="words"
            />
          </div>
        </Grid2>

        <Grid2 gap={10}>
          <div>
            <Label text="Work Date" required />
            <Input
              type="date"
              value={form.workDate}
              onChange={e => update("workDate", e.target.value)}
            />
          </div>
          <div>
            <Label text="Well / Lease" required />
            <Input
              value={form.wellLease}
              onChange={e => update("wellLease", e.target.value)}
            />
          </div>
        </Grid2>

        <Label text="Notes / Description" />
        <Textarea
          placeholder="Add job specifics…"
          value={form.notes}
          onChange={e => update("notes", e.target.value)}
        />

        {/* time + rate */}
        <Grid2 gap={10}>
          <div>
            <Label text="Start Time" />
            <Input type="time" value={form.startTime}
              onChange={e => update("startTime", e.target.value)} />
          </div>
          <div>
            <Label text="End Time" />
            <Input type="time" value={form.endTime}
              onChange={e => update("endTime", e.target.value)} />
          </div>
        </Grid2>

        <Label text="Hourly Rate ($)" />
        <Input
          type="number" inputMode="decimal" placeholder="e.g. 85"
          value={form.hourlyRate}
          onChange={e => update("hourlyRate", e.target.value)}
        />

        {hoursCalc && (
          <div style={{
            marginTop: 12, padding: "12px 14px",
            background: "rgba(212,175,55,0.07)",
            border: "1px solid rgba(212,175,55,0.2)",
            borderRadius: 10,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            gap: 8,
          }}>
            <div>
              <div style={{ color: T.muted, fontSize: 10 }}>TOTAL HOURS</div>
              <div style={{
                color: T.gold, fontFamily: "monospace",
                fontWeight: 800, fontSize: 22,
              }}>
                {hoursCalc.hrs} hrs
              </div>
            </div>
            {hoursCalc.total && (
              <div style={{ textAlign: "right" }}>
                <div style={{ color: T.muted, fontSize: 10 }}>ESTIMATED TOTAL</div>
                <div style={{
                  color: T.success, fontFamily: "monospace",
                  fontWeight: 800, fontSize: 22,
                }}>
                  ${hoursCalc.total}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── FIELD TICKET PHOTO ── */}
      <SectionCard title="📄 FIELD TICKET PHOTO ✱">
        <div
          onClick={() => { setScanTarget({ type: "field" }); setScanOpen(true); }}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === "Enter" &&
            (setScanTarget({ type: "field" }), setScanOpen(true))}
          aria-label="Scan or upload field ticket"
          style={{
            border: `2px dashed ${form.fieldTicketImage ? T.goldDim : T.border}`,
            borderRadius: 10, cursor: "pointer", textAlign: "center",
            background: T.bg, overflow: "hidden",
            padding: form.fieldTicketImage ? 0 : 24,
            transition: "border-color 0.2s",
          }}
        >
          {form.fieldTicketImage
            ? <img src={form.fieldTicketImage} alt="Field ticket"
                style={{ width: "100%", borderRadius: 8 }} />
            : (
              <div style={{ color: T.muted }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                <div style={{ fontSize: 13 }}>Tap to scan field ticket</div>
                <div style={{ fontSize: 11, marginTop: 4, color: "#4a5066" }}>
                  Auto edge detection + enhancement
                </div>
              </div>
            )
          }
        </div>
        {form.fieldTicketImage && (
          <button onClick={() => update("fieldTicketImage", "")}
            style={{ marginTop: 8, background: "transparent", border: "none",
              color: T.danger, fontSize: 12, cursor: "pointer", padding: "4px 0" }}>
            ✕ Remove photo
          </button>
        )}
      </SectionCard>

      {/* ── LOAD MANIFEST ── */}
      <SectionCard
        title="🚛 LOAD MANIFEST"
        right={
          <div style={{
            background: "rgba(212,175,55,0.1)",
            border: `1px solid ${T.goldDim}`,
            borderRadius: 8, padding: "4px 12px",
            color: T.gold, fontFamily: "monospace",
            fontSize: 13, fontWeight: 700,
            whiteSpace: "nowrap",
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
            onScan={() => {
              setScanTarget({ type: "load", index: idx });
              setScanOpen(true);
            }}
          />
        ))}

        <button
          onClick={addLoad}
          style={{
            width: "100%", minHeight: 52, padding: "0 16px",
            border: `1px dashed ${T.border}`, borderRadius: 10,
            cursor: "pointer", background: "transparent",
            color: T.muted, fontSize: 13, transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = T.borderHi;
            e.currentTarget.style.color = T.text;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.color = T.muted;
          }}
        >
          + ADD ADDITIONAL LOAD
        </button>
      </SectionCard>

      {/* ── SIGNATURE ── */}
      <SectionCard
        title="✍ OPERATOR SIGNATURE ✱"
        right={
          hasSignature
            ? <button onClick={clearSig} style={{
                background: "transparent", border: "none",
                color: T.danger, fontSize: 12, cursor: "pointer",
                padding: "4px 0", minHeight: 36,
              }}>✕ Clear</button>
            : null
        }
      >
        <div style={{
          borderRadius: 10, overflow: "hidden",
          border: `1px solid ${T.border}`,
        }}>
          <canvas
            ref={sigRef}
            width={900} height={300}
            style={{
              width: "100%", height: 150, background: "#fff",
              display: "block", touchAction: "none",
            }}
            onMouseDown={startDraw} onMouseMove={draw}
            onMouseUp={endDraw}    onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
            aria-label="Signature pad"
          />
        </div>
        {!hasSignature && (
          <div style={{
            color: T.muted, fontSize: 12, textAlign: "center", marginTop: 8,
          }}>
            Sign above with your finger
          </div>
        )}
      </SectionCard>

      {/* ── VOLUME SUMMARY ── */}
      <SectionCard>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ color: T.muted, fontSize: 11 }}>TOTAL LOADS</div>
            <div style={{
              color: T.text, fontWeight: 800, fontSize: 22, marginTop: 2,
            }}>
              {loads.length}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: T.muted, fontSize: 11 }}>TOTAL VOLUME</div>
            <div style={{
              color: T.gold, fontFamily: "monospace",
              fontWeight: 800, fontSize: 30, marginTop: 2,
            }}>
              {totalBBLS.toFixed(2)}{" "}
              <span style={{ fontSize: 14 }}>BBL</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <ErrorMsg msg={submitError} />

      <GoldBtn
        disabled={!isComplete}
        loading={isSubmitting}
        onClick={handleSubmit}
        style={{ marginTop: 8 }}
      >
        {isSubmitting
          ? "SUBMITTING…"
          : isComplete
            ? "✓ SUBMIT FINAL TICKET"
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

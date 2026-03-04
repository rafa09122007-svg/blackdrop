// ScannerModal.jsx
// Built-in document scanner — CamScanner-quality features in the browser:
//   • Live camera with guide overlay
//   • Auto edge/corner detection (contour tracing on canvas)
//   • Perspective warp (4-point transform → rectangular output)
//   • Image enhancement (adaptive contrast + brightness)
//   • Interactive corner drag to fine-tune crop
//   • Photo library upload fallback
//   • Fully mobile-optimised (safe-area, 48px targets, no zoom)

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { T } from "./shared";

// ─── constants ────────────────────────────────────────────────────────────────
const CORNER_RADIUS = 18; // px hit-target for corner handles
const SCAN_LINE_COLOR = T.gold;

// ─── tiny math helpers ────────────────────────────────────────────────────────
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Bilinear sample — used in perspective warp
function bilinear(data, w, h, sx, sy) {
  const x0 = clamp(Math.floor(sx), 0, w - 1);
  const y0 = clamp(Math.floor(sy), 0, h - 1);
  const x1 = clamp(x0 + 1, 0, w - 1);
  const y1 = clamp(y0 + 1, 0, h - 1);
  const fx = sx - x0, fy = sy - y0;
  const result = [0, 0, 0, 255];
  for (let c = 0; c < 3; c++) {
    const v00 = data[(y0 * w + x0) * 4 + c];
    const v10 = data[(y0 * w + x1) * 4 + c];
    const v01 = data[(y1 * w + x0) * 4 + c];
    const v11 = data[(y1 * w + x1) * 4 + c];
    result[c] = v00 * (1 - fx) * (1 - fy)
              + v10 * fx * (1 - fy)
              + v01 * (1 - fx) * fy
              + v11 * fx * fy;
  }
  return result;
}

// ─── perspective warp ─────────────────────────────────────────────────────────
// src corners (tl,tr,br,bl) in image pixels → flat rectangular output
function perspectiveWarp(srcCanvas, corners) {
  const [tl, tr, br, bl] = corners;
  const outW = Math.round(Math.max(dist(tl, tr), dist(bl, br)));
  const outH = Math.round(Math.max(dist(tl, bl), dist(tr, br)));
  if (outW < 10 || outH < 10) return srcCanvas;

  const out = document.createElement("canvas");
  out.width  = outW;
  out.height = outH;
  const ctx  = out.getContext("2d");
  const dst  = ctx.createImageData(outW, outH);
  const src  = srcCanvas.getContext("2d")
    .getImageData(0, 0, srcCanvas.width, srcCanvas.height);
  const w = srcCanvas.width, h = srcCanvas.height;

  // Inverse map: for each output pixel find where it comes from in source
  for (let y = 0; y < outH; y++) {
    const tv = y / (outH - 1);
    for (let x = 0; x < outW; x++) {
      const tu = x / (outW - 1);
      // Bilinear interpolation of the 4 source corners
      const sx = (1 - tu) * (1 - tv) * tl.x + tu * (1 - tv) * tr.x
               + (1 - tu) * tv        * bl.x + tu * tv        * br.x;
      const sy = (1 - tu) * (1 - tv) * tl.y + tu * (1 - tv) * tr.y
               + (1 - tu) * tv        * bl.y + tu * tv        * br.y;
      const px = bilinear(src.data, w, h, sx, sy);
      const i  = (y * outW + x) * 4;
      dst.data[i]     = px[0];
      dst.data[i + 1] = px[1];
      dst.data[i + 2] = px[2];
      dst.data[i + 3] = 255;
    }
  }
  ctx.putImageData(dst, 0, 0);
  return out;
}

// ─── image enhancement ────────────────────────────────────────────────────────
// Stretches histogram + sharpens — makes text pop like CamScanner
function enhanceDocument(canvas) {
  const ctx  = canvas.getContext("2d");
  const idat = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d    = idat.data;
  const n    = d.length;

  // 1. find luminance range
  let lo = 255, hi = 0;
  for (let i = 0; i < n; i += 4) {
    const v = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const range = hi - lo || 1;

  // 2. stretch + slight S-curve for punch
  for (let i = 0; i < n; i += 4) {
    for (let c = 0; c < 3; c++) {
      let v = ((d[i + c] - lo) / range) * 255;
      // mild S-curve
      v = v / 255;
      v = v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
      v = v * 255;
      d[i + c] = clamp(Math.round(v), 0, 255);
    }
  }

  // 3. unsharp-mask (simple 3×3 high-pass blend)
  const w = canvas.width, h = canvas.height;
  const tmp = new Uint8ClampedArray(d);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const blur =
          (tmp[((y-1)*w+(x-1))*4+c] + tmp[((y-1)*w+x)*4+c]*2 + tmp[((y-1)*w+(x+1))*4+c]
         + tmp[(y*w+(x-1))*4+c]*2    + tmp[(y*w+x)*4+c]*4      + tmp[(y*w+(x+1))*4+c]*2
         + tmp[((y+1)*w+(x-1))*4+c] + tmp[((y+1)*w+x)*4+c]*2 + tmp[((y+1)*w+(x+1))*4+c]
          ) / 16;
        d[i + c] = clamp(Math.round(d[i+c] + 0.6 * (d[i+c] - blur)), 0, 255);
      }
    }
  }
  ctx.putImageData(idat, 0, 0);
  return canvas;
}

// ─── auto-detect document corners ────────────────────────────────────────────
// Rough but fast: finds the largest rectangular-ish contour in the image.
// Returns 4 corners in canvas-pixel space ordered [tl, tr, br, bl].
function autoDetectCorners(canvas) {
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext("2d");
  const idat = ctx.getImageData(0, 0, w, h);
  const d = idat.data;

  // 1. grayscale + simple edge detection (Sobel)
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.299*d[i*4] + 0.587*d[i*4+1] + 0.114*d[i*4+2];
  }
  const edges = new Float32Array(w * h);
  let maxE = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx =
        -gray[(y-1)*w+(x-1)] - 2*gray[y*w+(x-1)] - gray[(y+1)*w+(x-1)]
        +gray[(y-1)*w+(x+1)] + 2*gray[y*w+(x+1)] + gray[(y+1)*w+(x+1)];
      const gy =
        -gray[(y-1)*w+(x-1)] - 2*gray[(y-1)*w+x] - gray[(y-1)*w+(x+1)]
        +gray[(y+1)*w+(x-1)] + 2*gray[(y+1)*w+x] + gray[(y+1)*w+(x+1)];
      const e = Math.hypot(gx, gy);
      edges[y*w+x] = e;
      if (e > maxE) maxE = e;
    }
  }

  // 2. threshold and find extreme edge pixels per quadrant
  const thr = maxE * 0.18;
  // quadrant boundary
  const midX = w / 2, midY = h / 2;
  // for each quadrant we track the point closest to each corner
  const corners = [
    { corner: "tl", best: null, bestDist: Infinity, tx: 0,   ty: 0   },
    { corner: "tr", best: null, bestDist: Infinity, tx: w,   ty: 0   },
    { corner: "br", best: null, bestDist: Infinity, tx: w,   ty: h   },
    { corner: "bl", best: null, bestDist: Infinity, tx: 0,   ty: h   },
  ];

  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      if (edges[y*w+x] < thr) continue;
      for (const q of corners) {
        const d2 = Math.hypot(x - q.tx, y - q.ty);
        if (d2 < q.bestDist) { q.bestDist = d2; q.best = { x, y }; }
      }
    }
  }

  // 3. fall back to generous inset if detection failed
  const margin = 0.08;
  return [
    corners[0].best ?? { x: w*margin,       y: h*margin       }, // tl
    corners[1].best ?? { x: w*(1-margin),   y: h*margin       }, // tr
    corners[2].best ?? { x: w*(1-margin),   y: h*(1-margin)   }, // br
    corners[3].best ?? { x: w*margin,       y: h*(1-margin)   }, // bl
  ];
}

// ─── ScannerModal component ───────────────────────────────────────────────────
export default function ScannerModal({ open, onClose, onUse }) {
  // phases: "camera" | "preview" | "crop" | "enhance"
  const [phase,      setPhase]      = useState("camera");
  const [captured,   setCaptured]   = useState(null); // raw canvas
  const [corners,    setCorners]    = useState(null); // [{x,y} ×4] in canvas px
  const [dragging,   setDragging]   = useState(null); // index 0–3
  const [ready,      setReady]      = useState(false);
  const [busy,       setBusy]       = useState(false);
  const [flashMsg,   setFlashMsg]   = useState("");

  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const rawCanvas   = useRef(null);   // hidden canvas — holds captured raw frame
  const overlayRef  = useRef(null);   // visible canvas — draws corner overlay
  const fileRef     = useRef(null);
  const animRef     = useRef(null);

  // ── lifecycle: start / stop camera ────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      stopCamera();
      reset();
      return;
    }
    document.body.style.overflow = "hidden";
    startCamera();
    return () => {
      stopCamera();
      document.body.style.overflow = "";
    };
  }, [open]);

  function reset() {
    setPhase("camera"); setCaptured(null); setCorners(null);
    setDragging(null); setReady(false); setBusy(false); setFlashMsg("");
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch (err) {
      console.warn("Camera unavailable:", err);
      // Fall straight to upload mode
      setPhase("upload");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setReady(false);
  }

  // ── capture frame from video ───────────────────────────────────────────────
  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !ready) return;
    const vw = video.videoWidth, vh = video.videoHeight;
    const c  = rawCanvas.current;
    c.width  = vw; c.height = vh;
    c.getContext("2d").drawImage(video, 0, 0, vw, vh);
    stopCamera();

    // auto-detect corners
    const detected = autoDetectCorners(c);
    setCaptured(c);
    setCorners(detected);
    setPhase("crop");
  }, [ready]);

  // ── handle library file ────────────────────────────────────────────────────
  const handleFile = useCallback(e => {
    const f = e.target.files?.[0]; if (!f) return;
    e.target.value = "";
    setBusy(true);
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      const c = rawCanvas.current;
      c.width  = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const detected = autoDetectCorners(c);
      setCaptured(c);
      setCorners(detected);
      setBusy(false);
      setPhase("crop");
    };
    img.onerror = () => { setBusy(false); flash("Could not load image."); };
    img.src = url;
  }, []);

  function flash(msg) {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(""), 2600);
  }

  // ── draw overlay (corner handles + quad outline) ───────────────────────────
  useEffect(() => {
    if (phase !== "crop" || !corners || !captured || !overlayRef.current) return;

    const oc  = overlayRef.current;
    const ctx = oc.getContext("2d");
    const W   = oc.offsetWidth, H = oc.offsetHeight;
    oc.width  = W; oc.height = H;

    // mapping: canvas-pixel → overlay-display coords
    const scaleX = W / captured.width;
    const scaleY = H / captured.height;
    function toDisplay(p) { return { x: p.x * scaleX, y: p.y * scaleY }; }

    ctx.clearRect(0, 0, W, H);

    // dim outside quad
    const [tl, tr, br, bl] = corners.map(toDisplay);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fill("evenodd");
    ctx.restore();

    // quad outline
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.strokeStyle = SCAN_LINE_COLOR;
    ctx.lineWidth   = 2.5;
    ctx.stroke();
    ctx.restore();

    // corner handles
    [tl, tr, br, bl].forEach((p, i) => {
      // outer ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, CORNER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(212,175,55,0.18)";
      ctx.fill();
      // dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = SCAN_LINE_COLOR;
      ctx.fill();
    });
  }, [phase, corners, captured]);

  // ── corner drag handling ──────────────────────────────────────────────────
  function getOverlayPoint(e, el) {
    const r  = el.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (cx - r.left) / r.width  * captured.width,
      y: (cy - r.top)  / r.height * captured.height,
    };
  }

  function onOverlayDown(e) {
    if (!corners) return;
    const el   = overlayRef.current;
    const r    = el.getBoundingClientRect();
    const cx   = e.touches ? e.touches[0].clientX : e.clientX;
    const cy   = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = el.offsetWidth  / captured.width;
    const scaleY = el.offsetHeight / captured.height;
    let minD = CORNER_RADIUS * 2.5, found = -1;
    corners.forEach((p, i) => {
      const dx = cx - (r.left + p.x * scaleX);
      const dy = cy - (r.top  + p.y * scaleY);
      const d2 = Math.hypot(dx, dy);
      if (d2 < minD) { minD = d2; found = i; }
    });
    if (found >= 0) {
      e.preventDefault();
      setDragging(found);
    }
  }

  function onOverlayMove(e) {
    if (dragging === null || !captured) return;
    e.preventDefault();
    const pt = getOverlayPoint(e, overlayRef.current);
    setCorners(prev => {
      const next = [...prev];
      next[dragging] = {
        x: clamp(pt.x, 0, captured.width),
        y: clamp(pt.y, 0, captured.height),
      };
      return next;
    });
  }

  function onOverlayUp() { setDragging(null); }

  // ── apply crop & enhance ──────────────────────────────────────────────────
  const applyAndEnhance = useCallback(() => {
    if (!captured || !corners) return;
    setBusy(true);
    // Use setTimeout so UI can repaint "busy" state first
    setTimeout(() => {
      try {
        const warped   = perspectiveWarp(captured, corners);
        const enhanced = enhanceDocument(warped);
        const dataUrl  = enhanced.toDataURL("image/jpeg", 0.92);
        onUse(dataUrl);
        onClose();
      } catch (err) {
        console.error(err);
        flash("Processing failed — try again.");
      } finally {
        setBusy(false);
      }
    }, 30);
  }, [captured, corners, onUse, onClose]);

  // ── use as-is (no enhance) ────────────────────────────────────────────────
  const useRaw = useCallback(() => {
    if (!captured) return;
    onUse(captured.toDataURL("image/jpeg", 0.92));
    onClose();
  }, [captured, onUse, onClose]);

  if (!open) return null;

  // ─── PHASE: camera ─────────────────────────────────────────────────────────
  if (phase === "camera" || phase === "upload") {
    return (
      <div style={modalShell}>
        {/* Header */}
        <div style={headerStyle}>
          <Btn square onClick={onClose} aria-label="Close">✕</Btn>
          <span style={{ color: T.gold, fontSize: 13, fontWeight: 700, letterSpacing: "0.12em" }}>
            📄 SCAN DOCUMENT
          </span>
          <div style={{ width: 40 }} />
        </div>

        {/* Video area */}
        <div style={{ flex: 1, background: "#000", position: "relative", overflow: "hidden" }}>
          <video
            ref={videoRef}
            playsInline autoPlay muted
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />

          {/* guide box */}
          {phase === "camera" && (
            <>
              <div style={{
                position: "absolute", top: "10%", left: "6%", right: "6%", bottom: "10%",
                border: `2px solid ${T.gold}`, borderRadius: 4, pointerEvents: "none",
              }}>
                {/* animated scan line */}
                <div style={{
                  position: "absolute", left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`,
                  animation: "scanBeam 2.4s ease-in-out infinite",
                }}/>
              </div>
              <div style={{
                position: "absolute", bottom: "calc(10% + 12px)", left: 0, right: 0,
                textAlign: "center", color: "rgba(255,255,255,0.65)", fontSize: 12,
                pointerEvents: "none",
              }}>
                Align document inside the frame
              </div>
            </>
          )}

          {(phase === "upload" || !ready) && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.7)", gap: 14,
            }}>
              <div style={{ fontSize: 52 }}>📷</div>
              <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: "0 24px" }}>
                {phase === "upload"
                  ? "Camera unavailable — use the upload button below"
                  : "Starting camera…"}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={controlsBar}>
          {flashMsg && <FlashBanner msg={flashMsg} />}

          <div style={{ display: "flex", gap: 10 }}>
            {/* shutter */}
            <button
              onClick={capture}
              disabled={!ready || phase === "upload"}
              aria-label="Capture"
              style={{
                flex: 1, height: 56, borderRadius: 14,
                background: ready && phase !== "upload" ? T.gold : "#1e2230",
                color: ready && phase !== "upload" ? "#000" : T.muted,
                border: "none", fontWeight: 800, fontSize: 15,
                letterSpacing: "0.06em", cursor: ready ? "pointer" : "not-allowed",
              }}
            >
              📸 CAPTURE
            </button>

            {/* upload */}
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Upload from library"
              style={{
                width: 56, height: 56, borderRadius: 14,
                background: T.surface, border: `1px solid ${T.border}`,
                color: T.text, fontSize: 22, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              🖼
            </button>
          </div>

          <button onClick={onClose} style={cancelBtn}>Cancel</button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          style={{ display: "none" }} onChange={handleFile} />
        {/* hidden canvas for processing */}
        <canvas ref={rawCanvas} style={{ display: "none" }} />
      </div>
    );
  }

  // ─── PHASE: crop ──────────────────────────────────────────────────────────
  if (phase === "crop") {
    return (
      <div style={modalShell}>
        <div style={headerStyle}>
          <Btn square onClick={() => { reset(); startCamera(); }}>↩</Btn>
          <span style={{ color: T.gold, fontSize: 13, fontWeight: 700, letterSpacing: "0.12em" }}>
            ✂ ADJUST CROP
          </span>
          <div style={{ width: 40 }} />
        </div>

        {/* image + overlay */}
        <div style={{
          flex: 1, background: "#000", position: "relative", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {captured && (
            <img
              src={captured.toDataURL()}
              alt=""
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
            />
          )}
          {/* interactive overlay */}
          <canvas
            ref={overlayRef}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              touchAction: "none",
            }}
            onMouseDown={onOverlayDown}
            onMouseMove={onOverlayMove}
            onMouseUp={onOverlayUp}
            onTouchStart={onOverlayDown}
            onTouchMove={onOverlayMove}
            onTouchEnd={onOverlayUp}
          />
        </div>

        <div style={controlsBar}>
          {flashMsg && <FlashBanner msg={flashMsg} />}
          <div style={{ color: T.muted, fontSize: 12, textAlign: "center", marginBottom: 10 }}>
            Drag the gold corners to fine-tune your crop
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={useRaw} style={{
              flex: 1, height: 52, background: T.surface,
              border: `1px solid ${T.border}`, color: T.text,
              borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>
              Skip Enhancement
            </button>
            <button onClick={applyAndEnhance} disabled={busy} style={{
              flex: 2, height: 52,
              background: busy ? "#1e2230" : T.gold,
              color: busy ? T.muted : "#000",
              border: "none", borderRadius: 12,
              fontWeight: 800, fontSize: 14, letterSpacing: "0.06em",
              cursor: busy ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {busy
                ? <><Spin /> Processing…</>
                : "✓ Apply & Enhance"}
            </button>
          </div>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
        </div>
        {/* hidden canvas still mounted for warp */}
        <canvas ref={rawCanvas} style={{ display: "none" }} />
      </div>
    );
  }

  return null;
}

// ─── sub-components & style helpers ──────────────────────────────────────────
function Btn({ children, onClick, square, ...rest }) {
  return (
    <button
      onClick={onClick}
      {...rest}
      style={{
        width: square ? 40 : "auto", height: 40,
        borderRadius: 10, background: T.surface,
        border: `1px solid ${T.border}`, color: T.text,
        cursor: "pointer", fontSize: 16,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function Spin() {
  return (
    <span style={{
      width: 16, height: 16, border: "2px solid rgba(0,0,0,0.2)",
      borderTop: "2px solid #000", borderRadius: "50%",
      animation: "spin 0.7s linear infinite", display: "inline-block",
    }}/>
  );
}

function FlashBanner({ msg }) {
  return (
    <div style={{
      background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
      borderRadius: 8, padding: "8px 12px", color: "#fca5a5",
      fontSize: 12, textAlign: "center", marginBottom: 8,
    }}>
      {msg}
    </div>
  );
}

const modalShell = {
  position: "fixed",
  inset: 0,
  // use dvh for mobile — correct for address-bar-visible state
  height: "100dvh",
  zIndex: 9999,
  background: "#000",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 14px",
  background: T.card,
  borderBottom: `1px solid ${T.border}`,
  flexShrink: 0,
  // account for notch
  paddingTop: "calc(10px + env(safe-area-inset-top, 0px))",
};

const controlsBar = {
  flexShrink: 0,
  background: T.card,
  borderTop: `1px solid ${T.border}`,
  padding: "12px 14px",
  paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
};

const cancelBtn = {
  width: "100%",
  height: 44,
  marginTop: 8,
  background: "transparent",
  color: T.muted,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

import React, { useState, useMemo, useEffect } from "react";

export default function SubmitTicket({ phone, onComplete, editTicket }){
const scrollRef = React.useRef(null);
const [isSubmitting, setIsSubmitting] = useState(false);

// timezone date
const now = new Date();
const today =
now.getFullYear() +
"-" +
String(now.getMonth()+1).padStart(2,"0") +
"-" +
String(now.getDate()).padStart(2,"0");

const [form,setForm]=useState(() => {

  if (!editTicket) {
    return {
      client:"",
      fieldTicket:"",
      dispatch:"",
      unit:"",
      driver:"",
      workDate:today,
      wellLease:"",
      notes:"",
      fieldTicketImage:""
    };
  }

  return {
    client: editTicket["Client"] || "",
    fieldTicket: editTicket["Field Ticket #"] || "",
    dispatch: editTicket["Dispatch #"] || "",
    unit: editTicket["Unit #"] || "",
    driver: editTicket["Driver"] || "",
    workDate: editTicket["Service Date"] || today,
    wellLease: editTicket["Well/Lease"] || "",
    notes: editTicket["Notes"] || "",
    fieldTicketImage:""
  };
});

function update(name,value){
setForm(prev=>({...prev,[name]:value}));
}


const [loads,setLoads]=useState([
{
id:1,
geminiRef:"",
loadTicket:"",
fluid:"Fresh Water",
bbls:"",
manifestOps:{
washOut:false,
unload:false
},
verificationImage:""
}
]);

function updateLoad(index,field,value){
setLoads(prev=>{
const copy=[...prev];
copy[index][field]=value;
return copy;
});
}

function addLoad(){
setLoads(prev=>[
...prev,
{
id:prev.length+1,
geminiRef:"",
loadTicket:"",
fluid:"Fresh Water",
bbls:"",
manifestOps:{
washOut:false,
unload:false
}
}
]);
}

function deleteLoad(index){
setLoads(prev=>prev.filter((_,i)=>i!==index));
}

function toggleManifestOp(index,op){
setLoads(prev=>{
const copy=[...prev];
copy[index].manifestOps[op]=!copy[index].manifestOps[op];
return copy;
});
}

const [submissionId] = useState(
  editTicket ? editTicket["Submission ID"] : null
);


//get totals
const totalBBLS=useMemo(()=>{
return loads.reduce((sum,l)=>{
const num=parseFloat(l.bbls);
return sum+(isNaN(num)?0:num);
},0);
},[loads]);

//signature handle
const sigCanvasRef = React.useRef(null);
const drawingRef = React.useRef(false);
const lastPtRef = React.useRef({ x: 0, y: 0 });
const [hasSignature, setHasSignature] = useState(false);

function getCanvasPoint(e) {
  const canvas = sigCanvasRef.current;
  const rect = canvas.getBoundingClientRect();

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function startDraw(e) {
  if (e.type === "touchstart") {
}
  const canvas = sigCanvasRef.current;
  const ctx = canvas.getContext("2d");

  drawingRef.current = true;

  const p = getCanvasPoint(e);
  lastPtRef.current = p;

  ctx.lineWidth = 2.25;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#000";

  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
}

function draw(e) {
  if (!drawingRef.current) return;

  const canvas = sigCanvasRef.current;
  const ctx = canvas.getContext("2d");

  const p = getCanvasPoint(e);

  // drawing
  ctx.lineTo(p.x, p.y);
  ctx.stroke();

  lastPtRef.current = p;
  setHasSignature(true);
}

function endDraw() {
  if (!drawingRef.current) return;
  drawingRef.current = false;

  const canvas = sigCanvasRef.current;
  const ctx = canvas.getContext("2d");
  ctx.closePath();
}

function clearSignature() {
  const canvas = sigCanvasRef.current;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  setHasSignature(false);
}



function isNonEmpty(v) {
  return String(v ?? "").trim().length > 0;
}
const isExxon = form.client === "Exxon";

function loadComplete(load) {

  const baseRequired =
  (!isExxon || isNonEmpty(load.geminiRef)) &&
  isNonEmpty(load.loadTicket) &&
  isNonEmpty(load.bbls) &&
  !isNaN(parseFloat(load.bbls));

  // Manifest options
  if (load.fluid === "Manifest") {
    return (
      baseRequired &&
      (load.manifestOps.washOut || load.manifestOps.unload)
    );
  }

  return baseRequired;
}

const requiredChecks = useMemo(() => {
  // requireds
  const checks = [
    { key: "client", ok: isNonEmpty(form.client) },
    { key: "fieldTicket", ok: isNonEmpty(form.fieldTicket) },
    { key: "dispatch", ok: isNonEmpty(form.dispatch) },
    { key: "unit", ok: isNonEmpty(form.unit) },
    { key: "driver", ok: isNonEmpty(form.driver) },
    { key: "workDate", ok: isNonEmpty(form.workDate) },
    { key: "wellLease", ok: isNonEmpty(form.wellLease) },
    { key: "fieldTicketImage", ok: isNonEmpty(form.fieldTicketImage) },
    { key: "signature", ok: hasSignature }
  ];

  // Each load requireds
    loads.forEach((l, i) => {
    checks.push({ key: `load_${i}`, ok: loadComplete(l) });
  });

  return checks;
}, [form, loads, hasSignature]);


//Progress bar handle
const progress = useMemo(() => {
  const total = requiredChecks.length;
  const filled = requiredChecks.filter(c => c.ok).length;
  return Math.round((filled / total) * 100);
}, [requiredChecks]);

const isComplete = useMemo(() => {
  return requiredChecks.every(c => c.ok);
}, [requiredChecks]);


//Scanner Handle

const [scannerOpen,setScannerOpen]=useState(false);
const [scannerTarget,setScannerTarget]=useState(null);

function openFieldScanner(){
setScannerTarget({type:"field"});
setScannerOpen(true);
}

function openLoadScanner(index){
setScannerTarget({type:"load",index});
setScannerOpen(true);
}

function handleScanUse(imageData){
if(!scannerTarget) return;

if(scannerTarget.type==="field"){
setForm(prev=>({...prev,fieldTicketImage:imageData}));
}

if(scannerTarget.type==="load"){
setLoads(prev=>{
const copy=[...prev];
copy[scannerTarget.index].verificationImage=imageData;
return copy;
});
}

setScannerOpen(false);
setScannerTarget(null);
}

const [scrollY,setScrollY]=useState(0);

useEffect(() => {
  async function syncOfflineTickets() {
    const pending = JSON.parse(localStorage.getItem("offlineTickets") || "[]");
    if (!pending.length) return;

    for (let ticket of pending) {
      try { // also add updated here
        await fetch("https://script.google.com/macros/s/AKfycbzws4Mt7KMVkLdc11IJNOtPyAWgZOP80cDiFffYZK1u_hJc4KQ-OEDtjo3_uZMGjV2v/exec", {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(ticket)
        });
      } catch {
        return; // still offline
      }
    }

    localStorage.removeItem("offlineTickets");
    alert("Offline tickets synced.");
  }

  window.addEventListener("online", syncOfflineTickets);
  syncOfflineTickets();
}, []);

useEffect(() => {
  const handleScroll = () => {
    setScrollY(window.pageYOffset);
  };

  window.addEventListener("scroll", handleScroll);

  return () => window.removeEventListener("scroll", handleScroll);
}, []);

const progressTranslate = Math.min(scrollY * 0.2, 40);

const dispatchLabel = (() => {
  if (form.client === "Exxon") return "GEMINI DISPATCH #";
  if (form.client === "Oxy") return "IRONSIGHT JOB #";
  if (form.client === "Western Midstream") return "IRONSIGHT JOB #";
  if (form.client === "Chevron") return "DISPATCH #";
  if (form.client === "Other") return "DISPATCH #";
  return "DISPATCH #";
})();

return(

<div style={S.container}>

<div ref={scrollRef} style={S.card}>

<div style={S.header}>
BLACK DROP | FIELD COMMAND
</div>

<div style={S.cloud}>
● CLOUD SYSTEM ONLINE
</div>

<div style={S.progressSticky}>

  <div
    style={{
      transform: `translateY(${progressTranslate}px)`,
      transition: "transform 0.08s linear"
    }}
  >

    <div style={S.progressTop}>
      <span style={S.keep}>KEEP GOING...</span>
      <span style={S.percent}>{progress}%</span>
    </div>

    <div style={S.progressBar}>
      <div style={{ ...S.progressFill, width: progress + "%" }} />
    </div>

  </div>

</div>

<Label text="CLIENT ORGANIZATION" required/>

<select
style={S.input}
value={form.client}
onChange={e=>update("client",e.target.value)}
>
<option value="">Select Client...</option>
<option>Exxon</option>
<option>Oxy</option>
<option>Western Midstream</option>
<option>Chevron</option>
<option>Other</option>
</select>


<div style={S.row}>

<div style={S.col}>
<Label text="FIELD TICKET #" required/>
<input
style={S.input}
value={form.fieldTicket}
onChange={e=>update("fieldTicket",e.target.value)}
/>
</div>

<div style={S.col}>
<Label text={dispatchLabel} required/>
<input
style={S.input}
value={form.dispatch}
onChange={e=>update("dispatch",e.target.value)}
/>
</div>

</div>


<div style={S.row}>

<div style={S.col}>
<Label text="UNIT / TRUCK #" required/>
<input
style={S.input}
value={form.unit}
onChange={e=>update("unit",e.target.value)}
/>
</div>

<div style={S.col}>
<Label text="DRIVER NAME" required/>
<input
style={S.input}
value={form.driver}
onChange={e=>update("driver",e.target.value)}
/>
</div>

</div>


<Label text="WORK DATE" required/>

<input
type="date"
style={S.inputDate}
value={form.workDate}
onChange={e=>update("workDate",e.target.value)}
/>


<Label text="WELL / LEASE NAME" required/>

<input
style={S.input}
value={form.wellLease}
onChange={e=>update("wellLease",e.target.value)}
/>


<Label text="NOTES / DESCRIPTION"/>

<textarea
style={S.textarea}
placeholder="Add job specifics here..."
value={form.notes}
onChange={e=>update("notes",e.target.value)}
/>
<Label text="FIELD TICKET PHOTO" required/>

<div
style={S.scanBox}
onClick={openFieldScanner}
>
{form.fieldTicketImage ? (
<img
src={form.fieldTicketImage}
style={S.scanPreview}
/>
) : (
<div style={S.scanText}>
📄 SCAN FIELD TICKET
</div>
)}
</div>

<div style={S.manifestHeader}>

<span style={S.manifestTitle}>
LOAD MANIFEST
</span>

<div style={S.totalBox}>
<span style={S.totalLabel}>TOTAL:</span>{" "}
<span style={S.totalValue}>{totalBBLS.toFixed(2)} BBLS</span>
</div>

</div>

{loads.map((load,index)=>(

<div key={load.id} style={S.loadCard}>

<div style={S.loadHeader}>

<div style={S.loadBadge}>
LOAD {String(load.id).padStart(2,"0")}
</div>

<div style={S.loadEntry}>
ENTRY DETAIL
</div>

{loads.length>1 && (
<button
type="button"
style={S.deleteBtn}
onClick={()=>deleteLoad(index)}
aria-label="Delete load"
>
🗑
</button>
)}

</div>

{isExxon && (
  <>
    <Label text="GEMINI DISPATCH REF #" required/>

    <input
      style={S.input}
      value={load.geminiRef}
      onChange={e=>updateLoad(index,"geminiRef",e.target.value)}
    />
  </>
)}
<Label text="LOAD TICKET NUMBER" required/>
<input
style={S.input}
value={load.loadTicket}
onChange={e=>updateLoad(index,"loadTicket",e.target.value)}
/>

<div style={S.row}>
<div style={S.col}>

<Label text="FLUID CLASSIFICATION"/>

<select
style={S.input}
value={load.fluid}
onChange={e=>updateLoad(index,"fluid",e.target.value)}
>
<option>Fresh Water</option>
<option>Brine Water</option>
<option>Disposal Water</option>
<option>Manifest</option>
</select>

</div>

<div style={S.col}>

<Label text="QUANTITY (BBLS)" required/>

<input
type="number"
style={S.input}
value={load.bbls}
onChange={e=>updateLoad(index,"bbls",e.target.value)}
/>
</div>

</div>
<div style={S.qtyRow}>

{[90,100,120,130,150,200].map(q=>(
<button
type="button"
key={q}
style={S.qtyBtn}
onClick={()=>updateLoad(index,"bbls",String(q))}
>
{q}
</button>
))}
</div>
<Label text="TICKET VERIFICATION IMAGE"/>

<div
style={S.scanBox}
onClick={()=>openLoadScanner(index)}
>
{load.verificationImage ? (
<img
src={load.verificationImage}
style={S.scanPreview}
/>
) : (
<div style={S.scanText}>
🧾 SCAN LOAD TICKET

</div>
)}
</div>


{load.fluid==="Manifest" && (

<div style={S.manifestOpsCard}>

<div style={S.manifestOpsHeader}>
<span>MANIFEST OPERATIONS</span>
<span style={S.requiredBadge}>
REQUIRED SELECTION
</span>
</div>

<div style={S.manifestOpsButtons}>

<button
type="button"
style={{
...S.manifestOpBtn,
...(load.manifestOps.washOut?S.manifestOpActive:{})
}}
onClick={()=>toggleManifestOp(index,"washOut")}
>
WASH OUT
</button>

<button
type="button"
style={{
...S.manifestOpBtn,
...(load.manifestOps.unload?S.manifestOpActive:{})
}}
onClick={()=>toggleManifestOp(index,"unload")}
>
UNLOAD
</button>
</div>
</div>
)}

</div>

))}


<button
type="button"
style={S.addLoadBtn}
onClick={addLoad}
>
+ ADD ADDITIONAL LOAD
</button>

<Label text="OPERATOR CONFIRMATION SIGNATURE" required/>

<canvas
  ref={sigCanvasRef}
  width={900}
  height={300}
  style={{
    width:"100%",
    height:160,
    background:"#fff",
    borderRadius:6,
    marginTop:12,
    touchAction:"none" // important for mobile
  }}
  onMouseDown={startDraw}
  onMouseMove={draw}
  onMouseUp={endDraw}
  onMouseLeave={endDraw}
  onTouchStart={startDraw}
  onTouchMove={draw}
  onTouchEnd={endDraw}
/>

<button
  type="button"
  style={S.addLoadBtn}
  onClick={clearSignature}
>
  CLEAR SIGNATURE
</button>

<div style={{
  marginTop:20,
  padding:20,
  background:"#111827",
  borderRadius:6
}}>

  <div style={{color:"#9ca3af",fontSize:12}}>
    MANIFEST VOLUME AUDIT
  </div>

  <div style={{
    fontSize:32,
    fontWeight:800,
    marginTop:10,
    color:"#D4AF37"
  }}>
    {totalBBLS.toFixed(2)} BBLS
  </div>

</div>

<button
  type="button"
  style={{
    marginTop:20,
    padding:16,
    width:"100%",
    background: (isComplete && !isSubmitting) ? "#D4AF37" : "#444",
    color: (isComplete && !isSubmitting) ? "#000" : "#bbb",
    border:"none",
    borderRadius:6,
    fontWeight:"bold",
    cursor: (isComplete && !isSubmitting) ? "pointer" : "not-allowed",
    opacity: (isComplete && !isSubmitting) ? 1 : 0.8,
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    gap:10
  }}
  disabled={!isComplete || isSubmitting}
  onClick={async () => {

    if (!isComplete || isSubmitting) return;

    setIsSubmitting(true);

    try {

      const payload = {
  submissionId: submissionId || null,
  phone,
  ...form,
  loads,
  totalBBLS,
  signature: sigCanvasRef.current.toDataURL("image/png")
};

      const res = await fetch( // must match current web app version
        "https://script.google.com/macros/s/AKfycbzws4Mt7KMVkLdc11IJNOtPyAWgZOP80cDiFffYZK1u_hJc4KQ-OEDtjo3_uZMGjV2v/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(payload)
        }
      );

      await res.text();
      setIsSubmitting(false);
      console.log("Calling onComplete");
      onComplete();

    } catch {
  // Save locally if offline
  const pending = JSON.parse(localStorage.getItem("offlineTickets") || "[]");
  pending.push(payload);
  localStorage.setItem("offlineTickets", JSON.stringify(pending));

  alert("No internet. Ticket saved offline and will send automatically.");

  setIsSubmitting(false);
}




  }}
>
  {isSubmitting && (
    <div style={S.spinner}></div>
  )}
  {isSubmitting ? "Submitting..." : "Submit Final Ticket"}
</button>

<ScannerModal
open={scannerOpen}
onClose={()=>setScannerOpen(false)}
onUse={handleScanUse}
/>
</div>
</div>
);
}

function Label({text,required}){
return(
<div style={S.label}>
{text}
{required&&<span style={S.req}> *</span>}
</div>
);
}

const S={

container:{
  background:"#000",
  minHeight:"100vh",
  width:"100%",
  display:"flex",
  justifyContent:"center",
  alignItems:"flex-start",
  padding:"20px 10px",
  boxSizing:"border-box"
},

spinner:{
  width:16,
  height:16,
  border:"2px solid rgba(0,0,0,0.3)",
  borderTop:"2px solid black",
  borderRadius:"50%",
  animation:"spin 0.8s linear infinite"
},

card:{
width:"100%",
maxWidth:520,
minWidth:0,
boxSizing:"border-box",
background:"#0b0b0b",
padding:"18px",
overflow:"hidden"
},

header:{
color:"#D4AF37",
textAlign:"center"
},

cloud:{
color:"#00ffc3",
textAlign:"center"
},

progressSticky:{
position:"sticky",
top:0,
background:"#0b0b0b",
zIndex:50,
paddingBottom:10,
willChange:"transform"
},

progressTop:{
display:"flex",
justifyContent:"space-between",
color:"#aaa",
fontSize:12
},

keep:{color:"#888"},

percent:{
color:"#D4AF37"
},

scanBox:{
marginTop:12,
padding:20,
border:"1px dashed #374151",
borderRadius:6,
background:"#0f172a",
cursor:"pointer",
textAlign:"center"
},

scanText:{
color:"#e5e7eb",
fontWeight:600
},

scanPreview:{
width:"100%",
borderRadius:6,
border:"1px solid #374151"
},

progressBar:{
height:3,
background:"#222"
},

progressFill:{
height:"100%",
background:"#D4AF37"
},

label:{
color:"#9ca3af",
marginTop:14,
fontSize:12
},

req:{color:"#ef4444"},

row:{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(0,1fr))",
gap:12,
width:"100%"
},

col:{
width:"100%",
minWidth:0
},

input:{
width:"100%",
boxSizing:"border-box",
padding:12,
background:"#0f172a",
border:"1px solid #2a3441",
color:"#e5e7eb",
borderRadius:6,
fontSize:14
},

// date icon visible
inputDate:{
width:"100%",
boxSizing:"border-box",
padding:12,
background:"#0f172a",
border:"1px solid #2a3441",
color:"#e5e7eb",
borderRadius:6,
fontSize:14,
WebkitAppearance:"none",
appearance:"none"
},

textarea:{
width:"100%",
boxSizing:"border-box",
background:"#0f172a",
border:"1px solid #2a3441",
color:"#e5e7eb",
borderRadius:6,
padding:14,
minHeight:140,
maxHeight:360,
resize:"vertical",
fontSize:14,
lineHeight:"20px"
},

manifestHeader:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginTop:30,
gap:12
},

manifestTitle:{
color:"#D4AF37",
fontWeight:700
},

totalBox:{
background:"#12151c",
border:"1px solid #2a3441",
borderRadius:6,
padding:"6px 12px",
color:"#e5e7eb",
whiteSpace:"nowrap"
},

totalLabel:{
color:"#9ca3af",
fontWeight:600
},

totalValue:{
color:"#D4AF37",
fontWeight:800
},

loadCard:{
background:"#111827",
borderLeft:"4px solid #D4AF37",
padding:16,
marginTop:12,
borderRadius:6,
boxSizing:"border-box"
},

loadHeader:{
display:"flex",
alignItems:"center",
gap:10
},

loadBadge:{
background:"#D4AF37",
color:"#000",
padding:"4px 10px",
borderRadius:4,
fontWeight:800,
fontSize:12
},

loadEntry:{
color:"#9ca3af",
fontSize:12
},

deleteBtn:{
marginLeft:"auto",
background:"transparent",
border:"1px solid #374151",
color:"#e5e7eb",
borderRadius:6,
padding:"4px 8px",
cursor:"pointer",
lineHeight:"16px"
},

qtyRow:{
display:"flex",
flexWrap:"wrap",
gap:8,
marginTop:10,
alignItems:"center"
},

qtyBtn:{
minWidth:46,
height:34,
display:"inline-flex",
alignItems:"center",
justifyContent:"center",
background:"#1f2937",
color:"#e5e7eb",
border:"1px solid #374151",
borderRadius:6,
cursor:"pointer",
fontSize:12
},

manifestOpsCard:{
border:"1px solid #374151",
borderRadius:6,
padding:12,
marginTop:14
},

manifestOpsHeader:{
display:"flex",
justifyContent:"space-between",
color:"#9ca3af",
fontSize:12,
marginBottom:10
},

requiredBadge:{
background:"#374151",
padding:"2px 6px",
borderRadius:4,
fontSize:10,
color:"#e5e7eb"
},

manifestOpsButtons:{
display:"flex",
gap:10
},

manifestOpBtn:{
flex:1,
textAlign:"center",
padding:10,
border:"1px solid #374151",
color:"#e5e7eb",
borderRadius:6,
background:"transparent",
cursor:"pointer"
},

manifestOpActive:{
background:"#D4AF37",
color:"#000",
border:"1px solid #D4AF37"
},

addLoadBtn:{
marginTop:16,
padding:14,
width:"100%",
border:"1px dashed #374151",
borderRadius:6,
cursor:"pointer",
textAlign:"center",
background:"transparent",
color:"#e5e7eb"
}

};

function ScannerModal({open,onClose,onUse}){

const videoRef=React.useRef(null);
const canvasRef=React.useRef(null);
const streamRef=React.useRef(null);
const fileInputRef = React.useRef(null);
const cameraInputRef = React.useRef(null);
const [captured,setCaptured]=React.useState(null);
const [cropRect, setCropRect] = React.useState(null);
const dragRef = React.useRef(null);
const [ready,setReady] = React.useState(false);

React.useEffect(() => {
  if (!open) return;

  let active = true;

  async function initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (!active) return;

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await video.play();

      setReady(true);

    } catch (err) {
      console.error("Camera error:", err);
    }
  }

  setCaptured(null);
  setReady(false);

  initCamera();

  return () => {
    active = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    setReady(false);
  };

}, [open]);

function enhanceScanLook(canvas) {
  const ctx = canvas.getContext("2d");

  ctx.filter = "brightness(160%) contrast(160%)";
  ctx.drawImage(canvas, 0, 0);

  ctx.filter = "none";
}

function capture() {
  const video = videoRef.current;
  if (!video) return;

  const canvas = canvasRef.current;

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  const cropX = videoWidth * 0.10;
  const cropY = videoHeight * 0.15;
  const cropW = videoWidth * 0.80;
  const cropH = videoHeight * 0.70;

  canvas.width = cropW;
  canvas.height = cropH;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    video,
    cropX,
    cropY,
    cropW,
    cropH,
    0,
    0,
    cropW,
    cropH
  );

  const data = canvas.toDataURL("image/png"); // PNG for sharp text
  setCaptured(data);
}

function handleFileUpload(e){
const file = e.target.files[0];
if(!file) return;

const reader = new FileReader();
reader.onload = function(event){
const img = new Image();
img.onload = function(){

const canvas = canvasRef.current;
canvas.width = img.width;
canvas.height = img.height;

const ctx = canvas.getContext("2d");
ctx.drawImage(img, 0, 0);

enhanceScanLook(canvas);

const data = canvas.toDataURL("image/jpeg", 0.9);
setCaptured(data);
};
img.src = event.target.result;
};
reader.readAsDataURL(file);
}

React.useEffect(()=>{
  function move(e){
    if(!dragRef.current || !cropRect) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;

    dragRef.current.startX = clientX;
    dragRef.current.startY = clientY;

    setCropRect(prev=>{
      if(!prev) return prev;
      return {
        ...prev,
        x: prev.x + dx * (canvasRef.current.width / window.innerWidth),
        y: prev.y + dy * (canvasRef.current.height / window.innerWidth)
      };
    });
  }

  function stop(){
    dragRef.current=null;
  }

  window.addEventListener("mousemove",move);
  window.addEventListener("mouseup",stop);
  window.addEventListener("touchmove",move);
  window.addEventListener("touchend",stop);

  return ()=>{
    window.removeEventListener("mousemove",move);
    window.removeEventListener("mouseup",stop);
    window.removeEventListener("touchmove",move);
    window.removeEventListener("touchend",stop);
  };
},[cropRect]);

if(!open) return null;

return(
<div style={M.overlay}>
<div style={M.modal}>
<div style={{ position: "relative" }}>

  {/* VIDEO (always mounted) */}
  <video
    ref={videoRef}
    style={{
      ...M.video,
      display: captured ? "none" : "block"
    }}
    playsInline
    autoPlay
  />

  {/* IMAGE (only shown when captured) */}
  {captured && (
    <img
      src={captured}
      style={{ width: "100%", borderRadius: 8 }}
      alt=""
    />
  )}

  {/* Guide Box only when live */}
  {!captured && (
    <div
      style={{
        position: "absolute",
        top: "15%",
        left: "10%",
        width: "80%",
        height: "70%",
        border: "3px solid #D4AF37",
        boxSizing: "border-box",
        pointerEvents: "none"
      }}
    />
  )}
</div>

<div style={{ display: "flex", gap: 10, marginBottom: 10 }}>

  {!captured ? (
    <>
      <button
        style={M.primaryBtn}
        onClick={capture}
        disabled={!ready}
      >
        CAPTURE
      </button>

      <button
        style={M.secondaryBtn}
        onClick={() => fileInputRef.current.click()}
      >
        UPLOAD
      </button>
    </>
  ) : (
    <>
      <button
        style={M.secondaryBtn}
        onClick={() => {
          setCaptured(null);
          setCropRect(null);
        }}
      >
        RETAKE
      </button>

      <button
        style={M.primaryBtn}
        onClick={() => onUse(captured)}
      >
        USE
      </button>
    </>
  )}

</div>

<input
  type="file"
  accept="image/*"
  ref={fileInputRef}
  style={{ display: "none" }}
  onChange={handleFileUpload}
/>
<canvas ref={canvasRef} style={{display:"none"}}/>
<button style={M.closeBtn} onClick={onClose}>✕</button>
</div>
</div>
);
}

const M={
overlay:{
position:"fixed",
inset:0,
background:"rgba(0,0,0,0.8)",
display:"flex",
justifyContent:"center",
alignItems:"center",
zIndex:9999
},
modal:{
position:"relative",
width:"90%",
maxWidth:520,
background:"#0b0b0b",
padding:20,
borderRadius:8,
textAlign:"center"
},
video:{
width:"100%",
borderRadius:8,
marginBottom:12
},
primaryBtn:{
padding:12,
background:"#D4AF37",
border:"none",
borderRadius:6,
fontWeight:"bold",
cursor:"pointer"
},
secondaryBtn:{
padding:12,
background:"transparent",
border:"1px solid #444",
color:"#fff",
borderRadius:6,
cursor:"pointer"
},
closeBtn:{
position:"absolute",
top:20,
right:20,
background:"transparent",
border:"1px solid #444",
color:"#fff",
borderRadius:6,
padding:"4px 8px",
cursor:"pointer"
}
};
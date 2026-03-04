import React, { useEffect, useState } from "react";

export default function Queue({ phone, onEdit, onBack }) {

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTickets() {
      const res = await fetch(
        `https://script.google.com/macros/library/d/1XRu2LBgji8EtH_O6P0YxvXLJPGurGEJZ_ZwmD0J5Dhja9hzMO7rpj0I1/12/exec?mode=queue&phone=${phone}`
      ); // fetch also must match web app url
      const data = await res.json();
      setTickets(data.reverse());
      setLoading(false);
    }
    fetchTickets();
  }, [phone]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ color:"#888" }}>LOADING QUEUE...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      <div style={styles.card}>

        <div style={styles.header}>
          BLACK DROP
        </div>

        <div style={styles.subheader}>
          SUBMISSION QUEUE
        </div>

        <button style={styles.backBtn} onClick={onBack}>
          ← BACK
        </button>

        {tickets.length === 0 && (
          <div style={styles.empty}>
            NO SUBMISSIONS FOUND
          </div>
        )}

        {tickets.map((ticket) => {

          const status = ticket["Status"];

          return (
            <div key={ticket["Submission ID"]} style={styles.ticketCard}>

              <div style={styles.row}>
                <span style={styles.label}>ID</span>
                <span>{ticket["Submission ID"]}</span>
              </div>

              <div style={styles.row}>
                <span style={styles.label}>CREATED</span>
                <span>{new Date(ticket["Timestamp"]).toLocaleString()}</span>
              </div>

              <div style={styles.row}>
                <span style={styles.label}>STATUS</span>
                <span style={{
                  ...styles.status,
                  color:
                    status === "BOUNCE BACK"
                      ? "#ef4444"
                      : status === "PENDING"
                      ? "#f59e0b"
                      : "#22c55e"
                }}>
                  {status}
                </span>
              </div>

              {status === "BOUNCE BACK" && (
                <button
                  style={styles.editBtn}
                  onClick={() => onEdit(ticket)}
                >
                  EDIT & RESUBMIT
                </button>
              )}

            </div>
          );
        })}

      </div>

    </div>
  );
}

const styles = {

  container:{
    background:"#000",
    minHeight:"100vh",
    display:"flex",
    justifyContent:"center",
    padding:"20px",
    boxSizing:"border-box"
  },

  card:{
    width:"100%",
    maxWidth:520,
    background:"#0b0b0b",
    padding:20,
    borderLeft:"4px solid #D4AF37",
    borderRadius:8
  },

  header:{
    color:"#D4AF37",
    fontSize:12,
    fontWeight:900,
    letterSpacing:3,
    textAlign:"center"
  },

  subheader:{
    color:"#D4AF37",
    fontSize:20,
    fontWeight:900,
    textAlign:"center",
    marginBottom:20
  },

  backBtn:{
    background:"transparent",
    border:"1px solid #333",
    color:"#fff",
    padding:10,
    borderRadius:6,
    cursor:"pointer",
    marginBottom:20
  },

  empty:{
    color:"#666",
    textAlign:"center",
    marginTop:20
  },

  ticketCard:{
    background:"#111827",
    padding:16,
    borderRadius:8,
    marginBottom:14,
    borderLeft:"4px solid #D4AF37"
  },

  row:{
    display:"flex",
    justifyContent:"space-between",
    marginBottom:6,
    color:"#e5e7eb",
    fontSize:14
  },

  label:{
    color:"#9ca3af",
    fontWeight:600
  },

  status:{
    fontWeight:800
  },

  editBtn:{
    marginTop:12,
    width:"100%",
    padding:12,
    background:"#D4AF37",
    color:"#000",
    border:"none",
    borderRadius:6,
    fontWeight:900,
    cursor:"pointer"
  }

};

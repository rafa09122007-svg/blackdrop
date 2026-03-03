import React, { useState } from "react";

// WEB APP URL
const API_URL = "https://script.google.com/macros/s/AKfycbzchLFGDTi7UpT0nHCaOCxIsTcutEYKt0IVTYisHuS6khmQ13dpY_3a9CnlJdut-H9M6g/exec";
export default function Login({ onLogin }) {

  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handlePhoneChange(e) {
    const numbersOnly = e.target.value.replace(/\D/g, "");
    setPhone(numbersOnly);
  }

async function handleLogin() {

  if (!phone || phone.length < 7) {
    alert("Enter valid phone number");
    return;
  }

  if (isLoading) return;

  setIsLoading(true);

  try {

    const response = await fetch(API_URL + "?t=" + Date.now());

    if (!response.ok) {
      alert("Server error");
      setIsLoading(false);
      return;
    }

    const allowedPhones = await response.json();

    const phoneString = String(phone).trim();
    const match = allowedPhones.some(p => String(p).trim() === phoneString);

    if (match) {

      onLogin(phoneString);

    } else {

      alert("This phone number is not authorized.");
      setIsLoading(false);

    }

  } catch (err) {

    console.error(err);
    alert("Connection failed.");
    setIsLoading(false);

  }
}

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <div style={styles.header}>
          BLACK DROP
        </div>

        <div style={styles.subheader}>
          FIELD COMMAND
        </div>

        <div style={styles.label}>
          PHONE NUMBER
        </div>

        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          style={styles.input}
          placeholder="Enter phone number"
          value={phone}
          onChange={handlePhoneChange}
          maxLength={15}
        />

        <button
  style={{
    ...styles.button,
    opacity: isLoading ? 0.8 : 1,
    cursor: isLoading ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  }}
  onClick={handleLogin}
  disabled={isLoading}
>
  {isLoading && <div style={styles.spinner}></div>}
  {isLoading ? "LOGGING IN..." : "LOGIN"}
</button>

        <div style={styles.footer}>
          Secure Access Required
        </div>

      </div>
    </div>
  );
}


const styles = {

  container: {
    background: "#0a0a0a",
    minHeight: "100vh",
    width: "100%",
    padding: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: "380px",
    background: "#141414",
    padding: "20px",
    borderRadius: "12px",
    borderLeft: "4px solid #D4AF37",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    boxSizing: "border-box",
  },

  header: {
    color: "#D4AF37",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "3px",
    textAlign: "center",
    marginBottom: "4px",
  },

  subheader: {
    color: "#D4AF37",
    fontSize: "20px",
    fontWeight: "900",
    letterSpacing: "2px",
    textAlign: "center",
    marginBottom: "20px",
  },

  label: {
    color: "#888",
    fontSize: "11px",
    letterSpacing: "2px",
    marginBottom: "8px",
  },

  input: {
    width: "100%",
    background: "#1f1f1f",
    border: "1px solid #333",
    color: "white",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "16px",
    marginBottom: "14px",
    outline: "none",
    boxSizing: "border-box",
  },

  button: {
    width: "100%",
    background: "#D4AF37",
    color: "black",
    border: "none",
    padding: "12px",
    fontWeight: "900",
    letterSpacing: "2px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    boxSizing: "border-box",
  },

  footer: {
    color: "#666",
    fontSize: "11px",
    textAlign: "center",
    marginTop: "14px",
  },

  spinner: {
  width: 14,
  height: 14,
  border: "2px solid rgba(0,0,0,0.3)",
  borderTop: "2px solid black",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite"
},

};

import React, { useState, useCallback } from "react";
import { API_URL, T, injectGlobalStyles } from "./shared";
import { Logo, Label, Input, GoldBtn, ErrorMsg, PageShell } from "./shared";

export default function Login({ onLogin }) {
  injectGlobalStyles();

  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleChange = useCallback(e => {
    setPhone(e.target.value.replace(/\D/g, ""));
    setError("");
  }, []);

  const handleLogin = useCallback(async () => {
    if (loading) return;
    if (!phone || phone.length < 7) {
      setError("Enter a valid phone number.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}?t=${Date.now()}`);
      if (!res.ok) throw new Error("server");
      const list = await res.json();
      const ok = list.some(p => String(p).trim() === phone.trim());
      if (ok) {
        onLogin(phone.trim());
      } else {
        setError("This number is not authorized.");
        setLoading(false);
      }
    } catch {
      setError("Connection failed — check your signal and try again.");
      setLoading(false);
    }
  }, [phone, loading, onLogin]);

  return (
    <div style={{
      background: T.bg, minHeight: "100vh", display: "flex",
      justifyContent: "center", alignItems: "center", padding: 16,
    }}>
      <div className="pop" style={{
        width: "100%", maxWidth: 360, background: T.card,
        borderRadius: 16, border: `1px solid ${T.border}`,
        borderLeft: `3px solid ${T.gold}`, padding: "32px 24px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.65)",
      }}>
        <Logo />

        <Label text="Phone Number" required />
        <Input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="e.g. 4325551234"
          value={phone}
          maxLength={15}
          onChange={handleChange}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          aria-label="Phone number"
        />

        <ErrorMsg msg={error} />

        <GoldBtn style={{ marginTop: 20 }} loading={loading} onClick={handleLogin}>
          {loading ? "VERIFYING..." : "ENTER FIELD COMMAND"}
        </GoldBtn>

        <div style={{ color: T.muted, fontSize: 11, textAlign: "center", marginTop: 16 }}>
          🔒 Authorized personnel only
        </div>
      </div>
    </div>
  );
}

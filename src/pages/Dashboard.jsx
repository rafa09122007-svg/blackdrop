import React, { useCallback } from "react";
import { T, injectGlobalStyles } from "./shared";
import { Logo, GoldBtn, GhostBtn } from "./shared";

export default function Dashboard({ phone, onLogout, onStartTicket, onOpenQueue }) {
  injectGlobalStyles();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" :
               "Good evening";

  return (
    <div style={{
      background: T.bg, minHeight: "100vh", display: "flex",
      justifyContent: "center", alignItems: "center", padding: 16,
    }}>
      <div className="pop" style={{
        width: "100%", maxWidth: 380, background: T.card,
        borderRadius: 16, border: `1px solid ${T.border}`,
        borderLeft: `3px solid ${T.gold}`, padding: "32px 24px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.65)",
      }}>
        <Logo />

        {/* User badge */}
        <div style={{
          background: T.surface, borderRadius: 10, padding: "12px 16px",
          marginBottom: 24, border: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(212,175,55,0.1)", border: `1px solid ${T.goldDim}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>
            👷
          </div>
          <div>
            <div style={{ color: T.muted, fontSize: 10, letterSpacing: "0.1em" }}>
              {greeting}
            </div>
            <div style={{ color: T.text, fontWeight: 600, fontSize: 14 }}>{phone}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <GoldBtn onClick={onStartTicket}>📋 SUBMIT NEW TICKET</GoldBtn>
          <GhostBtn onClick={onOpenQueue}>📥 SUBMISSION QUEUE</GhostBtn>
          <GhostBtn onClick={onLogout} danger>← LOG OUT</GhostBtn>
        </div>

        <div style={{
          marginTop: 24, paddingTop: 16, borderTop: `1px solid ${T.border}`,
          color: T.muted, fontSize: 10, textAlign: "center", letterSpacing: "0.1em",
        }}>
          BLACK DROP TRUCKING LLC · FIELD SYSTEM
        </div>
      </div>
    </div>
  );
}

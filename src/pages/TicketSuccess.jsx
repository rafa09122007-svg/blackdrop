import React from "react";
import { T, injectGlobalStyles } from "./shared";
import { GoldBtn } from "./shared";

export default function TicketSuccess({ onBack }) {
  injectGlobalStyles();

  return (
    <div style={{
      position: "fixed", inset: 0, background: T.bg,
      display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999,
    }}>
      <div className="pop" style={{
        background: T.card, padding: "48px 36px", borderRadius: 16,
        textAlign: "center", border: `1px solid ${T.border}`,
        borderLeft: `3px solid ${T.gold}`, maxWidth: 360, width: "90%",
        boxShadow: "0 24px 80px rgba(0,0,0,0.65)",
      }}>
        {/* Animated checkmark ring */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", fontSize: 32, color: T.success,
        }}>
          ✓
        </div>

        <div style={{
          color: T.gold, fontSize: 22, fontWeight: 800,
          letterSpacing: "0.12em", marginBottom: 10,
        }}>
          TICKET SUBMITTED
        </div>

        <div style={{
          color: T.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 32,
        }}>
          Your field ticket has been received and is now pending review.
        </div>

        <GoldBtn onClick={onBack}>← BACK TO DASHBOARD</GoldBtn>
      </div>
    </div>
  );
}

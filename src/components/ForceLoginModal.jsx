// src/components/ForceLoginModal.jsx
import React from "react";
import "./forceLoginModal.css"; // small css included below

export default function ForceLoginModal({ open, children }) {
  if (!open) return null;

  // Render a modal that cannot be closed (no X, backdrop click ignored)
  return (
    <div className="flm-backdrop" role="dialog" aria-modal="true">
      <div className="flm-card">
        {children}
      </div>
    </div>
  );
}

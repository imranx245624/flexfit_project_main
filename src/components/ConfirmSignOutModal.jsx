import React, { useEffect } from "react";
import "./confirmSignOutModal.css";

export default function ConfirmSignOutModal({ open = false, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (typeof onCancel === "function") onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const handleBackdrop = (e) => {
    if (e.target !== e.currentTarget) return;
    if (typeof onCancel === "function") onCancel();
  };

  return (
    <div className="confirm-backdrop" role="dialog" aria-modal="true" onClick={handleBackdrop}>
      <div className="confirm-panel">
        <div className="confirm-icon">!</div>
        <div className="confirm-title">Warning</div>
        <div className="confirm-text">Do you really want to log out?</div>
        <div className="confirm-actions">
          <button className="confirm-btn ghost" type="button" onClick={onCancel}>Cancel</button>
          <button className="confirm-btn danger" type="button" onClick={onConfirm}>Log out</button>
        </div>
      </div>
    </div>
  );
}

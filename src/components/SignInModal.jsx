import React from "react";
import SignIn from "../workout-pages/SignIn.jsx";
import "./SignInModal.css";

export default function SignInModal({ open = true, nonDismissible = false, onClose, onSignedIn }) {
  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target !== e.currentTarget) return;
    if (nonDismissible) return;
    if (typeof onClose === "function") onClose();
  };

  const handleSignedIn = onSignedIn || onClose || (() => {});

  return (
    <div
      className={`signin-backdrop ${nonDismissible ? "locked" : ""}`}
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="signin-panel">
        <SignIn
          setShowSignIn={nonDismissible ? undefined : onClose}
          forceMode={nonDismissible}
          onSignedIn={handleSignedIn}
        />
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";

const MAX_TOASTS = 4;

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(1);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handler = (event) => {
      const detail = event?.detail || {};
      const message = String(detail.message || "").trim();
      if (!message) return;
      const toast = {
        id: idRef.current++,
        message,
        type: detail.type || "info",
        duration: Number.isFinite(detail.duration) ? detail.duration : 3200,
      };
      setToasts((prev) => {
        const next = prev.concat(toast);
        return next.slice(-MAX_TOASTS);
      });
      if (toast.duration > 0) {
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, toast.duration);
      }
    };
    window.addEventListener("ff-toast", handler);
    return () => window.removeEventListener("ff-toast", handler);
  }, []);

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (!toasts.length) return null;

  return (
    <div className="ff-toast-host" role="status" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`ff-toast ff-toast--${toast.type}`}>
          <span className="ff-toast-text">{toast.message}</span>
          <button
            className="ff-toast-close"
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            title="Dismiss"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}

const DEFAULT_DURATION_MS = 3200;

export function toast(message, options = {}) {
  if (typeof window === "undefined") return;
  const detail = {
    message: String(message ?? ""),
    type: options.type || "info",
    duration: Number.isFinite(options.duration) ? options.duration : DEFAULT_DURATION_MS,
  };
  try {
    window.dispatchEvent(new CustomEvent("ff-toast", { detail }));
  } catch (e) {}
}

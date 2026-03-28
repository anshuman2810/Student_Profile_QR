import { useEffect } from "react";

const palettes = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-cyan-200 bg-cyan-50 text-cyan-700",
};

export default function StatusToast({ message, type = "info", onClose }) {
  useEffect(() => {
    if (!message) return undefined;

    const timer = window.setTimeout(() => {
      onClose?.();
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50">
      <div
        className={`min-w-[240px] rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${palettes[type] || palettes.info}`}
      >
        {message}
      </div>
    </div>
  );
}

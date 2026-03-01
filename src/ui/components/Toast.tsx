import { useEffect } from "react";

type ToastType = "success" | "error";

type ToastProps = {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
};

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgClass = type === "success" ? "bg-emerald-600" : "bg-red-600";
  const icon = type === "success" ? "✓" : "✕";

  return (
    <div
      role="alert"
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg ${bgClass} px-4 py-3 text-sm font-medium text-white shadow-lg animate-fade-in`}
    >
      <span className="text-base" aria-hidden>
        {icon}
      </span>
      <span>{message}</span>
    </div>
  );
}

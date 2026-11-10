import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(() => {});

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, tone = "success") => {
    const id = crypto.randomUUID();
    setToasts((list) => [...list, { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), 3800);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto max-w-md rounded-full px-5 py-2.5 text-sm shadow-[0_8px_30px_-12px_rgba(35,26,61,0.45)] ${
              item.tone === "error" ? "bg-alert text-white" : "bg-ink text-on-ink"
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Tailwind classes for the modal panel (width, max-width, etc.) */
  panelClassName?: string;
}

const Modal = ({ isOpen, onClose, title, children, panelClassName }: ModalProps) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const EXIT_MS = 180;

  // ESC key close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // next frame so transitions apply
      requestAnimationFrame(() => setIsVisible(true));
      return;
    }

    // exit animation, then unmount
    setIsVisible(false);
    const t = window.setTimeout(() => setShouldRender(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  if (!shouldRender) return null;

  /** Portal avoids `position: fixed` being clipped by transformed ancestors (e.g. sidebar). */
  return createPortal(
    <div
      className={`fixed inset-0 z-200 flex items-center justify-center p-4 transition-opacity duration-${EXIT_MS} ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-${EXIT_MS} ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative z-10 mx-auto w-full max-w-md max-h-[min(90dvh,720px)] overflow-y-auto rounded-2xl bg-white/80 shadow-xl transition-all duration-${EXIT_MS} ${
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"
        } ${panelClassName ?? ""}`}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 id="modal-title" className="font-semibold text-gray-800">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;

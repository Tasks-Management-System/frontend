import { useEffect } from "react";
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

  // ESC key close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>

      {/* Overlay */}
      <div
  className="absolute inset-0 bg-black/20 backdrop-blur-xs transition-transform duration-300"
  onClick={onClose}
/>
      {/* Modal */}
      <div
        className={`relative bg-white w-full max-w-md rounded-2xl shadow-xl
        transform transition-all duration-300 scale-100 opacity-100 ${panelClassName ?? ""}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500 hover:text-black" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
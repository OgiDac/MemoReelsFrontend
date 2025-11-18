import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageViewer({ items, index, onClose, onPrev, onNext }) {
  const escClose = (e) => e.key === "Escape" && onClose();
  const arrowNav = (e) => {
    if (e.key === "ArrowLeft") onPrev();
    if (e.key === "ArrowRight") onNext();
  };

  useEffect(() => {
    document.addEventListener("keydown", escClose);
    document.addEventListener("keydown", arrowNav);
    return () => {
      document.removeEventListener("keydown", escClose);
      document.removeEventListener("keydown", arrowNav);
    };
  }, [onPrev, onNext, onClose]);

  const p = items[index];
  if (!p) return null;

  const isHeic = (u) => u?.toLowerCase().includes(".heic");

  return (
    <div className="fixed inset-0 z-[100]">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* content */}
      <div className="absolute inset-0 flex flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-sm text-gray-200">
            {p.width && p.height ? `${p.width}×${p.height}` : ""}{" "}
            {p.sizeMB ? `• ${p.sizeMB.toFixed(2)} MB` : ""}
          </div>
          <button
            className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow transition"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* image area */}
        <div className="flex-1 flex items-center justify-center px-2 pb-6 select-none">
          {isHeic(p.webUrl) ? (
            <div className="text-center text-gray-200">
              <div className="text-base mb-2">HEIC preview not supported.</div>
            </div>
          ) : (
            <img
              src={p.webUrl}
              alt=""
              className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
              draggable={false}
            />
          )}
        </div>

        {/* nav buttons */}
        {items.length > 1 && (
          <>
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition"
              onClick={onPrev}
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition"
              onClick={onNext}
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

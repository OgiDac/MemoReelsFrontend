import { useEffect } from "react";

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
          <div className="flex items-center gap-2">
            <a
              href={p.originalUrl}
              download
              className="px-3 py-1.5 text-sm rounded-lg bg-white/90 hover:bg-white text-gray-800"
            >
              Download
            </a>
            <button
              className="px-3 py-1.5 text-sm rounded-lg bg-white/90 hover:bg-white text-gray-800"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        {/* image area */}
        <div className="flex-1 flex items-center justify-center px-2 pb-6 select-none">
          {isHeic(p.originalUrl) ? (
            <div className="text-center text-gray-200">
              <div className="text-base mb-2">HEIC preview not supported.</div>
              <a
                href={p.originalUrl}
                download
                className="underline text-white"
              >
                Download original
              </a>
            </div>
          ) : (
            <img
              src={p.originalUrl}
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
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center"
              onClick={onPrev}
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center"
              onClick={onNext}
              aria-label="Next"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}

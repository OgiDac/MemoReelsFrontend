import { Fragment } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";

const APP_BASE = import.meta.env.VITE_APP_PUBLIC_BASE ?? "https://app.yourdomain.com";

export default function EventQrModal({ open, onClose, id, code }) {
  if (!open || !code) return null;
  const url = `${APP_BASE}/e/${code}`;

  const downloadPng = () => {
    const canvas = document.getElementById("event-qr-canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `event-${code}.png`;
    a.click();
  };

  const downloadSvg = () => {
    const svg = document.getElementById("event-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const urlBlob = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = urlBlob;
    a.download = `event-${code}.svg`;
    a.click();
    URL.revokeObjectURL(urlBlob);
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="bg-white rounded-xl border border-gray-200 w-full max-w-md overflow-hidden shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <DialogTitle className="text-orange-600 font-semibold text-lg">Event QR Code</DialogTitle>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col items-center gap-4">
                <div className="p-4 rounded-2xl bg-white shadow-lg">
                  {/* Show SVG (crisper); keep hidden canvas for PNG export */}
                  <QRCodeSVG id="event-qr-svg" value={url} size={256} />
                  <QRCodeCanvas id="event-qr-canvas" value={url} size={256} className="hidden" />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={downloadPng}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 
                               text-white font-semibold shadow transition 
                               hover:from-orange-500 hover:to-orange-600 hover:shadow-lg"
                  >
                    Download PNG
                  </button>
                  <button
                    type="button"
                    onClick={downloadSvg}
                    className="px-5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold shadow-sm transition hover:bg-gray-50"
                  >
                    Download SVG
                  </button>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

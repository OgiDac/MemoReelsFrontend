// src/components/ConfirmDialog.jsx
import { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default", // "default" | "danger"
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const isDanger = variant === "danger";

  const confirmClasses = isDanger
    ? "inline-flex justify-center px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium shadow hover:bg-red-700 transition"
    : "inline-flex justify-center px-4 py-2 rounded-md bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium shadow hover:from-orange-600 hover:to-amber-600 transition";

  const cancelClasses =
    "inline-flex justify-center px-4 py-2 rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition";

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={onCancel}
      >
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
            <DialogPanel className="bg-white rounded-xl border border-gray-200 w-full max-w-sm overflow-hidden shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <DialogTitle className="text-orange-600 font-semibold text-lg">
                  {title}
                </DialogTitle>
                <button
                  onClick={onCancel}
                  className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              {message && (
                <div className="px-6 py-4 text-sm text-gray-600 leading-relaxed">
                  {message}
                </div>
              )}

              {/* Footer */}
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/70 flex justify-end gap-2">
                <button
                  type="button"
                  className={cancelClasses}
                  onClick={onCancel}
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  className={confirmClasses}
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

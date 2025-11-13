import { Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import {
  closeCreateAlbum,
  updateCreateAlbumForm,
  resetCreateAlbumForm,
} from "../store/slices/albumsSlice";
import { createAlbum, fetchAlbums } from "../store/slices/albumsSlice";

export default function CreateAlbumModal({ eventId, open }) {
  const dispatch = useDispatch();
  const { createForm, creating } = useSelector((s) => s.albums);

  const onClose = () => {
    dispatch(resetCreateAlbumForm());
    dispatch(closeCreateAlbum());
  };

  const submit = async (e) => {
    e.preventDefault();
    const res = await dispatch(createAlbum({
      eventId,
      name: createForm.name.trim(),
      description: createForm.description?.trim() || "",
    }));
    if (createAlbum.fulfilled.match(res)) {
      await dispatch(fetchAlbums(eventId));
      onClose();
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <DialogPanel className="bg-white rounded-xl border border-gray-200 w-full max-w-md overflow-hidden shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <DialogTitle className="text-orange-600 font-semibold text-lg">Create New Album</DialogTitle>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition cursor-pointer" aria-label="Close">✕</button>
              </div>

              {/* Body */}
              <form onSubmit={submit} className="p-6 space-y-4">
                <div className="flex flex-col text-left">
                  <label className="text-sm font-semibold mb-1 text-gray-700">
                    Album Name <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => dispatch(updateCreateAlbumForm({ field: "name", value: e.target.value }))}
                    placeholder="e.g. Highlights"
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400"
                    required
                  />
                </div>

                <div className="flex flex-col text-left">
                  <label className="text-sm font-semibold mb-1 text-gray-700">Description (optional)</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => dispatch(updateCreateAlbumForm({ field: "description", value: e.target.value }))}
                    placeholder="Short notes about this album…"
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating === "loading" || !createForm.name.trim()}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow transition hover:from-orange-500 hover:to-orange-600 hover:shadow-lg disabled:opacity-50"
                  >
                    {creating === "loading" ? "Creating..." : "Create Album"}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

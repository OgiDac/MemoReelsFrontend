import { useDispatch, useSelector } from "react-redux";
import { setUploadPanelOpen, setUploadDismissed } from "../store/slices/albumDetailSlice";
import { ChevronDown, ChevronUp, X } from "lucide-react";

export default function UploadManager() {
  const { uploadQueue, uploading, isUploadPanelOpen, isUploadDismissed } = useSelector((s) => s.albumDetail);
  const dispatch = useDispatch();

  // Nothing to show at all
  if (!uploadQueue?.length || isUploadDismissed) return null;

  const totalBytes = uploadQueue.reduce((s, f) => s + (f.size || 0), 0) || 1;
  const uploadedBytes = uploadQueue.reduce(
    (s, f) => s + ((f.size || 0) * (Math.min(f.progress, 100) / 100)),
    0
  );
  const overallPct = Math.round((uploadedBytes / totalBytes) * 100);

  const completed = uploadQueue.filter((f) => f.status === "uploaded").length;
  const failed = uploadQueue.filter((f) => f.status === "failed").length;
  const allDone = uploadQueue.length > 0 && completed + failed === uploadQueue.length;

  // Collapsed pill
  if (!isUploadPanelOpen) {
    return (
      <button
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-white border border-gray-200 shadow-lg px-3 py-2"
        title="Show upload manager"
        onClick={() => dispatch(setUploadPanelOpen(true))}
      >
        <div className="relative h-6 w-6 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-amber-500"
            style={{ width: `${overallPct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white drop-shadow">
            {overallPct}%
          </div>
        </div>
        <span className="text-xs text-gray-700">
          {completed}/{uploadQueue.length}{failed ? ` • ${failed} failed` : ""}
        </span>
        <ChevronUp className="h-4 w-4 text-gray-600" />
      </button>
    );
  }

  // Expanded panel
  return (
    <div className="fixed bottom-4 right-4 w-[min(420px,90vw)] z-40">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-sm font-medium text-slate-800">
            Uploading photos {uploading === "loading" ? "…" : ""}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="text-xs text-gray-600 mr-1.5">
              {completed}/{uploadQueue.length} done{failed ? ` • ${failed} failed` : ""}
            </div>
            {/* Collapse */}
            <button
              className="p-1 rounded-md hover:bg-gray-100"
              title="Collapse"
              onClick={() => dispatch(setUploadPanelOpen(false))}
            >
              <ChevronDown className="h-4 w-4 text-gray-700" />
            </button>
            {/* Dismiss only when all done */}
            {allDone && (
              <button
                className="p-1 rounded-md hover:bg-gray-100"
                title="Dismiss"
                onClick={() => {
                  // hide panel and pill completely
                  dispatch(setUploadPanelOpen(false));
                  dispatch(setUploadDismissed(true));
                }}
              >
                <X className="h-4 w-4 text-gray-700" />
              </button>
            )}
          </div>
        </div>

        {/* overall bar */}
        <div className="px-4 pb-3">
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-orange-500 to-amber-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-600">{overallPct}%</div>
        </div>

        <div className="max-h-64 overflow-auto divide-y divide-gray-100">
          {uploadQueue.map((f, i) => (
            <div key={i} className="px-4 py-2 text-sm">
              <div className="flex justify-between">
                <div className="truncate text-slate-700">{f.name}</div>
                <div className="text-xs text-gray-500">{f.progress}%</div>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-1.5 ${f.status === "failed" ? "bg-red-500" : "bg-orange-500"}`}
                  style={{ width: `${Math.min(f.progress, 100)}%` }}
                />
              </div>
              {f.status === "failed" && (
                <div className="mt-1 text-xs text-red-600">Upload failed</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

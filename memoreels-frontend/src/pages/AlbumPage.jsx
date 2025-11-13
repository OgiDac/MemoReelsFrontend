// src/pages/AlbumPage.jsx
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import {
    fetchAlbum,
    fetchAlbumPhotos,
    uploadPhotosBatch, // changed
} from "../store/slices/albumDetailSlice";
import {
    ArrowLeft,
    Image as ImageIcon,
    Plus,
    Upload,
    MoreHorizontal,
} from "lucide-react";
import { timeAgoUTCToLocal, formatLocalDateTime } from "../utils/time";
import ImageViewer from "../components/ImageViewer";

/* ---------- Photo Card ---------- */
function PhotoCard({ photo, onOpen }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return;
        const onClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [menuOpen]);

    const createdAt = photo?.createdAt;
    const sizeLabel =
        typeof photo?.sizeMB === "number" ? `${photo.sizeMB.toFixed(2)} MB` : null;

    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition" onClick={onOpen}>
            {/* image / placeholder */}
            <div className="aspect-[4/3] relative bg-gradient-to-br from-amber-50 to-white">
                {photo?.thumbUrl ? (
                    <img
                        src={photo.thumbUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-orange-600" />
                        </div>
                    </div>
                )}

                {/* stronger, cleaner gradient */}
                <div
                    className="pointer-events-none absolute inset-0
                     bg-gradient-to-t from-black/55 via-black/10 to-transparent
                     opacity-0 group-hover:opacity-100 transition"
                />

                {/* bottom-left meta: time (white), size (amber) */}
                <div className="absolute left-4 bottom-4 space-y-1 opacity-0 group-hover:opacity-100 transition">
                    {createdAt && (
                        <div
                            className="text-[13px] font-medium text-white leading-none drop-shadow-sm"
                            title={formatLocalDateTime(createdAt)}
                        >
                            {timeAgoUTCToLocal(createdAt)}
                        </div>
                    )}
                    {sizeLabel && (
                        <div className="text-[12px] tabular-nums text-gray-200/95 leading-none">
                            {sizeLabel}
                        </div>
                    )}
                </div>

                {/* top-right actions (UI only) */}
                <div className="absolute top-2 right-2" ref={menuRef}>
                    <button
                        type="button"
                        aria-label="Photo actions"
                        className="p-1.5 rounded-full bg-white/90 shadow-sm ring-1 ring-black/5
                       opacity-0 group-hover:opacity-100 transition"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen((v) => !v);
                        }}
                    >
                        <MoreHorizontal className="h-4 w-4 text-gray-700" />
                    </button>

                    {menuOpen && (
                        <div
                            className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button type="button" className="w-full px-3 py-2.5 text-sm text-left hover:bg-gray-50">
                                View
                            </button>
                            <button type="button" className="w-full px-3 py-2.5 text-sm text-left hover:bg-gray-50">
                                Download
                            </button>
                            <div className="h-px bg-gray-100 my-1" />
                            <button
                                type="button"
                                className="w-full px-3 py-2.5 text-sm text-left text-red-600 hover:bg-red-50"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------- Page ---------- */
export default function AlbumPage() {
    const { eventId, albumId } = useParams();
    const dispatch = useDispatch();
    const { album, status, error, photos, photosStatus, uploading, lastUploadSummary } =
        useSelector((s) => s.albumDetail);

    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const [viewerIndex, setViewerIndex] = useState(null);
    const openViewer = (idx) => setViewerIndex(idx);

    useEffect(() => {
        if (!albumId) return;
        dispatch(fetchAlbum(albumId));
        if (eventId) dispatch(fetchAlbumPhotos({ eventId, albumId }));
    }, [albumId, eventId, dispatch]);

    const title = album?.name ?? `Album #${albumId}`;
    const subtitle = album?.description || "";
    const count = Number(album?.photoCount ?? 0);

    const prevent = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const onDragEnter = (e) => {
        prevent(e);
        setIsDragging(true);
    };
    const onDragOver = (e) => {
        prevent(e);
        setIsDragging(true);
    };
    const onDragLeave = (e) => {
        prevent(e);
        setIsDragging(false);
    };
    const onDrop = (e) => {
        prevent(e);
        setIsDragging(false);
        // Hook up later to uploadPhotosBatch if you want drag&drop too
    };

    const onPickFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        try {
            await dispatch(
                uploadPhotosBatch({
                    eventId,
                    albumId,
                    files,
                    concurrency: 4,
                })
            ).unwrap();

            // refresh grid after successful uploads/finalize
            dispatch(fetchAlbumPhotos({ eventId, albumId }));
        } catch (err) {
            console.error(err);
        } finally {
            // allow selecting the same files again later
            e.target.value = "";
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 pt-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
                <div className="min-w-0 flex items-center gap-3">
                    <Link
                        to={`/events/${eventId}?tab=albums`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition shrink-0"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="font-medium">Back to Albums</span>
                    </Link>

                    <div className="hidden sm:block h-5 w-px bg-gray-200" />

                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center shrink-0">
                            <ImageIcon className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-orange-500 truncate">{title}</div>
                            {subtitle ? <div className="text-sm text-gray-500 truncate">{subtitle}</div> : null}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5 text-sm text-orange-700 px-3 py-1 rounded-full border border-orange-200 bg-white">
                        <ImageIcon className="h-4 w-4" />
                        <span className="tabular-nums">{count}</span>
                        <span>{count === 1 ? "photo" : "photos"}</span>
                    </div>

                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-white font-medium
                       bg-gradient-to-r from-orange-500 to-amber-500 shadow hover:shadow-md
                       focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-orange-300 disabled:opacity-60"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading === "loading"}
                    >
                        <Plus className="h-4 w-4" />
                        {uploading === "loading" ? "Uploading..." : "Upload Photos"}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={onPickFiles}
                    />
                </div>
            </div>

            {/* Optional summary after upload */}
            {lastUploadSummary && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-3">
                    Updated {lastUploadSummary.updated} rows • Uploaded {lastUploadSummary.uploaded} • Failed{" "}
                    {lastUploadSummary.failed}
                </div>
            )}
            {uploading === "failed" && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
                    Upload failed. Please try again.
                </div>
            )}

            {/* Loading / error */}
            {status === "failed" && (
                <p className="mt-4 text-sm text-red-600">
                    {typeof error === "string" ? error : "Failed to load album."}
                </p>
            )}

            {/* Dropzone (drag only) */}
            <div className="mt-6">
                <div
                    onDragEnter={onDragEnter}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`relative w-full h-56 sm:h-64 rounded-2xl border-2 border-dashed
                      bg-gradient-to-b from-white to-amber-50/10 transition
                      ${isDragging ? "border-orange-400 bg-amber-50/40" : "border-gray-300/70"}
                      cursor-default`}
                >
                    <div className="h-full w-full flex flex-col items-center justify-center text-center px-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md mb-3">
                            <Upload className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-sm font-medium text-slate-800">Drag &amp; drop photos here</div>
                        <div className="text-sm text-gray-500 mt-1">or click the button above to browse files</div>
                        <div className="text-xs text-gray-400 mt-3">Supports: JPG, PNG, HEIC, and more</div>
                    </div>
                </div>
            </div>

            {/* Photos grid */}
            <div className="mt-6">
                {photosStatus === "loading" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="aspect-[4/3] rounded-2xl bg-gray-100 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(Array.isArray(photos) ? photos : []).map((p, i) => (
                            <PhotoCard key={p.id} photo={p} onOpen={() => openViewer(i)} />
                        ))}
                    </div>
                )}
            </div>

            {viewerIndex !== null && (
                <ImageViewer
                    items={Array.isArray(photos) ? photos : []}
                    index={viewerIndex}
                    onClose={() => setViewerIndex(null)}
                    onPrev={() =>
                        setViewerIndex((i) => (i > 0 ? i - 1 : (photos?.length ?? 1) - 1))
                    }
                    onNext={() =>
                        setViewerIndex((i) => (i + 1) % (photos?.length ?? 1))
                    }
                />
            )}
        </div>
    );
}

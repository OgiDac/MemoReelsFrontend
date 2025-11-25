import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import {
    fetchAlbum,
    fetchAlbumPhotos,
    uploadPhotosBatch,
    deletePhoto,
    setAlbumCover,
    setPhotoStatuses,
    markProcessed,
    bumpPhotoCache,
} from "../store/slices/albumDetailSlice";
import {
    ArrowLeft,
    Image as ImageIcon,
    Plus,
    Upload,
    MoreHorizontal,
    Star,
} from "lucide-react";
import { timeAgoUTCToLocal, formatLocalDateTime } from "../utils/time";
import ImageViewer from "../components/ImageViewer";
import ConfirmDialog from "../components/ConfirmDialog";
import UploadManager from "../components/UploadManager";

/* ---------- Photo Card ---------- */
function PhotoCard({ photo, onOpen, onDelete, onSetAsCover, isCover }) {
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
    const sizeLabel = typeof photo?.sizeMB === "number" ? `${photo.sizeMB.toFixed(2)} MB` : null;

    const status = (photo?.status || "").toLowerCase();
    const isProcessed = status === "processed";

    const imgSrc = isProcessed
        ? (photo?.thumbUrl ?? photo?.thumbURL ?? photo?.webUrl ?? photo?.webURL ?? null)
        : null;


    return (
        <div
            className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition"
            onClick={() => { if (isProcessed) onOpen(); }}
        >
            <div className="aspect-[4/3] relative bg-gradient-to-br from-amber-50 to-white">
                {imgSrc ? (
                    <img src={imgSrc} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-orange-600" />
                        </div>
                        {status !== "processed" && (
                            <div className="mt-2 text-xs ...">Processing…</div>
                        )}
                    </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition" />

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

                {isCover && (
                    <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-black/5">
                        <Star className="h-3.5 w-3.5" />
                        Cover
                    </div>
                )}

                <div className="absolute top-2 right-2" ref={menuRef}>
                    <button
                        type="button"
                        aria-label="Photo actions"
                        className="p-1.5 rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 opacity-0 group-hover:opacity-100 transition"
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
                            <button
                                type="button"
                                className="w-full px-3 py-2.5 text-sm text-left hover:bg-gray-50"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    onSetAsCover && onSetAsCover();
                                }}
                            >
                                Set as album cover
                            </button>

                            <div className="h-px bg-gray-100 my-1" />

                            <button
                                type="button"
                                className="w-full px-3 py-2.5 text-sm text-left text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    onDelete && onDelete();
                                }}
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

function extractDroppedFiles(dt) {
    if (dt?.items && dt.items.length) {
        const files = [];
        for (const it of dt.items) {
            if (it.kind === "file") {
                const f = it.getAsFile();
                if (f) files.push(f);
            }
        }
        return files;
    }
    return Array.from(dt?.files || []);
}

/* ---------- Page ---------- */
export default function AlbumPage() {
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { eventId, albumId } = useParams();
    const dispatch = useDispatch();
    const { album, photos, photosStatus, uploading } = useSelector((s) => s.albumDetail);

    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const wsRef = useRef(null);

    const [viewerIndex, setViewerIndex] = useState(null);
    const openViewer = (idx) => setViewerIndex(idx);

    // Initial fetch
    useEffect(() => {
        if (!albumId) return;
        dispatch(fetchAlbum(albumId));
        if (eventId) {
            dispatch(fetchAlbumPhotos({ eventId, albumId })).catch(() => { });
        }
    }, [albumId, eventId, dispatch]);

    // WebSocket za photo.processed evente
    useEffect(() => {
        if (!eventId || !albumId) return;

        const base = (api.defaults.baseURL || window.location.origin).replace(/\/$/, "");
        const wsUrl =
            base.replace(/^http/, "ws") +
            `/ws/photos?eventId=${eventId}&albumId=${albumId}`;

        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
            console.log("photo WS opened", { eventId, albumId });
        };

        socket.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data);
                if (
                    msg?.type === "photo.processed" &&
                    String(msg.eventId) === String(eventId) &&
                    String(msg.albumId) === String(albumId)
                ) {
                    const photoId = Number(msg.photoId);
                    if (Number.isFinite(photoId)) {
                        dispatch(setPhotoStatuses([{ id: photoId, status: "processed" }]));
                        dispatch(markProcessed([photoId]));
                    }
                }
            } catch (err) {
                console.error("WS message parse error", err);
            }
        };


        socket.onerror = (err) => {
            console.error("photo WS error", err);
        };

        socket.onclose = () => {
            console.log("photo WS closed");
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [eventId, albumId, dispatch]);

    const title = album?.name ?? `Album #${albumId}`;
    const subtitle = album?.description || "";
    const count = Array.isArray(photos) ? photos.length : Number(album?.photoCount ?? 0);

    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
    const onDragEnter = (e) => { prevent(e); if (Array.from(e.dataTransfer?.items || []).some((it) => it.kind === "file")) setIsDragging(true); };
    const onDragOver = (e) => { prevent(e); if (Array.from(e.dataTransfer?.items || []).some((it) => it.kind === "file")) setIsDragging(true); };
    const onDragLeave = (e) => { prevent(e); setIsDragging(false); };

    const afterSuccessfulUpload = async () => {
        await dispatch(fetchAlbumPhotos({ eventId, albumId }));
        // nema više pollinga
    };

    const onDrop = async (e) => {
        prevent(e); setIsDragging(false);
        const files = extractDroppedFiles(e.dataTransfer).filter(Boolean);
        if (!files.length) return;
        try {
            await dispatch(uploadPhotosBatch({ eventId, albumId, files, concurrency: 4 })).unwrap();
            await afterSuccessfulUpload();
        } catch (err) { console.error(err); }
    };

    const onPickFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        try {
            await dispatch(uploadPhotosBatch({ eventId, albumId, files, concurrency: 4 })).unwrap();
            await afterSuccessfulUpload();
        } catch (err) {
            console.error(err);
        } finally {
            e.target.value = "";
        }
    };

    const requestDeletePhoto = (photo) => { setDeleteTarget(photo); };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try { await dispatch(deletePhoto(deleteTarget.id)).unwrap(); }
        catch (err) { console.error("Failed to delete photo", err); }
        finally { setDeleteTarget(null); }
    };

    const handleSetCover = async (pid) => {
        try {
            await dispatch(setAlbumCover({ albumId, photoId: pid })).unwrap();
            dispatch(fetchAlbum(albumId));
        } catch { }
    };

    const coverId = album?.coverPhotoId ?? null;

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
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-white font-medium bg-gradient-to-r from-orange-500 to-amber-500 shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-orange-300 disabled:opacity-60"
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

            {/* Dropzone */}
            <div className="mt-6">
                <div
                    onDragEnter={onDragEnter}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`relative w-full h-56 sm:h-64 rounded-2xl border-2 border-dashed bg-gradient-to-b from-white to-amber-50/10 transition ${isDragging ? "border-orange-400 bg-amber-50/40" : "border-gray-300/70"
                        } cursor-default`}
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
                            <PhotoCard
                                key={p.id}
                                photo={p}
                                isCover={coverId === p.id}
                                onOpen={() => setViewerIndex(i)}
                                onDelete={() => requestDeletePhoto(p)}
                                onSetAsCover={() => handleSetCover(p.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {viewerIndex !== null && (
                <ImageViewer
                    items={Array.isArray(photos) ? photos : []}
                    index={viewerIndex}
                    onClose={() => setViewerIndex(null)}
                    onPrev={() => setViewerIndex((i) => (i > 0 ? i - 1 : (photos?.length ?? 1) - 1))}
                    onNext={() => setViewerIndex((i) => (i + 1) % (photos?.length ?? 1))}
                />
            )}

            <UploadManager />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete photo"
                message="This will permanently delete this photo from this album. This action cannot be undone."
                confirmLabel="Delete photo"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}

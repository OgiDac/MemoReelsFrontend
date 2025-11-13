// src/components/AlbumsTab.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAlbums,
    openCreateAlbum,
    startRenameAlbum,
    updateEditingAlbumField,
    cancelEditingAlbum,
} from "../store/slices/albumsSlice";
import { updateAlbum } from "../store/slices/albumsSlice";
import CreateAlbumModal from "./CreateAlbumModal";
import {
    Folder,
    MoreHorizontal,
    Image as ImageIcon,
    Pencil,
    Trash2,
    CheckCircle2,
    XCircle,
    Images,
    Plus,
} from "lucide-react";
import { formatLocalDateTime, timeAgoUTCToLocal } from "../utils/time";

const STATUS_STYLES = {
    published: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    draft: "bg-gray-50 text-gray-700 ring-1 ring-gray-200",
    scheduled: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
};
const STATUS_DOT = {
    published: "bg-emerald-500",
    draft: "bg-gray-400",
    scheduled: "bg-blue-500",
};

function AlbumCard({
    album,
    onOpen,
    isRenaming,
    renameValue,
    isUpdating,
    onStartRename,
    onChangeRename,
    onCancelRename,
    onConfirmRename,
    onTogglePublish,
}) {
    const chip = album.status || "draft";
    const chipClass = STATUS_STYLES[chip] || STATUS_STYLES.draft;
    const dotClass = STATUS_DOT[chip] || STATUS_DOT.draft;
    const photoCount = Number(album.photoCount) || 0;

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const inputRef = useRef(null);

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

    useEffect(() => {
        if (isRenaming) {
            setMenuOpen(false);
            inputRef.current?.focus();
        }
    }, [isRenaming]);

    const publishLabel = chip === "published" ? "Unpublish" : "Publish";
    const PublishIcon = chip === "published" ? XCircle : CheckCircle2;

    const baseCls =
        "group w-full text-left rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm transition";
    const clickable = !isRenaming && !isUpdating;

    const handleCardClick = () => {
        if (clickable) onOpen?.(album);
    };
    const handleKeyDown = (e) => {
        if (!clickable) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen?.(album);
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleCardClick}
            onKeyDown={handleKeyDown}
            className={
                baseCls +
                " focus:outline-none focus-within:ring-2 focus-within:ring-orange-300 " +
                (clickable
                    ? "hover:-translate-y-0.5 hover:shadow-md hover:border-orange-200 cursor-pointer"
                    : "opacity-75")
            }
        >
            {/* Cover */}
            <div className={`relative aspect-[16/9] bg-gradient-to-tr from-amber-50 via-orange-50 to-white ${isRenaming ? "opacity-70" : ""}`}>
                {album.coverUrl ? (
                    <img src={album.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-amber-100/80 flex items-center justify-center shadow-sm">
                            {photoCount > 0 ? (
                                <ImageIcon className="h-5 w-5 text-amber-700" />
                            ) : (
                                <Folder className="h-5 w-5 text-amber-700" />
                            )}
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-black/5 to-transparent pointer-events-none" />

                {/* Chips */}
                <span
                    className={`absolute bottom-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide backdrop-blur ${chipClass}`}
                    title={`Status: ${chip}`}
                >
                    {chip === "published" ? "PUBLISHED" : chip.toUpperCase()}
                </span>
                <span className="absolute bottom-2 right-2 text-[11px] font-medium text-gray-800 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
                    {photoCount} {photoCount === 1 ? "photo" : "photos"}
                </span>

                {/* Menu */}
                <div className="absolute top-2 right-2 z-30" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        aria-label="Album actions"
                        className={`p-1.5 rounded-full border border-white/60 bg-white/80 hover:bg-white shadow-sm transition ${isRenaming || isUpdating ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"
                            }`}
                        onClick={() => setMenuOpen((v) => !v)}
                    >
                        <MoreHorizontal className="h-4 w-4 text-gray-700" />
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5 z-30">
                            <button
                                type="button"
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onStartRename?.();
                                }}
                            >
                                <Pencil className="h-4 w-4 text-gray-600" />
                                Rename
                            </button>
                            <button
                                type="button"
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                                disabled={isUpdating}
                                onClick={() => {
                                    onTogglePublish?.(album);
                                    setMenuOpen(false);
                                }}
                            >
                                <PublishIcon className="h-4 w-4 text-gray-600" />
                                {publishLabel}
                            </button>
                            <div className="my-1 h-px bg-gray-100" />
                            <button type="button" className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
                {/* Title row: fixed height, controls overlayed */}
                <div className="relative h-8">
                    {!isRenaming ? (
                        <div className="absolute inset-0 flex items-center pr-8">
                            <div className="text-sm font-semibold text-slate-800/90 leading-5 tracking-tight line-clamp-1">
                                {album.name || "Untitled album"}
                            </div>
                        </div>
                    ) : (
                        <form
                            className="absolute inset-0 flex items-center pr-8"
                            onSubmit={(e) => {
                                e.preventDefault();
                                onConfirmRename?.();
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                ref={inputRef}
                                value={renameValue}
                                onChange={(e) => onChangeRename?.(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Escape") onCancelRename?.();
                                }}
                                disabled={isUpdating}
                                className="min-w-0 w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm
                           leading-5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-300 pr-10"
                                placeholder="Album name"
                            />
                        </form>
                    )}

                    {/* Stacked icon buttons, overlayed to the right */}
                    {isRenaming && (
                        <div
                            className="absolute right-0 inset-y-0 flex flex-col items-center justify-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Confirm */}
                            <button
                                type="button"
                                onClick={onConfirmRename}
                                disabled={isUpdating}
                                title="Confirm"
                                aria-label="Confirm rename"
                                className="h-7 w-7 rounded-md border border-emerald-200 bg-emerald-50 hover:bg-emerald-100
                 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-300"
                            >
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                            </button>

                            {/* Cancel */}
                            <button
                                type="button"
                                onClick={onCancelRename}
                                disabled={isUpdating}
                                title="Cancel"
                                aria-label="Cancel rename"
                                className="h-7 w-7 rounded-md border border-gray-200 hover:bg-gray-50
                 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-300"
                            >
                                <XCircle className="h-4 w-4 text-gray-500 mx-auto" />
                            </button>
                        </div>
                    )}

                </div>

                {/* Meta row */}
                <div
                    className={`mt-1 flex items-center gap-2 text-[12px] text-gray-500 ${isRenaming ? "opacity-70" : ""}`}
                    title={formatLocalDateTime(album.createdAt)}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                    <span>Created {timeAgoUTCToLocal(album.createdAt)}</span>
                </div>
            </div>
        </div>
    );
}

function NewAlbumCard({ onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-2xl border-2 border-dashed border-orange-300/70 bg-white hover:bg-orange-50/40 transition p-6 w-full h-full text-center cursor-pointer"
        >
            <div className="mx-auto h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                <Plus className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-sm font-medium text-gray-700">New Album</div>
            <div className="text-[12px] text-gray-500">Create New Album</div>
        </button>
    );
}

export default function AlbumsTab({ eventId }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { albums, albumsStatus, isCreateOpen, editingAlbum, updatingId } = useSelector(
        (s) => s.albums
    );

    useEffect(() => {
        if (!eventId) return;
        dispatch(fetchAlbums(eventId));
    }, [eventId]);

    const onStartRename = (album) => dispatch(startRenameAlbum(album));
    const onChangeRename = (value) => dispatch(updateEditingAlbumField({ field: "name", value }));
    const onCancelRename = () => dispatch(cancelEditingAlbum());
    const onConfirmRename = async () => {
        if (!editingAlbum?.id) return;
        try {
            await dispatch(
                updateAlbum({
                    id: editingAlbum.id,
                    name: editingAlbum.name?.trim(),
                    description: editingAlbum.description ?? "",
                    status: editingAlbum.status ?? "draft",
                })
            ).unwrap();

            // refetch list after successful update
            dispatch(fetchAlbums(eventId));
        } catch (e) {
            // optional: show toast/snackbar
            console.error(e);
        }
    };

    const onTogglePublish = async (album) => {
        const next = album.status === "published" ? "draft" : "published";
        try {
            await dispatch(
                updateAlbum({
                    id: album.id,
                    name: album.name ?? "",
                    description: album.description ?? "",
                    status: next,
                })
            ).unwrap();
            dispatch(fetchAlbums(eventId));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="w-full space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Images className="h-4 w-4 text-orange-500" />
                Photo Albums <span className="text-gray-400">({albums.length})</span>
            </div>

            {albumsStatus === "loading" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-40 rounded-2xl bg-gray-50 animate-pulse border" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <NewAlbumCard onClick={() => dispatch(openCreateAlbum())} />
                    {albums.map((a) => (
                        <AlbumCard
                            key={a.id}
                            album={a}
                            isRenaming={editingAlbum?.id === a.id}
                            renameValue={editingAlbum?.name ?? ""}
                            isUpdating={updatingId === a.id}
                            onStartRename={() => onStartRename(a)}
                            onChangeRename={onChangeRename}
                            onCancelRename={onCancelRename}
                            onConfirmRename={onConfirmRename}
                            onOpen={(al) =>
                                navigate({
                                    pathname: `/events/${eventId}/albums/${al.id}`,
                                })
                            }
                            onTogglePublish={() => onTogglePublish(a)}
                        />
                    ))}
                </div>
            )}
            <CreateAlbumModal eventId={eventId} open={isCreateOpen} />
        </div>
    );
}

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

let pollTimer = null;
let pollDelayMs = 2000;
const pollBackoffSeq = [2000, 3000, 5000, 8000];
let backoffIdx = 0;

function scheduleNextTick(dispatch, getState, eventId, albumId) {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = setTimeout(() => {
    dispatch(pollProcessingOnce({ eventId, albumId }));
  }, pollDelayMs);
}

/* ========================= In-module file cache ========================= */
const fileCache = new Map();
const toMeta = (file) => ({
  tempId: crypto.randomUUID(),
  name: file.name,
  size: file.size || 0,
  type: file.type || "application/octet-stream",
  lastModified: file.lastModified || 0,
});

/* ========================= Helpers ========================= */
async function putFileToURL(file, url, contentType, { onProgress, signal } = {}) {
  const { default: axios } = await import("axios");
  const res = await axios.put(url, file, {
    headers: { "Content-Type": contentType || file.type || "application/octet-stream" },
    withCredentials: false,
    signal,
    onUploadProgress: (e) => {
      if (e?.total) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress?.(pct, e.loaded, e.total);
      }
    },
  });

  const etag = (res.headers?.etag || res.headers?.ETag || res.headers?.ETAG || "")
    .toString()
    .replaceAll('"', "");

  // best-effort local dimensions
  let width = 0, height = 0;
  try {
    if ("createImageBitmap" in window) {
      const bmp = await createImageBitmap(file);
      width = bmp.width; height = bmp.height; bmp.close?.();
    } else {
      const dims = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.width || 0, h: img.height || 0 });
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      width = dims.w; height = dims.h;
    }
  } catch { }

  return { etag, sizeBytes: file.size || 0, width, height };
}

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let i = 0, active = 0;
  return new Promise((resolve) => {
    const next = () => {
      if (i >= items.length && active === 0) return resolve(results);
      while (active < limit && i < items.length) {
        const idx = i++;
        active++;
        Promise.resolve()
          .then(() => worker(items[idx], idx))
          .then((r) => (results[idx] = r))
          .catch((e) => (results[idx] = { error: e }))
          .finally(() => { active--; next(); });
      }
    };
    next();
  });
}

/* ============================== Thunks ============================== */

export const fetchAlbum = createAsyncThunk(
  "albumDetail/fetchAlbum",
  async (albumId, thunkAPI) => {
    try {
      const res = await api.get(`/public/api/albums/${albumId}`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to fetch album");
    }
  }
);

export const fetchAlbumPhotos = createAsyncThunk(
  "albumDetail/fetchAlbumPhotos",
  async ({ eventId, albumId }, thunkAPI) => {
    try {
      const res = await api.get(`/public/api/photos/event/${eventId}/album/${albumId}`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to fetch photos");
    }
  }
);

export const batchInit = createAsyncThunk(
  "albumDetail/batchInit",
  async ({ eventId, albumId, metas }, thunkAPI) => {
    try {
      const items = metas.map((m) => ({
        filename: m.name,
        contentType: m.type || "application/octet-stream",
      }));
      const res = await api.post(`/private/api/photos/batch-init`, {
        eventId: Number(eventId),
        albumId: Number(albumId),
        items,
      });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to init uploads");
    }
  }
);

export const batchFinalize = createAsyncThunk(
  "albumDetail/batchFinalize",
  async ({ finalizeItems }, thunkAPI) => {
    try {
      const res = await api.post(`/private/api/photos/batch-finalize`, { items: finalizeItems });
      return res.data; // { updated: n }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to finalize uploads");
    }
  }
);

// init → upload → finalize; return uploadedIds so we can seed polling
export const uploadPhotosBatch = createAsyncThunk(
  "albumDetail/uploadPhotosBatch",
  async ({ eventId, albumId, files, concurrency = 4 }, thunkAPI) => {
    const { dispatch } = thunkAPI;
    try {
      const metas = files.map((f) => {
        const m = toMeta(f);
        fileCache.set(m.tempId, f);
        return m;
      });

      dispatch(uploadQueueStarted(metas));

      const init = await dispatch(batchInit({ eventId, albumId, metas })).unwrap();
      const initItems = Array.isArray(init?.items) ? init.items : [];
      if (initItems.length !== metas.length) throw new Error("Init response mismatch");

      const results = await runWithConcurrency(metas, concurrency, async (meta, idx) => {
        const initItem = initItems[idx];
        const uploadUrl = initItem.uploadUrl;
        const ctype = initItem.expectedContentType || meta.type || "application/octet-stream";
        if (!uploadUrl) return { id: initItem.id, status: "failed", error: "Missing uploadUrl" };

        const file = fileCache.get(meta.tempId);
        if (!file) return { id: initItem.id, status: "failed", error: "File cache miss" };

        try {
          const up = await putFileToURL(file, uploadUrl, ctype, {
            onProgress: (pct) => dispatch(uploadItemProgress({ index: idx, percent: pct })),
          });
          dispatch(uploadItemDone({ index: idx, ok: true }));
          return {
            id: initItem.id,
            status: "uploaded",
            sizeBytes: up.sizeBytes,
            etag: up.etag,
            width: up.width,
            height: up.height,
          };
        } catch (e) {
          dispatch(uploadItemDone({ index: idx, ok: false }));
          return { id: initItem.id, status: "failed", error: e?.message || "Upload failed" };
        } finally {
          fileCache.delete(meta.tempId);
        }
      });

      const finalizeItems = results.map((r) => ({
        id: r.id,
        status: r.status === "uploaded" ? "uploaded" : "failed",
        sizeBytes: r.sizeBytes ?? undefined,
        etag: r.etag ?? undefined,
        width: r.width ?? undefined,
        height: r.height ?? undefined,
      }));
      const finalizeRes = await dispatch(batchFinalize({ finalizeItems })).unwrap();

      dispatch(uploadQueueFinished());

      const uploadedIds = finalizeItems.filter(i => i.status === "uploaded").map(i => i.id);

      return {
        initCount: initItems.length,
        uploaded: uploadedIds.length,
        failed: finalizeItems.filter((i) => i.status === "failed").length,
        updated: finalizeRes?.updated ?? 0,
        uploadedIds, // 👈 seed polling
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(typeof err === "string" ? err : err?.message || "Batch upload failed");
    }
  }
);

export const setAlbumCover = createAsyncThunk(
  "albumDetail/setAlbumCover",
  async ({ albumId, photoId }, thunkAPI) => {
    try {
      await api.post(`/private/api/albums/${albumId}/cover`, { photoId: Number(photoId) });
      return { albumId: Number(albumId), photoId: Number(photoId) };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to set album cover");
    }
  }
);

export const deletePhoto = createAsyncThunk(
  "albumDetail/deletePhoto",
  async (photoId, thunkAPI) => {
    try {
      await api.delete(`/private/api/photos/${photoId}`);
      return photoId;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to delete photo");
    }
  }
);

export const checkPhotoStatuses = createAsyncThunk(
  "albumDetail/checkPhotoStatuses",
  async ({ ids }, thunkAPI) => {
    try {
      if (!ids?.length) return { statuses: [] };
      const res = await api.get(`/public/api/photos/status`, { params: { ids: ids.join(",") } });
      const data = res.data;
      const list = Array.isArray(data) ? data : Array.isArray(data?.statuses) ? data.statuses : [];
      const statuses = list.map(s => ({
        id: Number(s.id),
        status: String(s.status || "").toLowerCase(),
      }));
      return { statuses };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || "Status check failed");
    }
  }
);


export const pollProcessingOnce = createAsyncThunk(
  "albumDetail/pollProcessingOnce",
  async ({ eventId, albumId }, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    const st = getState().albumDetail;
    const pendingIds = Array.from(st.processingIds || []).map(Number);
    if (!pendingIds.length) { dispatch(stopStatusPolling()); return { changed: false }; }

    const resp = await dispatch(checkPhotoStatuses({ ids: pendingIds })).unwrap();
    const terminal = new Set(["processed", "failed"]);
    const nowTerminal = (resp.statuses || [])
      .filter(s => terminal.has(s.status))
      .map(s => Number(s.id));

    if (nowTerminal.length) {
      dispatch(setPhotoStatuses(nowTerminal.map(id => ({ id, status: "processed" })))); // 👈 optimistic UI
      dispatch(markProcessed(nowTerminal));
      backoffIdx = 0; pollDelayMs = pollBackoffSeq[0];
      await dispatch(fetchAlbumPhotos({ eventId, albumId }));
    } else {
      backoffIdx = Math.min(backoffIdx + 1, pollBackoffSeq.length - 1);
      pollDelayMs = pollBackoffSeq[backoffIdx];
    }

    // stop if empty after refresh
    const stillPending = (getState().albumDetail.processingIds || []).length > 0;
    if (stillPending) scheduleNextTick(dispatch, getState, eventId, albumId);
    else dispatch(stopStatusPolling());

    return { changed: nowTerminal.length > 0 };
  }
);


export const startStatusPolling = createAsyncThunk(
  "albumDetail/startStatusPolling",
  async ({ eventId, albumId }, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    const st = getState().albumDetail;
    if (st.processingIds.length === 0) return;
    if (!pollTimer) {
      backoffIdx = 0;
      pollDelayMs = pollBackoffSeq[0];
      scheduleNextTick(dispatch, getState, eventId, albumId);
    }
  }
);

export const stopStatusPolling = createAsyncThunk(
  "albumDetail/stopStatusPolling",
  async () => {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
  }
);

/* ============================== Slice ============================== */

const albumDetailSlice = createSlice({
  name: "albumDetail",
  initialState: {
    album: null,
    status: "idle",
    error: null,

    photos: [],
    photosStatus: "idle",
    photosError: null,

    uploading: "idle",
    uploadError: null,
    lastUploadSummary: null,

    uploadQueue: [],
    isUploadPanelOpen: false,
    isUploadDismissed: false,
    processingIds: [],
  },
  reducers: {
    setSelectedAlbum: (state, action) => {
      state.album = action.payload ?? null;
      state.status = action.payload ? "succeeded" : "idle";
      state.error = null;
    },
    clearSelectedAlbum: (state) => {
      state.album = null;
      state.status = "idle";
      state.error = null;
      state.photos = [];
      state.photosStatus = "idle";
      state.photosError = null;
    },
    clearAlbumPhotos: (state) => {
      state.photos = [];
      state.photosStatus = "idle";
      state.photosError = null;
    },

    uploadQueueStarted: (state, action) => {
      const metas = action.payload || [];
      state.uploadQueue = metas.map((m) => ({
        tempId: m.tempId,
        name: m.name,
        size: m.size || 0,
        progress: 0,
        status: "queued",
      }));
      state.isUploadPanelOpen = true;
    },
    uploadItemProgress: (state, action) => {
      const { index, percent } = action.payload;
      const it = state.uploadQueue[index];
      if (it) { it.progress = percent; it.status = "uploading"; }
    },
    uploadItemDone: (state, action) => {
      const { index, ok } = action.payload;
      const it = state.uploadQueue[index];
      if (it) { it.progress = ok ? 100 : it.progress; it.status = ok ? "uploaded" : "failed"; }
    },
    uploadQueueFinished: (state) => {
      state.uploading = "succeeded";
    },

    toggleUploadPanel: (state) => { state.isUploadPanelOpen = !state.isUploadPanelOpen; },
    setUploadPanelOpen: (state, action) => { state.isUploadPanelOpen = !!action.payload; },
    setUploadDismissed: (state, action) => { state.isUploadDismissed = !!action.payload; },

    recomputeProcessingFromPhotos: (state) => {
      const ids = (state.photos || [])
        .filter(p => {
          const st = p.status;
          if (st) return st !== "processed" && st !== "failed";
          // fallback: if no status, treat items without variants as pending
          return !(p.thumbUrl && p.webUrl);
        })
        .map(p => p.id);
      state.processingIds = Array.from(new Set(ids));
    },
    markProcessed: (state, action) => {
      const remove = new Set((action.payload || []).map(Number));
      state.processingIds = (state.processingIds || [])
        .map(Number)
        .filter(id => !remove.has(id));
    },
    addProcessingIds: (state, action) => {
      const add = new Set(action.payload || []);
      const merged = new Set([...(state.processingIds || []), ...add]);
      state.processingIds = Array.from(merged);
    },
    setPhotoStatuses: (state, action) => {
      const updates = action.payload || []; // [{id, status}]
      const byId = new Map(updates.map(u => [Number(u.id ?? u.ID), String(u.status || "").toLowerCase()]));
      state.photos = (state.photos || []).map(p => {
        const id = Number(p.id);
        if (byId.has(id)) return { ...p, status: byId.get(id) };
        return p;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // album
      .addCase(fetchAlbum.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAlbum.fulfilled, (state, action) => {
        state.album = action.payload;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchAlbum.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // photos
      .addCase(fetchAlbumPhotos.pending, (state) => {
        state.photosStatus = "loading";
        state.photosError = null;
      })
      .addCase(fetchAlbumPhotos.fulfilled, (state, action) => {
        const toNum = (v) => Number(v);
        const norm = (p) => {
          let status = String(p.status || "").toLowerCase();
          if (status === "uploaded") status = "processing";
          // accept both thumbUrl/webUrl and thumbURL/webURL
          const thumbUrl = p.thumbUrl ?? p.thumbURL ?? null;
          const webUrl = p.webUrl ?? p.webURL ?? null;
          const origUrl = p.originalUrl ?? p.originalURL ?? p.original_url ?? null;

          return {
            ...p,
            id: toNum(p.id),
            status,
            thumbUrl,
            webUrl,
            originalUrl: origUrl,
          };
        };

        const list = Array.isArray(action.payload) ? action.payload.map(norm) : [];
        state.photos = list;
        state.photosStatus = "succeeded";
        state.photosError = null;
        if (state.album) state.album.photoCount = list.length;

        // derive processing set (now on normalized data)
        const ids = list
          .filter(p => {
            if (p.status) return p.status !== "processed" && p.status !== "failed";
            return !(p.thumbUrl && p.webUrl);
          })
          .map(p => p.id);
        state.processingIds = Array.from(new Set(ids.map(Number)));
      })

      .addCase(fetchAlbumPhotos.rejected, (state, action) => {
        state.photosStatus = "failed";
        state.photosError = action.payload;
      })

      // batch init (optional UI)
      .addCase(batchInit.pending, (state) => {
        state.uploading = "loading";
        state.uploadError = null;
        state.lastUploadSummary = null;
      })
      .addCase(batchInit.fulfilled, () => { })
      .addCase(batchInit.rejected, (state, action) => {
        state.uploading = "failed";
        state.uploadError = action.payload || "Init failed";
      })

      // all-in-one
      .addCase(uploadPhotosBatch.pending, (state) => {
        state.uploading = "loading";
        state.isUploadPanelOpen = true;
        state.isUploadDismissed = false;
      })
      .addCase(uploadPhotosBatch.fulfilled, (state, action) => {
        state.uploading = "succeeded";
        state.uploadError = null;
        state.lastUploadSummary = action.payload || null;

        const ids = Array.isArray(action.payload?.uploadedIds)
          ? action.payload.uploadedIds.map(Number)
          : [];
        if (ids.length) {
          const merged = new Set([...(state.processingIds || []).map(Number), ...ids]);
          state.processingIds = Array.from(merged);
        }
      })
      .addCase(uploadPhotosBatch.rejected, (state, action) => {
        state.uploading = "failed";
        state.uploadError = action.payload || "Upload failed";
      })

      // delete photo
      .addCase(deletePhoto.fulfilled, (state, action) => {
        const id = action.payload;
        state.photos = (state.photos || []).filter((p) => p.id !== id);
      })
      .addCase(deletePhoto.rejected, (state, action) => {
        state.photosError = action.payload || "Failed to delete photo";
      })

      // set cover
      .addCase(setAlbumCover.fulfilled, (state, action) => {
        const { photoId } = action.payload || {};
        if (state.album) state.album.coverPhotoId = photoId;
      })
      .addCase(setAlbumCover.rejected, (state) => {
        state.photosError = "Failed to set album cover";
      });
  },
});

export const {
  setSelectedAlbum, clearSelectedAlbum, clearAlbumPhotos,
  uploadQueueStarted, uploadItemProgress, uploadItemDone, uploadQueueFinished,
  toggleUploadPanel, setUploadPanelOpen, setUploadDismissed,
  recomputeProcessingFromPhotos, markProcessed, addProcessingIds,
  setPhotoStatuses,
} = albumDetailSlice.actions;

export default albumDetailSlice.reducer;

// src/store/slices/albumDetailSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

/* ========================= Helpers ========================= */

// PUT file to a pre-signed URL. Returns { etag, sizeBytes, width, height }.
async function putFileToURL(file, url, contentType) {
  const { default: axios } = await import("axios");
  await axios.put(url, file, {
    headers: { "Content-Type": contentType || file.type || "application/octet-stream" },
    withCredentials: false,
  });

  // Best-effort HEAD to read ETag
  let etag = "";
  try {
    const headRes = await fetch(url, { method: "HEAD" });
    etag =
      headRes.headers.get("ETag") ||
      headRes.headers.get("etag") ||
      headRes.headers.get("Etag") ||
      "";
  } catch {
    // ignore
  }

  // Try to read dimensions
  let width = 0;
  let height = 0;
  try {
    if ("createImageBitmap" in window) {
      const bmp = await createImageBitmap(file);
      width = bmp.width;
      height = bmp.height;
      bmp.close && bmp.close();
    } else {
      const dims = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.width || 0, h: img.height || 0 });
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      width = dims.w;
      height = dims.h;
    }
  } catch {
    // ignore
  }

  return {
    etag,
    sizeBytes: file.size || 0,
    width,
    height,
  };
}

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let i = 0;
  let active = 0;
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
          .finally(() => {
            active--;
            next();
          });
      }
    };
    next();
  });
}

/* ============================== Thunks ============================== */

// GET /public/api/albums/{albumId}
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

// GET /public/api/photos/event/{eventId}/album/{albumId}
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

// POST /private/api/photos/batch-init
export const batchInit = createAsyncThunk(
  "albumDetail/batchInit",
  async ({ eventId, albumId, files }, thunkAPI) => {
    try {
      const items = files.map((f) => ({
        filename: f.name,
        contentType: f.type || "application/octet-stream",
      }));
      const res = await api.post(`/private/api/photos/batch-init`, {
        eventId: Number(eventId),
        albumId: Number(albumId),
        items,
      });
      return res.data; // { items: [{ id, s3Key, uploadUrl, expectedContentType, ...}] }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to init uploads");
    }
  }
);

// POST /private/api/photos/batch-finalize
export const batchFinalize = createAsyncThunk(
  "albumDetail/batchFinalize",
  async ({ finalizeItems }, thunkAPI) => {
    try {
      const res = await api.post(`/private/api/photos/batch-finalize`, {
        items: finalizeItems,
      });
      return res.data; // { updated: n }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to finalize uploads");
    }
  }
);

// All-in-one: init → upload → finalize
export const uploadPhotosBatch = createAsyncThunk(
  "albumDetail/uploadPhotosBatch",
  async ({ eventId, albumId, files, concurrency = 4 }, thunkAPI) => {
    try {
      // 1) Init
      const init = await thunkAPI.dispatch(batchInit({ eventId, albumId, files })).unwrap();
      const initItems = Array.isArray(init?.items) ? init.items : [];
      if (initItems.length !== files.length) {
        throw new Error("Init response mismatch");
      }

      // 2) Upload
      const results = await runWithConcurrency(files, concurrency, async (file, idx) => {
        const initItem = initItems[idx];
        const uploadUrl = initItem.uploadUrl;
        const ctype = initItem.expectedContentType || file.type || "application/octet-stream";
        if (!uploadUrl) {
          return { id: initItem.id, status: "failed", error: "Missing uploadUrl" };
        }
        try {
          const meta = await putFileToURL(file, uploadUrl, ctype);
          return {
            id: initItem.id,
            status: "uploaded",
            sizeBytes: meta.sizeBytes,
            etag: meta.etag || undefined,
            width: meta.width || undefined,
            height: meta.height || undefined,
          };
        } catch (e) {
          return { id: initItem.id, status: "failed", error: e?.message || "Upload failed" };
        }
      });

      // 3) Finalize
      const finalizeItems = results.map((r) => ({
        id: r.id,
        status: r.status === "uploaded" ? "uploaded" : "failed",
        sizeBytes: r.sizeBytes ?? undefined,
        etag: r.etag ?? undefined,
        width: r.width ?? undefined,
        height: r.height ?? undefined,
      }));
      const finalizeRes = await thunkAPI.dispatch(batchFinalize({ finalizeItems })).unwrap();

      return {
        initCount: initItems.length,
        uploaded: finalizeItems.filter((i) => i.status === "uploaded").length,
        failed: finalizeItems.filter((i) => i.status === "failed").length,
        updated: finalizeRes?.updated ?? 0,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        typeof err === "string" ? err : err?.message || "Batch upload failed"
      );
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

    uploading: "idle", // "idle" | "loading" | "succeeded" | "failed"
    uploadError: null,
    lastUploadSummary: null, // { initCount, uploaded, failed, updated }
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
        state.photos = Array.isArray(action.payload) ? action.payload : [];
        state.photosStatus = "succeeded";
        state.photosError = null;
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
      .addCase(batchInit.fulfilled, () => {})
      .addCase(batchInit.rejected, (state, action) => {
        state.uploading = "failed";
        state.uploadError = action.payload || "Init failed";
      })

      // all-in-one
      .addCase(uploadPhotosBatch.pending, (state) => {
        state.uploading = "loading";
        state.uploadError = null;
        state.lastUploadSummary = null;
      })
      .addCase(uploadPhotosBatch.fulfilled, (state, action) => {
        state.uploading = "succeeded";
        state.uploadError = null;
        state.lastUploadSummary = action.payload || null;
      })
      .addCase(uploadPhotosBatch.rejected, (state, action) => {
        state.uploading = "failed";
        state.uploadError = action.payload || "Upload failed";
      });
  },
});

export const {
  setSelectedAlbum,
  clearSelectedAlbum,
  clearAlbumPhotos,
} = albumDetailSlice.actions;

export default albumDetailSlice.reducer;

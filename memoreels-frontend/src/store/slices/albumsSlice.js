import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// GET /private/api/albums/event/{eventId}
export const fetchAlbums = createAsyncThunk(
    "albums/fetch",
    async (eventId, thunkAPI) => {
        try {
            const res = await api.get(`/private/api/albums/event/${eventId}`);
            return res.data || [];
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || "Failed to fetch albums");
        }
    }
);

export const createAlbum = createAsyncThunk(
    "albums/create",
    async ({ eventId, name, description }, thunkAPI) => {
        try {
            const payload = { eventId: Number(eventId), name, description };
            const res = await api.post(`/private/api/albums`, payload);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || "Failed to create album");
        }
    }
);

export const updateAlbum = createAsyncThunk(
    "albums/update",
    async (payload, thunkAPI) => {
        try {
            const { id, ...body } = payload; // remove id from body
            await api.put(`/private/api/albums/${id}`, body);
            return true; // server returns success only
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || "Failed to update album");
        }
    }
);

const albumsSlice = createSlice({
    name: "albums",
    initialState: {
        albums: [],
        albumsStatus: "idle",
        error: null,
        isCreateOpen: false,
        creating: "idle",
        createForm: { name: "", description: "" },
        editingAlbum: null,
        updatingId: null,
    },
    reducers: {
        openCreateAlbum: (state) => { state.isCreateOpen = true; },
        closeCreateAlbum: (state) => { state.isCreateOpen = false; },
        updateCreateAlbumForm: (state, action) => {
            const { field, value } = action.payload;
            state.createForm[field] = value;
        },
        resetCreateAlbumForm: (state) => {
            state.createForm = { name: "", description: "" };
            state.creating = "idle";
        },
        clearAlbums: (state) => {
            state.albums = [];
            state.albumsStatus = "idle";
            state.error = null;
        },
        startRenameAlbum: (s, a) => {
            const a0 = a.payload; // full album object
            s.editingAlbum = {
                id: a0.id,
                name: a0.name ?? "",
                description: a0.description ?? "",
                status: a0.status ?? "draft",
            };
        },
        updateEditingAlbumField: (s, a) => {
            const { field, value } = a.payload;
            if (s.editingAlbum) s.editingAlbum[field] = value;
        },
        cancelEditingAlbum: (s) => { s.editingAlbum = null; },
    },
    extraReducers: (builder) => {
        builder
            // list
            .addCase(fetchAlbums.pending, (state) => {
                state.albumsStatus = "loading";
                state.error = null;
            })
            .addCase(fetchAlbums.fulfilled, (state, action) => {
                state.albumsStatus = "succeeded";
                state.albums = action.payload;
            })
            .addCase(fetchAlbums.rejected, (state, action) => {
                state.albumsStatus = "failed";
                state.error = action.payload;
            })
            // create
            .addCase(createAlbum.pending, (state) => {
                state.creating = "loading";
            })
            .addCase(createAlbum.fulfilled, (state) => {
                state.creating = "succeeded";
            })
            .addCase(createAlbum.rejected, (state, action) => {
                state.creating = "failed";
                state.error = action.payload;
            })
            // update (rename)
            .addCase(updateAlbum.pending, (s, a) => {
                s.updatingId = a.meta.arg?.id ?? s.editingAlbum?.id ?? null;
                s.error = null;
            })
            .addCase(updateAlbum.fulfilled, (s, a) => {
                const upd = a.payload;
                const i = s.albums.findIndex(x => x.id === upd.id);
                if (i !== -1) s.albums[i] = { ...s.albums[i], ...upd };
                s.editingAlbum = null;
                s.updatingId = null;
            })
            .addCase(updateAlbum.rejected, (s, a) => {
                s.error = a.payload;
                s.updatingId = null; // keep editingAlbum so user can retry or cancel
            });
    },
});

export const {
    openCreateAlbum,
    closeCreateAlbum,
    updateCreateAlbumForm,
    resetCreateAlbumForm,
    clearAlbums,
    startRenameAlbum,
    updateEditingAlbumField,
    cancelEditingAlbum,
} = albumsSlice.actions;
export default albumsSlice.reducer;

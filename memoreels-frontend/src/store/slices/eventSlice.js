import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Thunk za dobavljanje jednog eventa
export const fetchEventById = createAsyncThunk(
    "event/fetchEventById",
    async (eventId, thunkAPI) => {
        try {
            const res = await api.get(`/public/api/events/${eventId}`);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || "Failed to fetch event");
        }
    }
);

export const fetchEventOverview = createAsyncThunk(
    "event/fetchEventOverview",
    async (eventId, thunkAPI) => {
        try {
            const res = await api.get(`/private/api/events/${eventId}/overview`);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || "Failed to fetch event overview");
        }
    }
);

export const fetchEventAlbums = createAsyncThunk(
    "event/fetchEventAlbums",
    async (eventId, thunkAPI) => {
        try {
            const res = await api.get(`/private/api/albums/event/${eventId}`);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || "Failed to fetch albums");
        }
    }
);

const eventSlice = createSlice({
    name: "event",
    initialState: {
        event: null,
        overview: null,
        status: "idle",
        error: null,
        overviewStatus: "idle",
        albums: [],
        albumsStatus: "idle",
    },
    reducers: {
        clearEvent: (state) => {
            state.event = null;
            state.status = "idle";
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchEventById.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchEventById.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.event = action.payload;
            })
            .addCase(fetchEventById.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })
            .addCase(fetchEventOverview.pending, (state) => {
                state.overviewStatus = "loading";
            })
            .addCase(fetchEventOverview.fulfilled, (state, action) => {
                state.overviewStatus = "succeeded";
                state.overview = action.payload;
            })
            .addCase(fetchEventOverview.rejected, (state, action) => {
                state.overviewStatus = "failed";
                state.error = action.payload;
            })
            .addCase(fetchEventAlbums.pending, (state) => {
                state.albumsStatus = "loading";
            })
            .addCase(fetchEventAlbums.fulfilled, (state, action) => {
                state.albumsStatus = "succeeded";
                state.albums = action.payload || [];
            })
            .addCase(fetchEventAlbums.rejected, (state, action) => {
                state.albumsStatus = "failed";
                state.error = action.payload;
            })
            ;
    },
});

export const { clearEvent } = eventSlice.actions;
export default eventSlice.reducer;

// src/store/slices/eventsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { notifyError, notifySuccess } from "../../utils/toast";

// Thunk za statistiku
export const fetchEventsStats = createAsyncThunk(
    "events/fetchStats",
    async (_, thunkAPI) => {
        try {
            const res = await api.get("/private/api/stats");
            return {
                total: res.data.totalEvents,
                upcoming: res.data.upcomingEvents,
                photos: res.data.totalPhotos,
            };
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || "Failed to fetch");
        }
    }
);

// Thunk za kreiranje eventa
export const createEvent = createAsyncThunk(
    "events/createEvent",
    async (_, thunkAPI) => {
        const { eventForm } = thunkAPI.getState().events;

        try {

            const payload = {
                name: eventForm.name,
                location: eventForm.location,
                description: eventForm.description,
                date: eventForm.date,
                code: eventForm.code,
                expectedGuests: eventForm.expectedGuests === "" ? null : Number(eventForm.expectedGuests),
            };

            const res = await api.post("/private/api/events", payload);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || "Failed to create");
        }
    }
);

// Thunk za validaciju koda
export const validateEventCode = createAsyncThunk(
    "events/validateEventCode",
    async (code, thunkAPI) => {
        try {
            const res = await api.get(`/private/api/events/validate-code?code=${code}`);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || "Validation failed");
        }
    }
);

export const fetchEventsList = createAsyncThunk(
    "events/fetchEventsList",
    async (_, thunkAPI) => {
        try {
            const res = await api.get("/private/api/events/my-events");
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || "Failed to fetch events");
        }
    }
);

export const deleteEvent = createAsyncThunk(
    "events/deleteEvent",
    async (eventId, thunkAPI) => {
        try {
            await api.delete(`/private/api/events/${eventId}`); // npr. /private/api/events/5
            return Number(eventId);
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || "Failed to delete event");
        }
    }
);


const eventsSlice = createSlice({
    name: "events",
    initialState: {
        stats: { total: 0, upcoming: 0, photos: 0 },
        status: "idle",
        error: null,
        creating: "idle",
        validating: "idle",
        eventFormStep: 1,
        eventForm: {
            name: "",
            date: "",
            location: "",
            description: "",
            code: "",
            expectedGuests: "",
        },
        isCodeValid: false,
        events: [],            // ⬅ lista eventova
        eventsStatus: "idle",
        isCreateModalOpen: false,
        isQrOpen: false,
        qrCodeValue: null,
    },
    reducers: {
        updateEventForm: (state, action) => {
            const { field, value } = action.payload;
            state.eventForm[field] = value;
            if (field === "code") {
                state.isCodeValid = false; // reset validacije kada se menja kod
            }
        },
        resetEventForm: (state) => {
            state.eventForm = {
                name: "",
                date: "",
                time: "",
                location: "",
                description: "",
                code: "",
            };
            state.eventFormStep = 1;
            state.isCodeValid = false;
        },
        setEventFormStep: (state, action) => {
            state.eventFormStep = action.payload;
        },
        openCreateModal: (state) => {
            state.isCreateModalOpen = true;
        },
        closeCreateModal: (state) => {
            state.isCreateModalOpen = false;
        },
        openQr: (state, action) => {
            state.isQrOpen = true;
            state.qrCodeValue = action.payload;
        },
        closeQr: (state) => {
            state.isQrOpen = false;
            state.qrCodeValue = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchEventsStats.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchEventsStats.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.stats = action.payload;
            })
            .addCase(fetchEventsStats.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })
            .addCase(createEvent.pending, (state) => {
                state.creating = "loading";
            })
            .addCase(createEvent.fulfilled, (state) => {
                state.creating = "succeeded";
                notifySuccess("Wedding event created successfully 🎉");
            })
            .addCase(createEvent.rejected, (state, action) => {
                state.creating = "failed";
                state.error = action.payload;
                notifyError("Failed to create wedding event ❌");
            })
            .addCase(validateEventCode.fulfilled, (state) => {
                state.validating = "succeeded";
                state.isCodeValid = true;
                notifySuccess("Code is available ✅");
            })
            .addCase(validateEventCode.rejected, (state, action) => {
                state.validating = "failed";
                state.isCodeValid = false;
                state.error = action.payload;

                if (action.payload?.reason === "invalid_format") {
                    notifyError("Invalid code ❌");
                } else if (action.payload?.reason === "taken") {
                    notifyError("Code already in use ❌");
                } else {
                    notifyError("Failed to validate code ❌");
                }
            })
            .addCase(fetchEventsList.pending, (state) => {
                state.eventsStatus = "loading";
            })
            .addCase(fetchEventsList.fulfilled, (state, action) => {
                state.eventsStatus = "succeeded";
                state.events = action.payload;
            })
            .addCase(fetchEventsList.rejected, (state, action) => {
                state.eventsStatus = "failed";
                state.error = action.payload;
            })
            // delete event
            .addCase(deleteEvent.fulfilled, (state, action) => {
                const id = Number(action.payload);
                state.events = (state.events || []).filter(ev => ev.id !== id);
                notifySuccess("Event deleted ✅");
            })
            .addCase(deleteEvent.rejected, (state, action) => {
                state.error = action.payload;
                notifyError("Failed to delete event ❌");
            });
    },
});

export const { updateEventForm, resetEventForm, setEventFormStep, openCreateModal, closeCreateModal, openQr, closeQr } =
    eventsSlice.actions;
export default eventsSlice.reducer;

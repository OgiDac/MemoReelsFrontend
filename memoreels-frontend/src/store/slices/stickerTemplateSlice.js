// src/store/slices/stickerTemplateSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { DEFAULT_STICKER_LAYOUT } from "../../constants/stickerDefaults";
import { notifyError, notifySuccess } from "../../utils/toast";

export const fetchStickerTemplate = createAsyncThunk(
  "stickerTemplate/fetch",
  async (eventId, thunkAPI) => {
    try {
      const { data } = await api.get(
        `/private/api/events/${eventId}/sticker-template/`
      );

      const def = data.definition || data;
      const template = {
        paper: {
          widthMm: data.paperWidthMm ?? def.paper?.widthMm ?? 90,
          heightMm: data.paperHeightMm ?? def.paper?.heightMm ?? 90,
        },
        elements: def.elements ?? [],
      };

      return { template, fromServer: true };
    } catch (err) {
      if (err.response?.status === 404) {
        return { template: DEFAULT_STICKER_LAYOUT, fromServer: false };
      }

      return thunkAPI.rejectWithValue(
        err.response?.data?.error || "Failed to load sticker template"
      );
    }
  }
);

export const fetchStickerEventInfo = createAsyncThunk(
  "stickerTemplate/fetchEventInfo",
  async (eventId, thunkAPI) => {
    try {
      const { data } = await api.get(
        `/private/api/events/${eventId}/sticker-template/event-info`
      );
      // očekuje { id, name, code }
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || "Failed to load sticker event info"
      );
    }
  }
);

export const saveStickerTemplate = createAsyncThunk(
  "stickerTemplate/save",
  async ({ eventId, template }, thunkAPI) => {
    try {
      const payload = {
        paperWidthMm: template.paper.widthMm,
        paperHeightMm: template.paper.heightMm,
        definition: template,
      };

      await api.put(
        `/private/api/events/${eventId}/sticker-template`,
        payload
      );

      notifySuccess("Sticker template saved");
      return { template };
    } catch (err) {
      notifyError("Failed to save sticker template");
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || "Failed to save sticker template"
      );
    }
  }
);

const stickerTemplateSlice = createSlice({
  name: "stickerTemplate",
  initialState: {
    template: null,
    loading: false,
    error: null,
    fromServer: false,

    eventInfo: null,
    eventLoading: false,
    eventError: null,
  },
  reducers: {
    setTemplate(state, action) {
      state.template = action.payload;
    },
    resetToDefault(state) {
      state.template = DEFAULT_STICKER_LAYOUT;
      state.fromServer = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // template
      .addCase(fetchStickerTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStickerTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.template = action.payload.template;
        state.fromServer = action.payload.fromServer;
      })
      .addCase(fetchStickerTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load sticker template";
      })

      // event info
      .addCase(fetchStickerEventInfo.pending, (state) => {
        state.eventLoading = true;
        state.eventError = null;
      })
      .addCase(fetchStickerEventInfo.fulfilled, (state, action) => {
        state.eventLoading = false;
        state.eventInfo = action.payload;
      })
      .addCase(fetchStickerEventInfo.rejected, (state, action) => {
        state.eventLoading = false;
        state.eventError =
          action.payload || "Failed to load sticker event info";
      })

      // save
      .addCase(saveStickerTemplate.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveStickerTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.template = action.payload.template;
      })
      .addCase(saveStickerTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to save sticker template";
      });
  },
});

export const { setTemplate, resetToDefault } = stickerTemplateSlice.actions;
export default stickerTemplateSlice.reducer;

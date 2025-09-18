import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { notifySuccess, notifyError } from "../../utils/toast";

export const login = createAsyncThunk("auth/login", async (form, thunkAPI) => {
  try {
    const { data } = await api.post("/public/api/users/login", form);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.error || "Login failed");
  }
});

export const signup = createAsyncThunk("auth/signup", async (form, thunkAPI) => {
  try {
    const { data } = await api.post("/public/api/users", form);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.error || "Signup failed");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isAuthenticated: !!localStorage.getItem("accessToken"),
    accessToken: localStorage.getItem("accessToken") || null,
    refreshToken: localStorage.getItem("refreshToken") || null,
    status: "idle",
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      notifySuccess("Signed out successfully!");
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        notifySuccess("Logged in successfully!");
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        notifyError(action.payload);
      })

      // SIGNUP
      .addCase(signup.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        notifySuccess("Account created successfully!");
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        notifyError(action.payload);
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;

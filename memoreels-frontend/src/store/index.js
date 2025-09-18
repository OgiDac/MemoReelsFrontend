import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import eventsReducer from "./slices/eventsSlice"; 

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
  },
});

export default store;

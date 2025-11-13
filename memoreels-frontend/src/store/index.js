import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import eventsReducer from "./slices/eventsSlice"; 
import eventReducer from "./slices/eventSlice"
import albumsReducer from "./slices/albumsSlice"
import albumDetailReducer from "./slices/albumDetailSlice"

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    event: eventReducer,
    albums: albumsReducer,
    albumDetail: albumDetailReducer,
  },
});

export default store;

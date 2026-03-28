import { createSlice } from "@reduxjs/toolkit";
import {
  buildAuthState,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "../../utils/auth";

const authSlice = createSlice({
  name: "auth",
  initialState: buildAuthState(getStoredToken()),
  reducers: {
    setCredentials: (_, action) => {
      const token = action.payload;
      setStoredToken(token);
      return buildAuthState(token);
    },
    logout: () => {
      clearStoredToken();
      return buildAuthState(null);
    },
    hydrateAuth: () => buildAuthState(getStoredToken()),
  },
});

export const { hydrateAuth, logout, setCredentials } = authSlice.actions;

export default authSlice.reducer;

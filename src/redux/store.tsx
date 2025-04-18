import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import leaveSlice from "./leave/leaveSlice";
import userSlice from "./user/userSlice";

// Reducers

const rootReducer = combineReducers({
  leaveSlice,
  userSlice,
});

const store = configureStore({ devTools: true, reducer: rootReducer });

export default store;
export type ReduxType = ReturnType<typeof rootReducer>;

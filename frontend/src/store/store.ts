import { configureStore } from "@reduxjs/toolkit";
import companyBranchReducer from "./slices/companyBranchSlice";

export const store = configureStore({
  reducer: {
    companyBranch: companyBranchReducer,
  },
});

// Type for RootState and AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

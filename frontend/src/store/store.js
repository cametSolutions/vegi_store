import { configureStore } from "@reduxjs/toolkit";
import companyBranchReducer from "./slices/companyBranchSlice";

export const store = configureStore({
  reducer: {
    companyBranch: companyBranchReducer,
  },
});



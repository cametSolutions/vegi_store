import { configureStore } from "@reduxjs/toolkit";
import companyBranchReducer from "./slices/companyBranchSlice";
import LoaderReducer from "./slices/loaderSlice";
export const store = configureStore({
  reducer: {
    companyBranch: companyBranchReducer,
    loader: LoaderReducer,
  },
});

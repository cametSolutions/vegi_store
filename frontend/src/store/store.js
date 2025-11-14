import { configureStore } from "@reduxjs/toolkit";
import companyBranchReducer from "./slices/companyBranchSlice";
import LoaderReducer from "./slices/loaderSlice";
import transactionSlice from "./slices/transactionSlice";
export const store = configureStore({
  reducer: {
    companyBranch: companyBranchReducer,
    loader: LoaderReducer,
    transaction: transactionSlice,
  },
});

import { createSlice } from "@reduxjs/toolkit";
import getLocalStorageItem from "../../helper/getlocalstorage";
// Retrieve later with proper typing
const companyBranches = getLocalStorageItem("companyBranches");
const storedCompany = getLocalStorageItem("selectedCompany");
const storedBranch = getLocalStorageItem("selectedBranch");
const initialState = {
  selectedCompany: storedCompany ? storedCompany : null,
  selectedBranch: storedBranch ? storedBranch : null,
  branches: companyBranches ? companyBranches : [],
};
const companyBranchSlice = createSlice({
  name: "CompanyBranch",
  initialState,
  reducers: {
    SetSelectedCompanyInStore(state, action) {
      state.selectedCompany = action.payload;
    },
    SetSelectedBranchInStore(state, action) {
      state.selectedBranch = action.payload;
    },
    setBranchesInStore(state, action) {
      state.branches = action.payload;
    },
    resetCompanyAndBranchSelectionFromStore(state) {
      state.selectedCompany = null;
      state.selectedBranch = null;
    },
  },
});
export const {
  SetSelectedCompanyInStore,
  SetSelectedBranchInStore,
  setBranchesInStore,
  resetCompanyAndBranchSelectionFromStore,
} = companyBranchSlice.actions;
export default companyBranchSlice.reducer;

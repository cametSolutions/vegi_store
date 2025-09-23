import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import getLocalStorageItem from "../../helper/getlocalstorage"
export interface CompanyBranchState {
  selectedCompany: { _id: string; companyName: string } | null
  selectedBranch: { _id: string; branchName: string } | null
  branches: { _id: string; branchName: string }[]
}
const storedCompany = getLocalStorageItem<{ _id: string; companyName: string }>(
  "selectedCompany"
)
const storedBranch = getLocalStorageItem<{ _id: string; branchName: string }>(
  "selectedBranch"
)

// Retrieve later with proper typing
const companybranches =
  getLocalStorageItem<{ _id: string; branchName: string }[]>("companybranches")

console.log("storedcompnay", storedCompany)
const initialState: CompanyBranchState = {
  selectedCompany: storedCompany ? storedCompany : null,
  selectedBranch: storedBranch ? storedBranch : null,
  branches: companybranches?companybranches: []
}
const companyBranchSlice = createSlice({
  name: "CompanyBranch",
  initialState,
  reducers: {
    selectedCompany(
      state,
      action: PayloadAction<{ _id: string; companyName: string }>
    ) {
      state.selectedCompany = action.payload
    },
    selectedBranch(
      state,
      action: PayloadAction<{ _id: string; branchName: string }>
    ) {
      state.selectedBranch = action.payload
    },
    setBranches(
      state,
      action: PayloadAction<{ _id: string; branchName: string }[]>
    ) {
      state.branches = action.payload
    },
    resetSelection(state) {
      state.selectedCompany = null
      state.selectedBranch = null
    }
  }
})
export const { selectedCompany, selectedBranch, setBranches, resetSelection } =
  companyBranchSlice.actions
export default companyBranchSlice.reducer

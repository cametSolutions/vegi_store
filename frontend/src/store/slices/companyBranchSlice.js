import { createSlice } from "@reduxjs/toolkit"
import getLocalStorageItem from "../../helper/getlocalstorage"
// Retrieve later with proper typing
const companybranches =
  getLocalStorageItem("companybranches")
const storedCompany = getLocalStorageItem(
  "selectedCompany"
)
const storedBranch = getLocalStorageItem(
  "selectedBranch"
)
const initialState = {
  selectedCompany: storedCompany ? storedCompany : null,
  selectedBranch: storedBranch ? storedBranch : null,
  branches: companybranches ? companybranches : []
}
const companyBranchSlice = createSlice({
  name: "CompanyBranch",
  initialState,
  reducers: {
    selectedCompany(
      state,
      action
    ) {
      state.selectedCompany = action.payload
    },
    selectedBranch(
      state,
      action
    ) {
      state.selectedBranch = action.payload
    },
    setBranches(
      state,
      action
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

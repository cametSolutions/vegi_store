// store/filtersSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  startDate: null,
  endDate: null,
  transactionType: null,
  outstandingType: null,
};

const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state[key] = value;
    },
    clearFilter: (state, action) => {
      const key = action.payload;
      state[key] = null;
    },
    clearAllFilters: () => initialState,
  },
});

export const { setFilter, clearFilter, clearAllFilters } = filtersSlice.actions;
export default filtersSlice.reducer;

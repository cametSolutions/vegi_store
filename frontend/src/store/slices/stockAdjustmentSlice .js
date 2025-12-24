// src/store/stockAdjustmentSlice.js
import { createSlice } from "@reduxjs/toolkit";

const stockAdjustmentSlice = createSlice({
  name: "stockAdjustment",
  initialState: {
    isEditMode: false,
    editAdjustmentId: null,
    adjustmentType: null, // "add" or "remove"
  },
  reducers: {
    addStockAdjustmentDataToStore(state, action) {
      state.isEditMode = action.payload.isEditMode;
      state.editAdjustmentId = action.payload.editAdjustmentId;
      state.adjustmentType = action.payload.adjustmentType;
    },

    removeStockAdjustmentDataFromStore(state) {
      state.isEditMode = false;
      state.editAdjustmentId = null;
      state.adjustmentType = null;
    },

    // Optional: Update only edit mode status
    setEditMode(state, action) {
      state.isEditMode = action.payload;
    },

    // Optional: Update only adjustment type
    setAdjustmentType(state, action) {
      state.adjustmentType = action.payload;
    },
  },
});

export const {
  addStockAdjustmentDataToStore,
  removeStockAdjustmentDataFromStore,
  setEditMode,
  setAdjustmentType,
} = stockAdjustmentSlice.actions;

export default stockAdjustmentSlice.reducer;

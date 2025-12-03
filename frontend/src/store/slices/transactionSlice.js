// src/store/loaderSlice.js
import { createSlice } from "@reduxjs/toolkit";

const transactionSlice = createSlice({
  name: "transaction",
  initialState: {
    isEditMode: false,
    editTransactionId: null,
    transactionType: null,
  },
  reducers: {
    addTransactionDataToStore(state, action) {
      state.isEditMode = action.payload.isEditMode;
      state.editTransactionId = action.payload.editTransactionId;
      state.transactionType = action.payload.transactionType;
    },

    removeTransactionDataFromStore(state) {
      state.isEditMode = false;
      state.editTransactionId = null;
      state.transactionType = null;
    },
  },
});

export const { addTransactionDataToStore, removeTransactionDataFromStore } =
  transactionSlice.actions;
export default transactionSlice.reducer;

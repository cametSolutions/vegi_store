import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  show: false,
  progress: 0,
  message: "Initializing...",
};

const revaluationLoaderSlice = createSlice({
  name: "revaluationLoader",
  initialState,
  reducers: {
    showRevaluationLoader: (state) => {
      state.show = true;
      state.progress = 0;
      state.message = "Starting revaluation process...";
    },
    hideRevaluationLoader: (state) => {
      state.show = false;
      state.progress = 0;
      state.message = "Initializing...";
    },
    setRevaluationProgress: (state, action) => {
      state.progress = action.payload;
    },
    setRevaluationMessage: (state, action) => {
      state.message = action.payload;
    },
  },
});

export const {
  showRevaluationLoader,
  hideRevaluationLoader,
  setRevaluationProgress,
  setRevaluationMessage,
} = revaluationLoaderSlice.actions;

export default revaluationLoaderSlice.reducer;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type LeaveDetail = {
  leaveType: string;
  fromDate: string;
  toDate: string;
  project: string;
  reason: string;
  approver: string;
  appliedDate: string;
  status: string;
};

type LeaveState = {
  leaveDetails: LeaveDetail[];
};

const initialState: LeaveState = {
  leaveDetails: [],
};

const leaveSlice = createSlice({
  name: "leaveSlice",
  initialState,
  reducers: {
    updateLeaveStatus(state, action: PayloadAction<LeaveDetail>) {
      // Append the new entry to existing state
      state.leaveDetails.push(action.payload);
    },
  },
});

export const { updateLeaveStatus } = leaveSlice.actions;
export default leaveSlice.reducer;

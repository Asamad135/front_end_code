import { createSlice } from "@reduxjs/toolkit";

type UserDetail = {
  name: string;
  password?: string;
  isManager?: boolean;
  designation?: string;
  EmpId?: string;
};

type UserState = {
  userDetails: UserDetail | null;
};

const initialState: UserState = {
  userDetails: null,
};

const userSlice = createSlice({
  name: "userSlice",
  initialState,
  reducers: {
    updateUserStatus(state, action) {
      return {
        ...state,
        userDetails: action.payload,
      };
    },
  },
});

export const { updateUserStatus } = userSlice.actions;
export default userSlice.reducer;

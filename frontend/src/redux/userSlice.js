import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../services/api";

export const fetchUsers = createAsyncThunk(
  "users/fetch",
  async () => {
    console.log('Fetching users...');
    const response = await API.get("/users");
    console.log('Users response:', response.data);
    return response.data;
  }
);

export const updateUser = createAsyncThunk(
  "users/update",
  async ({ userId, role }) => (await API.put(`/users/${userId}`, { role })).data
);

const userSlice = createSlice({
  name: "users",
  initialState: [],
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        console.log('Fetching users pending...');
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        console.log('Fetching users fulfilled:', action.payload);
        return action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        console.log('Fetching users rejected:', action.error);
      });
  }
});

export default userSlice.reducer;

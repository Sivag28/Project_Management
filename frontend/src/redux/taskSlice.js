import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../services/api";

export const fetchTasks = createAsyncThunk(
  "tasks/fetch",
  async (projectId) =>
    (await API.get(`/tasks/${projectId}`)).data
);

export const createTask = createAsyncThunk(
  "tasks/create",
  async (data) => (await API.post("/tasks", data)).data
);

export const fetchAllTasks = createAsyncThunk(
  "tasks/fetchAll",
  async () => (await API.get("/tasks/all")).data
);

export const fetchMemberCompanyTasks = createAsyncThunk(
  "tasks/fetchMemberCompany",
  async () => (await API.get("/tasks/member-company")).data
);

export const fetchTasksAssignedToUser = createAsyncThunk(
  "tasks/fetchAssigned",
  async () => (await API.get("/tasks/assigned")).data
);

export const updateTaskStatus = createAsyncThunk(
  "tasks/updateStatus",
  async ({ taskId, status }) => (await API.put(`/tasks/${taskId}/status`, { status })).data
);

export const assignTask = createAsyncThunk(
  "tasks/assign",
  async ({ taskId, userId }) => (await API.put(`/tasks/assign`, { taskId, userId })).data
);

export const deleteTask = createAsyncThunk(
  "tasks/delete",
  async (taskId) => (await API.delete(`/tasks/${taskId}`)).data
);

const taskSlice = createSlice({
  name: "tasks",
  initialState: { tasks: [], allTasks: [], loading: false, error: null },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.tasks = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchTasksAssignedToUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasksAssignedToUser.fulfilled, (state, action) => {
        state.tasks = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchTasksAssignedToUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchAllTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllTasks.fulfilled, (state, action) => {
        state.allTasks = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchMemberCompanyTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMemberCompanyTasks.fulfilled, (state, action) => {
        state.allTasks = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchMemberCompanyTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateTaskStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        // Update in tasks array
        const taskIndex = state.tasks.findIndex(t => t._id === action.meta.arg.taskId);
        if (taskIndex !== -1) {
          state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...action.payload };
        }
        // Update in allTasks array
        const allTaskIndex = state.allTasks.findIndex(t => t._id === action.meta.arg.taskId);
        if (allTaskIndex !== -1) {
          state.allTasks[allTaskIndex] = { ...state.allTasks[allTaskIndex], ...action.payload };
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(assignTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(assignTask.fulfilled, (state, action) => {
        const task = state.tasks.find(t => t._id === action.meta.arg.taskId);
        if (task) {
          task.assignedTo = action.meta.arg.userId;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(assignTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { updateTaskFromSocket } = taskSlice.actions;
export default taskSlice.reducer;

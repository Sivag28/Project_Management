import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../services/api";

export const fetchProjects = createAsyncThunk(
  "projects/fetch",
  async () => (await API.get("/projects")).data
);

export const createProject = createAsyncThunk(
  "projects/create",
  async (data) => (await API.post("/projects", data)).data
);

export const fetchAllProjects = createAsyncThunk(
  "projects/fetchAll",
  async () => (await API.get("/projects/all")).data
);

export const updateProject = createAsyncThunk(
  "projects/update",
  async ({ projectId, data }) => (await API.put(`/projects/${projectId}`, data)).data
);

export const deleteProject = createAsyncThunk(
  "projects/delete",
  async (projectId) => (await API.delete(`/projects/${projectId}`)).data
);

export const fetchProjectById = createAsyncThunk(
  "projects/fetchById",
  async (projectId) => (await API.get(`/projects/${projectId}`)).data
);

const projectSlice = createSlice({
  name: "projects",
  initialState: { projects: [], loading: false, error: null },
  extraReducers: (builder) => {
    builder
      // fetchProjects cases
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // fetchAllProjects cases
      .addCase(fetchAllProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
.addCase(fetchAllProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
        state.error = null;
        console.log('🔧 fetchAllProjects FULFILLED:', action.payload.length, 'projects loaded:', action.payload.map(p => ({id: p._id, title: p.title})));
      })
      .addCase(fetchAllProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        console.error('❌ fetchAllProjects REJECTED:', action.error.message || action.error);
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.push(action.payload);
      });

  }
});

export default projectSlice.reducer;


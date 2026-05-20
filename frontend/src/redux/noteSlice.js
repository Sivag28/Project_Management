import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../services/api';

export const fetchNotes = createAsyncThunk(
  'notes/fetchNotes',
  async ({ projectId }) => {
    const response = await API.get(`/notes/${projectId}`);
    return response.data;
  }
);

export const createNote = createAsyncThunk(
  'notes/createNote',
  async (noteData) => {
    const response = await API.post('/notes', noteData);
    return response.data;
  }
);

export const updateNote = createAsyncThunk(
  'notes/updateNote',
  async ({ id, noteData }) => {
    const response = await API.put(`/notes/${id}`, noteData);
    return response.data;
  }
);

export const deleteNote = createAsyncThunk(
  'notes/deleteNote',
  async (id) => {
    await API.delete(`/notes/${id}`);
    return id;
  }
);

const noteSlice = createSlice({
  name: 'notes',
  initialState: {
    notes: [],
    loading: false,
    error: null,
    currentProjectId: null
  },
  reducers: {
    setCurrentProjectId: (state, action) => {
      state.currentProjectId = action.payload;
    },
    clearNotes: (state) => {
      state.notes = [];
      state.currentProjectId = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.notes.push(action.payload);
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        const index = state.notes.findIndex(note => note._id === action.payload._id);
        if (index !== -1) {
          state.notes[index] = action.payload;
        }
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.notes = state.notes.filter(note => note._id !== action.payload);
      });
  }
});

export const { setCurrentProjectId, clearNotes } = noteSlice.actions;
export default noteSlice.reducer;


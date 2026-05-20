
import axios from "axios";

const API = axios.create({
  baseURL: "https://project-management-fvc3.onrender.com/api"
});

// Note API convenience methods (optional, since thunks use direct calls)
export const noteAPI = {
  getNotes: (projectId) => API.get(`/notes/${projectId}`),
  createNote: (data) => API.post('/notes', data),
  updateNote: (id, data) => API.put(`/notes/${id}`, data),
  deleteNote: (id) => API.delete(`/notes/${id}`)
};

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;

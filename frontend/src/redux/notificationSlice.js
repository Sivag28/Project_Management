import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../services/api";

// Async thunks for notification operations
export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (userId) => {
    const response = await API.get("/notifications");
    return { notifications: response.data, userId };
  }
);

export const markNotificationAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async ({ notificationId, userId }) => {
    const response = await API.put(`/notifications/${notificationId}/read`);
    return { notification: response.data, userId };
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async () => {
    const response = await API.put("/notifications/read-all");
    return response.data;
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null
  },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    addRealTimeNotification: (state, action) => {
      // Only add if not already in notifications
      const exists = state.notifications.find(n => n._id === action.payload._id);
      if (!exists) {
        state.notifications.unshift(action.payload);
        state.unreadCount += 1;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.notifications.filter(n => !n.readBy.includes(action.payload.userId)).length;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n._id === action.payload.notification._id);
        if (notification && !notification.readBy.includes(action.payload.userId)) {
          notification.readBy.push(action.payload.userId);
          state.unreadCount -= 1;
        }
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => n.isRead = true);
        state.unreadCount = 0;
      });
  }
});

export const { addNotification, clearNotifications, addRealTimeNotification } = notificationSlice.actions;
export default notificationSlice.reducer;

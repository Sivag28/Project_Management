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
  async (userId) => {
    const response = await API.put("/notifications/read-all");
    return { ...response.data, userId };
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
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications || [];
        state.unreadCount = state.notifications.filter((notification) =>
          !(notification.readBy || []).some((id) => String(id?._id || id) === String(action.payload.userId))
        ).length;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n._id === action.payload.notification._id);
        if (notification) {
          notification.readBy = action.payload.notification.readBy || notification.readBy || [];
          if (!notification.readBy.some((id) => String(id?._id || id) === String(action.payload.userId))) {
            notification.readBy.push(action.payload.userId);
          }
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state, action) => {
        state.notifications.forEach((notification) => {
          notification.readBy = notification.readBy || [];
          if (!notification.readBy.some((id) => String(id?._id || id) === String(action.payload.userId))) {
            notification.readBy.push(action.payload.userId);
          }
        });
        state.unreadCount = 0;
      });
  }
});

export const { addNotification, clearNotifications, addRealTimeNotification } = notificationSlice.actions;
export default notificationSlice.reducer;

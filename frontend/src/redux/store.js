import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import projectReducer from "./projectSlice";
import taskReducer from "./taskSlice";
import userReducer from "./userSlice";
import notificationReducer from "./notificationSlice";
import noteReducer from "./noteSlice";

export default configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    tasks: taskReducer,
    users: userReducer,
    notifications: notificationReducer,
    notes: noteReducer
  }
});

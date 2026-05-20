import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import seedRoles from './utils/seedRoles.js';
import User from "./models/User.js";
import Project from "./models/Project.js";
import Task from "./models/Task.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import projectChatRoutes from "./routes/projectChatRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();
connectDB();
seedRoles();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});
app.set("io", io);

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/project-chat", projectChatRoutes);

app.get("/", (req, res) => res.send("Project Management API Running"));

app.use(errorHandler);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password").populate("role").populate("company");

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.user._id.toString()}`);

  socket.on("joinProjectChat", async ({ projectId }) => {
    if (!projectId) return;

    const project = await Project.findById(projectId).select("owner members");
    if (!project) return;

    const userId = socket.user._id.toString();
    const hasAssignedTask = await Task.exists({
      projectId,
      assignedTo: socket.user._id
    });
    const isAllowed =
      socket.user.role?.name === "Admin" ||
      project.owner?.toString() === userId ||
      project.members?.some((memberId) => memberId.toString() === userId) ||
      Boolean(hasAssignedTask);

    if (!isAllowed) return;

    socket.join(`project:${projectId}`);
  });

  socket.on("leaveProjectChat", ({ projectId }) => {
    if (!projectId) return;
    socket.leave(`project:${projectId}`);
  });
});

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on ${process.env.PORT || 5000}`)
);

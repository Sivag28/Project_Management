import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { addRealTimeNotification } from "./redux/notificationSlice";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MemberDashboard from "./pages/MemberDashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";

const App = () => {
  const token = localStorage.getItem("token");
  const dispatch = useDispatch();

  useEffect(() => {
    if (token) {
      // Set up socket connection for notifications and tasks
      const socket = io("https://project-management-fvc3.onrender.com", {
        auth: {
          token: token
        }
      });

      socket.on('connect', () => {
        console.log('Connected to server');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      // Listen for real-time notifications
      socket.on('newNotification', (notification) => {
        dispatch(addRealTimeNotification(notification));
      });

      // Store socket instance globally for use in components
      window.socket = socket;

      return () => {
        socket.disconnect();
      };
    }
  }, [token, dispatch]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/admin-dashboard" element={token ? <AdminDashboard /> : <Navigate to="/" />} />
        <Route path="/member-dashboard" element={token ? <MemberDashboard /> : <Navigate to="/" />} />
        <Route path="/projects" element={token ? <Projects /> : <Navigate to="/" />} />
        <Route path="/projects/:id" element={token ? <ProjectDetails /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default App;

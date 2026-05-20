
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjects } from "../redux/projectSlice";
import { fetchTasksAssignedToUser, fetchMemberCompanyTasks, fetchAllTasks, updateTaskStatus } from "../redux/taskSlice";
import { fetchUsers } from "../redux/userSlice";
import ProjectCard from "../components/ProjectCard";
import TaskCard from "../components/TaskCard";
import KanbanBoard from "../components/KanbanBoard";
import CommentFeed from "../components/CommentFeed";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Link, useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import { FaSearch, FaList, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaStickyNote, FaBell, FaComments } from 'react-icons/fa';
import StickyNoteBoard from "../components/StickyNoteBoard";
import ProjectChatPanel from "../components/ProjectChatPanel";

import { fetchNotes } from "../redux/noteSlice";
import API from "../services/api";
const MemberDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { projects, loading: projectsLoading, error: projectsError } = useSelector((state) => state.projects);
  const { tasks, allTasks, loading, error } = useSelector((state) => state.tasks);
  const users = useSelector((state) => state?.users || []);
  console.log('MemberDashboard users:', users);

  const [activeSection, setActiveSection] = useState('projects');
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [activeTaskTab, setActiveTaskTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showProjectNotifications, setShowProjectNotifications] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  // Reports State (adapted from AdminDashboard)
  const [reportType, setReportType] = useState('weekly');
  const [reportData, setReportData] = useState(null);
  const [viewTab, setViewTab] = useState('overview');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchTasksAssignedToUser());
    dispatch(fetchAllTasks());
    dispatch(fetchUsers());
  }, [dispatch]);

  const refreshUnreadChatCount = async () => {
    try {
      const response = await API.get('/project-chat/unread-count');
      setUnreadChatCount(response.data.unreadCount || 0);
    } catch (chatCountError) {
      console.error('Unread chat count error:', chatCountError);
    }
  };

  useEffect(() => {
    refreshUnreadChatCount();

    const handleUnreadChat = () => {
      refreshUnreadChatCount();
    };

    window.socket?.on('projectChatUnread', handleUnreadChat);

    return () => {
      window.socket?.off('projectChatUnread', handleUnreadChat);
    };
  }, []);

  // Listen for real-time task updates
  useEffect(() => {
    if (window.socket) {
      const handleTaskUpdate = (data) => {
        console.log('Task updated:', data);
        // Refresh tasks when a task is updated
        dispatch(fetchTasksAssignedToUser());
        dispatch(fetchMemberCompanyTasks());
      };


      window.socket.on('taskUpdated', handleTaskUpdate);

      return () => {
        window.socket.off('taskUpdated', handleTaskUpdate);
      };
    }
  }, [dispatch]);

  const myTasks = (tasks || []).filter(
  (t) =>
    t.assignedTo && user &&
    (t.assignedTo._id || t.assignedTo).toString() === user._id
);
  const myProjectIds = new Set(
    myTasks
      .map((task) => task.projectId?._id || task.projectId)
      .filter(Boolean)
      .map((projectId) => projectId.toString())
  );
  const myProjects = (projects || []).filter((project) => myProjectIds.has(project._id.toString()));
  const completedTasks = myTasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = myTasks.filter((t) => t.status !== "Completed").length;
  const upcomingDeadlines = myTasks.filter((t) => t.dueDate && new Date(t.dueDate) > new Date()).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 3);
  const overdueTaskAlerts = myTasks
    .filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Completed")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);
  const projectSnapshots = myProjects.slice(0, 3).map((project) => ({
    ...project,
    openTasks: myTasks.filter((task) => task.projectId && (task.projectId._id || task.projectId) === project._id && task.status !== 'Completed').length
  }));
  const notificationItems = [
    ...overdueTaskAlerts.map((task) => ({
      id: `overdue-${task._id}`,
      type: 'overdue',
      title: task.title,
      subtitle: `Overdue since ${new Date(task.dueDate).toLocaleDateString()}`,
      accent: 'red'
    })),
    ...upcomingDeadlines.map((task) => ({
      id: `deadline-${task._id}`,
      type: 'deadline',
      title: task.title,
      subtitle: `Due on ${new Date(task.dueDate).toLocaleDateString()}`,
      accent: 'amber'
    })),
    ...projectSnapshots.map((project) => ({
      id: `project-${project._id}`,
      type: 'project',
      title: project.title,
      subtitle: `${project.openTasks} open ${project.openTasks === 1 ? 'task' : 'tasks'}`,
      accent: 'blue'
    }))
  ].slice(0, 6);

  const currentDate = new Date();
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Generate calendar data for all months in the year
  const generateYearCalendar = () => {
    const yearCalendar = [];
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
      const firstDayOfMonth = new Date(currentYear, month, 1).getDay();
      const calendarDays = [];
      for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(null);
      }
      for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
      }
      yearCalendar.push({
        month,
        monthName: monthNames[month],
        calendarDays
      });
    }
    return yearCalendar;
  };

  const yearCalendar = generateYearCalendar();

  const tasksByDate = {};
  myTasks.forEach(task => {
    if (task.dueDate) {
      const dateKey = new Date(task.dueDate).toISOString().split('T')[0];
      if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
      tasksByDate[dateKey].push(task);
    }
  });

  // Filter tasks based on active tab and search
  const filteredTasks = myTasks.filter(task => {
    const title = (task.title || '').toLowerCase();
    const description = (task.description || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = title.includes(search) || description.includes(search);
    if (!matchesSearch) return false;
    switch (activeTaskTab) {
      case 'inProgress': return task.status === 'In Progress';
      case 'completed': return task.status === 'Completed';
      case 'overdue': return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';
      default: return true;
    }
  });

  // Personal Productivity Tracker
  const weeklyProgress = myTasks.length > 0 ? Math.round((completedTasks / myTasks.length) * 100) : 0;
  const badges = weeklyProgress >= 90 ? ['🏆 Champion', '⭐ Star Performer', '🚀 Go-Getter'] :
                 weeklyProgress >= 70 ? ['💪 Hard Worker', '🎯 Focused'] :
                 weeklyProgress >= 50 ? ['📈 Improving', '⚡ Active'] : ['🌱 Growing', '💡 Learning'];

  // Task Insights
  const avgCompletionTime = myTasks.length > 0 ? Math.round(myTasks.reduce((acc, task) => acc + (task.estimatedHours || 2), 0) / myTasks.length) : 0;

  // Calculate most productive day based on completed tasks
  const completedTasksWithDates = myTasks.filter(task => task.status === "Completed" && task.updatedAt);
  const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
  completedTasksWithDates.forEach(task => {
    const day = new Date(task.updatedAt).getDay();
    dayCounts[day]++;
  });
  const maxDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  const mostProductiveDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][maxDayIndex];

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      text: 'You will need to login again to continue.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, logout'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        Swal.fire({
          title: 'Logged out successfully',
          icon: 'success',
          timer: 1400,
          showConfirmButton: false
        }).then(() => {
          navigate('/login');
        });
      }
    });
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      // Filter tasks based on selected project
      let filteredTasks = myTasks;
      if (selectedProjectId) {
        filteredTasks = myTasks.filter(task => task.projectId && task.projectId._id === selectedProjectId);
      }

      // Basic metrics
      const totalTasks = filteredTasks.length;
      const completedTasksCount = filteredTasks.filter(t => t.status === 'Completed').length;
      const overdueTasks = filteredTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed'
      ).length;
      const totalProjects = projects.filter(p => 
        filteredTasks.some(t => t.projectId && t.projectId._id === p._id)
      ).length;

      // Status breakdown for pie chart
      const statusCounts = {};
      filteredTasks.forEach(task => {
        statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
      });
      const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      // Team performance (group by assignedTo if available)
      const teamPerformance = users.map(user => {
        const userTasks = filteredTasks.filter(t => 
          t.assignedTo && (t.assignedTo._id || t.assignedTo) === user._id
        );
        return {
          name: user.name || 'Unknown',
          total: userTasks.length,
          completed: userTasks.filter(t => t.status === 'Completed').length
        };
      }).filter(item => item.total > 0);

      // Dynamic trends: Group tasks by week (last 4 weeks)
      const now = new Date();
      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
        weekStart.setDate(weekStart.getDate() - i * 7);
        weeks.push(weekStart.toISOString().slice(0, 10));
      }

      const trends = weeks.map((weekStart, index) => {
        const weekTasks = filteredTasks.filter(task => {
          if (!task.dueDate || !task.createdAt) return false;
          const taskWeek = new Date(task.dueDate || task.createdAt);
          taskWeek.setDate(taskWeek.getDate() - taskWeek.getDay());
          return taskWeek.toISOString().slice(0, 10) === weekStart;
        });
        return {
          week: `Week ${4 - index}`,
          completed: weekTasks.filter(t => t.status === 'Completed').length,
          total: weekTasks.length
        };
      });

      const report = {
        type: reportType,
        filters: { 
          selectedProjectId,
          dateRange,
          selectedTeamMember,
          totalTasks: filteredTasks.length
        },
        data: {
          totalProjects,
          totalTasks,
          completedTasks: completedTasksCount,
          overdueTasks,
          statusBreakdown,
          teamPerformance,
          trends,
          completionRate: Math.round((completedTasksCount / (totalTasks || 1)) * 100)
        },
        generatedAt: new Date().toISOString()
      };

      setReportData(report);
      Swal.fire({
        icon: 'success',
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report Generated!`,
        text: `${completedTasksCount}/${totalTasks} tasks completed (${Math.round((completedTasksCount / (totalTasks || 1)) * 100)}%)`,
        confirmButtonColor: '#10b981',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Generate report error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Report Generation Failed',
        text: 'Unable to generate report. Please try again.',
        confirmButtonColor: '#10b981'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;
    const headers = ['Metric', 'Value'];
    const csvContent = [
      headers.join(','),
      ...Object.entries(reportData.data).flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((item, idx) => `${key}_${idx},${JSON.stringify(item)}`);
        }
        return [`${key},${JSON.stringify(value)}`];
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal-report-${reportType}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const exportToPDF = () => {
    if (!reportData) return;
    try {
      // Direct import for Vite/React 19
      import('jspdf').then(({ jsPDF }) => {
        const doc = new jsPDF();
        let y = 20;
        
        doc.setFontSize(20);
        doc.text(`${user?.name || 'User'} - Personal ${reportType} Report`, 20, y);
        y += 15;
        
        doc.setFontSize(12);
        doc.text(`Generated by: ${user?.name || 'User'} | ${new Date().toLocaleDateString()}`, 20, y);
        y += 10;
        
        if (reportData.filters.selectedProjectId) {
          const project = projects.find(p => p._id === reportData.filters.selectedProjectId);
          doc.text(`Project: ${project?.title || 'All Projects'}`, 20, y);
          y += 10;
        }
        
        y += 10;
        doc.text('Key Metrics:', 20, y);
        y += 10;
        
        Object.entries(reportData.data).forEach(([key, value]) => {
          if (typeof value === 'number') {
            doc.text(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`, 20, y);
            y += 8;
          }
        });
        
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        
        doc.save(`personal-report-${reportType}.pdf`);
        Swal.fire({
          icon: 'success',
          title: 'PDF Exported!',
          text: 'Report saved as PDF.',
          timer: 2000,
          showConfirmButton: false
        });
      }).catch((error) => {
        console.error('PDF export error:', error);
        Swal.fire({
          icon: 'warning',
          title: 'PDF Export',
          text: 'PDF failed. CSV export works perfectly!',
          confirmButtonColor: '#10b981'
        });
      });
    } catch (error) {
      console.error('PDF export error:', error);
      Swal.fire({
        icon: 'warning',
        title: 'PDF Export',
        text: 'CSV export works perfectly!',
        confirmButtonColor: '#10b981'
      });
    }
  };



  const handleStatusUpdate = async (taskId, newStatus) => {
    setUpdatingTaskId(taskId);
    try {
      await dispatch(updateTaskStatus({ taskId, status: newStatus })).unwrap();
      // No need to refresh tasks since the state is updated optimistically
      Swal.fire({
        icon: 'success',
        title: 'Status Updated!',
        text: 'Task status has been updated successfully.',
        confirmButtonColor: '#14b8a6',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Update task status error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update task status. Please try again.',
        confirmButtonColor: '#14b8a6'
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const memberSectionConfig = [
    { id: 'projects', icon: 'fa-project-diagram', label: 'Projects', color: 'from-emerald-400 to-teal-500' },
    { id: 'tasks', icon: 'fa-tasks', label: 'My Tasks', color: 'from-blue-400 to-indigo-500' },
    { id: 'calendar', icon: 'fa-calendar-alt', label: 'Calendar', color: 'from-purple-400 to-pink-500' },
    { id: 'reports', icon: 'fa-chart-line', label: 'Reports', color: 'from-orange-400 to-red-500' },
    { id: 'chat', icon: 'fa-comments', label: 'Project Chat', color: 'from-teal-400 to-cyan-500' },
    { id: 'sticky-notes', icon: 'fa-sticky-note', label: 'Sticky Notes', color: 'from-amber-400 to-yellow-500' }
  ];

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-800">

      {/* Sidebar Navigation */}
      <aside className="hidden min-h-screen w-64 shrink-0 border-r border-slate-700 bg-slate-900 text-white lg:block">

        <div className="border-b border-slate-700 p-8">
          <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">ProManage</h2>
        </div>
        <nav className="mt-8">
          <ul className="space-y-1">
            {memberSectionConfig.map(({ id, icon, label, color }) => (
              <li key={id}>
                <div 
                  className={`mx-4 flex cursor-pointer items-center rounded-r-2xl px-8 py-4 transition-colors duration-200 ${
                    activeSection === id ? `bg-gradient-to-r ${color} text-white` : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => setActiveSection(id)}
                >
                  <i className={`fas ${icon} mr-4 text-xl ${activeSection === id ? 'text-white' : 'text-slate-400'}`}></i>
                  <span className="font-semibold">{label}</span>
                  {activeSection === id && (
                    <div className="ml-auto h-3 w-3 rounded-full bg-emerald-400"></div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </nav>
      </aside>


      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col bg-blue-50">
        {/* Header/Navbar */}
        <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-6">

          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-2xl border border-slate-200 bg-white p-1">
              <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=linear-gradient(135deg,%233b82f6,%239935f1)&color=fff&size=128&rounded=true`} alt="Avatar" className="h-full w-full rounded-xl object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-black gradient-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Member Dashboard</h1>
              {user?.role && (
                <span className="mt-1 inline-block rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-3 py-1 text-sm font-bold text-white">
                  {user.role.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 lg:space-x-4">
            <button
              onClick={() => {
                setActiveSection('chat');
                refreshUnreadChatCount();
              }}
              className="group relative flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-200 bg-white text-teal-600 transition-colors hover:bg-teal-50"
            >
              <FaComments className="text-2xl" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-7 min-w-7 items-center justify-center rounded-2xl border-4 border-white/60 bg-gradient-to-r from-red-400 via-rose-500 to-pink-500 text-xs font-black text-white shadow-2xl ring-2 ring-red-300/50 animate-pulse">
                  {unreadChatCount > 99 ? '99+' : unreadChatCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProjectNotifications((prev) => !prev)}
                className="group relative flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
              >
                <FaBell className="text-2xl" />
                {notificationItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-7 min-w-7 items-center justify-center rounded-2xl border-4 border-white/60 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 text-xs font-black text-slate-900 shadow-2xl ring-2 ring-amber-300/50 animate-bounce">
                    {notificationItems.length > 99 ? '99+' : notificationItems.length}
                  </span>
                )}
              </button>


              {showProjectNotifications && (
                <div className="absolute right-0 top-10 z-50 w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <h3 className="text-sm font-semibold text-slate-900">Project Notifications</h3>
                    <p className="mt-1 text-xs text-slate-500">Deadlines, overdue work, and project updates.</p>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">
                    {notificationItems.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-500">
                        No urgent project updates right now.
                      </div>
                    ) : (
                      notificationItems.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
                          <div className={`mt-1 h-2.5 w-2.5 rounded-full ${
                            item.accent === 'red'
                              ? 'bg-red-500'
                              : item.accent === 'amber'
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                          }`}></div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800">{item.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                            item.accent === 'red'
                              ? 'bg-red-50 text-red-700'
                              : item.accent === 'amber'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-blue-50 text-blue-700'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="flex items-center gap-3">
                <button className="text-gray-600 hover:text-gray-800 flex items-center">
                  <i className="fas fa-user-circle text-xl mr-2"></i>
                  {user?.name}
                  <i className="fas fa-chevron-down ml-2"></i>
                </button>
                <button
                  onClick={handleLogout}
                  className="animate-card-float rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 px-6 py-3 text-sm font-black text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-rose-400/50"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>Logout
                </button>

              </div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden">
                <Link to="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Account</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</button>
              </div>
            </div>
          </div>
        </header>

        <nav className="border-b border-slate-200 bg-white/90 px-4 py-3 lg:hidden">
          <div className="flex gap-3 overflow-x-auto pb-1 custom-scroll">
            {memberSectionConfig.map(({ id, icon, label, color }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all ${
                  activeSection === id ? `bg-gradient-to-r ${color}` : 'bg-slate-800'
                }`}
              >
                <i className={`fas ${icon}`}></i>
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6">
          {activeSection === 'projects' && (
            <div className="space-y-8">
              {/* Hero Banner */}
              <div className="relative glass rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl border border-white/30 overflow-hidden animate-scale-in">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-blue-400/20 to-purple-400/20 animate-gradient-shift"></div>
                <div className="absolute top-4 right-4 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full blur-xl opacity-30 animate-particles"></div>
                <div className="absolute bottom-4 left-4 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-xl opacity-20 animate-float delay-1000"></div>
                <div className="relative z-10 text-center md:text-left">
                  <div className="inline-block animate-shimmer">
                    <h1 className="text-4xl md:text-5xl font-black gradient-text mb-4 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">Your Projects
                    </h1>
                  </div>
                  <p className="text-xl text-slate-700 mb-6 max-w-2xl animate-metric-count">
                    Manage your assigned projects with real-time progress tracking and beautiful analytics ✨
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                    <div className="glass p-6 rounded-2xl shadow-xl animate-card-float">
                      <div className="text-3xl font-black gradient-text mb-2">{myProjects.length}</div>
                      <div className="text-slate-600 font-semibold">Active Projects</div>
                    </div>
                    <div className="glass p-6 rounded-2xl shadow-xl animate-card-float delay-500">
                      <div className="text-3xl font-black text-emerald-600 mb-2">{completedTasks}</div>
                      <div className="text-slate-600 font-semibold">Completed Tasks</div>
                    </div>
                    <div className="glass p-6 rounded-2xl shadow-xl animate-card-float delay-1000">
                      <div className="text-3xl font-black text-purple-600 mb-2">{pendingTasks}</div>
                      <div className="text-slate-600 font-semibold">Pending Tasks</div>
                    </div>
                  </div>
                </div>
              </div>

              {projectsLoading ? (
                <div className="text-center py-20 glass rounded-3xl p-12 shadow-2xl animate-pulse">
                  <div className="w-24 h-24 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-8 shadow-xl"></div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2 animate-metric-count">Loading your projects...</h3>
                  <p className="text-slate-600 text-lg">Discovering new opportunities and tasks</p>
                </div>
              ) : myProjects.length > 0 ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-blue-50/50 rounded-3xl blur opacity-75 pointer-events-none"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                    {myProjects.map((project) => (
                      <div className="perspective-[1000px] card-3d group cursor-pointer" key={project._id}>
                        <div className="relative h-full transform-style-3d transition-all duration-700 hover:rotate-y-10 hover:rotate-x-5 hover:translate-z-10">
                          <ProjectCard project={project} tasks={tasks || []} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="glass rounded-3xl p-20 shadow-2xl text-center backdrop-blur-xl animate-scale-in">
                  <div className="text-8xl mb-8 animate-bounce-slow">📁✨</div>
                  <h3 className="text-3xl font-black gradient-text mb-4 bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">No Assigned Projects Yet</h3>
                  <p className="text-xl text-slate-600 mb-8 max-w-md mx-auto animate-metric-count">Your projects will appear here once assigned. Reach out to your manager to get started!</p>
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 font-bold text-white transition-all duration-300 hover:scale-105">
                    <i className="fas fa-rocket"></i>
                    Ready to Collaborate
                  </div>
                </div>
              )}
            </div>
          )}


          {activeSection === 'tasks' && (
            <div className="animate-fadeIn">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">My Tasks</h2>

              {/* Quick Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 relative">
                <div className="glass p-8 rounded-3xl shadow-2xl text-center backdrop-blur-xl transition-all duration-500 hover:shadow-3xl hover:scale-105 card-3d animate-scale-in group border border-white/40">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-3xl glass backdrop-blur-xl flex items-center justify-center shadow-2xl group-hover:animate-spin-slow">
                    <FaList className="text-3xl text-blue-400 drop-shadow-lg" />
                  </div>
                  <div className="animate-metric-count">
                    <div className="text-4xl md:text-5xl font-black gradient-text mb-3 bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">{myTasks.length}</div>
                    <div className="text-lg font-bold text-slate-700">Total Tasks</div>
                  </div>
                </div>
                <div className="glass p-8 rounded-3xl shadow-2xl text-center backdrop-blur-xl transition-all duration-500 hover:shadow-3xl hover:scale-105 card-3d animate-scale-in delay-500 group border border-white/40">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-3xl glass backdrop-blur-xl flex items-center justify-center shadow-2xl group-hover:animate-pulse">
                    <FaSpinner className="text-3xl text-amber-400 drop-shadow-lg" />
                  </div>
                  <div className="animate-metric-count delay-500">
                    <div className="text-4xl md:text-5xl font-black gradient-text mb-3 bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">{pendingTasks}</div>
                    <div className="text-lg font-bold text-slate-700">In Progress</div>
                  </div>
                </div>
                <div className="glass p-8 rounded-3xl shadow-2xl text-center backdrop-blur-xl transition-all duration-500 hover:shadow-3xl hover:scale-105 card-3d animate-scale-in delay-1000 group border border-white/40">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-3xl glass backdrop-blur-xl flex items-center justify-center shadow-2xl group-hover:animate-bounce-slow">
                    <FaCheckCircle className="text-3xl text-emerald-400 drop-shadow-lg" />
                  </div>
                  <div className="animate-metric-count delay-1000">
                    <div className="text-4xl md:text-5xl font-black gradient-text mb-3 bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">{completedTasks}</div>
                    <div className="text-lg font-bold text-slate-700">Completed</div>
                  </div>
                </div>
                <div className="glass p-8 rounded-3xl shadow-2xl text-center backdrop-blur-xl transition-all duration-500 hover:shadow-3xl hover:scale-105 card-3d animate-scale-in delay-1500 group border border-white/40">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-3xl glass backdrop-blur-xl flex items-center justify-center shadow-2xl group-hover:animate-pulse">
                    <FaExclamationTriangle className="text-3xl text-rose-400 drop-shadow-lg" />
                  </div>
                  <div className="animate-metric-count delay-1500">
                    <div className="text-4xl md:text-5xl font-black gradient-text mb-3 bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">{myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length}</div>
                    <div className="text-lg font-bold text-slate-700">Overdue</div>
                  </div>
                </div>
              </div>

              {/* Task List View with Tabs and Search */}
              <div className="mb-8 overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white shadow-sm">
                <div className="glass p-4 rounded-3xl mb-8 backdrop-blur-xl shadow-2xl border border-white/30">
                  <div className="flex flex-col lg:flex-row justify-between items-center mb-6 lg:mb-0">
                    <div className="flex space-x-3 mb-4 lg:mb-0">
                      {[
                        { key: 'all', label: 'All Tasks', icon: FaList },
                        { key: 'inProgress', label: 'In Progress', icon: FaSpinner },
                        { key: 'completed', label: 'Completed', icon: FaCheckCircle },
                        { key: 'overdue', label: 'Overdue', icon: FaExclamationTriangle }
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setActiveTaskTab(key)}
                        className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                          activeTaskTab === key ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <Icon className="mr-2" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="flex flex-wrap gap-4 md:gap-6 justify-center -m-2 p-2">
                    {filteredTasks.map((task) => (
                      <TaskCard 
                        key={task._id} 
                        task={task} 
                        onStatusUpdate={handleStatusUpdate}
                        updatingTaskId={updatingTaskId}
                      />
                    ))}
                  </div>
                </div>
                {filteredTasks.length === 0 && (
                  <div className="text-center py-12">
                    <FaList className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No tasks found matching your criteria.</p>
                  </div>
                )}
              </div>

              {/* Project Progress */}
              <div className="mb-8 bg-white p-6 rounded-xl shadow-lg">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter Kanban by Project:
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
                  >
                    <option value="">All Company Tasks</option>
                    {projects && projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.title} 
                        {project.company && ` - ${project.company.name}`}
                      </option>
                    ))}
                  </select>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Project Progress</h3>
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  After updating task status, kindly logout and login again to see the updated Kanban status.
                </div>
                <div className="max-w-full overflow-x-auto custom-scroll pb-2">
                  <KanbanBoard 
                    tasks={
                      selectedProjectId 
                        ? (allTasks || []).filter(task => 
                            task.projectId && (task.projectId._id || task.projectId) === selectedProjectId
                          )
                        : allTasks || []
                    } 
                    users={users} 
                    showUserStatusSummary={false} 
                  />
                </div>
              </div>

              {/* Personal Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Task Completion Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Tasks</span>
                      <span className="font-bold">{myTasks.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed</span>
                      <span className="font-bold text-green-600">{completedTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending</span>
                      <span className="font-bold text-orange-600">{pendingTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate</span>
                      <span className="font-bold text-blue-600">{weeklyProgress}%</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <PieChart width={200} height={150}>
                      <Pie data={[
                        { name: 'Completed', value: completedTasks, fill: '#10b981' },
                        { name: 'Pending', value: pendingTasks, fill: '#f59e0b' }
                      ]} cx={100} cy={75} outerRadius={50} dataKey="value">
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Productivity Streaks</h3>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {badge}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between mb-2">
                      <span>Weekly Progress</span>
                      <span className="font-bold">{weeklyProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className={`h-4 rounded-full transition-all duration-500 ${weeklyProgress >= 80 ? 'bg-green-500' : weeklyProgress >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${weeklyProgress}%` }}></div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <BarChart width={200} height={100} data={[{ name: 'Progress', value: weeklyProgress }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'calendar' && (
            <div className="animate-fadeIn">
              {/* Hero Section */}
              <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-8 mb-8 text-white overflow-hidden">
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white bg-opacity-10 rounded-full"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white bg-opacity-10 rounded-full"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <i className="fas fa-calendar-alt text-4xl mr-4 text-yellow-300"></i>
                    <div>
                      <h1 className="text-4xl font-bold mb-2">Calendar & Deadlines</h1>
                      <p className="text-lg opacity-90">Stay organized and never miss a deadline</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 mt-6">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-clock text-yellow-300"></i>
                      <span className="text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-tasks text-green-300"></i>
                      <span className="text-sm">{myTasks.length} Total Tasks</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-exclamation-triangle text-red-300"></i>
                      <span className="text-sm">{myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length} Overdue</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar Header */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6 rounded-2xl shadow-2xl mb-6 transform hover:scale-105 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                      <i className="fas fa-calendar-week text-2xl"></i>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{currentYear} Overview</h3>
                      <p className="text-sm opacity-80">Plan ahead and stay productive</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-white bg-opacity-10 px-4 py-2 rounded-xl">
                      <i className="fas fa-calendar-day text-lg"></i>
                      <label htmlFor="year-select" className="text-sm font-medium">Year:</label>
                      <select
                        id="year-select"
                        value={currentYear}
                        onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                        className="text-gray-800 border border-gray-300 rounded px-2 py-1 cursor-pointer font-semibold bg-white"
                      >
                        {Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - 2 + i).map(year => (
                          <option key={year} value={year} className="text-gray-800 bg-white">
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentYear(currentYear - 1)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-xl transition-all duration-300 hover:scale-110"
                        title="Previous Year"
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      <button
                        onClick={() => setCurrentYear(currentYear + 1)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-xl transition-all duration-300 hover:scale-110"
                        title="Next Year"
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Year Calendar Grid */}
              <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 p-8 rounded-3xl shadow-2xl border border-gray-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-pink-100/20 rounded-3xl"></div>
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full"></div>
                <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full"></div>
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
                      <i className="fas fa-calendar-week text-2xl mr-3 text-blue-600"></i>
                      {currentYear} Calendar Overview
                    </h3>
                    <p className="text-gray-600">Visual timeline of your tasks and deadlines</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {yearCalendar.map(({ month, monthName, calendarDays }) => (
                      <div key={month} className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 group">
                        <div className="text-center mb-4">
                          <h4 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors duration-300">{monthName}</h4>
                          <div className="text-sm text-gray-500 font-medium">{currentYear}</div>
                          <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-2 group-hover:from-purple-500 group-hover:to-pink-500 transition-all duration-300"></div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-xs">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                            <div key={day} className="text-center font-bold text-gray-400 py-2 text-sm">{day}</div>
                          ))}
                          {calendarDays.map((day, index) => {
                            const dateKey = day ? `${currentYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
                            const dayTasks = dateKey ? tasksByDate[dateKey] || [] : [];
                            const isToday = day === currentDate.getDate() && month === currentDate.getMonth() && currentYear === currentDate.getFullYear();
                            const hasOverdue = dayTasks.some(task => new Date(task.dueDate) < new Date() && task.status !== 'Completed');
                            const hasUpcoming = dayTasks.some(task => new Date(task.dueDate) >= new Date());

                            return (
                              <div
                                key={index}
                                className={`relative text-center py-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                                  day ? 'hover:bg-gradient-to-br hover:from-blue-100 hover:to-purple-100 cursor-pointer shadow-md' : ''
                                } ${isToday ? 'bg-gradient-to-br from-green-400 to-blue-500 text-white font-bold shadow-lg scale-110 ring-2 ring-green-300' : 'text-gray-700'}`}
                              >
                                {day && (
                                  <>
                                    <div className="font-semibold">{day}</div>
                                    {dayTasks.length > 0 && (
                                      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                                        {dayTasks.length > 9 ? '9+' : dayTasks.length}
                                      </div>
                                    )}
                                    {hasOverdue && <div className="absolute bottom-1 left-1 w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-sm animate-bounce"></div>}
                                    {hasUpcoming && !hasOverdue && <div className="absolute bottom-1 left-1 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-sm animate-bounce"></div>}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Deadline Sections Container */}
              <div className="space-y-8">
                {/* Upcoming Deadlines */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <i className="fas fa-clock text-blue-500 mr-3"></i>
                    Upcoming Deadlines
                  </h3>
                  {myTasks.filter(t => t.dueDate && new Date(t.dueDate) > new Date() && t.status !== 'Completed').length > 0 ? (
                    <div className="space-y-4">
                      {myTasks.filter(t => t.dueDate && new Date(t.dueDate) > new Date() && t.status !== 'Completed').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map(task => (
                        <div key={task._id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                          <div>
                            <h4 className="font-semibold text-gray-800">{task.title}</h4>
                            <p className="text-sm text-gray-600">{task.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            <div className="mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                task.priority === 'High' ? 'bg-red-100 text-red-800' :
                                task.priority === 'Low' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {task.priority || 'Medium'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No upcoming deadlines.</p>
                  )}
                </div>

                {/* Missed Deadlines */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <i className="fas fa-exclamation-triangle text-red-500 mr-3"></i>
                    Missed Deadlines
                  </h3>
                  {myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length > 0 ? (
                    <div className="space-y-4">
                      {myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map(task => (
                        <div key={task._id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                          <div>
                            <h4 className="font-semibold text-gray-800">{task.title}</h4>
                            <p className="text-sm text-gray-600">{task.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            <div className="mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                task.priority === 'High' ? 'bg-red-100 text-red-800' :
                                task.priority === 'Low' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {task.priority || 'Medium'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No missed deadlines.</p>
                  )}
                </div>

                {/* Completed Deadlines */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <i className="fas fa-check-circle text-green-500 mr-3"></i>
                    Completed Deadlines
                  </h3>
                  {myTasks.filter(t => t.status === 'Completed').length > 0 ? (
                    <div className="space-y-4">
                      {myTasks.filter(t => t.status === 'Completed').sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 10).map(task => (
                        <div key={task._id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                          <div>
                            <h4 className="font-semibold text-gray-800">{task.title}</h4>
                            <p className="text-sm text-gray-600">{task.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-500">Completed: {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'N/A'}</span>
                            <div className="mt-1">
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                Completed
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No completed deadlines yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}



          {activeSection === 'kanban' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Kanban Board - Company Tasks</h2>
              <KanbanBoard tasks={allTasks} users={users} showUserStatusSummary={false} />
            </div>
          )}

          {activeSection === 'sticky-notes' && (
            <div className="animate-fadeIn">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center">
                  <FaStickyNote className="mr-3 text-amber-500 text-3xl" />
                  Sticky Notes Board
                </h2>
                <p className="text-xl text-gray-600">Quick notes, ideas, and reminders pinned to your projects 🟡🟠🩷</p>
              </div>
              <StickyNoteBoard />
            </div>
          )}
          {activeSection === 'chat' && (
            <div className="animate-fadeIn">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-comments mr-3 text-teal-500 text-3xl"></i>
                  Project Chat
                </h2>
                <p className="text-xl text-gray-600">
                  Select a project and chat only with the members of that project.
                </p>
              </div>
              <ProjectChatPanel projects={myProjects} user={user} onSeenMessages={refreshUnreadChatCount} />
            </div>
          )}
          {activeSection === 'reports' && (
            <div>
              {/* Reports Header */}
              <div className="mb-8 overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-8 py-10 text-white shadow-sm">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-emerald-100">
                  <i className="fas fa-chart-bar text-emerald-300"></i>
                  Reports Workspace
                </div>
                <h2 className="mb-4 flex items-center text-3xl font-black tracking-tight md:text-4xl">
                  <i className="fas fa-chart-bar mr-3 text-3xl text-emerald-300"></i>
                  Personal Reports & Analytics
                </h2>
                <p className="max-w-2xl text-lg text-slate-200">Track your productivity, project performance, and team contribution</p>
              </div>

              {/* Floating Reports Controls */}
              <div className="mb-8 rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-sm">
                <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr_260px]">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Report Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full px-5 py-4 glass backdrop-blur-md rounded-2xl border-2 border-white/50 focus:border-purple-400/80 focus:outline-none focus:ring-4 focus:ring-purple-400/30 shadow-2xl hover:shadow-3xl transition-all duration-400 font-semibold text-slate-800"
                    >
                      <option value="weekly">📊 Weekly Summary</option>
                      <option value="monthly">📈 Monthly Summary</option>
                      <option value="project">🎯 Project Summary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Filter by Project</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full px-5 py-4 glass backdrop-blur-md rounded-2xl border-2 border-white/50 focus:border-emerald-400/80 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 shadow-2xl hover:shadow-3xl transition-all duration-400 font-semibold text-slate-800"
                    >
                      <option value="">🌐 All My Projects</option>
                      {projects.map(project => (
                        <option key={project._id} value={project._id}>
                          {project.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={generateReport}
                      disabled={isGenerating}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent shadow-lg"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-chart-line text-lg"></i>
                          <span className="tracking-wide">Generate Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {reportData ? (
                <div className="space-y-8">
                  {/* KPI Flip Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="relative h-40 w-full overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                      <div className="flip-card-front absolute inset-0 p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-blue-500/90 to-blue-600/90 text-white">
                        <div className="w-14 h-14 glass backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 shadow-xl">
                          <i className="fas fa-project-diagram text-2xl"></i>
                        </div>
                        <p className="text-blue-100 text-sm font-semibold mb-1 opacity-90">Projects</p>
                        <p className="text-3xl font-black">{reportData.data.totalProjects || 0}</p>
                      </div>
                      <div className="flip-card-back absolute inset-0 p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-blue-400/90 to-blue-500/90 text-white">
                        <p className="text-sm font-medium mb-2">Active project count across all assignments</p>
                        <div className="w-full bg-white/30 rounded-full h-2">
                          <div className="bg-white h-2 rounded-full animate-liquid-fill" style={{width: '100%'}}></div>
                        </div>
                      </div>
                    </div>
                    <div className="relative h-40 w-full overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm">
                      <div className="flip-card-front absolute inset-0 p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-green-500/90 to-green-600/90 text-white">
                        <div className="w-14 h-14 glass backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 shadow-xl">
                          <i className="fas fa-tasks text-2xl"></i>
                        </div>
                        <p className="text-green-100 text-sm font-semibold mb-1 opacity-90">Total Tasks</p>
                        <p className="text-3xl font-black drop-shadow-lg">{reportData.data.totalTasks || 0}</p>
                      </div>
                      <div className="flip-card-back absolute inset-0 p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-green-400/90 to-green-500/90 text-white">
                        <p className="text-sm font-medium mb-2">All assigned tasks across projects</p>
                        <div className="w-full bg-white/30 rounded-full h-2">
                          <div className="bg-white h-2 rounded-full animate-liquid-fill" style={{width: '100%'}}></div>
                        </div>
                      </div>
                    </div>
                    <div className="relative h-40 w-full overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                      <div className="flip-card-front absolute inset-0 p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-emerald-500/90 to-emerald-600/90 text-white">
                        <div className="w-14 h-14 glass backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 shadow-xl">
                          <i className="fas fa-check-circle text-2xl"></i>
                        </div>
                        <p className="text-emerald-100 text-sm font-semibold mb-1 opacity-90">Completed</p>
                        <p className="text-3xl font-black drop-shadow-lg">{reportData.data.completedTasks || 0}</p>
                      </div>
                      <div className="flip-card-back absolute inset-0 p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-emerald-400/90 to-emerald-500/90 text-white">
                        <p className="text-sm font-medium mb-2">Tasks successfully delivered on time</p>
                        <div className="w-full bg-white/30 rounded-full h-2">
                          <div className="bg-white h-2 rounded-full animate-liquid-fill" style={{width: '100%'}}></div>
                        </div>
                      </div>
                    </div>
                    <div className="relative h-40 w-full overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-sm">
                      <div className="flip-card-front absolute inset-0 p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-red-500/90 to-red-600/90 text-white">
                        <div className="w-14 h-14 glass backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 shadow-xl animate-pulse">
                          <i className="fas fa-clock text-2xl"></i>
                        </div>
                        <p className="text-red-100 text-sm font-semibold mb-1 opacity-90">Overdue</p>
                        <p className="text-3xl font-black drop-shadow-lg">{reportData.data.overdueTasks || 0}</p>
                      </div>
                      <div className="flip-card-back absolute inset-0 p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-red-400/90 to-red-500/90 text-white">
                        <p className="text-sm font-medium mb-2">Tasks needing immediate attention</p>
                        <div className="text-sm text-center mt-2 font-bold text-red-200">
                          Prioritize these first!
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-sm">
                    <button 
                      onClick={exportToCSV} 
                      className="flex items-center gap-3 rounded-2xl bg-emerald-500 px-8 py-3 font-bold text-white transition hover:bg-emerald-600"
                    >
                      <i className="fas fa-file-csv text-lg"></i>
                      <span>Export CSV</span>
                    </button>
                    <button 
                      onClick={exportToPDF}
                      className="flex items-center gap-3 rounded-2xl bg-rose-500 px-8 py-3 font-bold text-white transition hover:bg-rose-600"
                    >
                      <i className="fas fa-file-pdf text-lg"></i>
                      <span>Export PDF</span>
                    </button>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Enhanced Task Status Pie Chart */}
                    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white/80 p-8 shadow-sm">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5"></div>
                      <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-4 relative z-10 bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent drop-shadow-lg">
                        <i className="fas fa-chart-pie text-emerald-500 text-2xl animate-spin-slow"></i>
                        Task Status Breakdown ✨
                      </h3>
                      <div className="relative z-10">
                        <PieChart width={450} height={350} className="animate-chart-enter delay-300">
                          <Pie
                            data={reportData.data.statusBreakdown || []}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={50}
                            dataKey="value"
                            nameKey="name"
                            cornerRadius={8}
                          >
                            {reportData.data.statusBreakdown?.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'][index % 5]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }} />
                          <Legend wrapperStyle={{paddingTop: '20px'}} />
                        </PieChart>
                      </div>
                    </div>

                    {/* Performance Trends Line Chart */}
                    <div className="rounded-[28px] border border-slate-200 bg-white/80 p-8 shadow-sm">
                      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <i className="fas fa-chart-line text-blue-600"></i>Weekly Performance Trend
                      </h3>
                      <LineChart width={400} height={300} data={reportData.data.trends || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} />
                        <Line type="monotone" dataKey="total" stroke="#64748b" strokeWidth={3} strokeDasharray="5 5" />
                      </LineChart>
                    </div>
                  </div>

                  {/* Team Performance Bar (if applicable) */}
                  {reportData.data.teamPerformance && reportData.data.teamPerformance.length > 0 && (
                    <div className="rounded-[28px] border border-slate-200 bg-white/80 p-8 shadow-sm">
                      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <i className="fas fa-users text-purple-600"></i>Team Performance
                      </h3>
                      <BarChart width={800} height={300} data={reportData.data.teamPerformance.slice(0, 6)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completed" fill="#10b981" name="Completed" />
                        <Bar dataKey="total" fill="#ef4444" name="Total" />
                      </BarChart>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-white to-slate-100 py-20 text-center shadow-sm">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600">
                    <i className="fas fa-chart-line text-4xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-600 mb-2">No Reports Generated</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Click "Generate Report" to analyze your tasks, projects, and productivity metrics.
                  </p>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>📊 Weekly/Monthly summaries</div>
                    <div>🎯 Project-specific analytics</div>
                    <div>📈 Performance trends & charts</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white p-4 text-center text-gray-600">
          <p>&copy; 2023 ProManage. All rights reserved.</p>
          <div className="mt-2">
            <Link to="/help" className="text-green-600 hover:text-green-700 mr-4">Help & Support</Link>
            <Link to="/feedback" className="text-green-600 hover:text-green-700">Feedback</Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MemberDashboard;

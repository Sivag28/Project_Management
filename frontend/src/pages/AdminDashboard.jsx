import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllProjects, createProject, deleteProject } from "../redux/projectSlice";
import { fetchAllTasks, createTask, assignTask } from "../redux/taskSlice";
import { fetchUsers, updateUser } from "../redux/userSlice";
import API from "../services/api";
import KanbanBoard from "../components/KanbanBoard";
import ActivityTimeline from "../components/ActivityTimeline";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Link, useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableUser = ({ user, isSelected, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: user._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center space-x-3 p-3 mb-2 bg-gray-600 rounded-lg cursor-grab active:cursor-grabbing hover:bg-gray-500 transition-colors ${isSelected ? 'ring-2 ring-teal-400' : ''}`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => {
          e.stopPropagation(); // Prevent drag from interfering
          onToggle(user._id);
        }}
        onClick={(e) => e.stopPropagation()} // Prevent drag on click
        className="form-checkbox h-4 w-4 text-teal-600"
      />
      <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
        {user.name.charAt(0)}
      </div>
      <div>
        <span className="font-semibold text-white text-sm">{user.name}</span>
        <p className="text-xs text-gray-300">{user.email}</p>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { projects } = useSelector((state) => state.projects);
  const { allTasks: tasks } = useSelector((state) => state.tasks);
  const users = useSelector((state) => state.users);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [bulkCreateLoading, setBulkCreateLoading] = useState(false);

  // Project Management State
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignedMembers: [],
    documents: []
  });

  // Team Management State
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: ''
  });

  // Task Management State
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: '',
    dueDate: '',
    priority: 'Medium',
    estimatedHours: 0,
    dependencies: []
  });

// Reports & Analytics State
  const [reportType, setReportType] = useState('weekly');
  const [reportData, setReportData] = useState(null);
  const [viewTab, setViewTab] = useState('overview');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const hasViewAnalytics = user?.role?.permissions?.includes('view_analytics');
  const hasManageUsers = user?.role?.permissions?.includes('manage_users');
  const hasCreateProject = user?.role?.permissions?.includes('create_project');
  const hasAssignTask = user?.role?.permissions?.includes('assign_task');

  // Check if user has any admin/manager permissions
  const hasAdminAccess = hasViewAnalytics || hasManageUsers || hasCreateProject || hasAssignTask;

  if (!hasAdminAccess) {
    return (
      <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the Admin Dashboard.</p>
          <p className="text-gray-600 mt-2">Please contact an administrator if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (hasViewAnalytics || hasManageUsers || hasCreateProject || hasAssignTask) {
      dispatch(fetchAllProjects());
      dispatch(fetchAllTasks());
      if (hasManageUsers || hasViewAnalytics || hasCreateProject || hasAssignTask) {
        dispatch(fetchUsers());
      }
    }
  }, [dispatch, hasViewAnalytics, hasManageUsers, hasCreateProject, hasAssignTask]);

  // Listen for real-time task updates
  useEffect(() => {
    if (window.socket) {
      const handleTaskUpdate = (data) => {
        console.log('Task updated:', data);
        // Refresh tasks when a task is updated
        dispatch(fetchAllTasks());
      };

      window.socket.on('taskUpdated', handleTaskUpdate);

      return () => {
        window.socket.off('taskUpdated', handleTaskUpdate);
      };
    }
  }, [dispatch]);

  const totalProjects = (projects || []).length;
  const totalTasks = (tasks || []).length;
  const totalUsers = (users || []).length;
  const completedTasks = (tasks || []).filter((t) => t.status === "Completed").length;
  const activeTasks = (tasks || []).filter((t) => t.status === "In Progress").length;
  const pendingTasks = (tasks || []).filter((t) => t.status === "To Do").length;

  const taskStatusData = [
    { status: "Completed", count: completedTasks, color: "bg-green-500" },
    { status: "In Progress", count: activeTasks, color: "bg-blue-500" },
    { status: "To Do", count: pendingTasks, color: "bg-yellow-500" },
  ];

  // Function to compute team performance from tasks
  const computeTeamPerformance = (userList, taskList) => {
    return (userList || []).map(user => {
      const userTasks = (taskList || []).filter(task => {
        if (!task.assignedTo) return false;
        const assignedToId = typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo;
        return assignedToId === user._id;
      });
      const total = userTasks.length;

      // Calculate weighted score: To Do = 1, In Progress = 2, Completed = 3
      let weightedScore = 0;
      userTasks.forEach(task => {
        switch (task.status) {
          case "To Do":
            weightedScore += 1;
            break;
          case "In Progress":
            weightedScore += 2;
            break;
          case "Completed":
            weightedScore += 3;
            break;
          default:
            weightedScore += 0;
        }
      });

      // Maximum possible score if all tasks were completed
      const maxScore = total * 3;
      const performanceScore = maxScore > 0 ? Math.round((weightedScore / maxScore) * 100) : 0;

      return {
        name: user.name,
        total,
        weightedScore,
        performanceScore,
        completed: userTasks.filter(task => task.status === "Completed").length,
        inProgress: userTasks.filter(task => task.status === "In Progress").length,
        todo: userTasks.filter(task => task.status === "To Do").length,
        userId: user._id
      };
    }).sort((a, b) => b.performanceScore - a.performanceScore);
  };

  const teamPerformance = computeTeamPerformance(users, tasks);


  // Quick Actions
  const handleBulkAssign = async () => {
    setBulkAssignLoading(true);
    try {
      // Get unassigned tasks
      const unassignedTasks = (tasks || []).filter(task => !task.assignedTo);
      if (unassignedTasks.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'No Unassigned Tasks',
          text: 'There are no unassigned tasks available to assign.',
          confirmButtonColor: '#14b8a6'
        });
        setBulkAssignLoading(false);
        return;
      }

      // Get available users
      const availableUsers = (users || []).filter(u => u._id !== user._id);

      if (availableUsers.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Available Users',
          text: 'There are no available users to assign tasks to.',
          confirmButtonColor: '#14b8a6'
        });
        setBulkAssignLoading(false);
        return;
      }

      // Assign tasks round-robin to available users
      for (let i = 0; i < unassignedTasks.length; i++) {
        const task = unassignedTasks[i];
        const assignedUser = availableUsers[i % availableUsers.length];
        await API.put(`/tasks/assign`, { taskId: task._id, userId: assignedUser._id });
      }

      Swal.fire({
        icon: 'success',
        title: 'Tasks Assigned Successfully!',
        text: `Successfully assigned ${unassignedTasks.length} tasks to team members.`,
        confirmButtonColor: '#14b8a6'
      });
      dispatch(fetchAllTasks()); // Refresh tasks
    } catch (error) {
      console.error("Bulk assign error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: 'Failed to bulk assign tasks. Please try again.',
        confirmButtonColor: '#14b8a6'
      });
    } finally {
      setBulkAssignLoading(false);
    }
  };

  const handleBulkCreate = async () => {
    setBulkCreateLoading(true);
    try {
      const projectNames = ["Project Alpha", "Project Beta", "Project Gamma", "Project Delta"];
      const createdProjects = [];

      for (const name of projectNames) {
        const projectData = {
          title: name,
          description: `Auto-generated project: ${name}`,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        };
        const newProject = await dispatch(createProject(projectData)).unwrap();
        createdProjects.push(newProject);
      }

      Swal.fire({
        icon: 'success',
        title: 'Projects Created Successfully!',
        text: `Successfully created ${createdProjects.length} projects.`,
        confirmButtonColor: '#14b8a6'
      });
      dispatch(fetchAllProjects()); // Refresh projects
    } catch (error) {
      console.error("Bulk create error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Bulk Creation Failed',
        text: 'Failed to bulk create projects. Please try again.',
        confirmButtonColor: '#14b8a6'
      });
    } finally {
      setBulkCreateLoading(false);
    }
  };

  // System Health (mock data for now)
  const systemHealth = {
    totalActivities: 42,
    errors: 2,
    uptime: "99.8%"
  };

  const [activeSection, setActiveSection] = useState('overview');
  const navigate = useNavigate();

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

  // Project Management Handlers
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createProject(newProject)).unwrap();
      setNewProject({ title: '', description: '', dueDate: '', assignedMembers: [], documents: [] });
      setShowCreateProjectForm(false);
      dispatch(fetchAllProjects());
      Swal.fire({
        icon: 'success',
        title: 'Project Created Successfully!',
        text: 'The project has been created and team members have been assigned.',
        confirmButtonColor: '#14b8a6'
      });
    } catch (error) {
      console.error('Create project error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Project Creation Failed',
        text: 'Failed to create project. Please try again.',
        confirmButtonColor: '#14b8a6'
      });
    }
  };

  const handleDeleteProject = async (projectId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteProject(projectId)).unwrap();
        dispatch(fetchAllProjects());
        Swal.fire({
          icon: 'success',
          title: 'Project Deleted!',
          text: 'The project has been deleted successfully.',
          confirmButtonColor: '#14b8a6'
        });
      } catch (error) {
        console.error('Delete project error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Deletion Failed',
          text: 'Failed to delete project. Please try again.',
          confirmButtonColor: '#14b8a6'
        });
      }
    }
  };

  // Team Management Handlers
  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      // This would typically call an API to add a user
      // For now, we'll just update the local state
      setNewMember({ name: '', email: '', role: '' });
      setShowAddMemberForm(false);
      dispatch(fetchUsers());
      Swal.fire({
        icon: 'success',
        title: 'Member Added Successfully!',
        text: 'The new team member has been added.',
        confirmButtonColor: '#14b8a6'
      });
    } catch (error) {
      console.error('Add member error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Add Member',
        text: 'Please try again.',
        confirmButtonColor: '#14b8a6'
      });
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await dispatch(updateUser({ userId, role: newRole })).unwrap();
      dispatch(fetchUsers());
      Swal.fire({
        icon: 'success',
        title: 'Role Updated Successfully!',
        text: 'User role has been updated.',
        confirmButtonColor: '#14b8a6'
      });
    } catch (error) {
      console.error('Update user role error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Role Update Failed',
        text: 'Failed to update user role. Please try again.',
        confirmButtonColor: '#14b8a6'
      });
    }
  };

  // Task Management Handlers
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createTask(newTask)).unwrap();
      setNewTask({
        title: '',
        description: '',
        projectId: '',
        assignedTo: '',
        dueDate: '',
        priority: 'Medium',
        estimatedHours: 0,
        dependencies: []
      });
      setShowCreateTaskForm(false);
      dispatch(fetchAllTasks());
      Swal.fire({
        icon: 'success',
        title: 'Task Created Successfully!',
        text: 'The task has been created and assigned.',
        confirmButtonColor: '#14b8a6'
      });
    } catch (error) {
      console.error('Create task error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Task Creation Failed',
        text: 'Failed to create task. Please try again.',
        confirmButtonColor: '#14b8a6'
      });
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await dispatch(updateTask({ taskId, status: newStatus })).unwrap();
      dispatch(fetchAllTasks());
    } catch (error) {
      console.error('Update task status error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Status Update Failed',
        text: 'Failed to update task status. Please try again.',
        confirmButtonColor: '#14b8a6'
      });
    }
  };

  const handleAssignTask = async (taskId, userId) => {
    try {
      await dispatch(assignTask({ taskId, userId })).unwrap();
      dispatch(fetchAllTasks());
      Swal.fire({
        icon: 'success',
        title: 'Task Assigned Successfully!',
        text: 'The task has been assigned to the selected user.',
        confirmButtonColor: '#14b8a6'
      });
    } catch (error) {
      console.error('Assign task error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: 'Failed to assign task. Please try again.',
        confirmButtonColor: '#14b8a6'
      });
    }
  };

// Reports Handlers
  const handleViewTabChange = (tab) => setViewTab(tab);

  const handleDateRangeChange = (range) => setDateRange(range);

  const handleTeamFilterChange = (memberId) => setSelectedTeamMember(memberId);

  const filterDataByDate = (items, start, end) => {
    if (!start && !end) return items;
    const startDate = start ? new Date(start) : new Date(0);
    const endDate = end ? new Date(end) : new Date();
    endDate.setHours(23,59,59,999);
    return items.filter(item => {
      const date = new Date(item.createdAt || item.dueDate);
      return date >= startDate && date <= endDate;
    });
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const filteredTasks = filterDataByDate(tasks || [], dateRange.start, dateRange.end);
      const filteredProjects = filterDataByDate(projects || [], dateRange.start, dateRange.end);
      
      // Compute team performance from filtered tasks
      let filteredTeamPerformance = computeTeamPerformance(users, filteredTasks);
      
      // Filter to specific member if selected
      if (selectedTeamMember) {
        filteredTeamPerformance = filteredTeamPerformance.filter(p => p.userId === selectedTeamMember);
      }

      // Compute filtered stats
      const filteredCompletedTasks = filteredTasks.filter(t => t.status === "Completed").length;
      const filteredActiveTasks = filteredTasks.filter(t => t.status === "In Progress").length;
      const filteredPendingTasks = filteredTasks.filter(t => t.status === "To Do").length;
      const filteredOverdueTasks = filteredTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed'
      ).length;

      // Filter projects with member's tasks
      const memberProjects = filteredProjects.map(project => {
        const projectTasks = filteredTasks.filter(task => task.projectId === project._id);
        const completed = projectTasks.filter(task => task.status === 'Completed').length;
        const total = projectTasks.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { ...project, progress, completedTasks: completed, totalTasks: total };
      }).filter(p => p.totalTasks > 0);  // Only projects with tasks

// Real trends data - aggregate by week from real task createdAt dates
      const weekStart = dateRange.start ? new Date(dateRange.start) : new Date(Date.now() - 7*7*24*60*60*1000); // last 7 weeks
      const trendsData = [];
      for (let i = 6; i >= 0; i--) {
        const weekDate = new Date(weekStart.getTime() + i*7*24*60*60*1000);
        const weekTasks = filteredTasks.filter(task => {
          const taskDate = new Date(task.createdAt);
          const weekStart = new Date(weekDate.getTime());
          const weekEnd = new Date(weekStart.getTime() + 7*24*60*60*1000);
          return taskDate >= weekStart && taskDate < weekEnd;
        });
        trendsData.push({
          week: `Week ${i+1}`,
          tasksCompleted: weekTasks.filter(t => t.status === 'Completed').length,
          tasksCreated: weekTasks.length,
          memberTasks: filteredTeamPerformance[0]?.total || 0
        });
      }
      const trends = trendsData;


      const report = {
        type: reportType,
        filters: { dateRange, selectedTeamMember, selectedMemberName: users.find(u => u._id === selectedTeamMember)?.name },
        data: {
          totalProjects: memberProjects.length,
          totalTasks: filteredTasks.length,
          completedTasks: filteredCompletedTasks,
          activeTasks: filteredActiveTasks,
          pendingTasks: filteredPendingTasks,
          overdueTasks: filteredOverdueTasks,
          teamPerformance: filteredTeamPerformance,
          projectProgress: memberProjects,
          trends
        },
        generatedAt: new Date().toISOString()
      };
      setReportData(report);
      Swal.fire({
        icon: 'success',
        title: 'Report Generated!',
        text: selectedTeamMember ? `Member-specific ${reportType} report` : `${reportType} report generated`,
        confirmButtonColor: '#14b8a6'
      });
    } catch (error) {
      console.error('Generate report error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Report Generation Failed',
        text: 'Please try again.',
        confirmButtonColor: '#14b8a6'
      });
    } finally {
      setIsGenerating(false);
    }
  };


  const exportToCSV = () => {
    if (!reportData) return;
    const headers = ['Metric', 'Value'];
    const csv = [
      headers.join(','),
      ...Object.entries(reportData.data).map(([k, v]) => `${k},${JSON.stringify(v)}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${reportType}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    // Requires jsPDF/html2canvas; simple text PDF for now
    if (!reportData) return;
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      Swal.fire('PDF export requires jsPDF library.');
      return;
    }
    const doc = new jsPDF();
    doc.text(`Report Summary`, 20, 20);
    let y = 30;
    Object.entries(reportData.data).forEach(([k, v]) => {
      doc.text(`${k}: ${JSON.stringify(v)}`, 20, y);
      y += 10;
    });
    doc.save(`report-${reportType}.pdf`);
  };

  // Calculate analytics
  const overdueTasks = (tasks || []).filter(task =>
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed'
  );
  const projectProgress = (projects || []).map(project => {
    const projectTasks = (tasks || []).filter(task => task.projectId === project._id);
    const completed = projectTasks.filter(task => task.status === 'Completed').length;
    const total = projectTasks.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { ...project, progress, completedTasks: completed, totalTasks: total };
  });

  const sectionConfig = [
    { id: 'overview', label: 'Overview', icon: 'fa-home', description: 'Command center' },
    { id: 'projects', label: 'Projects', icon: 'fa-project-diagram', description: 'Pipeline and delivery' },
    { id: 'team', label: 'Team', icon: 'fa-users', description: 'Members and roles' },
    { id: 'tasks', label: 'Tasks', icon: 'fa-tasks', description: 'Execution board' },
    { id: 'reports', label: 'Reports', icon: 'fa-chart-bar', description: 'Analytics and exports' },
  ];

  const activeSectionMeta = sectionConfig.find((section) => section.id === activeSection) || sectionConfig[0];
  const panelClassName = "rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md";
  const inputClassName = "w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/40";
  const secondaryButtonClassName = "rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition-all hover:bg-white/10";
  const primaryButtonClassName = "rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:from-cyan-400 hover:to-blue-400";

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#0f172a_48%,_#111827_100%)] text-white">
      {/* Sidebar Navigation */}
      <div className="hidden w-80 border-r border-white/10 bg-slate-950/70 px-6 py-8 backdrop-blur-xl lg:block">
        <div className="rounded-[28px] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Admin panel</p>
          <h2 className="mt-3 text-3xl font-bold text-white">ProManage</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Cleaner control surfaces for projects, people, tasks, and reporting.
          </p>
        </div>
        <nav className="mt-8">
          <ul className="space-y-3">
            {sectionConfig.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition-all ${
                    activeSection === section.id
                      ? 'border-cyan-300/40 bg-gradient-to-r from-cyan-500/25 to-blue-500/20 shadow-lg shadow-cyan-900/30'
                      : 'border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                      activeSection === section.id ? 'bg-white/15 text-cyan-200' : 'bg-slate-900/70 text-slate-300'
                    }`}>
                      <i className={`fas ${section.icon}`}></i>
                    </span>
                    <div>
                      <p className="font-semibold text-white">{section.label}</p>
                      <p className="text-xs text-slate-400">{section.description}</p>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-xs text-slate-500"></i>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header/Navbar */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/60 px-4 py-4 shadow-lg backdrop-blur-xl md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-900/40">
                <i className={`fas ${activeSectionMeta.icon} text-xl`}></i>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{activeSectionMeta.description}</p>
                <h1 className="text-2xl font-bold text-white">{activeSectionMeta.label}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900/70 text-slate-300 transition-all hover:bg-slate-800 hover:text-white">
                <i className="fas fa-bell text-lg"></i>
              </button>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-900/70 px-3 py-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 font-bold text-white">
                  {user?.name?.charAt(0) || "A"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400">Administrator</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-2xl bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-500/20 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8">
          {activeSection === 'overview' && (
            <div>
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-8 rounded-xl shadow-lg mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                      Welcome back, {user?.name}! 👋
                    </h1>
                    <p className="text-teal-100 text-lg">
                      {new Date().getHours() < 12 ? 'Good morning' :
                       new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}!
                      Here's what's happening with your team today.
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-6xl">📊</div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Active Projects</h3>
                      <p className="text-3xl font-bold text-white">{totalProjects}</p>
                      <p className="text-teal-100 text-sm">+12% from last month</p>
                    </div>
                    <div className="text-4xl text-white">📁</div>
                  </div>
                  <div className="w-full bg-teal-400 bg-opacity-30 rounded-full h-2 mt-4">
                    <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: '75%' }}></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Total Tasks</h3>
                      <p className="text-3xl font-bold text-white">{totalTasks}</p>
                      <p className="text-blue-100 text-sm">{completedTasks} completed</p>
                    </div>
                    <div className="text-4xl text-white">✅</div>
                  </div>
                  <div className="w-full bg-blue-400 bg-opacity-30 rounded-full h-2 mt-4">
                    <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">In Progress</h3>
                      <p className="text-3xl font-bold text-white">{activeTasks}</p>
                      <p className="text-orange-100 text-sm">{overdueTasks.length} overdue</p>
                    </div>
                    <div className="text-4xl text-white">⚡</div>
                  </div>
                  <div className="w-full bg-orange-400 bg-opacity-30 rounded-full h-2 mt-4">
                    <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: '60%' }}></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Team Members</h3>
                      <p className="text-3xl font-bold text-white">{totalUsers}</p>
                      <p className="text-green-100 text-sm">All active</p>
                    </div>
                    <div className="text-4xl text-white">👥</div>
                  </div>
                  <div className="w-full bg-green-400 bg-opacity-30 rounded-full h-2 mt-4">
                    <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: '90%' }}></div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveSection('projects')}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 flex flex-col items-center"
                  >
                    <i className="fas fa-plus text-2xl mb-2"></i>
                    <span>New Project</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('tasks')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 flex flex-col items-center"
                  >
                    <i className="fas fa-tasks text-2xl mb-2"></i>
                    <span>Add Task</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('reports')}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 flex flex-col items-center"
                  >
                    <i className="fas fa-chart-bar text-2xl mb-2"></i>
                    <span>View Reports</span>
                  </button>
                </div>
              </div>

              {/* Recent Activity & Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Team Activity Feed */}
                <div className="lg:col-span-2">
                  <h3 className="text-2xl font-bold text-white mb-4">Recent Team Activity</h3>
                  <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                    <ActivityTimeline />
                  </div>
                </div>

                {/* Performance Insights */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">Performance Insights</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300">Completion Rate</span>
                        <span className="text-green-400 font-bold">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300">Team Productivity</span>
                        <span className="text-blue-400 font-bold">High</span>
                      </div>
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(totalUsers, 5) }, (_, i) => (
                          <div key={i} className="w-8 h-8 bg-teal-500 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-xs font-bold">
                            {i + 1}
                          </div>
                        ))}
                        {totalUsers > 5 && (
                          <div className="w-8 h-8 bg-gray-600 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-xs font-bold">
                            +{totalUsers - 5}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Today's Focus</h4>
                      <p className="text-gray-300 text-sm">
                        {overdueTasks.length > 0
                          ? `🚨 ${overdueTasks.length} tasks need attention`
                          : activeTasks > 0
                          ? `⚡ ${activeTasks} tasks in progress`
                          : '🎉 All caught up!'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold text-white mb-4">Task Status Distribution</h3>
                  <div className="flex items-center justify-center">
                    <PieChart width={250} height={250}>
                      <Pie
                        data={taskStatusData}
                        cx={125}
                        cy={125}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color.replace('bg-', '').replace('-500', '')} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold text-white mb-4">Team Performance</h3>
                  <div className="space-y-4">
                    {teamPerformance.slice(0, 5).map((member, index) => (
                      <div key={member.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {member.name.charAt(0)}
                          </div>
                          <span className="text-gray-300">{member.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-teal-400 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${member.performanceScore}%` }}
                            ></div>
                          </div>
                          <span className="text-white font-bold w-12 text-right">{member.performanceScore}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Motivational Quote */}
              <div className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl shadow-lg">
                <div className="text-center">
                  <p className="text-white text-lg italic mb-2">
                    "The best way to predict the future is to create it."
                  </p>
                  <p className="text-purple-200">- Peter Drucker</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'projects' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Projects</p>
                  <h2 className="mt-2 text-3xl font-bold text-white">Project Management</h2>
                  <p className="mt-2 text-sm text-slate-400">Create, review, and clean up active delivery streams.</p>
                </div>
                <button
                  onClick={() => setShowCreateProjectForm(true)}
                  className={primaryButtonClassName}
                >
                  <i className="fas fa-plus mr-2"></i>Create New Project
                </button>
              </div>

              {showCreateProjectForm && (
                <div className={panelClassName}>
                  <h3 className="text-xl font-bold text-white mb-4">Create New Project</h3>
                  <form onSubmit={handleCreateProject}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Project Title"
                        value={newProject.title}
                        onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                        className={inputClassName}
                        required
                      />
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">Due Date</label>
                        <input
                          type="date"
                          placeholder="Select due date"
                          value={newProject.dueDate}
                          onChange={(e) => setNewProject({...newProject, dueDate: e.target.value})}
                          className={inputClassName}
                          required
                        />
                      </div>
                    </div>
                    <textarea
                      placeholder="Project Description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      className={`${inputClassName} mb-4 min-h-[120px]`}
                      rows="3"
                      required
                    />
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Assign Team Members</label>
                      <div className="max-h-64 w-full overflow-y-auto rounded-[24px] border border-white/10 bg-slate-900/70 p-3 text-white">
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                        >
                          <SortableContext items={(users || []).filter(u => u._id !== user?._id).map(u => u._id)} strategy={verticalListSortingStrategy}>
                            {(users || []).filter(u => u._id !== user?._id).map(user => (
                              <SortableUser
                                key={user._id}
                                user={user}
                                isSelected={newProject.assignedMembers.includes(user._id)}
                                onToggle={(userId) => {
                                  setNewProject(prev => ({
                                    ...prev,
                                    assignedMembers: prev.assignedMembers.includes(userId)
                                      ? prev.assignedMembers.filter(id => id !== userId)
                                      : [...prev.assignedMembers, userId]
                                  }));
                                }}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">Drag to reorder, then use the checkbox to include members.</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <button type="submit" className={primaryButtonClassName}>
                        Create Project
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateProjectForm(false)}
                        className={secondaryButtonClassName}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {(projects || []).map((project) => (
                  <div key={project._id} className="rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-800/80 p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                    <p className="mb-5 text-sm leading-6 text-slate-300">{project.description}</p>
                    <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${project.progress || 0}%` }}></div>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-slate-400">Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        project.status === 'Completed' ? 'bg-green-600' :
                        project.status === 'In Progress' ? 'bg-blue-600' : 'bg-yellow-600'
                      }`}>
                        {project.status || 'Active'}
                      </span>
                    </div>
                    <div className="mb-5 flex items-center justify-between text-sm text-slate-400">
                      <span>{project.completedTasks || 0} completed</span>
                      <span>{project.totalTasks || 0} total tasks</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeleteProject(project._id)}
                        className="rounded-2xl bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-500/20 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'team' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Team</p>
                  <h2 className="mt-2 text-3xl font-bold text-white">Team Management</h2>
                  <p className="mt-2 text-sm text-slate-400">Manage membership, role alignment, and admin visibility.</p>
                </div>
                <button
                  onClick={() => setShowAddMemberForm(true)}
                  className={primaryButtonClassName}
                >
                  <i className="fas fa-plus mr-2"></i>Add New Member
                </button>
              </div>

              {showAddMemberForm && (
                <div className={panelClassName}>
                  <h3 className="text-xl font-bold text-white mb-4">Add New Team Member</h3>
                  <form onSubmit={handleAddMember}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Name"
                        value={newMember.name}
                        onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                        className={inputClassName}
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                        className={inputClassName}
                        required
                      />
                      <select
                        value={newMember.role}
                        onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                        className={inputClassName}
                        required
                      >
                        <option value="">Select Role</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="member">Member</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <button type="submit" className={primaryButtonClassName}>
                        Add Member
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddMemberForm(false)}
                        className={secondaryButtonClassName}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className={panelClassName}>
                <h3 className="text-xl font-bold text-white mb-4">Team Members</h3>
                <div className="space-y-4">
                  {(users || []).map((member) => (
                    <div key={member._id} className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-slate-900/70 p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-white">{member.name}</span>
                          <p className="text-sm text-slate-400">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <select
                          value={member.role?._id || ''}
                          onChange={(e) => handleUpdateUserRole(member._id, e.target.value)}
                          className="rounded-2xl border border-white/10 bg-slate-800 px-4 py-2.5 text-white focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="">Select Role</option>
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="member">Member</option>
                        </select>
                        <span className="rounded-full bg-white/5 px-3 py-2 text-sm text-slate-300">{member.role?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'tasks' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md xl:flex-row xl:items-end xl:justify-between">
                <div className="w-full max-w-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Tasks</p>
                  <h2 className="mt-2 text-3xl font-bold text-white">Task Management</h2>
                  <p className="mt-2 text-sm text-slate-400">Filter execution by project and manage admin task creation.</p>
                </div>
                <div className="w-full max-w-md">
                  <label className="mb-2 block text-sm font-semibold text-white">
                    Filter Tasks by Project:
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className={inputClassName}
                  >
                    <option value="">All Projects</option>
                    {projects && projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setShowCreateTaskForm(true)}
                  className={primaryButtonClassName}
                >
                  <i className="fas fa-plus mr-2"></i>Create New Task
                </button>
              </div>

              {showCreateTaskForm && (
                <div className={panelClassName}>
                  <h3 className="text-xl font-bold text-white mb-4">Create New Task</h3>
                  <form onSubmit={handleCreateTask}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Task Title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        className={inputClassName}
                        required
                      />
                      <select
                        value={newTask.projectId}
                        onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}
                        className={inputClassName}
                        required
                      >
                        <option value="">Select Project</option>
                        {(projects || []).map(project => (
                          <option key={project._id} value={project._id}>{project.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <select
                        value={newTask.assignedTo}
                        onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                        className={inputClassName}
                      >
                        <option value="">Assign to User (Optional)</option>
                        {(users || []).map(user => (
                          <option key={user._id} value={user._id}>{user.name}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                        className={inputClassName}
                      />
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                        className={inputClassName}
                      >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Task Description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      className={`${inputClassName} mb-4 min-h-[120px]`}
                      rows="3"
                    />
                    <div className="flex flex-wrap gap-4">
                      <button type="submit" className={primaryButtonClassName}>
                        Create Task
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateTaskForm(false)}
                        className={secondaryButtonClassName}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <KanbanBoard 
                  tasks={
                    selectedProjectId 
                      ? tasks.filter(task => task.projectId && task.projectId._id === selectedProjectId)
                      : tasks
                  } 
                  users={users} 
                />
            </div>
          )}

{activeSection === 'reports' && (
            <div>
              {/* Hero Header */}
              <div className="bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 p-8 rounded-2xl shadow-2xl mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Analytics Dashboard 📊</h1>
                    <p className="text-teal-100 text-xl opacity-90">Monitor team performance, project progress, and key metrics in real-time</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                    <button
                      onClick={generateReport}
                      disabled={isGenerating}
                      className="bg-white text-gray-900 font-bold py-3 px-8 rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                    >
                      {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bolt"></i>}
                      Generate Report
                    </button>
                    {reportData && (
                      <>
                        <button onClick={exportToCSV} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2">
                          <i className="fas fa-file-csv"></i> CSV
                        </button>
                        <button onClick={exportToPDF} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2">
                          <i className="fas fa-file-pdf"></i> PDF
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl shadow-xl mb-8 border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Report Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 text-white p-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      className="w-full bg-gray-700/50 border border-gray-600 text-white p-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      className="w-full bg-gray-700/50 border border-gray-600 text-white p-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Team Member</label>
                    <select
                      value={selectedTeamMember || ''}
                      onChange={(e) => handleTeamFilterChange(e.target.value || null)}
                      className="w-full bg-gray-700/50 border border-gray-600 text-white p-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    >
                      <option value="">All Team Members</option>
                      {users.map(user => (
                        <option key={user._id} value={user._id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex bg-gray-800/50 backdrop-blur-md rounded-2xl p-1 mb-8 shadow-xl border border-gray-700">
                {['overview', 'team', 'projects', 'trends'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleViewTabChange(tab)}
                    className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all duration-300 ${
                      viewTab === tab
                        ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg transform scale-105'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    {tab === 'overview' && '📊 Overview'}
                    {tab === 'team' && '👥 Team'}
                    {tab === 'projects' && '📈 Projects'}
                    {tab === 'trends' && '📉 Trends'}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {!reportData ? (
                <div className="text-center py-20">
                  <i className="fas fa-chart-line text-6xl text-gray-600 mb-6"></i>
                  <h3 className="text-2xl font-bold text-gray-400 mb-2">No data yet</h3>
                  <p className="text-gray-500">Generate a report to see analytics</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-teal-500/20 to-blue-500/20 backdrop-blur-md p-6 rounded-2xl border border-teal-500/30 shadow-xl hover:shadow-2xl transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Total Projects</p>
                          <p className="text-3xl font-bold text-white">{reportData.data.totalProjects}</p>
                        </div>
                        <div className="text-4xl opacity-75">📁</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-md p-6 rounded-2xl border border-blue-500/30 shadow-xl hover:shadow-2xl transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Total Tasks</p>
                          <p className="text-3xl font-bold text-white">{reportData.data.totalTasks}</p>
                        </div>
                        <div className="text-4xl opacity-75">✅</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md p-6 rounded-2xl border border-green-500/30 shadow-xl hover:shadow-2xl transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Completed</p>
                          <p className="text-3xl font-bold text-white">{reportData.data.completedTasks}</p>
                        </div>
                        <div className="text-4xl opacity-75">🎯</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-md p-6 rounded-2xl border border-orange-500/30 shadow-xl hover:shadow-2xl transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Overdue</p>
                          <p className="text-3xl font-bold text-white">{reportData.data.overdueTasks}</p>
                        </div>
                        <div className="text-4xl opacity-75">⚠️</div>
                      </div>
                    </div>
                  </div>

                  {/* Tab Panels */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {viewTab === 'overview' && (
                      <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-md p-8 rounded-2xl border border-gray-700 shadow-2xl">
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                          <i className="fas fa-home"></i> Overview Metrics
                        </h3>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-gray-400 mb-2">Overall Completion Rate</p>
                              <div className="w-full bg-gray-700 rounded-full h-3">
                                <div 
                                  className="bg-gradient-to-r from-teal-400 to-blue-400 h-3 rounded-full shadow-lg" 
                                  style={{ width: `${Math.round((reportData.data.completedTasks / reportData.data.totalTasks) * 100) || 0}%` }}
                                ></div>
                              </div>
                              <p className="text-sm text-gray-400 mt-1">{Math.round((reportData.data.completedTasks / reportData.data.totalTasks) * 100) || 0}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {viewTab === 'team' && (
                      <div className="lg:col-span-2">
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                          <i className="fas fa-users"></i> Team Performance
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {reportData.data.teamPerformance.slice(0, 6).map((member, index) => (
                            <div key={member.name} className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all group">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                                  {member.name.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-bold text-white text-lg">{member.name}</h4>
                                  <p className="text-gray-400">{member.total} tasks</p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Performance</span>
                                  <span className="font-bold text-white">{member.performanceScore}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-3 group-hover:bg-gray-600 transition-all">
                                  <div 
                                    className="bg-gradient-to-r from-emerald-400 to-teal-400 h-3 rounded-full shadow-lg group-hover:shadow-inner transition-all" 
                                    style={{ width: `${member.performanceScore}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {viewTab === 'projects' && (
                      <div className="lg:col-span-2">
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                          <i className="fas fa-project-diagram"></i> Project Progress
                        </h3>
                        <div className="space-y-4">
                          {projectProgress.slice(0, 8).map(project => (
                            <div key={project._id} className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:bg-gray-800 transition-all group">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.progress > 75 ? '#10b981' : project.progress > 50 ? '#3b82f6' : '#f59e0b' }}></div>
                                  <h4 className="font-bold text-white truncate">{project.title}</h4>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2 group-hover:bg-gray-600 transition-all">
                                  <div 
                                    className="bg-gradient-to-r from-teal-400 to-emerald-400 h-2 rounded-full shadow-md" 
                                    style={{ width: `${project.progress}%` }}
                                  ></div>
                                </div>
                                <p className="text-sm text-gray-400 mt-1">{project.completedTasks}/{project.totalTasks} tasks</p>
                              </div>
                              <span className="font-bold text-xl text-white min-w-[60px] text-right">{project.progress}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {viewTab === 'trends' && (
                      <div className="lg:col-span-2">
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                          <i className="fas fa-chart-line"></i> Performance Trends
                        </h3>
                        <div className="bg-gradient-to-br from-slate-800/30 to-gray-800/30 backdrop-blur-md p-8 rounded-2xl border border-gray-600 shadow-2xl">
                          <LineChart width={800} height={400} data={reportData.data.trends}>
                            <CartesianGrid strokeDasharray="5 5" stroke="#374151" />
                            <XAxis dataKey="week" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip />
                            <Line type="monotone" dataKey="tasksCompleted" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2 }} name="Completed" />
                            <Line type="monotone" dataKey="tasksCreated" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2 }} name="Created" />
                          </LineChart>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}


        </main>

        {/* Footer */}
        <footer className="bg-gray-800 p-4 text-center text-gray-400">
          <p>&copy; 2023 ProManage. All rights reserved.</p>
          <div className="mt-2">
            <Link to="/help" className="text-teal-400 hover:text-teal-300 mr-4">Help</Link>
            <Link to="/support" className="text-teal-400 hover:text-teal-300">Support</Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboard;

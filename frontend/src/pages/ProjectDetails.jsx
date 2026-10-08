import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchTasks } from "../redux/taskSlice";
import { fetchProjectById } from "../redux/projectSlice";
import { fetchUsers } from "../redux/userSlice";
import KanbanBoard from "../components/KanbanBoard";
import { FaArrowLeft, FaCalendarAlt, FaCheckCircle, FaClock, FaFolderOpen, FaTasks } from "react-icons/fa";

const ProjectDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const tasks = useSelector((s) => s.tasks.tasks);
  const project = useSelector((s) => s.projects.projects.find(p => p._id === id));
  const users = useSelector((s) => s.users || []);
  const loading = useSelector((s) => s.tasks.loading);

  useEffect(() => {
    dispatch(fetchTasks(id));
    dispatch(fetchProjectById(id));
    dispatch(fetchUsers());
  }, [id, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50 p-8">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white/85 p-12 text-center shadow-sm">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500"></div>
          <p className="mt-6 text-lg font-semibold text-slate-700">Loading project details...</p>
        </div>
      </div>
    );
  }

  const companyUsers = users.filter((user) => {
    const userCompanyId = user?.company?._id || user?.company;
    const projectCompanyId = project?.company?._id || project?.company;
    return userCompanyId && projectCompanyId && userCompanyId === projectCompanyId;
  });

  const totalTasks = Array.isArray(tasks) ? tasks.length : 0;
  const completedTasks = tasks.filter((task) => task.status === "Completed").length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = tasks.filter(
    (task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "Completed"
  ).length;
  const dueDateValue = project?.dueDate || project?.deadline;
  const dueLabel = dueDateValue ? new Date(dueDateValue).toLocaleDateString() : "No deadline";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <Link
            to="/member-dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FaArrowLeft />
            Back to Dashboard
          </Link>
        </div>

        {project && (
          <div className="overflow-hidden rounded-[32px] border border-emerald-200 bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-100 text-slate-900 shadow-md">
            <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.4fr_0.9fr]">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-sm font-semibold text-emerald-900 shadow-sm">
                  <FaFolderOpen className="text-emerald-700" />
                  Project Overview
                </div>
                <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                  {project.title || project.name || "Untitled Project"}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                  {project.description || "No project description available."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                    Status: {project.status || "Active"}
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                    Priority: {project.priority || "Not set"}
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                    Deadline: {dueLabel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-md">
                  <div className="flex items-center gap-3 text-emerald-800">
                    <FaTasks />
                    <span className="text-sm font-semibold">Total Tasks</span>
                  </div>
                  <p className="mt-3 text-3xl font-black text-slate-900">{totalTasks}</p>
                </div>
                <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-md">
                  <div className="flex items-center gap-3 text-emerald-800">
                    <FaCheckCircle />
                    <span className="text-sm font-semibold">Completed</span>
                  </div>
                  <p className="mt-3 text-3xl font-black text-slate-900">{completedTasks}</p>
                </div>
                <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-md">
                  <div className="flex items-center gap-3 text-emerald-800">
                    <FaClock />
                    <span className="text-sm font-semibold">Overdue</span>
                  </div>
                  <p className="mt-3 text-3xl font-black text-slate-900">{overdueTasks}</p>
                </div>
                <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-md">
                  <div className="flex items-center gap-3 text-emerald-800">
                    <FaCalendarAlt />
                    <span className="text-sm font-semibold">Progress</span>
                  </div>
                  <p className="mt-3 text-3xl font-black text-slate-900">{progress}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[28px] border border-emerald-200 bg-white p-6 shadow-md">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Project Team</h3>
              <p className="mt-3 text-3xl font-black text-slate-900">{companyUsers.length}</p>
              <p className="mt-1 text-sm text-slate-500">Company members available for assignment</p>
            </div>

            <div className="rounded-[28px] border border-emerald-200 bg-white p-6 shadow-md">
              <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
                <span>Completion</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-[28px] border border-emerald-200 bg-white p-6 shadow-md">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Task Board</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Drag tasks across columns to update the project workflow.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
              </div>
            </div>

            <div className="max-w-full overflow-x-auto custom-scroll pb-2">
              <KanbanBoard tasks={tasks} users={users} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;

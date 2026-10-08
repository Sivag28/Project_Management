import { useState } from "react";
import { useSelector } from "react-redux";
import { FaComments, FaLeaf } from "react-icons/fa";
import CommentFeed from "./CommentFeed";

const TaskCard = ({ task, onStatusUpdate, updatingTaskId }) => {
  const [showComments, setShowComments] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const getStatusProgress = (status) => {
    const progressMap = {
      'Backlog': 10,
      'To Do': 30,
      'In Progress': 60,
      'Testing': 85,
      'Completed': 100
    };
    return progressMap[status] || 0;
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High': return 'border-rose-200 bg-rose-50 text-rose-700';
      case 'Medium': return 'border-amber-200 bg-amber-50 text-amber-800';
      case 'Low': return 'border-emerald-200 bg-emerald-50 text-emerald-800';
      default: return 'border-slate-200 bg-slate-50 text-slate-700';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'border-emerald-200 bg-emerald-50 text-emerald-800';
      case 'In Progress': return 'border-sky-200 bg-sky-50 text-sky-800';
      case 'Testing': return 'border-violet-200 bg-violet-50 text-violet-800';
      case 'To Do': return 'border-amber-200 bg-amber-50 text-amber-800';
      default: return 'border-slate-200 bg-slate-50 text-slate-700';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';

  return (
    <div className="group relative w-full max-w-[440px] min-h-[420px] overflow-hidden rounded-[1.35rem] border border-[#bfd2c0] bg-gradient-to-br from-white via-white to-[#f5f9f4] p-6 shadow-[0_12px_30px_rgba(32,56,42,0.11)] transition-all duration-300 hover:-translate-y-1 hover:border-[#8eaf92] hover:shadow-[0_18px_38px_rgba(32,56,42,0.16)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#74a77b] via-[#3f8057] to-[#73b0a0]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-[#eaf3e8]/80 blur-2xl" aria-hidden="true" />
      {updatingTaskId === task._id && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#e8f2e8]/95 via-[#dcebdd]/95 to-[#cfe3d2]/95">
          <div className="flex items-center justify-center gap-3 text-center font-bold text-[#285d42]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3d7650] border-t-transparent"></div>
            <FaLeaf className="shrink-0 text-[#3d7650]" aria-hidden="true" />
            <span>Updating Status...</span>
          </div>
        </div>
      )}
      
      {/* Priority Badge */}
      <div className={`absolute right-5 top-5 z-10 flex items-center gap-1.5 rounded-full border px-3 py-1.5 shadow-sm ${getPriorityBadgeClass(task.priority)}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em]">
          {task.priority || 'Medium'}
        </span>
      </div>

      {/* Overdue Dot */}
      {isOverdue && (
        <div className="absolute -top-3 -left-3 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg animate-pulse z-10"></div>
      )}

      <div className="relative z-10">
        <div className="mb-5 flex min-h-11 items-center gap-3 pr-24">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d9e7d7] bg-gradient-to-br from-[#f0f7ef] to-[#e3f0e3] text-[#4d8059] shadow-sm">
            <FaLeaf className="text-sm" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="mb-0.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#78917d]">Task</p>
            <h3 className="line-clamp-2 text-xl font-bold leading-snug tracking-tight text-[#20382a]">
              {task.title}
            </h3>
          </div>
        </div>
        
        <p className="mb-5 line-clamp-4 min-h-6 text-sm leading-relaxed text-slate-600">{task.description}</p>

        {/* Status & Due */}
        <div className="mb-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Current status</span>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(task.status)}`}>
              {task.status || 'Backlog'}
            </span>
            {task.dueDate && (
              <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                isOverdue 
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-[#dce8dc] bg-white/90 text-[#48634e]'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isOverdue ? 'bg-rose-500' : 'bg-emerald-500'}`} aria-hidden="true" />
                {isOverdue ? 'OVERDUE' : `Due ${new Date(task.dueDate).toLocaleDateString()}`}
              </span>
            )}
          </div>
          
          {user?.role && (
            <div className="flex items-center justify-between rounded-xl border border-[#dbe7db] bg-gradient-to-r from-[#f4f8f3] to-[#f8faf7] px-3.5 py-3 text-sm font-medium text-[#52685a] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <span>Your role</span>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#3e684a] shadow-sm">{user.role.name}</span>
            </div>
          )}
        </div>

        {/* Liquid Progress Bar */}
        <div className="mb-7">
          <div className="mb-2 flex justify-between text-sm text-slate-500">
            <span className="font-medium">Progress</span>
            <span className="font-bold tabular-nums text-[#345c40]">{getStatusProgress(task.status)}%</span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-[#dce8dc] bg-[#eaf0e9] shadow-inner">
            <div
              className="absolute left-0 top-0 h-full rounded-full shadow-[0_0_10px_rgba(63,128,87,0.28)] transition-[width] duration-700"
              style={{
                width: `${getStatusProgress(task.status)}%`,
                background: task.status === 'Completed'
                  ? 'linear-gradient(90deg, #10b981, #0f9488)'
                  : 'linear-gradient(90deg, #79a981, #438257)',
              }}
            />
          </div>
        </div>

        {/* Status Update Select */}
        <select
          value={task.status}
          onChange={(e) => onStatusUpdate?.(task._id, e.target.value)}
          disabled={updatingTaskId === task._id}
          className="w-full cursor-pointer rounded-xl border border-[#cbdccb] bg-white px-4 py-3.5 text-sm font-semibold text-[#294334] shadow-[0_2px_5px_rgba(35,68,43,0.04)] transition-all hover:border-[#8eaf92] hover:bg-[#fbfdfb] focus:border-[#54845e] focus:outline-none focus:ring-4 focus:ring-emerald-700/10"
        >
          <option value="Backlog">Backlog</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Testing">Testing</option>
          <option value="Completed">Completed</option>
        </select>

        {/* Comments Toggle */}
        <button 
          onClick={() => setShowComments(!showComments)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d0dfd0] bg-gradient-to-r from-[#f8fbf7] to-[#f0f6ef] p-3.5 text-sm font-semibold text-[#45664f] shadow-[0_2px_6px_rgba(35,68,43,0.04)] transition-all hover:border-[#a9c4aa] hover:from-[#f0f7ef] hover:to-[#eaf3e8] hover:shadow-[0_5px_12px_rgba(35,68,43,0.09)]"
        >
          <FaComments className="text-base" aria-hidden="true" />
          {showComments ? 'Hide Comments' : 'Show Comments'}
        </button>

        {showComments && (
          <div className="mt-4 pt-4 border-t border-slate-200/50">
            <CommentFeed taskId={task._id} />
          </div>
        )}
      </div>

    </div>
  );
};

export default TaskCard;

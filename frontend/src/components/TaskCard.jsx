import { useState } from "react";
import { useSelector } from "react-redux";
import { FaComments } from "react-icons/fa";
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'from-red-400 to-pink-500';
      case 'Medium': return 'from-amber-400 to-orange-500';
      case 'Low': return 'from-emerald-400 to-teal-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';

  return (
    <div className="group relative w-full max-w-[440px] min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-7 shadow-xl transition-all duration-500 hover:scale-105 card-3d animate-card-float">
      {updatingTaskId === task._id && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/80 to-purple-500/80 flex items-center justify-center z-20 rounded-2xl">
          <div className="flex items-center space-x-3 text-white font-bold">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            <span>Updating Status...</span>
          </div>
        </div>
      )}
      
      {/* Priority Badge */}
      <div className={`absolute -top-3 -right-3 z-10 flex h-24 w-24 items-center justify-center rounded-2xl shadow-2xl ${getPriorityColor(task.priority)}`}>
        <span className="font-black text-white text-sm uppercase tracking-wide drop-shadow-lg">
          {task.priority || 'Medium'}
        </span>
      </div>

      {/* Overdue Dot */}
      {isOverdue && (
        <div className="absolute -top-3 -left-3 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg animate-pulse z-10"></div>
      )}

      <div className="relative z-10">
        <div className="mb-5 flex items-start justify-between">
          <h3 className="line-clamp-2 bg-gradient-to-r from-gray-800 to-slate-700 bg-clip-text text-2xl font-black text-transparent transition-all duration-500 group-hover:from-indigo-600 group-hover:to-purple-600">
            {task.title}
          </h3>
        </div>
        
        <p className="mb-5 line-clamp-4 text-base leading-relaxed text-slate-700">{task.description}</p>

        {/* Status & Due */}
        <div className="mb-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-600">Status</span>
            {task.dueDate && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                isOverdue 
                  ? 'bg-red-500/90 text-white shadow-lg animate-pulse' 
                  : 'bg-emerald-500/90 text-white shadow-lg'
              }`}>
                {isOverdue ? 'OVERDUE' : new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
          
          {user?.role && (
            <div className="flex items-center justify-between rounded-xl bg-blue-50/50 px-3 py-3 text-sm font-semibold text-blue-600">
              <span>👤 Your Role: {user.role.name}</span>
            </div>
          )}
        </div>

        {/* Liquid Progress Bar */}
        <div className="mb-7">
          <div className="mb-2 flex justify-between text-sm text-slate-500">
            <span>Progress</span>
            <span>{getStatusProgress(task.status)}%</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-gradient-to-r from-slate-200 to-gray-200 shadow-inner">
            <div 
              className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getPriorityColor(task.status === 'Completed' ? 'Low' : 'Medium')} rounded-full shadow-lg animate-liquid-fill transition-all duration-1000`}
              style={{ '--progress-width': `${getStatusProgress(task.status)}%` }}
            ></div>
          </div>
        </div>

        {/* Status Update Select */}
        <select
          value={task.status}
          onChange={(e) => onStatusUpdate?.(task._id, e.target.value)}
          disabled={updatingTaskId === task._id}
          className="w-full cursor-pointer rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-4 text-base font-bold shadow-sm transition-all duration-300 hover:shadow-md focus:border-indigo-400/80 focus:outline-none focus:ring-4 focus:ring-indigo-400/30"
        >
          <option value="Backlog">📋 Backlog</option>
          <option value="To Do">✅ To Do</option>
          <option value="In Progress">⚡ In Progress</option>
          <option value="Testing">🧪 Testing</option>
          <option value="Completed">🎉 Completed</option>
        </select>

        {/* Comments Toggle */}
        <button 
          onClick={() => setShowComments(!showComments)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-base font-semibold text-slate-700 transition-all duration-300 hover:scale-105 hover:bg-slate-100 hover:shadow-md"
        >
          <FaComments className="text-lg" />
          {showComments ? 'Hide Comments' : 'Show Comments'}
        </button>

        {showComments && (
          <div className="mt-4 pt-4 border-t border-slate-200/50">
            <CommentFeed taskId={task._id} />
          </div>
        )}
      </div>

      {/* Floating Particles */}
      <div className="absolute top-2 left-2 w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-30 animate-float delay-1000"></div>
      <div className="absolute bottom-2 right-2 w-3 h-3 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full opacity-40 animate-float delay-2000"></div>
    </div>
  );
};

export default TaskCard;

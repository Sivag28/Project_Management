import { Link } from "react-router-dom";
import { FaSeedling, FaTree, FaLeaf, FaSpa, FaAppleAlt } from 'react-icons/fa';

const ProjectCard = ({ project, tasks = [] }) => {
  // Safe calculations with error handling
  let progress = 0;
  let totalTasks = 0;
  let completedTasks = 0;
  let daysLeft = 0;
  let isOverdue = false;
  let isUrgent = false;
  let resolvedDueDate = null;
  try {
    // Calculate project progress and status
    const projectTasks = tasks.filter(task =>
      task && (task.projectId === project._id || task.projectId?._id === project._id)
    );
    completedTasks = projectTasks.filter(task => task && task.status === "Completed").length;
    totalTasks = projectTasks.length;
    progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const fallbackTaskDueDate = projectTasks
      .filter((task) => task?.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]?.dueDate;
    const projectDueDate = project?.dueDate || project?.deadline || project?.endDate || fallbackTaskDueDate || null;
    resolvedDueDate = projectDueDate;

    // Calculate deadline status (only if deadline exists)
    if (projectDueDate) {
      const deadline = new Date(projectDueDate);
      const today = new Date();
      daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
      isOverdue = daysLeft < 0;
      isUrgent = daysLeft <= 3 && daysLeft >= 0;
    }
  } catch (error) {
    console.error('Error calculating project data:', error);
    // Use default values if calculation fails
  }

  const formattedDueDate = resolvedDueDate ? new Date(resolvedDueDate).toLocaleDateString() : 'No Deadline';

  // Simple theme based on progress
  const getTheme = () => {
    if (progress >= 80) return { bg: 'bg-green-100', icon: FaAppleAlt, color: 'text-green-600', name: 'Fruit Tree', emoji: '🍎' };
    if (progress >= 60) return { bg: 'bg-blue-100', icon: FaTree, color: 'text-blue-600', name: 'Mature Tree', emoji: '🌳' };
    if (progress >= 40) return { bg: 'bg-yellow-100', icon: FaLeaf, color: 'text-yellow-600', name: 'Growing Plant', emoji: '🌿' };
    if (progress >= 20) return { bg: 'bg-orange-100', icon: FaSpa, color: 'text-orange-600', name: 'Blooming Flower', emoji: '🌸' };
    return { bg: 'bg-gray-100', icon: FaSeedling, color: 'text-gray-600', name: 'Young Seedling', emoji: '🌱' };
  };

  const theme = getTheme();
  const IconComponent = theme.icon;

  return (
    <Link to={`/projects/${project._id}`}>
      <div className={`group relative p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${theme.bg} border border-gray-200 overflow-hidden`}>
        {/* Simple background pattern */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-full transform translate-x-10 -translate-y-10"></div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            project.status === 'Completed' ? 'bg-green-500 text-white' :
            project.status === 'In Progress' ? 'bg-blue-500 text-white' :
            'bg-gray-500 text-white'
          }`}>
            {project.status || 'Active'}
          </span>
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`text-5xl ${theme.color} animate-pulse`}>
              <IconComponent />
            </div>
          </div>

          {/* Project Info */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1">
              {project.title || 'Untitled Project'}
            </h2>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {project.description || 'No description available'}
            </p>
            <div className="text-lg">{theme.emoji} {theme.name}</div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-gray-800">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-1000 ${
                  progress >= 80 ? 'bg-green-500' :
                  progress >= 60 ? 'bg-blue-500' :
                  progress >= 40 ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/70 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-gray-800">{totalTasks}</div>
              <div className="text-xs text-gray-600">Tasks</div>
            </div>
            <div className="bg-white/70 rounded-lg p-2 text-center">
              <div className={`text-sm font-bold ${resolvedDueDate ? (isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-green-600') : 'text-gray-700'}`}>
                {formattedDueDate}
              </div>
              <div className="text-xs text-gray-600">
                Due Date
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-white/90 rounded-lg px-3 py-2 shadow-sm">
              <span className="text-sm font-medium text-gray-800">View Details</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;

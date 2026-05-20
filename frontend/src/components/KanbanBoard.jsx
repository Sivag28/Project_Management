import { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateTaskStatus } from "../redux/taskSlice";

const SortableTask = ({ task, getUserName }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "bg-red-100 border-red-300";
      case "Medium": return "bg-yellow-100 border-yellow-300";
      case "Low": return "bg-green-100 border-green-300";
      default: return "bg-gray-100 border-gray-300";
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 mb-2 bg-white rounded-lg shadow-sm border-l-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${getPriorityColor(task.priority)} ${isOverdue ? 'border-red-500' : ''}`}
    >
      <h4 className="font-semibold text-sm mb-1">{task.title}</h4>
      <p className="text-xs text-gray-600 mb-2">{task.description}</p>
      {task.assignedTo && (
        <div className="mb-2">
          <p className="text-xs text-blue-600 font-medium">
            Assigned to: {getUserName(task.assignedTo)}
          </p>
          {typeof task.assignedTo === 'object' && task.assignedTo.role && (
            <p className="text-xs text-gray-500">
              Role: {task.assignedTo.role.name}
            </p>
          )}
        </div>
      )}
      <div className="flex justify-between items-center text-xs">
        <span className={`px-2 py-1 rounded ${task.priority === 'High' ? 'bg-red-200 text-red-800' : task.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className={`px-2 py-1 rounded ${isOverdue ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Updated: {new Date(task.updatedAt).toLocaleString()}
      </div>
    </div>
  );
};

const Column = ({ id, title, tasks, color, getUserName }) => {
  return (
    <div className={`flex-1 min-w-[280px] md:min-w-[320px] max-w-[400px] p-4 rounded-lg basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 ${color}`}>
      <h3 className="font-bold text-lg mb-4 text-gray-800">{title}</h3>
      <div className="space-y-2">
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask key={task._id} task={task} getUserName={getUserName} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

const UserStatusSummary = ({ userStatuses }) => {
  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">User Task Status Summary</h3>
      <div className="overflow-x-auto lg:overflow-visible">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">User</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Role</th>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Backlog</th>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">To Do</th>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">In Progress</th>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Testing</th>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Completed</th>
            </tr>
          </thead>
          <tbody>
            {userStatuses.map((userStatus, index) => (
              <tr key={index} className="border-t">
                <td className="px-4 py-2 text-sm text-gray-900">{userStatus.name}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{userStatus.role}</td>
                <td className="px-4 py-2 text-center text-sm">{userStatus.backlog}</td>
                <td className="px-4 py-2 text-center text-sm">{userStatus.todo}</td>
                <td className="px-4 py-2 text-center text-sm">{userStatus.inProgress}</td>
                <td className="px-4 py-2 text-center text-sm">{userStatus.testing}</td>
                <td className="px-4 py-2 text-center text-sm">{userStatus.completed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const KanbanBoard = ({ tasks, users = [], showUserStatusSummary = false }) => {
  const dispatch = useDispatch();
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const prevTasksRef = useRef(safeTasks);

  const getUserName = (assignedTo) => {
    if (!assignedTo) return "Unassigned";
    
    if (typeof assignedTo === 'object' && assignedTo.name) {
      return assignedTo.name;
    }
    
    // If string ID, find matching user
    if (typeof assignedTo === 'string' && users.length > 0) {
      const user = users.find(u => u._id === assignedTo);
      return user ? user.name : assignedTo;
    }
    
    return "Unknown User";
  };

  const [columns, setColumns] = useState({
    backlog: safeTasks.filter(t => t.status === "Backlog") || [],
    todo: safeTasks.filter(t => t.status === "To Do") || [],
    inProgress: safeTasks.filter(t => t.status === "In Progress") || [],
    testing: safeTasks.filter(t => t.status === "Testing") || [],
    completed: safeTasks.filter(t => t.status === "Completed") || [],
  });

  // Update columns when tasks prop changes
  useEffect(() => {
    if (JSON.stringify(safeTasks) !== JSON.stringify(prevTasksRef.current)) {
      setColumns({
        backlog: safeTasks.filter(t => t.status === "Backlog") || [],
        todo: safeTasks.filter(t => t.status === "To Do") || [],
        inProgress: safeTasks.filter(t => t.status === "In Progress") || [],
        testing: safeTasks.filter(t => t.status === "Testing") || [],
        completed: safeTasks.filter(t => t.status === "Completed") || [],
      });
      prevTasksRef.current = safeTasks;
    }
  }, [safeTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const userStatuses = useMemo(() => {
    console.log('Users:', users);
    console.log('Tasks:', safeTasks);

    const userMap = {};

    // Initialize all users with 0 counts
    if (users && Array.isArray(users)) {
      users.forEach(user => {
        userMap[user._id] = {
          name: user.name,
          role: user.role?.name || 'Unknown',
          backlog: 0,
          todo: 0,
          inProgress: 0,
          testing: 0,
          completed: 0,
        };
      });
    }

    // Count tasks for each user
    safeTasks.forEach(task => {
      if (task.assignedTo) {
        const userId = typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo;

        if (userMap[userId]) {
          const status = task.status;
          if (status === "Backlog") userMap[userId].backlog++;
          else if (status === "To Do") userMap[userId].todo++;
          else if (status === "In Progress") userMap[userId].inProgress++;
          else if (status === "Testing") userMap[userId].testing++;
          else if (status === "Completed") userMap[userId].completed++;
        }
      }
    });

    const result = Object.values(userMap);
    console.log('User statuses:', result);
    return result;
  }, [safeTasks, users]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find source and destination columns
    let sourceColumn = null;
    let destColumn = null;
    let sourceTasks = [];
    let destTasks = [];

    Object.keys(columns).forEach(col => {
      if (columns[col].some(t => t._id === activeId)) {
        sourceColumn = col;
        sourceTasks = [...columns[col]];
      }
      if (columns[col].some(t => t._id === overId) || col === overId) {
        destColumn = col;
        destTasks = [...columns[col]];
      }
    });

    if (!sourceColumn || !destColumn) return;

    // If dropping on a column header
    if (Object.keys(columns).includes(overId)) {
      destColumn = overId;
      destTasks = [...columns[destColumn]];
    }

    // Find the task being moved
    const activeTask = sourceTasks.find(t => t._id === activeId);
    if (!activeTask) return;

    // Remove from source
    const newSourceTasks = sourceTasks.filter(t => t._id !== activeId);

    // Add to destination
    let newDestTasks;
    if (Object.keys(columns).includes(overId)) {
      // Dropped on column header
      newDestTasks = [...destTasks, activeTask];
    } else {
      // Dropped on another task
      const overIndex = destTasks.findIndex(t => t._id === overId);
      newDestTasks = [...destTasks];
      newDestTasks.splice(overIndex, 0, activeTask);
    }

    // Update columns
    const newColumns = {
      ...columns,
      [sourceColumn]: newSourceTasks,
      [destColumn]: newDestTasks,
    };

    setColumns(newColumns);

    // Update task status in backend
    const statusMap = {
      backlog: "Backlog",
      todo: "To Do",
      inProgress: "In Progress",
      testing: "Testing",
      completed: "Completed",
    };

    dispatch(updateTaskStatus({
      taskId: activeId,
      status: statusMap[destColumn],
    }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Kanban Board ðŸ—‚ï¸</h2>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
          <Column
            id="backlog"
            title="Backlog"
            tasks={columns.backlog}
            color="bg-gray-100"
            getUserName={getUserName}
          />
          <Column
            id="todo"
            title="To Do"
            tasks={columns.todo}
            color="bg-blue-100"
            getUserName={getUserName}
          />
          <Column
            id="inProgress"
            title="In Progress"
            tasks={columns.inProgress}
            color="bg-yellow-100"
            getUserName={getUserName}
          />
          <Column
            id="testing"
            title="Testing"
            tasks={columns.testing}
            color="bg-purple-100"
            getUserName={getUserName}
          />
          <Column
            id="completed"
            title="Completed"
            tasks={columns.completed}
            color="bg-green-100"
            getUserName={getUserName}
          />
        </div>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;

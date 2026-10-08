import { useEffect, useMemo, useState } from "react";
import { FaHistory, FaProjectDiagram, FaTasks } from "react-icons/fa";
import API from "../services/api";

const getTimestamp = (item) => item.timestamp || item.createdAt || item.updatedAt || null;

const ActivityTimeline = ({ projects = [], tasks = [] }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    API.get("/activities/all")
      .then((res) => {
        if (!isMounted) return;
        const results = Array.isArray(res.data) ? res.data : res.data?.activities;
        setLogs(Array.isArray(results) ? results : []);
      })
      .catch(() => {
        if (isMounted) setLoadError(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const entries = useMemo(() => {
    const loggedEntries = logs.map((log) => ({
      id: log._id,
      action: log.action || "Team activity",
      actor: log.user?.name || "Team member",
      timestamp: getTimestamp(log),
      icon: FaHistory,
      source: "log",
    }));

    // Older installations may not have audit events yet. Show actual records
    // and their database timestamps until new activity is logged.
    const workspaceEntries = [
      ...projects.map((project) => ({
        id: `project-${project._id}`,
        action: `Project added: ${project.title || "Untitled project"}`,
        actor: project.owner?.name ? `Owned by ${project.owner.name}` : "Project workspace",
        timestamp: getTimestamp(project),
        icon: FaProjectDiagram,
        source: "record",
      })),
      ...tasks.map((task) => ({
        id: `task-${task._id}`,
        action: `Task ${task.status ? `(${task.status})` : "added"}: ${task.title || "Untitled task"}`,
        actor: task.assignedTo?.name ? `Assigned to ${task.assignedTo.name}` : "Team task",
        timestamp: getTimestamp(task),
        icon: FaTasks,
        source: "record",
      })),
    ];

    const result = loggedEntries.length ? loggedEntries : workspaceEntries;
    return result
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, 5);
  }, [logs, projects, tasks]);

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Activity Log</h2>
      {loading ? (
        <p className="py-5 text-sm text-slate-500">Loading recent activity…</p>
      ) : entries.length ? (
        <>
          {loadError && <p className="mb-3 text-xs text-slate-500">Showing recent project and task records.</p>}
          {!logs.length && <p className="mb-3 text-xs text-slate-500">Recent projects and tasks</p>}
          <ol className="space-y-3">
            {entries.map((entry) => {
              const Icon = entry.icon;
              const date = entry.timestamp ? new Date(entry.timestamp) : null;
              const validDate = date && !Number.isNaN(date.getTime());
              return (
                <li key={entry.id} className="flex items-start gap-3 rounded-xl border border-[#dce7dc] bg-white/70 px-3 py-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf3e9] text-[#3f7650]">
                    <Icon aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-5 text-[#294333]">{entry.action}</p>
                    <p className="mt-1 text-sm text-[#64766a]">
                      {entry.actor}{validDate ? ` · ${date.toLocaleString()}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <div className="flex min-h-24 items-center gap-3 rounded-xl border border-dashed border-[#b9cdbb] bg-[#f7faf6] px-4 py-4">
          <FaHistory className="shrink-0 text-[#63856a]" aria-hidden="true" />
          <p className="text-sm text-[#586b5d]">
            {loadError ? "Activity could not be loaded right now." : "No project or task activity has been recorded yet."}
          </p>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;

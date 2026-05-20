import { useEffect, useState } from "react";
import API from "../services/api";

const ActivityTimeline = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await API.get("/activities/all");
      setLogs(res.data);
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Activity Log</h2>
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log._id} className="flex items-start space-x-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <p className="font-semibold">{log.action}</p>
              <p className="text-sm text-gray-600">{new Date(log.timestamp).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTimeline;

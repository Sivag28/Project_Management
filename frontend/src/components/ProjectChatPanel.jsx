import { useEffect, useState } from "react";
import API from "../services/api";

const ProjectChatPanel = ({ projects, user, onSeenMessages }) => {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0]._id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      setMessages([]);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError("");

    API.get(`/project-chat/${selectedProjectId}`)
      .then((response) => {
        if (mounted) {
          setMessages(response.data.messages || []);
          onSeenMessages?.();
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.response?.data?.message || "Unable to load chat messages.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    window.socket?.emit("joinProjectChat", { projectId: selectedProjectId });

    const handleIncomingMessage = ({ projectId, message }) => {
      if (projectId === selectedProjectId) {
        setMessages((prev) => [...prev, message]);
        if ((message.sender?._id || message.sender) !== user?._id) {
          API.put(`/project-chat/${selectedProjectId}/read`).finally(() => {
            onSeenMessages?.();
          });
        }
      }
    };

    window.socket?.on("projectChatMessage", handleIncomingMessage);

    return () => {
      mounted = false;
      window.socket?.emit("leaveProjectChat", { projectId: selectedProjectId });
      window.socket?.off("projectChatMessage", handleIncomingMessage);
    };
  }, [selectedProjectId, onSeenMessages, user?._id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedProjectId) return;

    try {
      setSending(true);
      setError("");
      await API.post(`/project-chat/${selectedProjectId}`, { content: newMessage });
      setNewMessage("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-teal-50 p-10 text-center shadow-sm">
        <h3 className="text-xl font-semibold text-slate-800">No Project Chats Yet</h3>
        <p className="mt-2 text-sm text-slate-500">
          Project chat becomes available when you have tasks in a project.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-teal-50 p-6 shadow-sm lg:grid-cols-[320px_1fr]">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-900 via-slate-800 to-teal-900 p-5 text-white">
        <div className="border-b border-slate-200 pb-4">
          <h3 className="text-lg font-semibold text-white">Project Channels</h3>
          <p className="mt-1 text-sm text-slate-300">
            Select a project to open its member-only chat.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {projects.map((project) => (
            <button
              key={project._id}
              onClick={() => setSelectedProjectId(project._id)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                selectedProjectId === project._id
                  ? "border-teal-300 bg-white text-teal-900 shadow-sm"
                  : "border-white/10 bg-white/10 text-slate-100 hover:border-white/20 hover:bg-white/15"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{project.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {project.members?.length || 0} members
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    selectedProjectId === project._id
                      ? "bg-teal-100 text-teal-700"
                      : "bg-white/10 text-slate-200"
                  }`}
                >
                  Channel
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/85 backdrop-blur-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-teal-600 via-cyan-600 to-slate-900 px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black text-white">
                {projects.find((project) => project._id === selectedProjectId)?.title || "Project Chat"}
              </h3>
              <p className="mt-1 text-sm text-teal-50/90">
                Only members of this project can send and receive messages here.
              </p>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              {messages.length} {messages.length === 1 ? "message" : "messages"}
            </span>
          </div>
        </div>

        <div className="h-[460px] space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.12),_transparent_30%),linear-gradient(180deg,_rgba(248,250,252,0.95),_rgba(240,253,250,0.95))] px-6 py-5">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-6 text-center text-sm text-slate-500">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-teal-200 bg-white/90 px-4 py-8 text-center text-sm text-slate-500">
              No messages yet. Start the project conversation.
            </div>
          ) : (
            messages.map((message) => {
              const isMine = (message.sender?._id || message.sender) === user?._id;
              return (
                <div
                  key={message._id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-3xl px-4 py-3 shadow-sm ${
                      isMine
                        ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white"
                        : "border border-slate-200 bg-white/95 text-slate-800"
                    }`}
                  >
                    <p className={`text-xs font-semibold ${isMine ? "text-teal-100" : "text-slate-500"}`}>
                      {message.sender?.name || "Project Member"}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                    <p className={`mt-3 text-[11px] ${isMine ? "text-teal-100" : "text-slate-400"}`}>
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-100/80 px-8 py-6">
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200/50 bg-red-50/80 px-5 py-4 text-sm text-red-800">
              {error}
            </div>
          )}
          <div className="flex gap-4">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message for the project team..."
              className="min-h-[96px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
            />
            <button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim() || !selectedProjectId}
              className="self-end rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectChatPanel;

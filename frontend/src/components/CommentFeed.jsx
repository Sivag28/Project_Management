import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import API from "../services/api";

const CommentFeed = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const res = await API.get(`/comments/${taskId}`);
      setComments(res.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      await API.post(`/comments/${taskId}`, { content: newComment });
      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold mb-2">Comments</h4>
      <div className="space-y-2 mb-4">
        {comments.map((comment) => (
          <div key={comment._id} className="p-2 bg-white rounded">
            <p className="text-sm font-medium">{comment.user.name}</p>
            <p className="text-sm">{comment.content}</p>
            <p className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 p-2 border rounded-l"
        />
        <button onClick={addComment} className="px-4 py-2 bg-blue-500 text-white rounded-r">
          Post
        </button>
      </div>
    </div>
  );
};

export default CommentFeed;

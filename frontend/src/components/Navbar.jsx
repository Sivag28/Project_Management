import { Link } from "react-router-dom";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications, markAllNotificationsAsRead } from "../redux/notificationSlice";

const Navbar = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const { user } = useSelector((state) => state.auth);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      dispatch(fetchNotifications());
    }
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  return (
    <nav className="bg-slate-900 text-white p-4 flex justify-between items-center relative">
      <h1 className="font-bold text-xl">ProManage</h1>
      <div className="flex items-center space-x-4">
        <Link to="/" className="hover:text-purple-400 transition-colors">Dashboard</Link>
        <Link to="/projects" className="hover:text-purple-400 transition-colors">Projects</Link>
        <div className="relative">
          <button
            onClick={handleBellClick}
            className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7v5h5l-5-5zM4 12h8m0 0l-2-2m2 2l-2 2m6-6V3a1 1 0 00-1-1H5a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 border-b border-slate-700 hover:bg-slate-700 transition-colors ${
                        !notification.isRead ? 'bg-slate-700/50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {notification.type === 'task' && '📋'}
                          {notification.type === 'action' && '⚡'}
                          {!notification.type && '🔔'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {user && (
          <div className="flex items-center space-x-2">
            <span className="text-sm">{user.name}</span>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

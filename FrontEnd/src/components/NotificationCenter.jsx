import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const load = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {
      // Notification failures should never block the rest of the application.
    }
  };

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleRead = async (notification) => {
    if (!notification.read) {
      try {
        await markNotificationRead(notification._id);
        setNotifications((current) => current.map((item) => item._id === notification._id ? { ...item, read: true } : item));
        setUnread((current) => Math.max(0, current - 1));
      } catch {
        // Keep navigation usable even when a read-state update fails.
      }
    }
  };

  const handleReadAll = async () => {
    if (!unread || loading) return;
    try {
      setLoading(true);
      await markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      setUnread(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notification-center" ref={wrapperRef}>
      <button
        type="button"
        className="notification-trigger"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">●</span>
        {unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}
      </button>

      {open && (
        <div className="notification-popover">
          <div className="notification-popover-header">
            <strong>Notifications</strong>
            <button type="button" onClick={handleReadAll} disabled={!unread || loading}>Mark all read</button>
          </div>
          {notifications.length === 0 ? (
            <div className="notification-empty">You are all caught up.</div>
          ) : (
            <div className="notification-list">
              {notifications.slice(0, 10).map((notification) => (
                <Link
                  to={notification.issue ? `/issues/${notification.issue._id || notification.issue}` : "/"}
                  className={`notification-item ${notification.read ? "" : "unread"}`}
                  key={notification._id}
                  onClick={() => handleRead(notification)}
                >
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <small>{new Date(notification.createdAt).toLocaleString()}</small>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

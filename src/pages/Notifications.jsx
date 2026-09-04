import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Package,
  CreditCard,
  AlertTriangle,
  BadgeCheck,
  Clock3,
  XCircle,
  ChevronLeft,
} from "lucide-react";

import { supabase } from "../lib/supabase";

const Notifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  ========================================
  LOAD NOTIFICATIONS
  ========================================
  */

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setNotifications([]);
          return;
        }

        const { data, error: notificationError } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (notificationError) {
          throw notificationError;
        }

        setNotifications(data || []);
      } catch (err) {
        console.error("Notifications error:", err);
        setError(err?.message || "Unable to load notifications.");
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  /*
  ========================================
  FILTER NOTIFICATIONS
  ========================================
  */

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") {
      return true;
    }

    if (activeTab === "listings") {
      return notification.type?.startsWith("listing");
    }

    if (activeTab === "plan") {
      return notification.type?.startsWith("plan");
    }

    return true;
  });

  /*
  ========================================
  UNREAD COUNT
  ========================================
  */

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  /*
  ========================================
  MARK AS READ
  ========================================
  */

  const markAsRead = async (notification) => {
    if (notification.is_read) {
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", notification.id);

    if (error) {
      console.error("Mark notification read error:", error);
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              is_read: true,
            }
          : item
      )
    );
  };

  /*
  ========================================
  MARK ALL AS READ
  ========================================
  */

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter((notification) => !notification.is_read)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) {
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .in("id", unreadIds);

    if (error) {
      console.error("Mark all notifications read error:", error);
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    );
  };

  /*
  ========================================
  DELETE NOTIFICATION
  ========================================
  */

  const deleteNotification = async (id) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete notification error:", error);
      return;
    }

    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  };

  /*
  ========================================
  NOTIFICATION ICON
  ========================================
  */

  const getNotificationIcon = (notification) => {
    const type = notification.type || "";

    if (type === "listing_published") {
      return <BadgeCheck size={19} />;
    }

    if (type === "listing_pending") {
      return <Clock3 size={19} />;
    }

    if (type === "listing_rejected") {
      return <XCircle size={19} />;
    }

    if (type === "listing_expired") {
      return <AlertTriangle size={19} />;
    }

    if (type === "listing_restored") {
      return <BadgeCheck size={19} />;
    }

    if (type === "plan_activated") {
      return <CreditCard size={19} />;
    }

    if (type === "plan_expiring") {
      return <AlertTriangle size={19} />;
    }

    if (type === "plan_expired") {
      return <AlertTriangle size={19} />;
    }

    if (type === "plan_renewed") {
      return <Check size={19} />;
    }

    return <Bell size={19} />;
  };

  /*
  ========================================
  NOTIFICATION CLASS
  ========================================
  */

  const getNotificationClass = (notification) => {
    const type = notification.type || "";

    if (type.includes("expired") || type.includes("rejected")) {
      return "sh-notification-icon danger";
    }

    if (type.includes("expiring") || type.includes("pending")) {
      return "sh-notification-icon warning";
    }

    if (type.includes("published") || type.includes("restored")) {
      return "sh-notification-icon success";
    }

    return "sh-notification-icon";
  };

  /*
  ========================================
  FORMAT TIME
  ========================================
  */

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    const created = new Date(date);
    const now = new Date();

    const difference = Math.floor((now - created) / 1000);

    if (difference < 60) {
      return "Just now";
    }

    if (difference < 3600) {
      const minutes = Math.floor(difference / 60);
      return `${minutes}m ago`;
    }

    if (difference < 86400) {
      const hours = Math.floor(difference / 3600);
      return `${hours}h ago`;
    }

    if (difference < 604800) {
      const days = Math.floor(difference / 86400);
      return `${days}d ago`;
    }

    return created.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /*
  ========================================
  HANDLE NOTIFICATION CLICK
  ========================================
  */

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification);

    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="sh-notifications-page">
      <div className="sh-notifications-container">
        {/* Header */}

        <div className="sh-notifications-header">
          <div>
            <Link to="/dashboard" className="sh-notifications-back">
              <ChevronLeft size={17} />
              Dashboard
            </Link>

            <div className="sh-notifications-title-row">
              <div className="sh-notifications-title-icon">
                <Bell size={21} />
              </div>

              <div>
                <h1>Notifications</h1>

                <p>Stay updated with your listings and subscription.</p>
              </div>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="sh-notifications-mark-all"
              onClick={markAllAsRead}
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          )}
        </div>

        {/* Tabs */}

        <div className="sh-notifications-tabs">
          <button
            type="button"
            className={activeTab === "all" ? "active" : ""}
            onClick={() => setActiveTab("all")}
          >
            All
            {notifications.length > 0 && <span>{notifications.length}</span>}
          </button>

          <button
            type="button"
            className={activeTab === "listings" ? "active" : ""}
            onClick={() => setActiveTab("listings")}
          >
            Listings
          </button>

          <button
            type="button"
            className={activeTab === "plan" ? "active" : ""}
            onClick={() => setActiveTab("plan")}
          >
            Plan
          </button>
        </div>

        {/* Content */}

        <div className="sh-notifications-card">
          {loading ? (
            <div className="sh-notifications-empty">
              <div className="sh-notifications-empty-icon">
                <Bell size={21} />
              </div>

              <h3>Loading notifications...</h3>

              <p>Checking for recent activity.</p>
            </div>
          ) : error ? (
            <div className="sh-notifications-empty">
              <div className="sh-notifications-empty-icon">
                <AlertTriangle size={21} />
              </div>

              <h3>Unable to load notifications</h3>

              <p>{error}</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="sh-notifications-empty">
              <div className="sh-notifications-empty-icon">
                <Bell size={21} />
              </div>

              <h3>No notifications</h3>

              <p>You're all caught up. New activity will appear here.</p>
            </div>
          ) : (
            <div className="sh-notifications-list">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`sh-notification-item ${
                    notification.is_read ? "is-read" : "is-unread"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={getNotificationClass(notification)}>
                    {getNotificationIcon(notification)}
                  </div>

                  <div className="sh-notification-content">
                    <div className="sh-notification-top">
                      <h3>{notification.title}</h3>

                      {!notification.is_read && (
                        <span className="sh-notification-dot" />
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <span className="sh-notification-time">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="sh-notification-delete"
                    aria-label="Delete notification"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;

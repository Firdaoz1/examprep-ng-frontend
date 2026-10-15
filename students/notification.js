const API_BASE =
  "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

document.addEventListener("DOMContentLoaded", () => {
  const notificationList = document.getElementById("notification-list");
  const emptyState = document.getElementById("empty-state");
  const tabs = document.querySelectorAll(".notification-tab");
  const markAllButton = document.getElementById("mark-all");
  const notificationDot = document.getElementById("notification-dot");

  let notifications = [];
  let activeTab = "all";

  const token = localStorage.getItem("token");

  async function apiRequest(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || `Request failed: ${response.status}`);
    }

    return result;
  }

  function getData(result) {
    return result.data ?? result;
  }

  function isRead(notification) {
    return (
      notification.isRead === true ||
      notification.read === true ||
      notification.status === "read"
    );
  }

  function formatTime(dateValue) {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "";

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString();
  }

  function updateHeaderDot() {
    const hasUnread = notifications.some(
      (notification) => !isRead(notification),
    );

    notificationDot?.classList.toggle("hidden", !hasUnread);
  }

  function renderNotifications() {
    const filtered = notifications.filter((notification) => {
      if (activeTab === "all") return true;

      const type = String(
        notification.type || notification.category || "",
      ).toLowerCase();

      return (
        type === activeTab ||
        (activeTab === "updates" && type === "update") ||
        (activeTab === "reminders" && type === "reminder")
      );
    });

    notificationList.innerHTML = "";

    emptyState.classList.toggle("hidden", filtered.length > 0);

    filtered.forEach((notification) => {
      const item = document.createElement("div");

      item.className =
        "notification-item px-4 sm:px-7 py-5 border-b " +
        "border-[#D9D9D9] grid grid-cols-[1fr_auto] gap-4 items-start";

      item.dataset.type = String(
        notification.type || notification.category || "updates",
      ).toLowerCase();

      const content = document.createElement("div");

      const title = document.createElement("h3");
      title.className =
        "text-[15px] md:text-[18px] font-semibold text-[#003028]";
      title.textContent =
        notification.title || notification.message || "Notification";

      const description = document.createElement("p");
      description.className =
        "mt-2 text-[12px] md:text-[14px] leading-5 " +
        "text-[#000000]/50 font-medium";
      description.textContent =
        notification.description ||
        notification.body ||
        (notification.message && notification.title
          ? notification.message
          : "");

      content.append(title, description);

      const rightSide = document.createElement("div");
      rightSide.className = "flex items-center gap-4 pl-2";

      const time = document.createElement("span");
      time.className = "text-[16px] text-[#000000]/50 whitespace-nowrap";
      time.textContent = formatTime(
        notification.createdAt || notification.created_at,
      );

      rightSide.appendChild(time);

      if (!isRead(notification)) {
        const greenDot = document.createElement("span");
        greenDot.className = "unread-dot w-2 h-2 rounded-full bg-[#34c759]";
        rightSide.appendChild(greenDot);
      }

      item.append(content, rightSide);

      item.style.cursor = "pointer";
      item.addEventListener("click", () => {
        markAsRead(notification);
      });

      notificationList.appendChild(item);
    });

    updateHeaderDot();
  }

  async function loadNotifications() {
    if (!token) {
      notificationList.innerHTML = "";
      emptyState.textContent = "Please log in to view notifications.";
      emptyState.classList.remove("hidden");
      return;
    }

    try {
      const result = await apiRequest("/api/notifications");
      const data = getData(result);

      notifications = Array.isArray(data) ? data : data.notifications || [];

      renderNotifications();
    } catch (error) {
      console.error("Failed to load notifications:", error);
      notificationList.innerHTML = "";
      emptyState.textContent =
        "Unable to load notifications. Please try again.";
      emptyState.classList.remove("hidden");
    }
  }

  async function markAsRead(notification) {
    if (isRead(notification)) return;

    const id = notification._id || notification.id;

    if (!id) {
      console.error("Notification has no ID.");
      return;
    }

    try {
      await apiRequest(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      notification.isRead = true;
      renderNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }

  async function markAllAsRead() {
    const unread = notifications.filter(
      (notification) => !isRead(notification),
    );

    if (!unread.length) return;

    try {
      await apiRequest("/api/notifications/read-all", {
        method: "PATCH",
      });

      notifications = notifications.map((notification) => ({
        ...notification,
        isRead: true,
      }));

      renderNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeTab = tab.dataset.tab;

      tabs.forEach((button) => {
        button.classList.remove("active-tab", "bg-[#085848]", "text-white");
        button.classList.add("text-[#6F6F6F]");
      });

      tab.classList.add("active-tab", "bg-[#085848]", "text-white");
      tab.classList.remove("text-[#6F6F6F]");

      renderNotifications();
    });
  });

  markAllButton?.addEventListener("click", markAllAsRead);

  loadNotifications();
});

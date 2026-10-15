const menuBtn = document.getElementById("menuBtn");
const sidebarClose = document.getElementById("close-btn");
const sidebar = document.getElementById("sidebar");
const sidebarLinks = document.querySelectorAll(".screen");
const currentPage = window.location.pathname.split("/").pop();
const profileInitials = document.getElementById("profile-initials");
const profileName = document.getElementById("profile-name");
const profileRole = document.querySelector("profile-role");
const notificationButton = document.getElementById("notification-button");
const notificationDot = document.getElementById("notification-Dot");
const searchInputs = document.querySelectorAll(".search");
const profileDropdown = document.getElementById("profile-dropdown");

function openSidebar() {
  sidebar.classList.remove("-translate-x-full");
}

function closeSidebar() {
  sidebar.classList.add("-translate-x-full");
}

if (menuBtn && sidebarClose && sidebar) {
  menuBtn.addEventListener("click", openSidebar);
  sidebarClose.addEventListener("click", closeSidebar);
}

window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024) {
    sidebar.classList.remove("-translate-x-[110%]");
  }
});

if (sidebarLinks) {
  sidebarLinks.forEach((link) => {
    const linkPage = link.getAttribute("href").split("/").pop();

    if (linkPage === currentPage) {
      link.classList.add("bg-[#CEF4DA]");
      link.classList.add("text-[#003028]");
      const icon = link.querySelector("ion-icon");
      icon.classList.add("text-[#003028]");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE =
    "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

  const token = localStorage.getItem("token");

  const profileInitials = document.getElementById("profile-initials");
  const profileName = document.querySelector("#profile-name p");
  const profileRole = document.getElementById("profile-role");

  function getInitials(name) {
    return (name || "Student")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("");
  }

  function displayProfile(student) {
    const name =
      student?.fullName || student?.name || student?.username || "Student";

    const photo =
      student?.profilePicture ||
      student?.profilePhoto ||
      student?.profileImage ||
      student?.avatarUrl ||
      student?.profilePictureUrl ||
      student?.avatar ||
      student?.photoURL ||
      "";

    if (profileName) {
      profileName.textContent = name;
    }

    if (profileRole) {
      profileRole.textContent = student?.roleLabel || "JAMB candidate";
    }

    if (!profileInitials) return;

    profileInitials.replaceChildren();

    if (photo) {
      const img = document.createElement("img");
      img.src = photo;
      img.alt = `${name}'s profile photo`;
      img.className = "w-full h-full object-cover rounded-full";

      img.onerror = () => {
        profileInitials.replaceChildren();
        profileInitials.textContent = getInitials(name);
      };

      profileInitials.appendChild(img);
    } else {
      profileInitials.textContent = getInitials(name);
    }
  }

  async function loadProfile() {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Could not load profile");
      }

      const data =
        result.data?.settings ?? result.data?.user ?? result.data ?? result;

      displayProfile(data);
    } catch (error) {
      console.error("Profile error:", error);
    }
  }

  loadProfile();

  const notificationButton = document.getElementById("notification-button");

  notificationButton?.addEventListener("click", () => {
    window.location.href = "./notification.html";
  });

  const searchInputs = document.querySelectorAll(".search input[type='text']");

  let searchMatches = [];
  let currentMatchIndex = -1;

  function clearSearchHighlights() {
    document.querySelectorAll("[data-search-match]").forEach((element) => {
      element.classList.remove("ring-2", "ring-green-600", "rounded-lg");
      element.removeAttribute("data-search-match");
    });

    searchMatches = [];
    currentMatchIndex = -1;
  }

  function searchCurrentPage(query) {
    clearSearchHighlights();

    if (!query) {
      return;
    }

    const main = document.querySelector("main") || document.body;
    const candidates = main.querySelectorAll(
      "h1, h2, h3, h4, p, a, button, li, td, [data-searchable]",
    );

    const normalizedQuery = query.toLowerCase();

    candidates.forEach((element) => {
      if (
        element.closest("header") ||
        element.closest("nav") ||
        element.closest("aside") ||
        element.closest("[hidden]") ||
        element.offsetParent === null
      ) {
        return;
      }

      const hasMatchingChild = [...element.children].some((child) =>
        child.textContent.toLowerCase().includes(normalizedQuery),
      );

      if (
        element.textContent.toLowerCase().includes(normalizedQuery) &&
        !hasMatchingChild
      ) {
        searchMatches.push(element);
      }
    });

    if (!searchMatches.length) {
      return;
    }

    currentMatchIndex = 0;

    searchMatches.forEach((element) => {
      element.classList.add("ring-2", "ring-green-600", "rounded-lg");
      element.setAttribute("data-search-match", "true");
    });

    searchMatches[currentMatchIndex].scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  searchInputs.forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;

      event.preventDefault();
      searchCurrentPage(input.value.trim());
    });

    input.addEventListener("input", () => {
      if (!input.value.trim()) {
        clearSearchHighlights();
      }
    });
  });
});

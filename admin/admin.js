const API_BASE_URL =
  "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";
  const searchInputs = document.querySelectorAll(
  ".search input[type='text']"
);

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menu-btn");
  const closeBtn = document.getElementById("sidebar-close");

  const profileMenuBtn = document.getElementById("profile-menu-btn");
  const profileDropdown = document.getElementById("profile-dropdown");
  const logoutBtn = document.getElementById("logout-btn");

  const adminName = document.getElementById("admin-name");
  const adminRole = document.getElementById("admin-role");
  const profileInitials = document.getElementById("profile-initials");

  const navLinks = sidebar?.querySelectorAll("nav a") || [];

  const mobileScreen = window.matchMedia("(max-width: 767px)");
  const tabletScreen = window.matchMedia(
    "(min-width: 768px) and (max-width: 1023px)"
  );

  // -------------------------
  // SIDEBAR
  // -------------------------

  function openSidebar() {
  if (mobileScreen.matches || tabletScreen.matches) {
    sidebar.classList.remove("-translate-x-full");
  }
}

function closeSidebar() {
  if (mobileScreen.matches || tabletScreen.matches) {
    sidebar.classList.add("-translate-x-full");
  }
}

menuBtn?.addEventListener("click", openSidebar);
closeBtn?.addEventListener("click", closeSidebar);

navLinks.forEach((link) => {
  link.addEventListener("click", closeSidebar);
});

  menuBtn?.addEventListener("click", openSidebar);
  closeBtn?.addEventListener("click", closeSidebar);

  navLinks.forEach((link) => {
    link.addEventListener("click", closeSidebar);
  });

  // -------------------------
  // RESPONSIVE SIDEBAR
  // Mobile: hidden until opened
  // Tablet: compact icon-only sidebar
  // Desktop: full sidebar
  // -------------------------

  function updateResponsiveLayout() {
  if (mobileScreen.matches || tabletScreen.matches) {
    // Phone and tablet: use the same sidebar behavior

    sidebar.querySelectorAll("nav a span").forEach((label) => {
      label.classList.remove("hidden");
    });

    sidebar.querySelectorAll("nav a").forEach((link) => {
      link.classList.remove("justify-center");
    });

    const logoText = sidebar.querySelector(
      ".flex.items-center.gap-2 span"
    );

    logoText?.classList.remove("hidden");
    closeBtn?.classList.remove("hidden");
  } else {
    // Desktop: keep the full sidebar visible
    sidebar.classList.remove("-translate-x-full", "w-20");
    sidebar.classList.add("w-[250px]");

    sidebar.querySelectorAll("nav a span").forEach((label) => {
      label.classList.remove("hidden");
    });

    sidebar.querySelectorAll("nav a").forEach((link) => {
      link.classList.remove("justify-center");
    });

    const logoText = sidebar.querySelector(
      ".flex.items-center.gap-2 span"
    );

    logoText?.classList.remove("hidden");
    closeBtn?.classList.add("hidden");
  }
}

updateResponsiveLayout();

  // -------------------------
  // ACTIVE NAVIGATION
  // -------------------------

  function setActiveNavigation() {
    const currentPage = window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();

    navLinks.forEach((link) => {
      const linkPage = new URL(link.href).pathname
        .split("/")
        .pop()
        .toLowerCase();

      const isActive = linkPage === currentPage;

      link.classList.toggle("bg-[#CEF4DA]", isActive);
      link.classList.toggle("text-[#003028]", isActive);
      link.classList.toggle("text-white", !isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  setActiveNavigation();

  // -------------------------
  // ADMIN PROFILE
  // -------------------------

  function getInitials(name) {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  async function loadAdminProfile() {
    const token = sessionStorage.getItem("adminToken");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/dashboard`,
        {
          headers: {
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Unable to fetch admin details."
        );
      }

      // Update these fields to match the actual backend response.
      const admin =
        result.data?.admin ||
        result.data?.user ||
        result.admin ||
        result.user;

      if (!admin) {
        console.warn("Admin details were not found in the response:", result);
        adminName.textContent = "Admin";
        adminRole.textContent = "Admin";
        profileInitials.textContent = "AD";
        return;
      }

      const name =
        admin.fullName ||
        admin.name ||
        [admin.firstName, admin.lastName]
          .filter(Boolean)
          .join(" ") ||
        admin.email ||
        "Admin";

      adminName.textContent = name;
      adminRole.textContent = admin.role || "Admin";
      profileInitials.textContent = getInitials(name);
    } catch (error) {
      console.error("Admin profile error:", error);

      adminName.textContent = "Admin";
      adminRole.textContent = "Admin";
      profileInitials.textContent = "AD";
    }
  }

  loadAdminProfile();

  // -------------------------
  // PROFILE DROPDOWN
  // -------------------------

  profileMenuBtn?.addEventListener("click", (event) => {
    event.stopPropagation();

    const isOpening = profileDropdown.classList.contains("hidden");

    profileDropdown.classList.toggle("hidden");
    profileMenuBtn.setAttribute("aria-expanded", String(isOpening));
  });

  document.addEventListener("click", (event) => {
    if (
      profileDropdown &&
      profileMenuBtn &&
      !profileDropdown.contains(event.target) &&
      !profileMenuBtn.contains(event.target)
    ) {
      profileDropdown.classList.add("hidden");
      profileMenuBtn.setAttribute("aria-expanded", "false");
    }
  });

  // -------------------------
  // LOGOUT
  // -------------------------

  logoutBtn?.addEventListener("click", () => {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("admin");

    window.location.href = "./admin-login.html";
  });
});

// SEARCH RECENT FEED ACTIVITY
// -------------------------
// ADMIN DASHBOARD SEARCH
// -------------------------



let searchMatches = [];

function clearSearchHighlights() {
  document.querySelectorAll("[data-search-match]").forEach((element) => {
    element.classList.remove(
      "ring-2",
      "ring-green-600",
      "rounded-lg"
    );

    element.removeAttribute("data-search-match");
  });

  searchMatches = [];
}

function searchCurrentPage(query) {
  clearSearchHighlights();

  if (!query) return;

  const main = document.querySelector("main") || document.body;

  const candidates = main.querySelectorAll(
    "h1, h2, h3, h4, p, a, button, li, td, [data-searchable]"
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
      child.textContent.toLowerCase().includes(normalizedQuery)
    );

    if (
      element.textContent.toLowerCase().includes(normalizedQuery) &&
      !hasMatchingChild
    ) {
      searchMatches.push(element);
    }
  });

  if (!searchMatches.length) {
    console.log("No matching content found:", query);
    return;
  }

  searchMatches.forEach((element) => {
    element.classList.add(
      "ring-2",
      "ring-green-600",
      "rounded-lg"
    );

    element.setAttribute("data-search-match", "true");
  });

  searchMatches[0].scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

searchInputs.forEach((input) => {
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();

    // Keep both search fields synchronised
    searchInputs.forEach((otherInput) => {
      otherInput.value = input.value;
    });

    searchCurrentPage(input.value.trim());
  });

  input.addEventListener("input", () => {
    if (!input.value.trim()) {
      clearSearchHighlights();
    }
  });
});
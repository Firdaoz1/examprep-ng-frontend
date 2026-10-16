const ADMIN_DASHBOARD_API_BASE =
  "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // ELEMENTS
  // =========================

  const examChart = document.getElementById("exam-chart");
  const subjectLegend = document.getElementById("subject-legend");
  const subjectChartBox = subjectLegend?.previousElementSibling;
  const tableBody = document.querySelector("main tbody");

  // =========================
  // HELPERS
  // =========================

  function getArray(...values) {
    return values.find(Array.isArray) || [];
  }

  function getNumber(...values) {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== "") {
        const number = Number(value);
        if (Number.isFinite(number)) return number;
      }
    }

    return 0;
  }

  function getText(...values) {
    const value = values.find(
      (item) => item !== undefined && item !== null && item !== ""
    );

    if (value === undefined) return "—";

    if (typeof value === "object") {
      return value.name || value.title || value._id || value.id || "—";
    }

    return String(value);
  }

  function getInitials(name) {
    return String(name || "Admin")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  // =========================
  // ADMIN PROFILE
  // =========================

  function renderAdminProfile(admin = {}) {
    const nameElement = document.getElementById("admin-name");
    const roleElement = document.getElementById("admin-role");
    const initialsElement = document.getElementById("profile-initials");

    const name = admin.fullName || admin.name || "Admin";

    if (nameElement) {
      nameElement.textContent = name;
    }

    if (roleElement) {
      roleElement.textContent = admin.role || "Admin";
    }

    if (initialsElement) {
      initialsElement.textContent = getInitials(name);
    }
  }

  // =========================
  // STATISTICS
  // =========================

  // =========================
  // STATISTICS
  // =========================

  function updateStat(label, value) {
    const statsContainer = document.querySelector(
      "main > section > section > div.grid"
    );

    if (!statsContainer) {
      console.error("Dashboard statistics container not found.");
      return;
    }

    const cards = statsContainer.querySelectorAll(":scope > div");

    cards.forEach((card) => {
      const title = card.querySelector("p");
      const number = card.querySelector("h2");

      if (
        title &&
        number &&
        title.textContent.trim().toLowerCase() === label.toLowerCase()
      ) {
        number.textContent = Number(value).toLocaleString();
      }
    });
  }

  function renderStats(summary = {}) {
    console.log("Summary received:", summary);

    if (summary.totalQuestions !== undefined) {
      updateStat("Total Questions", summary.totalQuestions);
    }

    if (summary.publishedItems !== undefined) {
      updateStat("Published Items", summary.publishedItems);
    }

    if (summary.totalSubjects !== undefined) {
      updateStat("Active Subjects", summary.totalSubjects);
    }

    if (summary.drafts !== undefined) {
      updateStat("Drafts", summary.drafts);
    }
  }
  // =========================
  // DISTRIBUTION BAR CHART
  // Questions grouped by exam tier
  // =========================

  function renderBarChart(questions, distribution = []) {
    if (!examChart) return;

    examChart.replaceChildren();

    const counts = {};

    if (distribution.length) {
      distribution.forEach((item) => {
        const label = getText(
          item.label,
          item.name,
          item.examName,
          item.category
        );

        counts[label] = getNumber(
          item.count,
          item.total,
          item.questionCount,
          item.value
        );
      });
    } else {
      questions.forEach((question) => {
        const label = getText(
          question.examName,
          question.examType,
          question.exam?.name,
          question.exam,
          question.category
        );

        counts[label] = (counts[label] || 0) + 1;
      });
    }

    const entries = Object.entries(counts);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    const maxCount = Math.max(...entries.map(([, count]) => count), 1);

    if (!entries.length) {
      examChart.textContent = "No exam distribution data available.";
      return;
    }

    examChart.className =
      "flex h-64 items-end justify-around gap-4 overflow-x-auto px-2";

    entries.forEach(([label, count]) => {
      const column = document.createElement("div");

      column.className =
        "flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2";

      const percentage = document.createElement("span");
      percentage.className = "text-xs font-semibold text-gray-600";
      percentage.textContent =
        `${total ? ((count / total) * 100).toFixed(1) : 0}%`;

      const bar = document.createElement("div");
      bar.className = "w-full max-w-12 rounded-t-md bg-[#00C896]";
      bar.style.height = `${Math.max((count / maxCount) * 75, 2)}%`;
      bar.title = `${label}: ${count} questions`;

      const caption = document.createElement("span");
      caption.className =
        "max-w-full truncate text-center text-xs text-gray-500";
      caption.textContent = label;
      caption.title = label;

      column.append(percentage, bar, caption);
      examChart.appendChild(column);
    });
  }

  // =========================
  // SUBJECT DOUGHNUT CHART
  // Percentage of questions per subject
  // =========================

  function renderSubjectChart(questions, subjects = []) {
    if (!subjectLegend) return;

    subjectLegend.replaceChildren();

    const counts = {};

    if (subjects.length) {
      subjects.forEach((subject) => {
        const name = getText(subject.name, subject.subjectName);

        counts[name] = getNumber(
          subject.questionCount,
          subject.questionsCount,
          subject.count,
          subject.total
        );
      });
    } else {
      questions.forEach((question) => {
        const name = getText(
          question.subjectName,
          question.subject?.name,
          question.subject
        );

        counts[name] = (counts[name] || 0) + 1;
      });
    }

    const entries = Object.entries(counts).filter(
      ([, count]) => count > 0
    );

    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    const colors = [
      "#00C896",
      "#587DBD",
      "#800080",
      "#F8BD00",
      "#E33629",
      "#085848",
      "#91C9B5",
      "#F08CB7"
    ];

    if (subjectChartBox) {
      subjectChartBox.replaceChildren();

      if (total > 0) {
        let currentPercent = 0;

        const segments = entries.map(([, count], index) => {
          const start = currentPercent;
          currentPercent += (count / total) * 100;

          return `${colors[index % colors.length]} ${start}% ${currentPercent}%`;
        });

        const donut = document.createElement("div");

        donut.className =
          "mx-auto flex h-48 w-48 items-center justify-center rounded-full";

        donut.style.background =
          `conic-gradient(${segments.join(", ")})`;

        const center = document.createElement("div");

        center.className =
          "flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white";

        const totalNumber = document.createElement("strong");
        totalNumber.className = "text-2xl text-[#003028]";
        totalNumber.textContent = total.toLocaleString();

        const centerLabel = document.createElement("span");
        centerLabel.className = "text-xs text-gray-500";
        centerLabel.textContent = "Questions";

        center.append(totalNumber, centerLabel);
        donut.appendChild(center);
        subjectChartBox.appendChild(donut);
      }
    }

    if (!entries.length) {
      subjectLegend.textContent = "No subject distribution data available.";
      return;
    }

    subjectLegend.className = "mt-7 space-y-4";

    entries.forEach(([name, count], index) => {
      const row = document.createElement("div");
      row.className = "flex items-center justify-between gap-3 text-sm";

      const left = document.createElement("div");
      left.className = "flex min-w-0 items-center gap-2";

      const dot = document.createElement("span");
      dot.className = "h-3 w-3 shrink-0 rounded-full";
      dot.style.backgroundColor = colors[index % colors.length];

      const label = document.createElement("span");
      label.className = "truncate";
      label.textContent = name;

      const percent = document.createElement("span");
      percent.className = "shrink-0 font-semibold";
      percent.textContent = `${((count / total) * 100).toFixed(1)}%`;

      left.append(dot, label);
      row.append(left, percent);
      subjectLegend.appendChild(row);
    });
  }

  // =========================
  // RECENT FEED ACTIVITY
  // ID, category, question, subject, topic, status
  // =========================

  function renderRecentFeed(questions) {
    if (!tableBody) return;

    tableBody.replaceChildren();

    if (!questions.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");

      cell.colSpan = 6;
      cell.className = "px-4 py-8 text-center text-gray-400";
      cell.textContent = "No recent question activity available.";

      row.appendChild(cell);
      tableBody.appendChild(row);
      return;
    }

    questions.slice(0, 10).forEach((question, index) => {
      const row = document.createElement("tr");

      row.className = index % 2 === 0 ? "bg-[#FAFAFA]" : "bg-white";

      const values = [
        getText(question._id, question.id, question.questionId),
        getText(
          question.category,
          question.examType,
          question.examName,
          question.exam
        ),
        getText(
          question.questionText,
          question.question,
          question.prompt,
          question.title
        ),
        getText(question.subjectName, question.subject),
        getText(question.topicName, question.topic),
        getText(question.status, question.state)
      ];

      values.forEach((value, cellIndex) => {
        const cell = document.createElement("td");
        cell.className = "px-4 py-4";

        if (cellIndex === 5) {
          const badge = document.createElement("span");
          const published = value.toLowerCase() === "published";

          badge.className = published
            ? "rounded-full bg-[#71dd8c]/30 px-3 py-2 text-[#34C759]"
            : "rounded-full bg-[#F8BD00]/20 px-3 py-2 text-[#B8860B]";

          badge.textContent = value;
          cell.appendChild(badge);
        } else {
          cell.textContent = value;
        }

        row.appendChild(cell);
      });

      tableBody.appendChild(row);
    });
  }

  // =========================
  // ERROR DISPLAY
  // =========================

  function showDashboardError(message) {
    if (examChart) {
      examChart.textContent = message;
    }

    if (subjectLegend) {
      subjectLegend.textContent = message;
    }

    if (tableBody) {
      tableBody.replaceChildren();

      const row = document.createElement("tr");
      const cell = document.createElement("td");

      cell.colSpan = 6;
      cell.className = "px-4 py-6 text-center text-red-500";
      cell.textContent = message;

      row.appendChild(cell);
      tableBody.appendChild(row);
    }
  }

  // =========================
  // FETCH DASHBOARD
  // =========================

  async function loadDashboard() {
    // This must match the key saved by your admin login code.
    const token = sessionStorage.getItem("adminToken");

    if (!token) {
      showDashboardError("No admin session found. Please log in again.");
      console.error("Missing sessionStorage adminToken.");
      return;
    }

    try {
      const response = await fetch(
        `${ADMIN_DASHBOARD_API_BASE}/api/admin/dashboard`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        throw new Error("Admin session expired or unauthorized. Please log in again.");
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || `Request failed (${response.status}).`
        );
      }

      // Actual response provided:
      // { admin: { fullName, id, role }, summary: { ... } }
      const data = result.data ?? result;

      renderAdminProfile(data.admin || {});
      renderStats(data.summary || {});

      // Use these arrays when the backend starts returning them.
      const questions = getArray(
        data.recentQuestions,
        data.recentFeed,
        data.questions,
        data.items
      );

      const examDistribution = getArray(
        data.examTierDistribution,
        data.distributionByExam,
        data.examDistribution
      );

      const subjectDistribution = getArray(
        data.subjectDistribution,
        data.subjectStats,
        data.subjects
      );

      renderBarChart(questions, examDistribution);
      renderSubjectChart(questions, subjectDistribution);
      renderRecentFeed(questions);

      console.log("Admin dashboard response:", data);
    } catch (error) {
      console.error("Admin dashboard error:", error);
      showDashboardError(error.message || "Unable to load dashboard data.");
    }
  }

  loadDashboard();
});
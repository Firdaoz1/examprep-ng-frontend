const API_BASE =
  "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

// State
let practiceSessions = [];
let progressChart = null;

// HTML elements
const summaryPeriod = document.getElementById("performance-period");
const graphPeriod = document.getElementById("progress-period-graph");

const overallAccuracy = document.getElementById("overall-accuracy");
const questionsCompleted = document.getElementById("questions-completed");
const streakDays = document.getElementById("streak-days");
const timeSpent = document.getElementById("time-spent");

const recentActivityList = document.getElementById("Recent-activity-list");

const progressDate = document.getElementById("progress-date");
const chartCanvas = document.getElementById("progress-chart");

// Authentication
function getToken() {
  return localStorage.getItem("token");
}

// Safely read a numeric value
function getNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

async function loadCardProgress() {
  const token = getToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE}/api/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load card progress.");
    }

    const progress = result.data?.progress ?? {};

    if (overallAccuracy && progress.accuracy != null) {
  overallAccuracy.textContent = `${progress.accuracy}%`;
}

    const cardProgress = [
      {
        selector: ".performance-change",
        value: progress.accuracyProgress,
      },
      {
        selector: ".questions-completed-change",
        value: progress.questionsCompletedProgress,
      },
      {
        selector: ".practice-section-change",
        value: progress.studyStreakProgress,
      },
      {
        selector: ".time-spent-change",
        value: progress.timeSpentPracticingProgress,
      },
    ];

    cardProgress.forEach(({ selector, value }) => {
      const element = document.querySelector(selector);

      if (!element || value === undefined || value === null) {
        return;
      }

      const number = Number(value);

      if (!Number.isFinite(number)) return;

      // Reset previous styles and content.
      element.replaceChildren();
      element.classList.remove(
        "text-green-600",
        "text-red-600",
        "text-gray-500",
      );

      if (number > 0) {
        element.classList.add("text-green-600");

        const icon = document.createElement("ion-icon");
        icon.setAttribute("name", "arrow-up-outline");
        icon.setAttribute("aria-hidden", "true");
        icon.style.verticalAlign = "middle";

        element.append(icon, document.createTextNode(` ${number}%`));
      } else if (number < 0) {
        element.classList.add("text-red-600");

        const icon = document.createElement("ion-icon");
        icon.setAttribute("name", "arrow-down-outline");
        icon.setAttribute("aria-hidden", "true");
        icon.style.verticalAlign = "middle";

        element.append(icon, document.createTextNode(` ${Math.abs(number)}%`));
      } else {
        element.classList.add("text-gray-500");
        element.textContent = "0%";
      }
    });
  } catch (error) {
    console.error("Card progress loading error:", error);
  }
}

function getName(value, fallback = "—") {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return value.name || value.topicName || value.subjectName || fallback;
  }
  return fallback;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return replacements[character];
  });
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, getNumber(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${hours}h ${minutes}m`;
}

function getSessionDate(session) {
  const value =
    session.date ??
    session.completedAt ??
    session.createdAt ??
    session.updatedAt;

  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function loadProgress() {
  try {
    const token = getToken();

    if (!token) {
      throw new Error("Please log in to view your progress.");
    }

    const response = await fetch(`${API_BASE}/api/practice-sessions`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to load practice sessions.");
    }

    const data = result.data ?? result;

    if (Array.isArray(data)) {
      practiceSessions = data;
    } else if (Array.isArray(data.sessions)) {
      practiceSessions = data.sessions;
    } else if (Array.isArray(data.practiceSessions)) {
      practiceSessions = data.practiceSessions;
    } else if (Array.isArray(data.attempts)) {
      practiceSessions = data.attempts;
    } else {
      console.warn(
        "No practice-session array found in the API response.",
        data,
      );
      practiceSessions = [];
    }

    updateSummaryCards();
    renderRecentActivity();
    renderProgressChart();
  } catch (error) {
    console.error("Progress loading error:", error);

    overallAccuracy.textContent = "—";
    questionsCompleted.textContent = "—";
    streakDays.textContent = "—";
    timeSpent.textContent = "—";

    if (recentActivityList) {
      recentActivityList.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-8 text-center text-red-500">
            ${escapeHTML(error.message)}
          </td>
        </tr>
      `;
    }

    if (progressChart) {
      progressChart.destroy();
      progressChart = null;
    }
  }
}

function getPeriodStart(days) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - Number(days) + 1);
  return start;
}

function getSessionsForPeriod(days) {
  const start = getPeriodStart(days);
  const now = new Date();

  return practiceSessions.filter((session) => {
    const date = getSessionDate(session);
    return date && date >= start && date <= now;
  });
}

function getQuestionCount(session) {
  return Math.max(
    0,
    getNumber(
      session.numberOfQuestions ??
        session.questionsCompleted ??
        session.totalQuestions,
    ),
  );
}

function getAccuracy(session) {
  const value = session.accuracy ?? session.percentage;

  if (value !== undefined && value !== null && value !== "") {
    return Math.max(0, Math.min(100, getNumber(value)));
  }

  const score = session.score;
  const count = getQuestionCount(session);

  if (score !== undefined && score !== null && count > 0) {
    const numericScore = getNumber(score);
    return Math.max(
      0,
      Math.min(
        100,
        numericScore <= 1 ? numericScore * 100 : (numericScore / count) * 100,
      ),
    );
  }

  return null;
}

function getDurationSeconds(session) {
  if (
    session.durationSeconds !== undefined &&
    session.durationSeconds !== null
  ) {
    return Math.max(0, getNumber(session.durationSeconds));
  }

  return 0;
}

function updateSummaryCards() {
  const days = Number(summaryPeriod?.value) || 30;
  const sessions = getSessionsForPeriod(days);

  let totalQuestions = 0;
  let totalCorrect = 0;
  let knownAccuracyQuestions = 0;

  sessions.forEach((session) => {
    const count = getQuestionCount(session);
    const accuracy = getAccuracy(session);

    totalQuestions += count;

    if (accuracy !== null) {
      totalCorrect += (count * accuracy) / 100;
      knownAccuracyQuestions += count;
    }
  });

  const accuracy =
    knownAccuracyQuestions > 0
      ? Math.round((totalCorrect / knownAccuracyQuestions) * 100)
      : null;

  const totalSeconds = sessions.reduce(
    (sum, session) => sum + getDurationSeconds(session),
    0,
  );

  if (overallAccuracy) {
    overallAccuracy.textContent = accuracy === null ? "—" : `${accuracy}%`;
  }

  if (questionsCompleted) {
    questionsCompleted.textContent = totalQuestions.toLocaleString();
  }

  if (timeSpent) {
    timeSpent.textContent = formatDuration(totalSeconds);
  }

  if (streakDays) {
    streakDays.textContent = `${calculateStudyStreak()} days`;
  }

  document.querySelectorAll(".comparison-label").forEach((label) => {
    label.textContent = `vs. Last ${days} days`;
  });
}

function calculateStudyStreak() {
  const sessionDays = new Set();

  practiceSessions.forEach((session) => {
    const date = getSessionDate(session);
    if (!date) return;

    sessionDays.add(
      `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    );
  });

  if (sessionDays.size === 0) return 0;

  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  const keyFor = (date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  if (!sessionDays.has(keyFor(checkDate))) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let streak = 0;

  while (sessionDays.has(keyFor(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

function formatSessionDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function renderRecentActivity() {
  if (!recentActivityList) return;

  recentActivityList.innerHTML = "";

  const sessions = [...practiceSessions]
    .sort(
      (a, b) =>
        (getSessionDate(b)?.getTime() || 0) -
        (getSessionDate(a)?.getTime() || 0),
    )
    .slice(0, 4);

  if (sessions.length === 0) {
    recentActivityList.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-gray-500">
          No completed practice sessions found for this account.
        </td>
      </tr>
    `;
    return;
  }

  sessions.forEach((session) => {
    const subject = getName(session.subject, "Unknown subject");
    const topic = getName(session.topic, "—");
    const count = getQuestionCount(session);
    const accuracy = getAccuracy(session);

    const score = accuracy === null ? "—" : `${Math.round(accuracy)}%`;

    const mode =
      session.practiceMode || session.mode || session.type || "Practice";

    const row = document.createElement("tr");
    row.className = "border-b border-[#D9D9D9]";

    const values = [
      subject,
      topic,
      count.toLocaleString(),
      score,
      formatSessionDate(
        session.date ??
          session.completedAt ??
          session.createdAt ??
          session.updatedAt,
      ),
      mode,
    ];

    values.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.className = "px-5 py-4";

      if (index === 0) {
        cell.classList.add("px-6");

        const wrapper = document.createElement("div");
        wrapper.className =
          "flex flex-col md:flex-row items-start md:items-center gap-3";

        const icon = document.createElement("div");
        icon.className =
          "w-9 h-9 rounded-full bg-[#D9F5D8] text-[#085848] flex items-center justify-center font-bold";
        icon.textContent = subject.charAt(0).toUpperCase();

        const subjectName = document.createElement("p");
        subjectName.textContent = subject;

        wrapper.append(icon, subjectName);
        cell.appendChild(wrapper);
      } else {
        cell.textContent = String(value);
      }

      if (index === 3 && accuracy !== null) {
        cell.classList.add(
          accuracy >= 70
            ? "text-[#34C759]"
            : accuracy >= 50
              ? "text-[#D4A900]"
              : "text-red-500",
        );
      }

      row.appendChild(cell);
    });

    recentActivityList.appendChild(row);
  });
}

function renderProgressChart() {
  if (!chartCanvas || typeof Chart === "undefined") return;

  if (progressDate) {
    progressDate.innerHTML = "";
    progressDate.classList.add("hidden");
  }

  const days = Number(graphPeriod?.value) || 30;
  const sessions = getSessionsForPeriod(days);
  const dailyTotals = new Map();

  sessions.forEach((session) => {
    const date = getSessionDate(session);
    const count = getQuestionCount(session);
    const accuracy = getAccuracy(session);

    if (!date || count <= 0 || accuracy === null) return;

    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    const current = dailyTotals.get(key) || {
      correct: 0,
      questions: 0,
    };

    current.correct += (accuracy / 100) * count;
    current.questions += count;

    dailyTotals.set(key, current);
  });

  const labels = [];
  const values = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const offset = Math.round(((6 - i) * (days - 1)) / 6);

    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    date.setHours(0, 0, 0, 0);

    labels.push(
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    );

    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    const total = dailyTotals.get(key);

    values.push(
      total && total.questions > 0
        ? Number(((total.correct / total.questions) * 100).toFixed(1))
        : null,
    );
  }

  if (progressChart) {
    progressChart.destroy();
  }

  progressChart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Daily accuracy",
          data: values,
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.12)",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.25,
          spanGaps: false,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          border: {
            display: true,
            color: "#D9D9D9",
            width: 1,
          },
          ticks: {
            autoSkip: false,
            maxRotation: 0,
          },
        },
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 25,
            callback: (value) => `${value}%`,
          },
          grid: {
            display: false,
          },
          border: {
            display: true,
            color: "#D9D9D9",
            width: 1,
          },
        },
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const savedPerformancePeriod = localStorage.getItem("performancePeriod");

  const savedGraphPeriod = localStorage.getItem("graphPeriod");

  if (summaryPeriod && savedPerformancePeriod) {
    summaryPeriod.value = savedPerformancePeriod;
  }

  if (graphPeriod && savedGraphPeriod) {
    graphPeriod.value = savedGraphPeriod;
  }

  summaryPeriod?.addEventListener("change", () => {
    localStorage.setItem("performancePeriod", summaryPeriod.value);
    updateSummaryCards();
  });

  graphPeriod?.addEventListener("change", () => {
    localStorage.setItem("graphPeriod", graphPeriod.value);
    renderProgressChart();
  });

  loadProgress();
  loadCardProgress();
});

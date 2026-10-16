const performancePeriod = document.getElementById("performance-period");

const overallAccuracy = document.getElementById("overall-accuracy");
const questionsCompleted = document.getElementById("questions-completed");
const practiceSessions = document.getElementById("practice-sessions");
const timeSpent = document.getElementById("time-spent");
const accuracyChange = document.getElementById("performance-change");
const questionsChange = document.getElementById("question-completed-change");
const sessionsChange = document.getElementById("practice-section-change");
const timeChange = document.getElementById("time-spent-change");

const subjectPerformanceList = document.getElementById(
  "subject-performance-list",
);

const weakTopicsList = document.getElementById("weak-topics-list");

const recentActivityList = document.getElementById("recent-activity-list");

const API =
  "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app/api/dashboard";

function showValue(value, fallback = "-") {
  return value !== undefined && value !== null && value !== ""
    ? value
    : fallback;
}

function updateChange(element, value) {
  if (!element || value === undefined || value === null) return;

  const number = Number(value);
  if (!Number.isFinite(number)) return;

  element.textContent = `${Math.abs(number)}%`;

  const container = element.parentElement;
  const icon = container?.querySelector("ion-icon");

  container?.classList.remove(
    "text-[#34c759]",
    "text-[#FF0000]",
    "text-[#000000]",
  );

  if (icon) {
    icon.style.display = "inline";
  }

  if (number > 0) {
    container?.classList.add("text-[#34c759]");

    if (icon) icon.setAttribute("name", "arrow-up-outline");
  } else if (number < 0) {
    container?.classList.add("text-[#FF0000]");

    if (icon) icon.setAttribute("name", "arrow-down-outline");
  } else {
    container?.classList.add("text-[#000000]");

    if (icon) icon.style.display = "none";
  }
}

function createIcon(iconName, fallbackText, size = "w-11 h-11") {
  const container = document.createElement("div");

  container.className =
    `${size} shrink-0 flex items-center justify-center ` +
    "rounded-full bg-[#D9F5D8] text-[#085848]";

  container.textContent = String(fallbackText || "?")
    .charAt(0)
    .toUpperCase();

  return container;
}

function updateComparisonLabels() {
  const days = performancePeriod?.value || "30";

  document.querySelectorAll(".comparison-label").forEach((label) => {
    label.textContent = `Vs. Last ${days} days`;
  });
}

async function getPerformance() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Login token not found. Please log in again.");
    }

    const days = performancePeriod?.value || "30";
    const url = `${API}?days=${encodeURIComponent(days)}&_=${Date.now()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Unable to fetch performance data.");
    }

    const data = result.data || {};
    const progress = data.progress || {};

    if (overallAccuracy) {
      overallAccuracy.textContent = `${showValue(progress.accuracy, 0)}%`;
    }

    if (questionsCompleted) {
      questionsCompleted.textContent = showValue(
        progress.questionsCompleted,
        0,
      );
    }
    if (practiceSessions) {
      practiceSessions.textContent = showValue(
        progress.practiceSessionsCompleted,
        0,
      );
    }

    const timeValue = Number(progress.timeSpentPracticing ?? 0);

    const hours = Math.floor(timeValue / 60);
    const minutes = Math.floor(timeValue % 60);

    timeSpent.textContent = `${hours}h ${minutes}m`;

    updateChange(
      timeChange,
      progress.timeSpentPracticingProgress ?? data.timeSpentPracticingProgress,
    );

    updateChange(accuracyChange, progress.accuracyProgress);
    updateChange(questionsChange, progress.questionsCompletedProgress);

    updateChange(
      sessionsChange,
      progress.sessionsProgress ?? progress.practiceSessionsProgress,
    );

    renderSubjectPerformance(data.subjectPerformance || []);

    renderWeakTopics(data.weakTopics || []);

    renderRecentActivity(
      Array.isArray(data.recentAttempts) ? data.recentAttempts.slice(0, 4) : [],
    );
  } catch (error) {
    console.error("Error fetching performance:", error);
  }
}

function renderSubjectPerformance(subjects) {
  if (!subjectPerformanceList) return;

  subjectPerformanceList.innerHTML = "";

  if (!Array.isArray(subjects) || subjects.length === 0) {
    subjectPerformanceList.textContent = "No subject performance data yet.";
    return;
  }

  subjects.forEach((subject) => {
    const name =
      typeof subject.subject === "object"
        ? (subject.subject?.name ??
          subject.name ??
          subject.subjectName ??
          "Subject")
        : (subject.subject ?? subject.name ?? subject.subjectName ?? "Subject");

    const accuracy = Math.max(0, Math.min(100, Number(subject.accuracy ?? 0)));
    const row = document.createElement("div");

    row.className =
      "grid grid-cols-[44px_minmax(0,1fr)_40px] " +
      "sm:grid-cols-[44px_minmax(90px,1fr)_minmax(90px,1fr)_40px] " +
      "items-center gap-3";

    const icon = createIcon(subject.icon, name, "w-11 h-11");

    const nameElement = document.createElement("p");
    nameElement.className = "text-[14px] font-bold";
    nameElement.textContent = name;

    const bar = document.createElement("div");
    bar.className =
      "col-start-2 col-span-2 sm:col-auto " +
      "h-[5px] rounded-full bg-[#D9D9D9]";

    const fill = document.createElement("div");
    fill.className = "h-full rounded-full bg-[#00C896]";
    fill.style.width = `${accuracy}%`;

    bar.appendChild(fill);

    const percentage = document.createElement("p");
    percentage.className =
      "row-start-1 col-start-3 sm:row-auto sm:col-auto " +
      "text-[12px] text-right font-bold";

    percentage.textContent = `${accuracy}%`;

    row.append(icon, nameElement, bar, percentage);
    subjectPerformanceList.appendChild(row);
  });
}

function renderWeakTopics(topics) {
  if (!weakTopicsList) return;

  weakTopicsList.innerHTML = "";

  if (!Array.isArray(topics) || topics.length === 0) {
    weakTopicsList.textContent = "No weak topic available yet.";
    return;
  }

  topics.forEach((topic) => {
    const name = topic.topic ?? topic.name ?? topic.topicName ?? "Topic";

    const subjectName = topic.subject ?? topic.subjectName ?? "";

    const accuracy = Math.max(0, Math.min(100, Number(topic.accuracy ?? 0)));

    const row = document.createElement("div");

    row.className =
      "grid grid-cols-[42px_minmax(0,1fr)_40px] " +
      "sm:grid-cols-[42px_minmax(80px,1fr)_35px_minmax(55px,1fr)_65px] " +
      "items-center gap-3";

    const icon = createIcon(topic.icon, name, "w-10 h-10");

    const details = document.createElement("div");

    const topicName = document.createElement("p");
    topicName.className = "text-[13px] font-bold";
    topicName.textContent = name;

    const subject = document.createElement("p");
    subject.className = "mt-1 text-[13px] text-black/50";
    subject.textContent = subjectName;

    details.append(topicName, subject);

    const percentage = document.createElement("p");
    percentage.className = "text-[12px] text-right font-bold";
    percentage.textContent = `${accuracy}%`;

    const bar = document.createElement("div");
    bar.className =
      "col-start-2 col-span-2 sm:col-auto " +
      "h-[4px] rounded-full bg-[#D9D9D9] overflow-hidden";

    const fill = document.createElement("div");
    fill.className = "h-full rounded-full bg-[#085848]";
    fill.style.width = `${accuracy}%`;

    bar.appendChild(fill);

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "col-start-2 sm:col-auto w-fit px-3 py-2 rounded-lg " +
      "bg-[#FFE1E2] text-[12px] font-bold text-[#FF0000]";
    button.textContent = "Practice";

    row.append(icon, details, percentage, bar, button);

    weakTopicsList.appendChild(row);
  });
}

function renderRecentActivity(activities) {
  if (!recentActivityList) return;

  recentActivityList.innerHTML = "";

  if (!Array.isArray(activities) || activities.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 6;
    cell.className = "px-6 py-4 text-center text-black/50";
    cell.textContent = "No recent activity yet.";

    row.appendChild(cell);
    recentActivityList.appendChild(row);
    return;
  }

  activities.forEach((activity) => {
    const row = document.createElement("tr");
    row.className = "border-b border-[#D8E0DE]";

    const subjectName =
      typeof activity.subject === "object"
        ? (activity.subject?.name ?? "Subject")
        : (activity.subject ?? activity.subjectName ?? "Subject");

    const topicValue = activity.topics ?? activity.topic ?? activity.topicName;
    const topicName = Array.isArray(topicValue)
      ? topicValue
          .map((topic) => (typeof topic === "object" ? topic.name : topic))
          .filter(Boolean)
          .join(", ")
      : typeof topicValue === "object"
        ? (topicValue?.name ?? "-")
        : (topicValue ?? "-");

    const questionCount =
      activity.totalQuestions ??
      activity.questions ??
      activity.questionsAttempted ??
      "-";

    const scoreValue = activity.accuracy ?? activity.score;
    const score =
      scoreValue === undefined || scoreValue === null
        ? "-"
        : `${
            scoreValue === activity.score && activity.accuracy == null
              ? Number(scoreValue) * 100
              : Number(scoreValue)
          }%`;

    const dateValue =
      activity.submittedAt ?? activity.date ?? activity.createdAt;

    const mode = activity.mode ?? activity.type ?? activity.examType ?? "-";

    const subjectCell = document.createElement("td");
    subjectCell.className = "px-6 py-4";

    const subjectWrapper = document.createElement("div");
    subjectWrapper.className =
      "flex flex-col md:flex-row items-start md:items-center gap-3";

    const subjectIcon = createIcon(activity.icon, subjectName, "w-9 h-9");

    const subjectText = document.createElement("p");
    subjectText.textContent = subjectName;

    subjectWrapper.append(subjectIcon, subjectText);
    subjectCell.appendChild(subjectWrapper);
    row.appendChild(subjectCell);

    const values = [
      topicName,
      questionCount,
      score,
      dateValue ? formatActivityDate(dateValue) : "-",
      mode,
    ];

    values.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.className = "px-5 py-4";
      cell.textContent = String(value);

      if (index === 2 && score !== "-") {
        const numericScore = Number.parseFloat(score);

        if (numericScore >= 70) {
          cell.classList.add("text-[#34c759]");
        } else if (numericScore < 50) {
          cell.classList.add("text-[#FF0000]");
        }
      }

      row.appendChild(cell);
    });

    recentActivityList.appendChild(row);
  });
}

function formatActivityDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

performancePeriod?.addEventListener("change", () => {
  updateComparisonLabels();
  getPerformance();
});

updateComparisonLabels();
getPerformance();

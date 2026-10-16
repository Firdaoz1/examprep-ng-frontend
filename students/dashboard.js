// ========================================
// EXAMPREP NG - DASHBOARD
// ========================================

const greeting = document.getElementById("morning");
const dateElement = document.getElementById("date");

const weakTopic = document.getElementById("topics");
const accuracy = document.getElementById("accuracy");

const questionsCompleted = document.getElementById("questions-completed");
const questionsChange = document.getElementById("questions-change");

const practiceSessionsElement = document.getElementById("practice-sessions");
const practiceChange = document.getElementById("practice-change");

const continuePractice = document.getElementById("continue-practice");
const practiceTitle = document.getElementById("practice-title");
const practiceDetails = document.getElementById("practice-details");

const recentActivities = document.getElementById("recent-activities");
const weakTopicsContainer = document.getElementById("weak-topic");

const monthYear = document.getElementById("monthYear");
const calendarDays = document.getElementById("calendarDays");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

const API_BASE_URL =
  "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

async function loadDashboard() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to load dashboard.");
    }

    if (!result.success || !result.data) {
      throw new Error("Invalid dashboard response.");
    }

    const data = result.data;
    const progress = data.progress || {};

    const studentName =
      typeof data.student === "object"
        ? data.student?.name || "Student"
        : data.student || "Student";

    showGreeting(studentName);

    if (questionsCompleted) {
      questionsCompleted.textContent =
        progress.questionsCompleted ?? data.questionsAttempted ?? 0;
    }

    showProgress(questionsChange, progress.questionsCompletedProgress);

    if (practiceSessionsElement) {
      practiceSessionsElement.textContent =
        progress.practiceSessionsCompleted ??
        data.practiceSessionsCompleted ??
        0;
    }

    showProgress(practiceChange, progress.practiceSessionsProgress);

    const weakTopics = Array.isArray(data.weakTopics) ? data.weakTopics : [];

    if (weakTopics.length > 0) {
      const weakest = weakTopics[0];

      if (weakTopic) {
        weakTopic.textContent = weakest.topic || "Unknown topic";
      }

      if (accuracy) {
        accuracy.textContent =
          weakest.accuracy != null
            ? `${weakest.accuracy}% accuracy`
            : "No accuracy data yet";
      }
    } else {
      if (weakTopic) {
        weakTopic.textContent = "No data yet";
      }

      if (accuracy) {
        accuracy.textContent = "No accuracy data yet";
      }
    }

    displayWeakTopics(weakTopics, weakTopicsContainer);
    const sessions = Array.isArray(data.practiceSessions)
      ? data.practiceSessions
      : [];

    displayPracticeSessions(sessions);

    if (data.currentPractice) {
      displayCurrentPractice(data.currentPractice);
    } else if (continuePractice) {
      continuePractice.disabled = true;

      continuePractice.classList.add("opacity-50", "cursor-not-allowed");
    }

    const activities = Array.isArray(data.recentAttempts)
      ? data.recentAttempts
      : [];

    displayActivities(activities, recentActivities);
  } catch (error) {
    console.error("Dashboard error:", error);
  }
}

function showGreeting(name) {
  const now = new Date();
  const hour = now.getHours();

  let greetingText;

  if (hour < 12) {
    greetingText = "Good Morning";
  } else if (hour < 18) {
    greetingText = "Good Afternoon";
  } else {
    greetingText = "Good Evening";
  }

  if (greeting) {
    greeting.textContent = `${greetingText}, ${name}`;
  }

  if (dateElement) {
    dateElement.textContent = now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
}

function showProgress(element, percentage) {
  if (!element) return;

  const icon = element.querySelector("ion-icon");
  const text = element.querySelector("span");

  if (!text) return;

  const value = Number(percentage);

  if (percentage == null || percentage === "" || !Number.isFinite(value)) {
    text.textContent = "0%";

    if (icon) {
      icon.style.display = "none";
    }

    element.classList.remove("text-green-500", "text-red-500");

    element.classList.add("text-gray-500");
    return;
  }

  text.textContent = `${Math.abs(value)}%`;

  if (icon) {
    if (value > 0) {
      icon.style.display = "inline-block";
      icon.setAttribute("name", "arrow-up-outline");
    } else if (value < 0) {
      icon.style.display = "inline-block";
      icon.setAttribute("name", "arrow-down-outline");
    } else {
      icon.style.display = "none";
    }
  }

  element.classList.remove("text-green-500", "text-red-500", "text-gray-500");

  if (value > 0) {
    element.classList.add("text-green-500");
  } else if (value < 0) {
    element.classList.add("text-red-500");
  } else {
    element.classList.add("text-gray-500");
  }
}

function getSessionId(session) {
  if (!session || typeof session !== "object") {
    return null;
  }

  return (
    session.attemptId ?? session.sessionId ?? session._id ?? session.id ?? null
  );
}

function getSavedAttempt() {
  const savedAttempt = sessionStorage.getItem("activePracticeAttempt");

  if (!savedAttempt) {
    return null;
  }

  try {
    const parsed = JSON.parse(savedAttempt);

    const attempt = parsed.attempt ?? parsed;

    if (!attempt || typeof attempt !== "object") {
      return null;
    }

    if (!Array.isArray(attempt.questions) || attempt.questions.length === 0) {
      return null;
    }

    return attempt;
  } catch (error) {
    console.error("Could not read saved practice attempt:", error);

    return null;
  }
}

function resumePractice(session) {
  const sessionId = getSessionId(session);

  if (!sessionId) {
    alert("This practice session does not have a session ID.");
    return;
  }

  const savedAttempt = getSavedAttempt();

  if (!savedAttempt) {
    alert(
      "The questions for this practice session are not saved. The backend needs to provide a way to retrieve the active attempt.",
    );

    console.warn(
      "Cannot resume: active attempt questions are missing from sessionStorage.",
    );

    return;
  }

  const savedId = getSessionId(savedAttempt);

  if (!savedId || String(savedId) !== String(sessionId)) {
    alert("The saved questions do not match this practice session.");

    console.warn("Session ID mismatch:", {
      selectedSessionId: sessionId,
      savedSessionId: savedId,
    });

    return;
  }

  window.location.href = `./questionpractice.html?sessionId=${encodeURIComponent(sessionId)}`;
}

function displayCurrentPractice(session) {
  if (!session) return;

  if (practiceTitle) {
    practiceTitle.textContent =
      session.subject?.name ?? session.subject ?? "Continue Practicing";
  }

  if (practiceDetails) {
    const topic = session.topic?.name ?? session.topic ?? "General practice";

    const questionCount =
      session.numberOfQuestions ??
      session.questionsCount ??
      session.totalQuestions ??
      (Array.isArray(session.questions) ? session.questions.length : null);

    practiceDetails.textContent =
      questionCount != null ? `${topic} · ${questionCount} questions` : topic;
  }

  if (continuePractice) {
    continuePractice.disabled = false;

    continuePractice.classList.remove("opacity-50", "cursor-not-allowed");

    continuePractice.onclick = () => {
      resumePractice(session);
    };
  }
}

function displayPracticeSessions(sessions) {
  const container = document.getElementById("continue-practice-list");

  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(sessions) || sessions.length === 0) {
    container.innerHTML = `
      <div class="rounded-lg border border-gray-200 p-4">
        <p class="text-sm text-gray-600">
          No ongoing practice sessions.
        </p>
      </div>
    `;

    return;
  }

  sessions.slice(0, 2).forEach((session) => {
    const subject =
      session.subject?.name ?? session.subject ?? "Subject unavailable";

    const topic = session.topic?.name ?? session.topic ?? "Topic unavailable";

    const mode = session.practiceMode ?? session.mode ?? "Practice";

    const questionCount =
      session.numberOfQuestions ??
      session.questionsCount ??
      session.totalQuestions ??
      (Array.isArray(session.questions) ? session.questions.length : 0);

    const card = document.createElement("div");

    card.className = "rounded-xl border border-gray-200 p-4 space-y-3";

    const details = document.createElement("div");

    const heading = document.createElement("h3");
    heading.className = "font-semibold text-gray-800";
    heading.textContent = subject;

    const topicText = document.createElement("p");
    topicText.className = "mt-1 text-sm text-gray-600";
    topicText.textContent = `Topic: ${topic}`;

    const sessionText = document.createElement("p");
    sessionText.className = "mt-1 text-sm text-gray-500";
    sessionText.textContent = `${mode} · ${questionCount} questions`;

    details.append(heading, topicText, sessionText);

    const button = document.createElement("button");

    button.type = "button";
    button.textContent = "Continue Practice";
    button.className = "w-full rounded-lg bg-[#085848] px-4 py-2 text-white";

    button.addEventListener("click", () => {
      resumePractice(session);
    });

    card.append(details, button);
    container.appendChild(card);
  });
}

function displayActivities(activities, container) {
  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(activities) || activities.length === 0) {
    container.innerHTML = `
      <tr>
        <td
          colspan="4"
          class="px-6 py-8 text-center text-gray-500"
        >
          No recent activity yet.
        </td>
      </tr>
    `;

    return;
  }

  activities.slice(0, 4).forEach((activity) => {
    const row = document.createElement("tr");

    row.className = "border-b border-[#D8E0DE]";

    const subjectCell = document.createElement("td");
    subjectCell.className = "px-6 py-4";

    const subjectName =
      typeof activity.subject === "object"
        ? (activity.subject?.name ?? "Unknown subject")
        : (activity.subject ?? "Unknown subject");

    const subjectWrapper = document.createElement("div");

    subjectWrapper.className = "flex items-center gap-3";

    const subjectIcon = document.createElement("div");

    subjectIcon.className =
      "flex h-10 w-10 shrink-0 items-center justify-center " +
      "rounded-full bg-[#D9F5D8] font-bold text-[#085848]";

    subjectIcon.textContent = String(subjectName).charAt(0).toUpperCase();

    const subjectText = document.createElement("p");

    subjectText.className = "font-bold";
    subjectText.textContent = subjectName;

    subjectWrapper.append(subjectIcon, subjectText);

    subjectCell.appendChild(subjectWrapper);

    const questionsCell = document.createElement("td");

    questionsCell.className = "px-5 py-4";

    questionsCell.textContent =
      activity.totalQuestions ??
      activity.questionsCount ??
      activity.questionsAttempted ??
      (Array.isArray(activity.questions) ? activity.questions.length : 0);

    const scoreCell = document.createElement("td");

    scoreCell.className = "px-5 py-4 font-bold";

    const scoreValue = activity.accuracy ?? activity.score;

    const score = Number(scoreValue);

    if (
      scoreValue !== undefined &&
      scoreValue !== null &&
      Number.isFinite(score)
    ) {
      scoreCell.textContent = `${score}%`;

      scoreCell.classList.add(
        score >= 50 ? "text-[#34c759]" : "text-[#FF0000]",
      );
    } else {
      scoreCell.textContent = "--";
    }

    const dateCell = document.createElement("td");

    dateCell.className = "whitespace-nowrap px-5 py-4";

    dateCell.textContent = formatDate(
      activity.submittedAt ?? activity.date ?? activity.createdAt,
    );

    row.append(subjectCell, questionsCell, scoreCell, dateCell);

    container.appendChild(row);
  });
}

function displayWeakTopics(topics, container) {
  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(topics) || topics.length === 0) {
    container.innerHTML = `
      <p class="text-sm text-gray-500">
        No weak topics available yet.
      </p>
    `;

    return;
  }

  topics.forEach((topic) => {
    const topicAccuracy = Number(topic.accuracy);

    const hasAccuracy =
      topic.accuracy !== undefined &&
      topic.accuracy !== null &&
      Number.isFinite(topicAccuracy);

    const safeAccuracy = hasAccuracy
      ? Math.max(0, Math.min(100, topicAccuracy))
      : 0;

    const topicElement = document.createElement("div");

    topicElement.className = "flex gap-3";

    topicElement.innerHTML = `
  <div
    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D9F5D8] text-base font-bold text-[#085848]"
  >
    <span class="topic-initial"></span>
  </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="topic-name text-[16px] font-bold"></p>

            <p class="topic-accuracy text-[13px] font-bold text-[#78909C]"></p>
          </div>

          <button
            type="button"
            class="practice-topic rounded-lg bg-red-100 px-3 py-1.5 text-[12px] font-bold text-red-500"
          >
            Practice
          </button>
        </div>

        <div class="mt-3 h-1.5 w-full rounded-full bg-gray-200">
          <div
            class="topic-bar h-full rounded-full bg-red-500"
          ></div>
        </div>
      </div>
    `;

    const topicName = topic.topic ?? "Untitled topic";

    topicElement.querySelector(".topic-name").textContent = topicName;

    topicElement.querySelector(".topic-initial").textContent = topicName
      .trim()
      .charAt(0)
      .toUpperCase();

    topicElement.querySelector(".topic-accuracy").textContent = hasAccuracy
      ? `${safeAccuracy}% accuracy`
      : "No accuracy data yet";

    topicElement.querySelector(".topic-bar").style.width = `${safeAccuracy}%`;

    topicElement
      .querySelector(".practice-topic")
      .addEventListener("click", () => {
        const topicName = topic.topic ?? "";

        window.location.href = `./questionpractice.html?topic=${encodeURIComponent(topicName)}`;
      });

    container.appendChild(topicElement);
  });
}

function formatDate(dateValue) {
  if (!dateValue) return "--";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

let currentDate = new Date();
let selectedDate = new Date();

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function calendar() {
  if (!monthYear || !calendarDays) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthYear.textContent = `${monthNames[month]} ${year}`;

  calendarDays.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement("div");

    emptyDay.className = "h-[70px] sm:h-[82px]";

    calendarDays.appendChild(emptyDay);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateButton = document.createElement("button");

    dateButton.type = "button";
    dateButton.textContent = day;

    dateButton.className =
      "relative flex w-full items-center justify-center p-3 " +
      "text-[15px] font-medium hover:bg-[#F2F8F6] " +
      "sm:text-[17px]";

    const date = new Date(year, month, day);

    if (date.getDay() === 0) {
      dateButton.classList.add("text-[#EF6B78]");
    } else {
      dateButton.classList.add("text-[#424242]");
    }

    if (isSameDate(date, selectedDate)) {
      dateButton.classList.add("border-2", "border-[#085848]");
    }

    dateButton.addEventListener("click", () => {
      selectedDate = new Date(year, month, day);

      calendar();
    });

    calendarDays.appendChild(dateButton);
  }
}

function isSameDate(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

if (prevMonthBtn) {
  prevMonthBtn.addEventListener("click", () => {
    currentDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1,
    );

    calendar();
  });
}

if (nextMonthBtn) {
  nextMonthBtn.addEventListener("click", () => {
    currentDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1,
    );

    calendar();
  });
}

loadDashboard();
calendar();

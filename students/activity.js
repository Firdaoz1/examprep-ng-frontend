const API_BASE =
  "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

const activityList = document.getElementById("Recent-activity-list");

async function loadActivities() {
  if (!activityList) {
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "../index.html";
    return;
  }

  activityList.innerHTML = `
    <tr>
      <td colspan="6" class="px-6 py-8 text-center text-gray-500">
        Loading your activities...
      </td>
    </tr>
  `;

  try {
    const response = await fetch(`${API_BASE}/api/dashboard`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to load activities.");
    }

    const data = result.data ?? result;

    const activities = Array.isArray(data)
      ? data
      : (data.attempts ?? data.activities ?? data.recentAttempts ?? []);

    if (!Array.isArray(activities) || activities.length === 0) {
      activityList.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-8 text-center text-gray-500">
            You haven't completed any practice activities yet.
          </td>
        </tr>
      `;
      return;
    }

    activityList.innerHTML = "";

    activities.forEach((activity) => {
      const row = document.createElement("tr");

      row.className = "border-b border-[#D8E0DE]";

      const subject =
        activity.subject?.name ??
        activity.subjectName ??
        activity.subject ??
        "—";

      const topic =
        activity.topics?.map((topic) => topic.name).join(", ") ||
        activity.topic?.name ||
        activity.topicName ||
        "—";

      const questionCount =
        activity.totalQuestions ??
        activity.numberOfQuestions ??
        activity.questionCount ??
        activity.questions?.length ??
        "—";

      const score =
        activity.accuracy ??
        activity.percentage ??
        activity.score?.percentage ??
        null;

      const dateValue =
        activity.completedAt ??
        activity.submittedAt ??
        activity.createdAt ??
        activity.date;

      const date = dateValue
        ? new Date(dateValue).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "—";

      const mode =
        activity.mode ??
        activity.practiceMode ??
        activity.examType ??
        "Practice";

      const cells = [
        subject,
        topic,
        questionCount,
        score === null || score === undefined ? "—" : `${Number(score)}%`,
        date,
        mode,
      ];

      cells.forEach((value, index) => {
        const cell = document.createElement("td");

        cell.className = "px-5 py-4";

        if (index === 0) {
          cell.classList.add("px-6");
        }

        if (index === 3 && score !== null && score !== undefined) {
          const numericScore = Number(score);

          cell.classList.add(
            numericScore >= 50 ? "text-[#34C759]" : "text-red-500",
          );
        }

        cell.textContent = String(value);
        row.appendChild(cell);
      });

      activityList.appendChild(row);
    });
  } catch (error) {
    activityList.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-red-500">
          ${escapeHTML(error.message)}
        </td>
      </tr>
    `;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

loadActivities();

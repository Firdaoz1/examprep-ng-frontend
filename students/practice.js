const practiceCards = document.querySelectorAll(".practice-card");
const subjectsContainer = document.getElementById("subjects-container");
const topicSelect = document.getElementById("topic-select");
const questionYears = document.querySelectorAll(".question-year");
const startPracticeButtons = document.querySelectorAll(".start-practice");

const summaryTopic = document.getElementById("summary-topic");
const summaryPractice = document.getElementById("summary-practice");
const summarySubject = document.getElementById("summary-subject");
const summaryQuestions = document.getElementById("summary-questions");
const summaryTime = document.querySelector("#summary-time");

const API_BASE_URL =
  "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

let selectedPractice = "";
let selectExam = "";
let selectedSubject = "";
let numberOfQuestions = 0;
let selectedQuestionYear = "All Years";

function getToken() {
  return localStorage.getItem("token");
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || `Request failed: ${response.status}`);
  }

  return result;
}

practiceCards.forEach((card) => {
  card.addEventListener("click", () => {
    practiceCards.forEach((item) => {
      item.classList.remove("border-[#085848]");
      item.classList.add("border-[#D9D9D9]");

      const radio = item.querySelector(".practice-radio");

      radio?.classList.remove("border-[#085848]");
      radio?.classList.add("border-[#D9D9D9]");
      radio?.querySelector("span")?.classList.remove("bg-[#085848]");
    });

    card.classList.remove("border-[#D9D9D9]");
    card.classList.add("border-[#085848]");

    const radio = card.querySelector(".practice-radio");

    radio?.classList.remove("border-[#D9D9D9]");
    radio?.classList.add("border-[#085848]");
    radio?.querySelector("span")?.classList.add("bg-[#085848]");

    selectedPractice = card.querySelector("h2")?.textContent.trim() || "";

    if (summaryPractice) {
      summaryPractice.textContent = selectedPractice;
    }

    if (summaryTopic) {
      summaryTopic.textContent =
        selectedPractice === "Topic Practice"
          ? topicSelect?.value
            ? topicSelect.options[topicSelect.selectedIndex].textContent
            : "Select a topic"
          : "As provided by practice type";
    }
  });
});

async function loadSubjects() {
  if (!subjectsContainer) {
    console.error("Element #subjects-container was not found.");
    return;
  }

  if (!getToken()) {
    subjectsContainer.innerHTML =
      '<p class="text-sm text-red-600">Please log in to load subjects.</p>';
    return;
  }

  subjectsContainer.innerHTML =
    '<p class="text-sm text-gray-500">Loading subjects...</p>';

  try {
    const result = await apiRequest("/api/subjects");

    const subjects = Array.isArray(result.data)
      ? result.data
      : (result.data?.subjects ?? result.subjects);

    if (!Array.isArray(subjects)) {
      throw new Error("The subjects response does not contain an array.");
    }

    subjectsContainer.innerHTML = "";

    if (subjects.length === 0) {
      subjectsContainer.innerHTML =
        '<p class="text-sm text-gray-500">No subjects are available yet.</p>';
      return;
    }

    subjects.forEach((subject) => {
      const subjectId = subject.subjectId ?? subject.id ?? subject._id;
      const subjectName = subject.name;
      const questionCount = Number(subject.questionCount ?? 0);

      if (!subjectId || !subjectName) {
        console.warn("Subject is missing its ID or name:", subject);
        return;
      }

      const button = document.createElement("button");

      button.type = "button";
      button.className =
        "subject-card relative p-4 rounded-xl border border-[#D9D9D9] bg-white text-left";

      const image = document.createElement("div");
      image.className =
        "w-10 h-10 rounded-full bg-[#D9F5D8] text-[#085848] " +
        "flex items-center justify-center font-bold text-lg shrink-0";
      image.textContent = subjectName.charAt(0).toUpperCase();
      image.setAttribute("aria-label", subjectName);

      const heading = document.createElement("h3");
      heading.className = "mt-3 text-[20px] font-bold text-[#085848]";
      heading.textContent = subjectName;

      const count = document.createElement("p");
      count.className = "text-[16px] text-[#78909C]";
      count.textContent = `${questionCount} questions`;

      const radio = document.createElement("div");
      radio.className =
        "subject-radio absolute right-4 bottom-4 w-4 h-4 rounded-full border border-[#D9D9D9] flex items-center justify-center text-white text-[8px]";

      button.append(image, heading, count, radio);

      button.addEventListener("click", () => {
        selectedSubject = subjectId;
        selectExam = subject.examId ?? "";
        numberOfQuestions = 0;

        document.querySelectorAll(".subject-card").forEach((item) => {
          item.classList.remove("border-[#085848]");
          item.classList.add("border-[#D9D9D9]");

          const itemRadio = item.querySelector(".subject-radio");

          itemRadio?.classList.remove("border-[#085848]", "bg-[#085848]");
          itemRadio?.classList.add("border-[#D9D9D9]");

          if (itemRadio) {
            itemRadio.innerHTML = "";
          }
        });

        button.classList.remove("border-[#D9D9D9]");
        button.classList.add("border-[#085848]");

        radio.classList.remove("border-[#D9D9D9]");
        radio.classList.add("border-[#085848]", "bg-[#085848]");
        radio.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>';

        if (summarySubject) {
          summarySubject.textContent = subjectName;
        }

        if (summaryQuestions) {
          summaryQuestions.textContent = "Select a topic";
        }

        if (summaryTime) {
          summaryTime.textContent = "—";
        }

        loadTopics(subjectId);
      });

      subjectsContainer.appendChild(button);
    });

    if (subjectsContainer.children.length === 0) {
      subjectsContainer.innerHTML =
        '<p class="text-sm text-gray-500">No valid subjects were returned.</p>';
    }
  } catch (error) {
    subjectsContainer.innerHTML =
      '<p class="text-sm text-red-600">Unable to load subjects. Please try again later.</p>';
  }
}

async function loadTopics(subjectId) {
  if (!topicSelect) return;

  topicSelect.disabled = true;
  topicSelect.innerHTML = '<option value="">Loading topics...</option>';

  numberOfQuestions = 0;

  if (summaryTopic) {
    summaryTopic.textContent = "Loading topics...";
  }

  if (summaryQuestions) {
    summaryQuestions.textContent = "Select a topic";
  }

  try {
    const result = await apiRequest(
      `/api/topics?subjectId=${encodeURIComponent(subjectId)}`,
    );

    const topics = Array.isArray(result.data)
      ? result.data
      : (result.data?.topics ?? result.topics);

    if (!Array.isArray(topics)) {
      throw new Error("The topics response does not contain an array.");
    }

    topicSelect.innerHTML = '<option value="">Select a Topic</option>';

    if (topics.length === 0) {
      topicSelect.innerHTML = '<option value="">No topics available</option>';

      if (summaryTopic) {
        summaryTopic.textContent = "No topics available";
      }

      return;
    }

    topics.forEach((topic) => {
      const topicId = topic.topicId ?? topic.id ?? topic._id;
      const topicName = topic.name ?? topic.topicName;
      const topicQuestionCount = Number(topic.questionCount ?? 0);

      if (!topicId || !topicName) {
        console.warn("Topic is missing its ID or name:", topic);
        return;
      }

      const option = document.createElement("option");

      option.value = topicId;
      option.textContent = topicName;

      option.dataset.questionCount = String(topicQuestionCount);

      topicSelect.appendChild(option);
    });

    topicSelect.disabled = topicSelect.options.length <= 1;

    if (summaryTopic) {
      summaryTopic.textContent = "Select a topic";
    }
  } catch (error) {
    console.error("Unable to load topics:", error);

    topicSelect.innerHTML = '<option value="">Unable to load topics</option>';

    topicSelect.disabled = true;

    if (summaryTopic) {
      summaryTopic.textContent = "Unavailable";
    }
  }
}

// Update count and summary when the student selects a topic
topicSelect?.addEventListener("change", () => {
  const option = topicSelect.options[topicSelect.selectedIndex];

  if (!topicSelect.value || !option) {
    numberOfQuestions = 0;

    if (summaryTopic) {
      summaryTopic.textContent = "Select a topic";
    }

    if (summaryQuestions) {
      summaryQuestions.textContent = "Select a topic";
    }

    if (summaryTime) {
      summaryTime.textContent = "—";
    }

    return;
  }

  numberOfQuestions = Number(option.dataset.questionCount || 0);

  if (summaryTopic) {
    summaryTopic.textContent = option.textContent;
  }

  if (summaryQuestions) {
    summaryQuestions.textContent = `${numberOfQuestions} questions`;
  }

  if (summaryTime) {
    summaryTime.textContent =
      numberOfQuestions > 0 ? `${Math.ceil(numberOfQuestions)} minutes` : "—";
  }
});

questionYears.forEach((year) => {
  year.addEventListener("click", () => {
    questionYears.forEach((item) => {
      item.classList.remove("bg-[#085848]", "text-white");
      item.classList.add(
        "border",
        "border-[#D9D9D9]",
        "bg-white",
        "text-[#085848]",
      );
    });

    year.classList.remove(
      "border",
      "border-[#D9D9D9]",
      "bg-white",
      "text-[#085848]",
    );

    year.classList.add("bg-[#085848]", "text-white");

    selectedQuestionYear = year.textContent.trim();
  });
});

// Start practice
async function handleStartPractice(event) {
  if (!selectedPractice) {
    alert("Please select a practice type.");
    return;
  }

  if (!selectedSubject) {
    alert("Please select a subject.");
    return;
  }

  if (!selectExam) {
    alert(
      "The selected subject has no exam ID. Please select another subject or contact the backend team.",
    );
    return;
  }

  if (!topicSelect?.value) {
    alert("Please select a topic.");
    return;
  }

  if (!Number.isInteger(numberOfQuestions) || numberOfQuestions <= 0) {
    alert("No questions are currently available for this topic.");
    return;
  }

  const clickedButton = event.currentTarget;
  clickedButton.disabled = true;

  try {
    const estimatedTimeMinutes = Math.ceil(numberOfQuestions);

    const payload = {
      examId: selectExam,
      subjectId: selectedSubject,
      topicId: topicSelect.value,
      numberOfQuestions,
      practiceType: selectedPractice,
      questionSource: selectedQuestionYear,
    };

    const result = await apiRequest("/api/attempts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const attempt = result.data;

    const sessionId =
      attempt?.attemptId ?? attempt?.sessionId ?? attempt?.id ?? attempt?._id;

    if (!sessionId) {
      throw new Error(
        "No session ID was returned. Check the start-practice API response.",
      );
    }

    sessionStorage.setItem("activePracticeAttempt", JSON.stringify(attempt));

    const selectedTopicOption = topicSelect.options[topicSelect.selectedIndex];

    const selectedSubjectCard = document.querySelector(
      ".subject-card.border-\\[\\#085848\\]",
    );

    const subjectName =
      selectedSubjectCard?.querySelector("h3")?.textContent.trim() ||
      summarySubject?.textContent.trim() ||
      "";

    const topicName = selectedTopicOption?.textContent.trim() || "";

    sessionStorage.setItem(
      "activePracticeDetails",
      JSON.stringify({
        practiceType: selectedPractice,
        subjectName,
        topicName,
        estimatedTimeMinutes,
      }),
    );

    window.location.href = `./questionpractice.html?sessionId=${encodeURIComponent(sessionId)}`;
  } catch (error) {
    console.error("Unable to start practice:", error);
    alert(error.message || "Unable to start practice. Please try again.");
  } finally {
    clickedButton.disabled = false;
  }
}

startPracticeButtons.forEach((button) => {
  button.addEventListener("click", handleStartPractice);
});

loadSubjects();

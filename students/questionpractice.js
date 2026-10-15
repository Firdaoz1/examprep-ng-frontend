const sessionId = new URLSearchParams(window.location.search).get("sessionId");
const progressStorageKey = `practiceProgress_${sessionId}`;
const API_BASE_URL =
  "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

const token = localStorage.getItem("token");

const practiceTitle = document.getElementById("practice-title");
const questionCount = document.getElementById("question-count");
const questionText = document.getElementById("question-text");
const answerOptions = document.getElementById("answer-options");
const previousButton = document.getElementById("previous-question");
const nextButton = document.getElementById("next-question");
const submitButton = document.getElementById("submit-practice");
const sessionProgress = document.getElementById("session-progress");
const timeRemaining = document.getElementById("time-remaining");
const bookmarkButton = document.querySelector(".bookmark-question");
const completeModal = document.getElementById("practice-complete-modal");

let questions = [];
let currentIndex = 0;
let selectedAnswers = {};
let bookmarkedQuestions = new Set();
let practiceDetails = {};
let timerInterval = null;
let secondsRemaining = 13 * 60;
let isSubmitting = false;
let bookmarkRequestInProgress = false;
let activeFilter = "all";

let warningsShown = {
  fiveMinutes: false,
  oneMinute: false,
  tenSeconds: false,
};

async function apiRequest(endpoint, options = {}) {
  if (!token) {
    throw new Error("No login token found. Please log in again.");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Request failed with status ${response.status}`,
    );
  }

  return result;
}

function showPageError(message) {
  clearInterval(timerInterval);

  questionText.textContent = message;
  answerOptions.replaceChildren();

  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.textContent = "Try Again";
  retryButton.className =
    "rounded-lg bg-[#085848] px-5 py-3 font-semibold text-white";

  retryButton.addEventListener("click", loadPractice);
  answerOptions.appendChild(retryButton);
}

function savePracticeProgress() {
  if (!sessionId || questions.length === 0) return;

  const progress = {
    currentIndex,
    selectedAnswers,
    secondsRemaining,
    savedAt: Date.now(),
  };

  try {
    sessionStorage.setItem(progressStorageKey, JSON.stringify(progress));
  } catch (error) {
    console.error("Unable to save practice progress:", error);
  }
}

function restorePracticeProgress() {
  try {
    const saved = sessionStorage.getItem(progressStorageKey);

    if (!saved) return false;

    const progress = JSON.parse(saved);

    currentIndex = Number.isInteger(progress.currentIndex)
      ? Math.min(Math.max(progress.currentIndex, 0), questions.length - 1)
      : 0;

    selectedAnswers =
      progress.selectedAnswers && typeof progress.selectedAnswers === "object"
        ? progress.selectedAnswers
        : {};

    const elapsedSeconds = Math.floor(
      (Date.now() - Number(progress.savedAt || Date.now())) / 1000,
    );

    secondsRemaining = Math.max(
      0,
      Number(progress.secondsRemaining) - elapsedSeconds,
    );

    return true;
  } catch (error) {
    console.error("Unable to restore practice progress:", error);
    return false;
  }
}

async function loadPractice() {
  clearInterval(timerInterval);

  if (!sessionId) {
    showPageError(
      "No session ID found. Please return to Practice Setup and start a session.",
    );
    return;
  }

  if (!token) {
    showPageError("Your login session is missing. Please log in again.");
    return;
  }

  questionText.textContent = "Loading questions...";
  answerOptions.replaceChildren();

  try {
    const savedAttempt = sessionStorage.getItem("activePracticeAttempt");

    if (!savedAttempt) {
      throw new Error(
        "Practice session data was not found. Please start a new session.",
      );
    }

    const attemptResult = JSON.parse(savedAttempt);
    practiceDetails = attemptResult.attempt || attemptResult;

    const savedSessionId =
      practiceDetails.attemptId ||
      practiceDetails.sessionId ||
      practiceDetails._id;

    if (String(savedSessionId) !== String(sessionId)) {
      throw new Error(
        "The saved session does not match this page. Please start a new practice session.",
      );
    }

    questions = Array.isArray(practiceDetails.questions)
      ? practiceDetails.questions
      : [];

    if (questions.length === 0) {
      throw new Error("No questions were returned for this session.");
    }

    const requestedCount = Number(
      practiceDetails.numberOfQuestions || practiceDetails.totalQuestions,
    );

    if (requestedCount > 0) {
      questions = questions.slice(0, requestedCount);
    }

    let savedPracticeDetails = {};

    try {
      savedPracticeDetails = JSON.parse(
        sessionStorage.getItem("activePracticeDetails") || "{}",
      );
    } catch (error) {
      console.error("Unable to read practice details:", error);
    }

    const durationMinutes = Number(practiceDetails.durationMinutes);

    const estimatedTimeMinutes = Number(
      savedPracticeDetails.estimatedTimeMinutes,
    );

    const timeInMinutes =
      Number.isFinite(durationMinutes) && durationMinutes > 0
        ? durationMinutes
        : Number.isFinite(estimatedTimeMinutes) && estimatedTimeMinutes > 0
          ? estimatedTimeMinutes
          : 13;

    const fullDurationSeconds = Math.ceil(timeInMinutes * 60);

    secondsRemaining = fullDurationSeconds;

    activeFilter = "all";
    window.practiceProgressFilter = "all";

    secondsRemaining = fullDurationSeconds;
    const progressRestored = restorePracticeProgress();

    if (!progressRestored) {
      currentIndex = 0;
      selectedAnswers = {};
    }

    warningsShown = {
      fiveMinutes: secondsRemaining <= 300,
      oneMinute: secondsRemaining <= 60,
      tenSeconds: secondsRemaining <= 10,
    };

    updatePracticeHeading();
    renderQuestion();
    renderSessionProgress();
    startTimer();

    await loadBookmarks();
  } catch (error) {
    console.error("PRACTICE LOADING ERROR:", error);

    showPageError(error.message || "Unable to load the practice session.");
  }
}

function updatePracticeHeading() {
  let savedDetails = {};

  try {
    savedDetails = JSON.parse(
      sessionStorage.getItem("activePracticeDetails") || "{}",
    );
  } catch (error) {
    console.error("Unable to read practice details:", error);
  }

  const subject =
    savedDetails.subjectName ||
    practiceDetails.subjectName ||
    practiceDetails.subject?.name ||
    "";

  const topic =
    savedDetails.topicName ||
    practiceDetails.topicName ||
    practiceDetails.topic?.name ||
    "";

  const practiceType = savedDetails.practiceType || "Practice";

  if (!practiceTitle) return;

  if (topic) {
    practiceTitle.textContent = `${subject ? subject + ": " : ""}${practiceType} - ${topic}`;
  } else if (subject) {
    practiceTitle.textContent = `${subject}: ${practiceType}`;
  } else {
    practiceTitle.textContent = practiceType;
  }
}

function isQuestionAnswered(question) {
  const answer = selectedAnswers[question._id];

  return answer !== undefined && answer !== null && answer !== "";
}

function getQuestionStatus(question) {
  return isQuestionAnswered(question) ? "answered" : "unanswered";
}

function renderQuestion() {
  const question = questions[currentIndex];

  if (!question) return;

  questionCount.textContent = `Question ${currentIndex + 1} of ${questions.length}`;

  questionText.textContent =
    question.questionText || "Question text unavailable";

  answerOptions.replaceChildren();

  const options = Array.isArray(question.options) ? question.options : [];

  if (options.length === 0) {
    const message = document.createElement("p");
    message.className = "text-sm text-red-600";
    message.textContent = "No answer options are available for this question.";

    answerOptions.appendChild(message);
  }

  options.forEach((option, index) => {
    const label = option.label || String.fromCharCode(65 + index);
    const optionText = option.text ?? "";

    const button = document.createElement("button");
    button.type = "button";

    const isSelected = selectedAnswers[question._id] === label;

    button.className =
      "answer-option flex w-full items-center gap-4 rounded-lg border p-4 text-left transition";

    button.classList.add(
      ...(isSelected
        ? ["border-[#085848]", "bg-[#EAF8EC]"]
        : ["border-[#D9D9D9]", "bg-white"]),
    );

    const radio = document.createElement("span");
    radio.className =
      "radio-circle flex h-4 w-4 shrink-0 items-center justify-center rounded-full border";

    radio.classList.add(isSelected ? "border-[#085848]" : "border-[#B7C3C0]");

    if (isSelected) {
      const dot = document.createElement("span");
      dot.className = "h-2 w-2 rounded-full bg-[#085848]";
      radio.appendChild(dot);
    }

    const labelElement = document.createElement("span");
    labelElement.className = "text-sm font-semibold";
    labelElement.textContent = label;

    const textElement = document.createElement("span");
    textElement.className = "text-sm";
    textElement.textContent = optionText;

    button.append(radio, labelElement, textElement);

    if (isSelected) {
      const check = document.createElement("span");
      check.className = "ml-auto font-bold text-[#085848]";
      check.textContent = "✓";
      button.appendChild(check);
    }

    button.addEventListener("click", () => {
      selectedAnswers[question._id] = label;
      savePracticeProgress();

      const notice = document.getElementById("submission-inline-message");

      if (notice) {
        notice.classList.add("hidden");
      }

      renderQuestion();
      renderSessionProgress();
    });

    answerOptions.appendChild(button);
  });

  previousButton.disabled = currentIndex === 0;
  previousButton.classList.toggle("opacity-50", currentIndex === 0);

  nextButton.disabled = currentIndex === questions.length - 1;

  nextButton.classList.toggle(
    "opacity-50",
    currentIndex === questions.length - 1,
  );

  updateBookmarkButton();
}

function renderSessionProgress() {
  sessionProgress.replaceChildren();

  const currentFilter = window.practiceProgressFilter || activeFilter;

  questions.forEach((question, index) => {
    const isAnswered = isQuestionAnswered(question);

    if (currentFilter === "answered" && !isAnswered) return;
    if (currentFilter === "unanswered" && isAnswered) return;

    const isCurrent = index === currentIndex;
    const button = document.createElement("button");

    button.type = "button";
    button.className =
      "rounded-lg border p-3 text-center text-base font-semibold transition";

    if (isAnswered) {
      button.classList.add("border-[#085848]", "bg-[#085848]", "text-white");

      button.innerHTML =
        '<ion-icon name="checkmark-outline" aria-hidden="true"></ion-icon>';
    } else if (isCurrent) {
      button.classList.add(
        "border-[#003028]",
        "bg-white",
        "text-[#003028]",
        "ring-2",
        "ring-[#003028]",
      );

      button.textContent = String(index + 1);
    } else {
      button.classList.add(
        "border-transparent",
        "bg-[#D8E0DE]",
        "text-[#003028]",
      );

      button.textContent = String(index + 1);
    }

    button.setAttribute(
      "aria-label",
      `Question ${index + 1}, ${
        isAnswered ? "answered" : "unanswered"
      }${isCurrent ? ", current question" : ""}`,
    );

    button.addEventListener("click", () => {
      currentIndex = index;
      savePracticeProgress();
      renderQuestion();
      renderSessionProgress();
    });

    sessionProgress.appendChild(button);
  });

  const legendContainer = sessionProgress.nextElementSibling;

  if (legendContainer) {
    const legendItems = legendContainer.querySelectorAll("div");

    legendItems.forEach((item) => {
      const label = item.querySelector("p:last-child");
      const indicator = item.querySelector("p:first-child");

      if (!label) return;

      const labelText = label.textContent.trim().toLowerCase();

      const filter =
        labelText === "answered"
          ? "answered"
          : labelText === "unanswered"
            ? "unanswered"
            : null;

      if (!filter) return;

      item.style.cursor = "pointer";
      item.setAttribute("role", "button");
      item.setAttribute("aria-pressed", String(currentFilter === filter));
      item.tabIndex = 0;

      if (indicator) {
        indicator.classList.remove(
          "bg-[#085848]",
          "bg-white",
          "border-[#B7C3C0]",
        );

        if (currentFilter === filter) {
          indicator.classList.add("bg-[#085848]");
        } else {
          indicator.classList.add("bg-white", "border", "border-[#B7C3C0]");
        }
      }

      if (item.dataset.filterReady === "true") return;

      item.dataset.filterReady = "true";

      const applyFilter = () => {
        const existingFilter = window.practiceProgressFilter || "all";

        const nextFilter = existingFilter === filter ? "all" : filter;

        activeFilter = nextFilter;
        window.practiceProgressFilter = nextFilter;

        renderSessionProgress();
      };

      item.addEventListener("click", applyFilter);

      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          applyFilter();
        }
      });
    });
  }
}

function setupProgressFilters() {
  const allSelectors = [
    ["all", "#show-all-questions", "#all-questions", "[data-filter='all']"],
    [
      "answered",
      "#answered-questions",
      "#show-answered",
      "[data-filter='answered']",
    ],
    [
      "unanswered",
      "#unanswered-questions",
      "#show-unanswered",
      "[data-filter='unanswered']",
    ],
  ];

  allSelectors.forEach(([filter, ...selectors]) => {
    document.querySelectorAll(selectors.join(",")).forEach((element) => {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        activeFilter = filter;
        window.practiceProgressFilter = filter;
        renderSessionProgress();
      });
    });
  });

  document.querySelectorAll("button").forEach((button) => {
    const text = button.textContent.trim().toLowerCase();

    let filter = null;

    if (
      text === "answered" ||
      text === "show answered" ||
      text === "answered questions"
    ) {
      filter = "answered";
    } else if (
      text === "unanswered" ||
      text === "show unanswered" ||
      text === "unanswered questions"
    ) {
      filter = "unanswered";
    } else if (
      text === "all" ||
      text === "all questions" ||
      text === "show all"
    ) {
      filter = "all";
    }

    if (!filter || button.dataset.progressFilterReady === "true") {
      return;
    }

    button.dataset.progressFilterReady = "true";

    button.addEventListener("click", (event) => {
      event.preventDefault();
      activeFilter = filter;
      window.practiceProgressFilter = filter;
      renderSessionProgress();
    });
  });
}

previousButton.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    savePracticeProgress();
    renderQuestion();
    renderSessionProgress();
  }
});

nextButton.addEventListener("click", () => {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    savePracticeProgress();
    renderQuestion();
    renderSessionProgress();
  }
});

function startTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    if (isSubmitting) return;

    secondsRemaining = Math.max(0, secondsRemaining - 1);
    updateTimerDisplay();
    savePracticeProgress();

    if (secondsRemaining === 300 && !warningsShown.fiveMinutes) {
      warningsShown.fiveMinutes = true;

      showTimerWarning(
        "5 minutes remaining. Keep going and review your answers.",
      );
    }

    if (secondsRemaining === 60 && !warningsShown.oneMinute) {
      warningsShown.oneMinute = true;

      showTimerWarning("1 minute remaining. Please review your answers.");
    }

    if (secondsRemaining === 10 && !warningsShown.tenSeconds) {
      warningsShown.tenSeconds = true;

      showTimerWarning(
        "Only 10 seconds remaining. Your practice will submit automatically.",
      );
    }

    if (secondsRemaining <= 0) {
      clearInterval(timerInterval);
      submitPractice(true);
    }
  }, 1000);
}

function showTimerWarning(message) {
  if (!timeRemaining) return;

  let warning = document.getElementById("timer-warning");

  if (!warning) {
    warning = document.createElement("p");
    warning.id = "timer-warning";
    warning.className = "mt-2 text-sm font-semibold text-red-600";
    warning.setAttribute("role", "alert");
    warning.setAttribute("aria-live", "assertive");

    timeRemaining.insertAdjacentElement("afterend", warning);
  }

  warning.textContent = message;
}

function updateTimerDisplay() {
  if (!timeRemaining) return;

  const safeSeconds = Math.max(0, secondsRemaining);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  timeRemaining.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} remaining`;

  timeRemaining.classList.toggle("text-red-600", safeSeconds <= 60);

  timeRemaining.classList.toggle("font-bold", safeSeconds <= 60);

  timeRemaining.setAttribute("role", "timer");
  timeRemaining.setAttribute("aria-live", "off");
}

async function loadBookmarks() {
  try {
    const result = await apiRequest("/api/bookmarks");
    const data = result.data;

    const bookmarks = Array.isArray(data)
      ? data
      : Array.isArray(data?.bookmarks)
        ? data.bookmarks
        : [];

    bookmarkedQuestions.clear();

    bookmarks.forEach((item) => {
      const id =
        item.questionId?._id ||
        item.questionId ||
        item.question?._id ||
        item.question;

      if (id) bookmarkedQuestions.add(String(id));
    });

    updateBookmarkButton();
  } catch (error) {
    console.error("LOAD BOOKMARKS ERROR:", error);
  }
}

function updateBookmarkButton() {
  if (!bookmarkButton) return;

  const question = questions[currentIndex];
  const icon = bookmarkButton.querySelector(".bookmark-icon");

  if (!question) {
    bookmarkButton.disabled = true;
    return;
  }

  bookmarkButton.disabled = false;

  const questionId = String(question._id);
  const isBookmarked = bookmarkedQuestions.has(questionId);

  bookmarkButton.dataset.bookmarked = String(isBookmarked);
  bookmarkButton.setAttribute("aria-pressed", String(isBookmarked));

  bookmarkButton.setAttribute(
    "aria-label",
    isBookmarked ? "Remove bookmark" : "Bookmark question",
  );

  bookmarkButton.title = isBookmarked ? "Remove bookmark" : "Bookmark question";

  if (icon) {
    icon.setAttribute("name", isBookmarked ? "bookmark" : "bookmark-outline");
  }
}

async function toggleBookmark() {
  const question = questions[currentIndex];

  if (!question || bookmarkRequestInProgress) return;

  const questionId = String(question._id);
  const isBookmarked = bookmarkedQuestions.has(questionId);

  bookmarkRequestInProgress = true;

  if (bookmarkButton) bookmarkButton.disabled = true;

  try {
    if (isBookmarked) {
      await apiRequest(`/api/bookmarks/${encodeURIComponent(questionId)}`, {
        method: "DELETE",
      });

      bookmarkedQuestions.delete(questionId);
    } else {
      await apiRequest("/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({ questionId }),
      });

      bookmarkedQuestions.add(questionId);
    }

    updateBookmarkButton();
  } catch (error) {
    console.error("BOOKMARK REQUEST ERROR:", error);
    alert(`Unable to update bookmark: ${error.message}`);
  } finally {
    bookmarkRequestInProgress = false;
    updateBookmarkButton();
  }
}

bookmarkButton?.addEventListener("click", toggleBookmark);

function showSubmissionConfirmation(unansweredCount) {
  return new Promise((resolve) => {
    let modal = document.getElementById("submission-confirmation-modal");

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "submission-confirmation-modal";
      modal.className =
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4";

      modal.innerHTML = `
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
             role="dialog"
             aria-modal="true"
             aria-labelledby="submission-modal-title">
          <h2 id="submission-modal-title"
              class="mb-3 text-xl font-bold text-[#003028]">
            Submit practice?
          </h2>

          <p id="submission-modal-time" class="mb-2 text-sm text-gray-700"></p>

          <p id="submission-modal-unanswered"
             class="mb-5 text-sm text-gray-700"></p>

          <div class="flex justify-end gap-3">
            <button id="cancel-practice-submission"
                    type="button"
                    class="rounded-lg border border-gray-300 px-4 py-2 font-semibold">
              Continue Practicing
            </button>

            <button id="confirm-practice-submission"
                    type="button"
                    class="rounded-lg bg-[#085848] px-4 py-2 font-semibold text-white">
              Submit Practice
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    }

    const timeMessage = modal.querySelector("#submission-modal-time");
    const unansweredMessage = modal.querySelector(
      "#submission-modal-unanswered",
    );
    const cancelButton = modal.querySelector("#cancel-practice-submission");
    const confirmButton = modal.querySelector("#confirm-practice-submission");

    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;

    timeMessage.textContent = `Time remaining: ${minutes} minute(s) and ${seconds} second(s).`;

    unansweredMessage.textContent = `Unanswered questions: ${unansweredCount}.`;

    modal.classList.remove("hidden");

    const finish = (confirmed) => {
      modal.classList.add("hidden");

      cancelButton.removeEventListener("click", cancelHandler);
      confirmButton.removeEventListener("click", confirmHandler);

      resolve(confirmed);
    };

    const cancelHandler = () => finish(false);
    const confirmHandler = () => finish(true);

    cancelButton.addEventListener("click", cancelHandler);
    confirmButton.addEventListener("click", confirmHandler);
  });
}

submitButton.addEventListener("click", () => submitPractice(false));

async function submitPractice(isTimeout = false) {
  if (isSubmitting || questions.length === 0) return;

  const unansweredCount = questions.filter(
    (question) => !isQuestionAnswered(question),
  ).length;

  if (!isTimeout) {
    const confirmed = await showSubmissionConfirmation(unansweredCount);

    if (!confirmed) return;

    if (secondsRemaining <= 0) {
      isTimeout = true;
    }
  }

  const answers = questions.filter(isQuestionAnswered).map((question) => ({
    questionId: question._id,
    selectedOption: selectedAnswers[question._id],
  }));

  if (answers.length === 0) {
    showSubmissionMessage(
      "You haven't answered any questions yet. Please answer at least one question before submitting.",
    );
    return;
  }

  const subjectId =
    practiceDetails.subjectId?._id ||
    practiceDetails.subjectId ||
    practiceDetails.subject?._id;

  const firstQuestion = questions[0];

  const topicId =
    practiceDetails.topicId?._id ||
    practiceDetails.topicId ||
    firstQuestion?.topicId?._id ||
    firstQuestion?.topicId;

  if (!subjectId) {
    alert("Cannot submit: the session did not return a subject ID.");
    return;
  }

  const body = { subjectId, answers };

  if (topicId) body.topicId = topicId;

  isSubmitting = true;

  submitButton.disabled = true;
  submitButton.textContent = isTimeout
    ? "Time expired. Submitting..."
    : "Submitting...";

  clearInterval(timerInterval);

  try {
    const result = await apiRequest("/api/practice/submit", {
      method: "POST",
      body: JSON.stringify(body),
    });

    displayResults(result.data || result);

    sessionStorage.removeItem("activePracticeAttempt");
    sessionStorage.removeItem(progressStorageKey);

    const submittedData = result.data || result;

    const attemptId =
      submittedData.attemptId || submittedData._id || submittedData.id;

    sessionStorage.setItem("lastSubmittedAttemptId", attemptId || "");

    const reviewLink = document.getElementById("review-answer-link");

    reviewLink?.addEventListener("click", (event) => {
      event.preventDefault();

      const attemptId = sessionStorage.getItem("lastSubmittedAttemptId");

      if (!attemptId) {
        alert(
          "Attempt ID not found. Please submit your practice session first.",
        );
        return;
      }

      window.location.href = `./answerreview.html?attemptId=${encodeURIComponent(attemptId)}`;
    });
  } catch (error) {
    console.error("PRACTICE SUBMISSION ERROR:", error);

    alert(
      `Submission failed: ${error.message}. Your answers remain on the page.`,
    );

    if (secondsRemaining > 0) {
      startTimer();
    } else {
      showTimerWarning(
        "Time has expired. Your answers remain on the page. Please try submitting again.",
      );
    }
  } finally {
    isSubmitting = false;
    submitButton.disabled = false;
    submitButton.textContent = "Submit Practice Session";
  }
}

function displayResults(result) {
  const total = questions.length;

  const correct = Number(
    result.correctCount ?? result.correctAnswers ?? result.score ?? 0,
  );

  const safeCorrect = Math.max(0, Math.min(correct, total));
  const incorrect = total - safeCorrect;

  const percentage = total > 0 ? Math.round((safeCorrect / total) * 100) : 0;

  const setText = (id, value) => {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = String(value);
    }
  };

  setText("result-score", safeCorrect);
  setText("result-correct", safeCorrect);
  setText("result-incorrect", incorrect);
  setText("result-total-score", total);
  setText("result-total-questions", total);
  setText("result-percentage", `${percentage}%`);

  const wrapper = completeModal?.parentElement;

  wrapper?.classList.remove("hidden");
  completeModal?.classList.remove("hidden");
}

setupProgressFilters();
loadPractice();

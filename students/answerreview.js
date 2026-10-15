const API_BASE =
  "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

const totalScore = document.getElementById("totalScore");
const questionGrid = document.getElementById("questionGrid");
const emptyState = document.getElementById("emptyState");
const tabs = document.querySelectorAll(".review-tab");

let reviewData = null;

async function getAnswerReview() {
  try {
    const params = new URLSearchParams(window.location.search);
    const attemptId = params.get("attemptId");
    const token = localStorage.getItem("token");

    if (!attemptId) {
      throw new Error("Attempt ID is missing from the URL.");
    }

    if (!token) {
      throw new Error("Please log in to view your answer review.");
    }

    questionGrid.innerHTML = `
      <p class="col-span-full py-8 text-center text-gray-500">
        Loading your answer review...
      </p>
    `;

    const response = await fetch(
      `${API_BASE}/api/attempts/${encodeURIComponent(attemptId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch answer review.");
    }

    const data = result.data || result;

    reviewData = data;
    renderReview(data);
  } catch (error) {
    questionGrid.innerHTML = "";
    questionGrid.classList.remove("hidden");
    emptyState.classList.add("hidden");

    const errorContainer = document.createElement("div");
    errorContainer.className = "col-span-full py-12 text-center";

    const message = document.createElement("p");
    message.className = "text-[15px] font-semibold text-red-500";
    message.textContent = error.message;

    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className =
      "mt-4 px-5 py-2 rounded-lg bg-[#085848] text-white text-sm font-semibold";
    retryButton.textContent = "Try Again";
    retryButton.addEventListener("click", getAnswerReview);

    errorContainer.append(message, retryButton);
    questionGrid.appendChild(errorContainer);
  }
}

function renderReview(data) {
  Header(data);

  const answers = Array.isArray(data.answers) ? data.answers : [];

  const questions = answers.map((answer) => {
    const selectedAnswer =
      answer.selectedOption ??
      answer.userAnswer ??
      answer.submittedAnswer ??
      null;

    const isSkipped =
      selectedAnswer === null ||
      selectedAnswer === undefined ||
      selectedAnswer === "";

    const isCorrect = !isSkipped && answer.isCorrect === true;

    return {
      ...answer,
      question: answer.questionText ?? answer.question,
      selectedAnswer: isSkipped ? null : selectedAnswer,
      correctAnswer: answer.correctOption ?? answer.correctAnswer,
      status: isSkipped ? "skipped" : isCorrect ? "correct" : "incorrect",
    };
  });

  reviewData = { ...data, questions };

  Tabs({});
  Questions(questions);
  setupTabs();
}

function Header(data) {
  const subject =
    typeof data.subject === "object" && data.subject !== null
      ? data.subject.name || data.subject.subjectName || "Practice"
      : data.subject || "Practice";

  const obtained = data.correctCount ?? 0;
  const total = data.totalQuestions ?? 0;
  const percentage = data.accuracy ?? 0;

  document.querySelector("h1").textContent =
    `${subject} Practice - Answer Review`;

  totalScore.textContent = `${obtained} / ${total} (${Number(percentage).toFixed(1)}%)`;
}

function Tabs(counts) {
  const questions = reviewData?.questions || [];

  const actualCounts = {
    all: counts.all ?? questions.length,
    correct:
      counts.correct ?? questions.filter((q) => q.status === "correct").length,
    incorrect:
      counts.incorrect ??
      questions.filter((q) => q.status === "incorrect").length,
    skipped:
      counts.skipped ?? questions.filter((q) => q.status === "skipped").length,
  };

  tabs.forEach((tab) => {
    const filter = tab.dataset.filter;

    const labels = {
      all: "All questions",
      correct: "Correct",
      incorrect: "Incorrect",
      skipped: "Skipped",
    };

    tab.textContent = `${labels[filter] || "Questions"} (${actualCounts[filter] ?? 0})`;
  });
}

function createQuestionCard(question, index) {
  const card = document.createElement("div");

  card.className =
    "question-card border border-[#D9D9D9] rounded-[14px] p-4 sm:p-5";

  card.dataset.status = question.status || "incorrect";

  const questionTitle = document.createElement("h2");
  questionTitle.className = "text-[14px] font-semibold leading-6";
  questionTitle.textContent = `${index + 1}. ${question.question ?? question.questionText ?? "Question unavailable"}`;

  const optionsContainer = document.createElement("div");
  optionsContainer.className = "mt-4 space-y-3";

  const options = Array.isArray(question.options) ? question.options : [];

  options.forEach((option) => {
    optionsContainer.appendChild(createOption(option, question));
  });

  const solutionContainer = createSolution(
    question.solution ?? question.explanation,
  );

  card.append(questionTitle, optionsContainer, solutionContainer);

  if (question.status === "skipped") {
    const skippedLabel = document.createElement("p");
    skippedLabel.className = "mt-3 text-sm font-semibold text-orange-600";
    skippedLabel.textContent = "Skipped — no answer selected.";
    card.appendChild(skippedLabel);
  }

  return card;
}

function Questions(questions) {
  questionGrid.innerHTML = "";

  if (!Array.isArray(questions) || questions.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  questions.forEach((question, index) => {
    const card = createQuestionCard(question, index);
    questionGrid.appendChild(card);
  });
}

function createOption(option, question) {
  const wrapper = document.createElement("div");

  const optionText =
    typeof option === "object" && option !== null
      ? (option.text ?? option.label ?? option.value ?? "")
      : String(option);

  const selectedAnswer = question.selectedAnswer;
  const correctAnswer = question.correctAnswer;

  const isSelected =
    selectedAnswer !== null &&
    selectedAnswer !== undefined &&
    selectedAnswer !== "" &&
    answersMatch(option, selectedAnswer);

  const isCorrect = answersMatch(option, correctAnswer);

  wrapper.className =
    "min-h-[44px] rounded-[10px] px-3 flex items-center gap-3";

  const circle = document.createElement("span");
  circle.className = "w-5 h-5 rounded-full border shrink-0";

  const text = document.createElement("span");
  text.className = "text-[13px]";
  text.textContent = optionText;

  if (isSelected) {
    wrapper.classList.add(
      question.status === "correct" ? "bg-[#34C759]/30" : "bg-[#FF0000]/30",
    );

    circle.className =
      question.status === "correct"
        ? "w-5 h-5 rounded-full bg-[#34C759] border-[4px] border-white shrink-0"
        : "w-5 h-5 rounded-full bg-[#FF0000] border-[4px] border-white shrink-0";

    text.classList.add("font-semibold");
  } else {
    circle.classList.add("border-[#D9D9D9]");
  }

  wrapper.append(circle, text);

  return wrapper;
}

function createOption(option, question) {
  const wrapper = document.createElement("div");

  const optionText =
    typeof option === "object"
      ? (option.text ?? option.label ?? option.value ?? "")
      : String(option);

  const selectedAnswer =
    question.selectedAnswer ??
    question.userAnswer ??
    question.submittedAnswer ??
    null;

  const correctAnswer = question.correctAnswer ?? question.answer ?? null;

  const isSelected = answersMatch(option, selectedAnswer);
  const isCorrect = answersMatch(option, correctAnswer);

  wrapper.className =
    "min-h-[44px] rounded-[10px] px-3 flex items-center gap-3";

  const circle = document.createElement("span");
  circle.className = "w-5 h-5 rounded-full border shrink-0";

  const text = document.createElement("span");
  text.className = "text-[13px]";
  text.textContent = optionText;

  if (isSelected) {
    wrapper.classList.add(
      question.isCorrect ? "bg-[#34C759]/30" : "bg-[#FF0000]/30",
    );

    circle.className = question.isCorrect
      ? "w-5 h-5 rounded-full bg-[#34C759] border-[4px] border-white shrink-0"
      : "w-5 h-5 rounded-full bg-[#FF0000] border-[4px] border-white shrink-0";

    text.classList.add("font-semibold");
  } else {
    circle.classList.add("border-[#D9D9D9]");
  }

  wrapper.append(circle, text);

  return wrapper;
}

function answersMatch(option, answer) {
  if (answer === null || answer === undefined || answer === "") {
    return false;
  }

  const normalize = (value) => {
    if (typeof value === "object" && value !== null) {
      return String(value.text ?? value.label ?? value.value ?? value._id ?? "")
        .trim()
        .toLowerCase();
    }

    return String(value).trim().toLowerCase();
  };

  const optionValues =
    typeof option === "object" && option !== null
      ? [option.text, option.label, option.value, option._id]
      : [option];

  return optionValues.some(
    (value) =>
      value !== undefined &&
      value !== null &&
      normalize(value) === normalize(answer),
  );
}

function createSolution(solution) {
  const container = document.createElement("div");
  container.className = "mt-6 rounded-[11px] bg-[#E0E0E0] p-5";

  const heading = document.createElement("h3");
  heading.className = "text-[14px] font-bold";
  heading.textContent = "Solution";

  const label = document.createElement("p");
  label.className = "mt-2 text-[11px] font-semibold";
  label.textContent = "Step-by-step solution:";

  const steps = document.createElement("div");
  steps.className = "mt-2 space-y-2 text-[11px] font-semibold";

  const solutionItems = Array.isArray(solution)
    ? solution
    : solution
      ? [solution]
      : [];

  if (solutionItems.length === 0) {
    const paragraph = document.createElement("p");
    paragraph.textContent = "No solution available.";
    steps.appendChild(paragraph);
  } else {
    solutionItems.forEach((step) => {
      const paragraph = document.createElement("p");

      paragraph.textContent =
        typeof step === "object" && step !== null
          ? (step.text ??
            step.description ??
            step.explanation ??
            JSON.stringify(step))
          : String(step);

      steps.appendChild(paragraph);
    });
  }

  container.append(heading, label, steps);

  return container;
}

function setupTabs() {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab);
      filterQuestions(tab.dataset.filter);
    });
  });
}

function filterQuestions(filter) {
  const cards = document.querySelectorAll(".question-card");
  let visibleCount = 0;

  cards.forEach((card) => {
    const matches = filter === "all" || card.dataset.status === filter;

    card.classList.toggle("hidden", !matches);

    if (matches) {
      visibleCount++;
    }
  });

  emptyState.classList.toggle("hidden", visibleCount > 0);
}

function setActiveTab(activeTab) {
  tabs.forEach((tab) => {
    tab.classList.remove("text-[#085848]", "border-[#085848]", "active-tab");

    tab.classList.add("text-[#000000]/50", "border-transparent");
  });

  activeTab.classList.remove("text-[#000000]/50", "border-transparent");

  activeTab.classList.add("text-[#085848]", "border-[#085848]", "active-tab");
}

getAnswerReview();

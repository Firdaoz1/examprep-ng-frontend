// const API_BASE_URL =
  // "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("question-form");

  const fields = {
    category: document.getElementById("exam-category"),
    subject: document.getElementById("subject"),
    topic: document.getElementById("topic"),
    type: document.getElementById("question-type"),
    question: document.getElementById("question"),
    explanation: document.getElementById("explanation"),
    correctAnswer: document.getElementById("correct-answer"),
    correctAnswerDisplay: document.getElementById("correct-answer-display"),
    message: document.getElementById("form-message"),
  };

  const options = {
    A: document.getElementById("answer-a"),
    B: document.getElementById("answer-b"),
    C: document.getElementById("answer-c"),
    D: document.getElementById("answer-d"),
  };

  // Load actual database IDs for exams, subjects, and topics.
  let availableSubjects = [];
  let availableTopics = [];

  async function loadSubjects() {
  try {
    const token = sessionStorage.getItem("adminToken");

    if (!token) {
      throw new Error("Admin token not found. Please log in again.");
    }

    const response = await fetch(`${API_BASE_URL}/api/subjects`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message || `Failed to load subjects (${response.status}).`
      );
    }

    availableSubjects = Array.isArray(result.data)
      ? result.data
      : result.data?.subjects || [];

    console.log("Subjects loaded:", availableSubjects);
  } catch (error) {
    console.error("Loading subjects failed:", error);
    showMessage(error.message, true);
  }
}

  async function loadTopics(subjectId) {
  try {
    const token = sessionStorage.getItem("adminToken");

    if (!token) {
      throw new Error("Admin token not found. Please log in again.");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/topics?subjectId=${encodeURIComponent(subjectId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message || `Failed to load topics (${response.status}).`
      );
    }

    availableTopics = Array.isArray(result.data)
      ? result.data
      : result.data?.topics || [];

    console.log("Topics loaded:", availableTopics);
  } catch (error) {
    availableTopics = [];
    console.error("Loading topics failed:", error);
    showMessage(error.message, true);
  }
}
function getRecordId(record, ...keys) {
  for (const key of keys) {
    const value = record?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (value && typeof value === "object" && value._id) {
      return String(value._id);
    }
  }

  return "";
}

async function resolveSelectedSubject() {
  const subjectName = fields.subject.value.trim().toLowerCase();

  const subject = availableSubjects.find(
    item => item.name.trim().toLowerCase() === subjectName
  );

  if (!subject) {
    console.error("Selected subject not found:", fields.subject.value);
    delete fields.subject.dataset.id;
    delete fields.category.dataset.id;
    showMessage("Please select a valid subject.", "error");
    return;
  }

  // Assign the actual IDs returned by the backend
  fields.subject.dataset.id = subject.subjectId;
  fields.category.dataset.id = subject.examId;

  console.log("Resolved exam ID:", fields.category.dataset.id);
  console.log("Resolved subject ID:", fields.subject.dataset.id);

  await loadTopics(subject.subjectId);
  resolveSelectedTopic();
}

function resolveSelectedTopic() {
  const topicName = fields.topic.value.trim().toLowerCase();

  const topic = availableTopics.find((item) => {
    const name = item.name || item.topicName || item.title || "";
    const recordSubjectId = getRecordId(item, "subjectId");

    return (
      name.trim().toLowerCase() === topicName &&
      recordSubjectId === fields.subject.dataset.id
    );
  });

  if (!topic) {
    delete fields.topic.dataset.id;

    console.error("Topic not found. Available records:", availableTopics);
    showMessage("Topic not found in the backend topic list.", true);
    return;
  }

  const topicId = getRecordId(topic, "topicId", "_id", "id");

  if (!topicId) {
    console.error("Topic record is missing its ID:", topic);
    showMessage("The topic record has no recognizable database ID.", true);
    return;
  }

  fields.topic.dataset.id = topicId;
  console.log("Resolved topic ID:", topicId);
}

  fields.subject.addEventListener("change", resolveSelectedSubject);
  fields.subject.addEventListener("blur", resolveSelectedSubject);
  fields.topic.addEventListener("change", resolveSelectedTopic);
  fields.topic.addEventListener("blur", resolveSelectedTopic);

  loadSubjects();

const SAVED_ID_KEY = "examPrepSavedQuestionId";

let savedQuestionId = sessionStorage.getItem(SAVED_ID_KEY);
let isSaving = false;

  const neutralCardClasses = [
    "bg-white",
    "border-[#D9D9D9]",
  ];

  const selectedCardClasses = [
    "bg-[#CEF4DA]",
    "border-[#085848]",
  ];

  const neutralLetterClasses = [
    "bg-white",
    "text-black",
    "border-[#D9D9D9]",
  ];

  const selectedLetterClasses = [
    "bg-[#085848]",
    "text-white",
    "border-[#085848]",
  ];

  const neutralInputClasses = [
    "bg-transparent",
    "text-black",
  ];

  const selectedInputClasses = [
    "bg-transparent",
    "text-[#085848]",
  ];

  const neutralRadioClasses = [
    "border-[#D9D9D9]",
    "border",
    "bg-white",
  ];

  const selectedRadioClasses = [
    "border-[#085848]",
    "border-[4px]",
    "bg-white",
  ];

  function setText(id, value, fallback = "") {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value?.trim() || fallback;
    }
  }

  function selectCorrectAnswer(letter) {
    if (!options[letter]) return;

    fields.correctAnswer.value = letter;

    document.querySelectorAll(".answer-row").forEach((row) => {
      const input = row.querySelector('input[type="text"]');
      const radio = row.querySelector(".correct-answer-btn");
      const letterLabel = row.querySelector("label");
      const card = row.querySelector(".answer-box");

      if (!input || !radio || !letterLabel || !card) return;

      const selected = input.id === options[letter].id;

      // Reset the answer card first.
      card.classList.remove(...selectedCardClasses);
      card.classList.add(...neutralCardClasses);

      // Reset the A, B, C or D circle.
      letterLabel.classList.remove(
        ...selectedLetterClasses,
        ...neutralLetterClasses
      );

      // Reset the answer text.
      input.classList.remove(
        ...selectedInputClasses,
        ...neutralInputClasses
      );

      // Reset the radio button.
      radio.classList.remove(
        ...selectedRadioClasses,
        ...neutralRadioClasses
      );

      radio.classList.remove("selected");

      if (selected) {
        // Style only the selected answer.
        card.classList.remove(...neutralCardClasses);
        card.classList.add(...selectedCardClasses);

        letterLabel.classList.remove(...neutralLetterClasses);
        letterLabel.classList.add(...selectedLetterClasses);

        input.classList.remove(...neutralInputClasses);
        input.classList.add(...selectedInputClasses);

        radio.classList.remove(...neutralRadioClasses);
        radio.classList.add(...selectedRadioClasses);
        radio.classList.add("selected");
      }

      radio.setAttribute("aria-pressed", String(selected));
    });

    updateCorrectAnswerDisplay();
    updatePreview();
  }

  function updateCorrectAnswerDisplay() {
    const letter = fields.correctAnswer.value;
    const answer = options[letter]?.value.trim() || "";

    fields.correctAnswerDisplay.textContent =
      letter && answer ? `${letter} - ${answer}` : "No answer selected";
  }

  function updatePreview() {
    setText("preview-question", fields.question.value, "Your question will appear here.");
    setText("preview-explanation", fields.explanation.value, "Your explanation will appear here.");
    setText("preview-category", fields.category.value, "Exam category");
    setText("preview-subject", fields.subject.value, "Subject");
    setText("preview-topic", fields.topic.value, "Topic");
    setText("preview-type", fields.type.value, "Question type");

    ["A", "B", "C", "D"].forEach((letter) => {
      setText(
        `preview-${letter.toLowerCase()}`,
        options[letter].value,
        `Option ${letter}`
      );
    });

    document.querySelectorAll(".preview-option").forEach((row) => {
      const letter = row.dataset.answer;
      const selected = letter === fields.correctAnswer.value;
      const badge = row.querySelector("span:first-child");
      const answerText = row.querySelector("span:last-child");

      row.classList.remove(
        "selected-preview",
        "p-2",
        "bg-[#085848]/30",
        "border",
        "border-[#085848]",
        "rounded-[7px]"
      );

      badge.classList.remove(
        "bg-[#085848]",
        "text-white",
        "border",
        "border-[#D9D9D9]"
      );

      answerText.classList.remove("text-[#085848]");

      if (selected) {
        row.classList.add(
          "selected-preview",
          "p-2",
          "bg-[#085848]/30",
          "border",
          "border-[#085848]",
          "rounded-[7px]"
        );

        badge.classList.add("bg-[#085848]", "text-white");
        answerText.classList.add("text-[#085848]");
      } else {
        badge.classList.add("border", "border-[#D9D9D9]");
      }
    });
  }

  function showMessage(text, isError = false) {
    fields.message.textContent = text;
    fields.message.classList.remove(
      "hidden",
      "text-red-600",
      "text-green-700"
    );

    fields.message.classList.add(
      isError ? "text-red-600" : "text-green-700"
    );
  }

  function collectQuestionData(status) {
    return {
      examCategory: fields.category.value.trim(),
      subject: fields.subject.value.trim(),
      topic: fields.topic.value.trim(),
      questionType: fields.type.value.trim(),
      question: fields.question.value.trim(),
      options: {
        A: options.A.value.trim(),
        B: options.B.value.trim(),
        C: options.C.value.trim(),
        D: options.D.value.trim(),
      },
      correctAnswer: fields.correctAnswer.value,
      explanation: fields.explanation.value.trim(),
      status,
    };
  }

  function validateForm() {
    const data = collectQuestionData("draft");

    const requiredFields = [
      data.examCategory,
      data.subject,
      data.topic,
      data.questionType,
      data.question,
      data.explanation,
      data.options.A,
      data.options.B,
      data.options.C,
      data.options.D,
    ];

    if (requiredFields.some((value) => !value)) {
      showMessage("Please fill in all the required fields.", true);
      return false;
    }

    if (!["A", "B", "C", "D"].includes(data.correctAnswer)) {
      showMessage("Please select the correct answer.", true);
      return false;
    }

    return true;
  }

  function getAdminToken() {
  return sessionStorage.getItem("adminToken");
}

function getBackendId(field) {
  return (
    field?.dataset.id ||
    field?.dataset.examId ||
    field?.dataset.subjectId ||
    field?.dataset.topicId ||
    ""
  ).trim();
}

function collectApiQuestionData() {
  return {
    examId: fields.category.dataset.id || "",
    subjectId: fields.subject.dataset.id || "",
    topicId: fields.topic.dataset.id || "",
    questionType: fields.type.value.trim(),
    questionText: fields.question.value.trim(),
    options: {
      A: options.A.value.trim(),
      B: options.B.value.trim(),
      C: options.C.value.trim(),
      D: options.D.value.trim()
    },
    correctAnswer: fields.correctAnswer.value,
    explanation: fields.explanation.value.trim()
  };
}

async function sendQuestionRequest(url, method, body) {
  const token = getAdminToken();

  if (!token) {
    throw new Error("Admin login required. Please log in again.");
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let result = {};

  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = { message: text };
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Request failed (${response.status}).`
    );
  }

  return result;
}

async function createQuestionOnBackend() {
  const data = collectApiQuestionData();

  console.log("IDs before creating question:", {
  examId: data.examId,
  subjectId: data.subjectId,
  topicId: data.topicId
});

  if (!data.examId || !data.subjectId || !data.topicId) {
    throw new Error(
      "Exam ID, subject ID or topic ID is missing. The form currently has no confirmed database ID for one or more fields."
    );
  }

  const result = await sendQuestionRequest(
    "/api/questions",
    "POST",
    {
      ...data,
      status: "draft",
    }
  );

  const question =
    result.data?.question ||
    result.data ||
    result.question ||
    result;

  const id =
    question._id ||
    question.id ||
    question.questionId;

  if (!id) {
    console.error("Create question response:", result);
    throw new Error(
      "The question response did not contain a recognizable question ID. Check the browser console."
    );
  }

  savedQuestionId = String(id);
  sessionStorage.setItem(SAVED_ID_KEY, savedQuestionId);

  return savedQuestionId;
}

  async function saveDraft() {
  if (isSaving) return;
  if (!validateForm()) return;

  if (savedQuestionId) {
    showMessage(
      "This question already has a saved ID. You can publish it."
    );
    return;
  }

  isSaving = true;

  try {
    await createQuestionOnBackend();

    // Keep a local copy as a backup.
    localStorage.setItem(
      "examPrepQuestionDraft",
      JSON.stringify(collectQuestionData("draft"))
    );

    showMessage("Question saved as a draft successfully.");
  } catch (error) {
    console.error("Save draft failed:", error);
    showMessage(error.message, true);
  } finally {
    isSaving = false;
  }
}

async function publishQuestion() {
  if (isSaving) return;
  if (!validateForm()) return;

  isSaving = true;

  try {
    // Create the draft first if it hasn't been saved yet.
    const questionId =
      savedQuestionId || await createQuestionOnBackend();

    await sendQuestionRequest(
      `/api/admin/questions/${encodeURIComponent(questionId)}/status`,
      "PATCH",
      { status: "published" }
    );

    sessionStorage.removeItem(SAVED_ID_KEY);
    localStorage.removeItem("examPrepQuestionDraft");
    savedQuestionId = null;

    showMessage("Question published successfully.");
  } catch (error) {
    console.error("Publish question failed:", error);
    showMessage(error.message, true);
  } finally {
    isSaving = false;
  }
}

  function restoreDraft() {
    try {
      const saved = localStorage.getItem("examPrepQuestionDraft");

      if (!saved) return;

      const data = JSON.parse(saved);

      fields.category.value = data.examCategory || "";
      fields.subject.value = data.subject || "";
      fields.topic.value = data.topic || "";
      fields.type.value = data.questionType || "";
      fields.question.value = data.question || "";
      fields.explanation.value = data.explanation || "";

      ["A", "B", "C", "D"].forEach((letter) => {
        options[letter].value = data.options?.[letter] || "";
      });

      fields.correctAnswer.value =
        ["A", "B", "C", "D"].includes(data.correctAnswer)
          ? data.correctAnswer
          : "";
    } catch (error) {
      console.error("Unable to restore draft:", error);
    }
  }

  // Clicking an answer selects it.
 document.querySelectorAll(".correct-answer-btn").forEach((button) => {
  button.addEventListener("click", function (event) {
    event.preventDefault();

    const answer = this.getAttribute("data-answer");

    if (!answer) return;

    fields.correctAnswer.value = answer;

    selectCorrectAnswer(answer);
  });
});

  // Update the preview while typing.
  Object.values(fields).forEach((field) => {
    if (!field || field === fields.correctAnswerDisplay || field === fields.message || field === fields.correctAnswer) {
      return;
    }

    field.addEventListener("input", updatePreview);
  });

  Object.values(options).forEach((input) => {
    input.addEventListener("input", () => {
      updateCorrectAnswerDisplay();
      updatePreview();
    });
  });

  // Save draft buttons.
  document.getElementById("save-draft-btn")
    ?.addEventListener("click", saveDraft);

  document.getElementById("save-draft-btn-mobile")
    ?.addEventListener("click", saveDraft);

  // Validate the form. Actual API publishing is not connected yet.
  // Publish the question when the form is submitted.
// Publish the question when the form is submitted.
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateForm()) return;

  await publishQuestion();
});


  // No answer should be selected by default.
  restoreDraft();

if (!["A", "B", "C", "D"].includes(fields.correctAnswer.value)) {
  fields.correctAnswer.value = "";
}

updateCorrectAnswerDisplay();
updatePreview();
selectCorrectAnswer(fields.correctAnswer.value);
});
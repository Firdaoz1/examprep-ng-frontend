document.addEventListener("DOMContentLoaded", () => {
  const API_BASE =
    "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

  const DASHBOARD_ENDPOINT = `${API_BASE}/api/admin/dashboard`;

  // HTML elements
  const totalQuestionsEl = document.getElementById("total-questions");
  const publishedQuestionsEl = document.getElementById("published-items");
  const activeSubjectsEl = document.getElementById("active-subjects");
  const draftQuestionsEl = document.getElementById("draft-questions");

  const searchInput = document.getElementById("question-search");
  const categoryFilter = document.getElementById("exam-category-filter");
  const subjectFilter = document.getElementById("subject-filter");
  const tableBody = document.getElementById("question-table-body");

  const loadingMessage = document.getElementById("question-loading");
  const errorMessage = document.getElementById("question-error");
  const emptyMessage = document.getElementById("question-empty");

  let allQuestions = [];

  // Safely display text returned by the API.
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
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

  function showElement(element, visible) {
    if (element) {
      element.classList.toggle("hidden", !visible);
    }
  }

  function showLoading(isLoading) {
    showElement(loadingMessage, isLoading);
  }

  function showError(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
      showElement(errorMessage, true);
    }
  }

  function hideError() {
    showElement(errorMessage, false);
  }

  // Support common response wrappers without assuming
  // that the backend has already added the questions array.
  function extractQuestions(response) {
  const possibleArrays = [
    response?.data?.questions,
    response?.data?.items,
    response?.data?.recentActivity,
    response?.data?.questionBank?.questions,
    response?.questionBank?.questions,
    response?.questions,
    response?.items,
  ];

  return possibleArrays.find(Array.isArray) || [];
}

  function getQuestionFields(question) {
    return {
      id: question._id ?? question.id ?? question.questionId ?? "",
      category:
  question.examCategory ??
  (typeof question.exam === "string"
    ? question.exam
    : question.exam?.name) ??
  question.examName ??
  question.category ??
  question.examType ??
  question.examCode ??
  "",
      subject:
        question.subject?.name ??
        question.subjectName ??
        question.subject ??
        "",
      topic: question.topic?.name ?? question.topicName ?? question.topic ?? "",
      text:
        question.questionText ??
        question.question ??
        question.text ??
        "",
      status:
        question.status ??
        (question.isPublished === true
          ? "published"
          : question.isPublished === false
            ? "draft"
            : ""),
    };
  }

  function getStatus(question) {
    const fields = getQuestionFields(question);
    return String(fields.status).toLowerCase();
  }

  function renderStatistics(questions, summary = {}) {
    // Use backend totals when available. Otherwise use the
    // records returned by the API.
    const publishedCount = questions.filter((question) => {
      const status = getStatus(question);

      return (
        status === "published" ||
        status === "active" ||
        question.isPublished === true
      );
    }).length;

    const draftCount = questions.filter((question) => {
      const status = getStatus(question);

      return (
        status === "draft" ||
        status === "unpublished" ||
        question.isPublished === false
      );
    }).length;

    const subjects = new Set(
      questions
        .map((question) => getQuestionFields(question).subject)
        .filter(Boolean)
        .map((subject) =>
          typeof subject === "object"
            ? subject._id ?? subject.id ?? subject.name ?? ""
            : String(subject)
        )
    );

    if (totalQuestionsEl) {
      totalQuestionsEl.textContent =
        summary.totalQuestions ?? questions.length;
    }

    if (publishedQuestionsEl) {
      publishedQuestionsEl.textContent =
        summary.publishedQuestions ?? publishedCount;
    }

    if (draftQuestionsEl) {
      draftQuestionsEl.textContent =
        summary.draftQuestions ?? draftCount;
    }

    if (activeSubjectsEl) {
      activeSubjectsEl.textContent =
        summary.activeSubjects ?? subjects.size;
    }
  }

  function populateFilter(selectElement, values, defaultLabel) {
    if (!selectElement) return;

    const currentValue = selectElement.value;

    // Keep the existing first option and remove old dynamic options.
    selectElement.length = 1;
    selectElement.options[0].value = "";
    selectElement.options[0].textContent = defaultLabel;

    const uniqueValues = [...new Set(
      values
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    uniqueValues.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      selectElement.appendChild(option);
    });

    // Keep the user's selection if it still exists.
    if (
      [...selectElement.options].some(
        (option) => option.value === currentValue
      )
    ) {
      selectElement.value = currentValue;
    }
  }

  function populateFilters(questions) {
    const categories = questions.map(
      (question) => getQuestionFields(question).category
    );

    const subjects = questions.map(
      (question) => getQuestionFields(question).subject
    );

    populateFilter(categoryFilter, categories, "All Exam Categories");
    populateFilter(subjectFilter, subjects, "All Subjects");
  }

  function renderQuestions() {
    if (!tableBody) {
      console.error('Missing HTML element: "question-table-body"');
      return;
    }

    const searchTerm = (searchInput?.value ?? "")
      .trim()
      .toLowerCase();

    const selectedCategory = categoryFilter?.value ?? "";
    const selectedSubject = subjectFilter?.value ?? "";

    const filteredQuestions = allQuestions.filter((question) => {
      const fields = getQuestionFields(question);

      const searchableText = [
        fields.id,
        fields.category,
        fields.subject,
        fields.topic,
        fields.text,
        fields.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(searchTerm);

      const matchesCategory =
        !selectedCategory || fields.category === selectedCategory;

      const matchesSubject =
        !selectedSubject || fields.subject === selectedSubject;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSubject
      );
    });

    tableBody.innerHTML = "";

    showElement(emptyMessage, filteredQuestions.length === 0);

    if (filteredQuestions.length === 0) {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td colspan="100%" class="px-6 py-8 text-center text-gray-500">
          ${
            allQuestions.length === 0
              ? "No question records were returned by the API."
              : "No questions match your search or filters."
          }
        </td>
      `;

      tableBody.appendChild(row);
      return;
    }

    filteredQuestions.forEach((question) => {
  const fields = getQuestionFields(question);
  const status = fields.status || "Unknown";

  const row = document.createElement("tr");
  row.className = "border-b border-gray-200 hover:bg-gray-50";

  const statusClass =
    status.toLowerCase() === "published" ||
    status.toLowerCase() === "active"
      ? "bg-green-100 text-green-700"
      : status.toLowerCase() === "draft"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-gray-100 text-gray-600";

  row.innerHTML = `
    <td class="px-4 py-5 text-sm whitespace-nowrap">
      ${escapeHTML(fields.id || "—")}
    </td>

    <td class="px-4 py-5 text-sm whitespace-nowrap">
      ${escapeHTML(fields.category || "—")}
    </td>

    <td class="px-4 py-5 text-sm">
      <div class="font-medium">
        ${escapeHTML(fields.subject || "—")}
      </div>
      <div class="mt-1 text-xs text-gray-600">
        ${escapeHTML(fields.topic || "")}
      </div>
      <div class="mt-1 text-xs text-gray-400">
        ${escapeHTML(fields.text || "")}
      </div>
    </td>

    <td class="px-4 py-5 text-sm">
      —
    </td>

    <td class="px-4 py-5 text-sm">
      <span class="inline-block rounded-full px-3 py-1 text-xs font-medium ${statusClass}">
        ${escapeHTML(status)}
      </span>
    </td>
  `;

  tableBody.appendChild(row);
});
  }

  async function loadQuestions() {
    showLoading(true);
    hideError();

    try {
      const token =
        sessionStorage.getItem("adminToken") ||
        sessionStorage.getItem("token");

      const headers = {
        Accept: "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(DASHBOARD_ENDPOINT, {
        method: "GET",
        headers,
      });

      const responseText = await response.text();

      let result;

      try {
        result = responseText ? JSON.parse(responseText) : {};
        console.log("Full dashboard response:", result);
console.log("Extracted questions:", extractQuestions(result));
      } catch {
        throw new Error(
          "The API returned a response that is not valid JSON."
        );
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
          `Request failed with status ${response.status}.`
        );
      }

      if (result.success === false) {
        throw new Error(
          result.message || "The dashboard request failed."
        );
      }

      // Support either a root-level summary or a wrapped response.
      const summary =
        result.data?.summary ??
        result.summary ??
        {};

      allQuestions = extractQuestions(result);

      console.log("API response:", result);
console.log("Questions loaded:", allQuestions);
      renderStatistics(allQuestions, summary);
      populateFilters(allQuestions);
      renderQuestions();

      // The summary can work even when the API has not yet
      // been extended to return individual question records.
      if (allQuestions.length === 0) {
        console.warn(
          "Dashboard loaded, but no questions array was found. " +
          "The backend must include question records for the table."
        );
      }
    } catch (error) {
      console.error("Question Bank loading error:", error);
      showError(error.message || "Unable to load dashboard data.");

      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="100%" class="px-6 py-8 text-center text-red-600">
              Unable to load question data. Please try again.
            </td>
          </tr>
        `;
      }
    } finally {
      showLoading(false);
    }
  }

  // Search and filters update the table immediately.
  searchInput?.addEventListener("input", renderQuestions);
  categoryFilter?.addEventListener("change", renderQuestions);
  subjectFilter?.addEventListener("change", renderQuestions);

  loadQuestions();
});
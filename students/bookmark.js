document.addEventListener("DOMContentLoaded", () => {
  async function bookmarkApiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app${endpoint}`,
      {
        ...options,
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      },
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || `Request failed (${response.status})`);
    }

    return result;
  }

  const bookmarkList = document.getElementById("bookmark-list");
  const savedCount = document.getElementById("saved-count");
  const filterButtons = document.querySelectorAll(".bookmark-filter");

  const API_BASE =
    "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

  let bookmarks = [];
  let activeSubject = "All";
  const removingIds = new Set();

  const subjectIcons = {
    mathematics: "/Images/Math.png",
    physics: "/Images/Phy.png",
    chemistry: "/Images/Chem.png",
    english: "/Images/Eng (1).png",
    "use of english": "/Images/Eng (1).png",
  };

  function getQuestion(item) {
    const question = item?.questionId ?? item?.question ?? item;
    return question && typeof question === "object" ? question : {};
  }

  function getQuestionId(item) {
    const question = getQuestion(item);
    const id =
      question._id ||
      item?.questionId?._id ||
      item?.question?._id ||
      (typeof item?.questionId === "string" ? item.questionId : null) ||
      (typeof item?.question === "string" ? item.question : null);

    return id ? String(id) : "";
  }

  function getSubject(item) {
    const question = getQuestion(item);
    const subject =
      question.subject ||
      item?.subject ||
      question.subjectId ||
      item?.subjectId;

    if (typeof subject === "string") return subject;
    return subject?.name || subject?.title || "";
  }

  function getTopic(item) {
    const question = getQuestion(item);
    const topic =
      question.topic || item?.topic || question.topicId || item?.topicId;

    if (typeof topic === "string") return topic;
    return topic?.name || topic?.title || "";
  }

  function getQuestionText(item) {
    const question = getQuestion(item);

    return (
      question.questionText ||
      question.text ||
      question.question ||
      item?.questionText ||
      item?.text ||
      "Question text unavailable"
    );
  }

  function getExplanation(item) {
    const question = getQuestion(item);

    return (
      question.explanation ||
      question.answerExplanation ||
      question.solution ||
      item?.explanation ||
      ""
    );
  }

  function getSavedDate(item) {
    const date =
      item?.createdAt || item?.savedAt || item?.bookmarkedAt || item?.updatedAt;

    if (!date) return "";

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";

    return parsed.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

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

  function normaliseSubject(subject) {
    const value = String(subject || "")
      .trim()
      .toLowerCase();

    if (value === "use of english" || value === "english") {
      return "English";
    }

    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Other";
  }

  function getSubjectInitial(subject) {
    const name = String(subject || "").trim();

    if (!name) return "?";

    return name.charAt(0).toUpperCase();
  }

  async function loadBookmarks() {
    bookmarkList.innerHTML = `
      <p class="py-8 text-center text-[#78909C]">
        Loading your bookmarks...
      </p>
    `;

    try {
      const result = await bookmarkApiRequest("/api/bookmarks");
      const data = result?.data;

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.bookmarks)
          ? data.bookmarks
          : Array.isArray(result?.bookmarks)
            ? result.bookmarks
            : [];

      bookmarks = items.filter((item) => getQuestionId(item));

      renderBookmarks();
    } catch (error) {
      bookmarkList.innerHTML = `
        <p class="py-8 text-center text-red-600">
          Unable to load bookmarks.
          <button id="retry-bookmarks"
            class="ml-2 font-bold underline">
            Try again
          </button>
        </p>
      `;

      document
        .getElementById("retry-bookmarks")
        ?.addEventListener("click", loadBookmarks);
    }
  }

  function renderBookmarks() {
    const filteredBookmarks =
      activeSubject === "All"
        ? bookmarks
        : bookmarks.filter(
            (item) => normaliseSubject(getSubject(item)) === activeSubject,
          );

    savedCount.textContent = `${bookmarks.length} Saved`;

    filterButtons.forEach((button) => {
      const selected = button.dataset.subject === activeSubject;

      button.classList.toggle("bg-[#085848]", selected);
      button.classList.toggle("text-white", selected);
      button.classList.toggle("bg-[#FFFFFF]", !selected);
      button.classList.toggle("text-[#78909C]", !selected);

      button.setAttribute("aria-pressed", String(selected));
    });

    if (!filteredBookmarks.length) {
      bookmarkList.innerHTML = `
        <div class="rounded-2xl border border-[#D9D9D9] bg-white p-8 text-center">
          <p class="font-bold text-[#085848]">
            ${
              bookmarks.length
                ? "No bookmarks for this subject yet."
                : "You haven't bookmarked any questions yet."
            }
          </p>
          <p class="mt-2 text-sm text-[#78909C]">
            Save a question during practice and it will appear here.
          </p>
        </div>
      `;
      return;
    }

    bookmarkList.innerHTML = filteredBookmarks
      .map((item) => {
        const question = getQuestion(item);
        const id = getQuestionId(item);
        const subject = normaliseSubject(getSubject(item));
        const topic = getTopic(item) || "General";
        const text = getQuestionText(item);
        const explanation = getExplanation(item);
        const savedDate = getSavedDate(item);
        const initial = getSubjectInitial(subject);

        return `
          <article
            class="bookmark-card bg-white border border-[#D9D9D9]
                   rounded-2xl p-4 sm:p-5"
            data-question-id="${escapeHTML(id)}"
          >
            <div class="grid grid-cols-[minmax(0,1fr)_auto]
                        md:grid-cols-[minmax(0,1fr)_auto_auto_auto]
                        items-center gap-x-4 gap-y-5 md:gap-6">

              <div class="flex items-start gap-4 min-w-0">
                <div class="w-10 h-10 shrink-0 rounded-xl bg-[#CEF4DA]
            text-[#085848] flex items-center justify-center
            font-bold text-lg">
  ${escapeHTML(initial)}
</div>

                <div class="min-w-0 flex-1">
                  <h2 class="text-[18px] font-bold text-black">
                    ${escapeHTML(subject)}
                  </h2>

                  <p class="mt-1 text-[14px] font-bold text-[#78909C]">
                    ${escapeHTML(topic)}
                  </p>

                  <p class="mt-2 text-[14px] text-[#78909C]
                            break-words">
                    ${escapeHTML(text)}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 justify-self-end
                          self-start md:self-center text-[12px]
                          sm:text-[14px] text-[#78909C]">
                <ion-icon name="time-outline"></ion-icon>
                <p>${savedDate ? `Saved on ${escapeHTML(savedDate)}` : "Saved"}</p>
              </div>

              <button
                type="button"
                class="view-bookmark row-start-2 col-start-1
                       justify-self-start md:row-auto md:col-auto
                       w-[86px] p-3 rounded-lg bg-[#D9F5D8]
                       text-[#085848] text-[14px] font-bold"
                aria-expanded="false"
              >
                View
              </button>

              <button
                type="button"
                class="remove-bookmark row-start-2 col-start-2
                       justify-self-end md:row-auto md:col-auto
                       flex items-center justify-center
                       text-[#085848] p-2"
                aria-label="Remove ${escapeHTML(subject)} bookmark"
                title="Remove bookmark"
                ${removingIds.has(id) ? "disabled" : ""}
              >
                <ion-icon name="bookmark" class="w-5 h-5"></ion-icon>
              </button>
            </div>

            <div class="bookmark-explanation hidden mt-4 border-t
                        border-[#E5E7EB] pt-4">
              <h3 class="text-sm font-bold text-[#085848]">
                Explanation
              </h3>

              <p class="mt-2 text-sm leading-6 text-[#52666D]
                        whitespace-pre-line break-words">
                ${
                  explanation
                    ? escapeHTML(explanation)
                    : "No explanation is available for this question."
                }
              </p>
            </div>
          </article>
        `;
      })
      .join("");
  }

  async function removeBookmark(questionId, button) {
    if (!questionId || removingIds.has(questionId)) return;

    const originalText = button.innerHTML;

    removingIds.add(questionId);
    button.disabled = true;

    try {
      await bookmarkApiRequest(
        `/api/bookmarks/${encodeURIComponent(questionId)}`,
        { method: "DELETE" },
      );

      bookmarks = bookmarks.filter(
        (item) => getQuestionId(item) !== questionId,
      );

      renderBookmarks();
    } catch (error) {
      button.disabled = false;
      button.innerHTML = originalText;

      alert(`Unable to remove bookmark: ${error.message}`);
    } finally {
      removingIds.delete(questionId);
    }
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeSubject = button.dataset.subject || "All";
      renderBookmarks();
    });
  });

  bookmarkList.addEventListener("click", (event) => {
    const viewButton = event.target.closest(".view-bookmark");

    if (viewButton) {
      const card = viewButton.closest(".bookmark-card");
      const explanation = card?.querySelector(".bookmark-explanation");

      if (!explanation) return;

      const isExpanded = !explanation.classList.contains("hidden");

      explanation.classList.toggle("hidden", isExpanded);
      viewButton.textContent = isExpanded ? "View" : "Hide";
      viewButton.setAttribute("aria-expanded", String(!isExpanded));

      return;
    }

    const removeButton = event.target.closest(".remove-bookmark");

    if (removeButton) {
      const card = removeButton.closest(".bookmark-card");
      const questionId = card?.dataset.questionId;

      removeBookmark(questionId, removeButton);
    }
  });

  loadBookmarks();
});

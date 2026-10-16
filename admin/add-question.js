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

  function selectCorrectAnswer(letter = "") {
  const validLetter = ["A", "B", "C", "D"].includes(letter)
    ? letter
    : "";

  fields.correctAnswer.value = validLetter;

  document.querySelectorAll(".answer-row").forEach((row) => {
    const input = row.querySelector('input[type="text"]');
    const radio = row.querySelector(".correct-answer-btn");
    const letterLabel = row.querySelector("label");
    const card = row.querySelector(".answer-box");

    if (!input || !radio || !letterLabel || !card) return;

    const selected = input.id === options[validLetter]?.id;

    card.classList.remove(...selectedCardClasses);
    card.classList.add(...neutralCardClasses);

    letterLabel.classList.remove(...selectedLetterClasses);
    letterLabel.classList.add(...neutralLetterClasses);

    input.classList.remove(...selectedInputClasses);
    input.classList.add(...neutralInputClasses);

    radio.classList.remove(...selectedRadioClasses, "selected");
    radio.classList.add(...neutralRadioClasses);
    radio.setAttribute("aria-pressed", String(selected));

    if (selected) {
      card.classList.remove(...neutralCardClasses);
      card.classList.add(...selectedCardClasses);

      letterLabel.classList.remove(...neutralLetterClasses);
      letterLabel.classList.add(...selectedLetterClasses);

      input.classList.remove(...neutralInputClasses);
      input.classList.add(...selectedInputClasses);

      radio.classList.remove(...neutralRadioClasses);
      radio.classList.add(...selectedRadioClasses, "selected");
    }
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

  function saveDraft() {
    const data = collectQuestionData("draft");

    try {
      localStorage.setItem(
        "examPrepQuestionDraft",
        JSON.stringify(data)
      );

      showMessage(
        "Draft saved in your browser. It has not been sent to the backend."
      );
    } catch (error) {
      showMessage("Unable to save the draft.", true);
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
  button.addEventListener("click", (event) => {
    event.preventDefault();
    selectCorrectAnswer(button.dataset.answer);
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
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    console.log(
      "Question ready for backend integration:",
      collectQuestionData("published")
    );

    showMessage(
      "All fields are valid. Publishing still needs backend integration."
    );
  });

// Restore a saved draft once, if one exists.
restoreDraft();

// Restore its selected answer, or select nothing.
const savedAnswer = fields.correctAnswer.value;

selectCorrectAnswer(
  ["A", "B", "C", "D"].includes(savedAnswer)
    ? savedAnswer
    : ""
);

updatePreview();
});
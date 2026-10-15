const roleCards = document.querySelectorAll(".role-card");

roleCards.forEach((card) => {
  card.addEventListener("click", () => {
    roleCards.forEach((card) => {
      card.classList.remove("border-[#085848]");
    });

    card.classList.add("border-[#085848]");

    const role = card.dataset.role;

    if (role === "teacher") {
      window.location.href = "";
    }

    if (role === "student") {
      window.location.href = "./signup.html";
    }

    if (role === "administrator") {
      window.location.href = "/admin/admin-signup.html";
    }
  });
});
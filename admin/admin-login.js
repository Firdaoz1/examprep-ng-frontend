const API_BASE_URL =
  "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginMessage = document.getElementById("login-message");
const googleMessage = document.getElementById("google-message");
const googleButton = document.getElementById("google-login");

// Show inline messages instead of alerts
function showMessage(element, message, type = "error") {
  if (!element) return;

  element.textContent = message;
  element.className = "mt-3 text-sm text-center";

  element.classList.add(
    type === "success" ? "text-green-700" : "text-red-600"
  );
}

// Toggle password visibility
const toggleButton = document.querySelector(".toggle-password");

if (toggleButton) {
  toggleButton.addEventListener("click", () => {
    const input = document.getElementById("password");
    const icon = toggleButton.querySelector("ion-icon");

    if (!input || !icon) return;

    const showPassword = input.type === "password";

    input.type = showPassword ? "text" : "password";
    icon.setAttribute("name", showPassword ? "eye" : "eye-off");
    toggleButton.setAttribute(
      "aria-label",
      showPassword ? "Hide password" : "Show password"
    );
  });
}

// Admin login
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage(loginMessage, "");

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage(loginMessage, "Please enter your email and password.");
    return;
  }

  const submitButton = loginForm.querySelector(
    'button[type="submit"]'
  );
  const originalText = submitButton.textContent;

  submitButton.disabled = true;
  submitButton.textContent = "Signing in...";

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
         emailOrPhone: email,
         password: password
         }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      showMessage(
        loginMessage,
        result.message || `Login failed (${response.status}).`
      );
      return;
    }

    // Store the token only if this matches the backend's response.
    const token =
      result.data?.token ||
      result.token ||
      result.data?.accessToken;

    if (token) {
      sessionStorage.setItem("adminToken", token);
    }

    showMessage(
      loginMessage,
      result.message || "Login successful!",
      "success"
    );

    // Change this path if your admin dashboard is elsewhere.
    window.location.href = "./admin-dashboard.html";
  } catch (error) {
    console.error("Admin login error:", error);

    showMessage(
      loginMessage,
      "Unable to connect to the server. Please try again."
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
});

// Google login
googleButton.addEventListener("click", () => {
  showMessage(
    googleMessage,
    "Google sign-in is not connected yet."
  );
});
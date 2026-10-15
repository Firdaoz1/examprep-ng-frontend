const APIBASEURL =
"https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const googleLogin = document.getElementById("google-login");
const message = document.getElementById("message");
const googleMessage = document.getElementById("google-message");

// Password visibility
document.querySelectorAll(".toggle-password").forEach((button) => {
button.addEventListener("click", () => {
const input = button.parentElement.querySelector("input");
const eyeIcon = button.querySelector("ion-icon");

if (!input) return;

input.type = input.type === "password" ? "text" : "password";

if (eyeIcon) {
  eyeIcon.name =
    input.type === "password" ? "eye-off-outline" : "eye-outline";
}

});
});

// Google sign-in unavailable
googleLogin?.addEventListener("click", () => {
googleMessage.textContent =
"Google sign-in is currently unavailable. Please sign up using your email address.";

message.classList.remove("hidden", "text-green-600");
message.classList.add("text-red-500");
});

// Login with email and password
loginForm?.addEventListener("submit", async (event) => {
event.preventDefault();

message.textContent = "";
message.classList.remove("text-green-600", "text-red-500");

const emailOrPhone = emailInput.value.trim();
const password = passwordInput.value;

if (!emailOrPhone || !password) {
message.textContent = "Please fill in all fields.";
message.classList.add("text-red-500");
return;
}

const submitButton = loginForm.querySelector('button[type="submit"]');
const originalButtonText = submitButton.innerHTML;

submitButton.disabled = true;
submitButton.textContent = "Logging in...";

try {
const response = await fetch(`${APIBASEURL}/api/auth/login`, {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
emailOrPhone,
password,
}),
});

const data = await response.json().catch(() => ({}));

if (!response.ok || data.success === false) {
  message.textContent =
    data.message || "Your login details are incorrect.";

  message.classList.add("text-red-500");
  return;
}

const token = data.data?.token;
const user = data.data?.user;

if (!token || !user) {
  message.textContent =
    "Login response is missing your account information. Please try again.";
  message.classList.add("text-red-500");
  return;
}

localStorage.setItem("token", token);
localStorage.setItem("user", JSON.stringify(user));

window.location.href = "/students/dashboard.html";

} catch (error) {
console.error("Login error:", error);

message.textContent =
  "Unable to connect to the server. Please try again.";

message.classList.add("text-red-500");

} finally {
submitButton.disabled = false;
submitButton.innerHTML = originalButtonText;
}
});
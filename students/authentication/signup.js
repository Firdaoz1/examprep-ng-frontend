const APIBASEURL = "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

const signupForm = document.getElementById("signup-form");
const fullNameInput = document.getElementById("full-name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");

const message = document.getElementById("message");
const passwordMessage = document.getElementById("password-message");
const googleLogin = document.getElementById("google-login");

const googleMessage = document.getElementById("google-message");

document.querySelectorAll(".toggle-password").forEach((button) => {
button.addEventListener("click", () => {
const input = button.parentElement.querySelector("input");
const icon = button.querySelector("ion-icon");

if (!input) return;

input.type = input.type === "password" ? "text" : "password";

if (icon) {
  icon.name =
    input.type === "password" ? "eye-off-outline" : "eye-outline";
}

});
});

googleLogin?.addEventListener("click", () => {
if (googleMessage) {
googleMessage.textContent =
"Google sign-up is currently unavailable. Please sign up using your email address.";
}
});

signupForm?.addEventListener("submit", async (event) => {
event.preventDefault();

message.textContent = "";
passwordMessage.textContent = "";

if (googleMessage) googleMessage.textContent = "";

const fullName = fullNameInput.value.trim();
const emailOrPhone = emailInput.value.trim();
const password = passwordInput.value;
const confirmPassword = confirmPasswordInput.value;

if (!fullName || !emailOrPhone || !password || !confirmPassword) {
message.textContent = "Please fill in all required fields.";
return;
}

if (password.length < 8) {
passwordMessage.textContent =
"Password must be at least 8 characters long.";
return;
}

if (password !== confirmPassword) {
passwordMessage.textContent = "Passwords do not match.";
return;
}

const submitButton = signupForm.querySelector('button[type="submit"]');
const originalButtonText = submitButton.textContent;

submitButton.disabled = true;
submitButton.textContent = "Creating account...";

try {
const response = await fetch(`${APIBASEURL}/api/auth/register`, {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
fullName,
emailOrPhone,
password,
}),
});

const result = await response.json().catch(() => ({}));
const responseMessage =
  result.message || "Unable to create your account.";

if (!response.ok || result.success === false) {
  message.textContent = responseMessage;
  message.classList.remove("text-green-600", "text-amber-600");
  message.classList.add("text-red-500");
  return;
}

sessionStorage.setItem("signupEmail", emailOrPhone);

const lowerMessage = responseMessage.toLowerCase();

const emailFailed =
  lowerMessage.includes("could not send") ||
  lowerMessage.includes("couldn't send") ||
  lowerMessage.includes("failed to send") ||
  lowerMessage.includes("email configuration missing") ||
  lowerMessage.includes("unable to send") ||
  lowerMessage.includes("resend-verification");

if (emailFailed) {
  sessionStorage.setItem(
    "verificationMessage",
    "Your account was created, but we couldn't send the verification email. Please try resending it."
  );
  sessionStorage.setItem("verificationEmailSent", "false");
} else {
  sessionStorage.setItem("verificationMessage", responseMessage);
  sessionStorage.setItem("verificationEmailSent", "true");
}
window.location.href = "./email-sent.html";

} catch (error) {
console.error("Signup error:", error);

message.textContent =
  "Unable to connect to the server. Please check your connection and try again.";

message.classList.remove("text-green-600", "text-amber-600");
message.classList.add("text-red-500");

} finally {
submitButton.disabled = false;
submitButton.textContent = originalButtonText;
}
});
const APIBASEURL =
"https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

const resetPasswordForm = document.getElementById("reset-password-form");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const message = document.getElementById("message");
const passwordMessage = document.getElementById("password-message");
const resetButton = document.getElementById("reset-password-button");

// Read the reset token from the email link's URL.
// Expected format: reset-password.html?token=YOUR_RESET_TOKEN
const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get("token");

// Display messages
function showMessage(text, type = "error") {
message.textContent = text;
message.classList.remove(
"hidden",
"text-red-500",
"text-green-600",
"text-amber-600"
);

if (type === "success") {
message.classList.add("text-green-600");
} else if (type === "warning") {
message.classList.add("text-amber-600");
} else {
message.classList.add("text-red-500");
}
}

// Password visibility
document.querySelectorAll(".toggle-password").forEach((button) => {
button.addEventListener("click", () => {
const container = button.parentElement;
const input = container.querySelector("input");
const icon = button.querySelector("ion-icon");

if (!input) return;

input.type = input.type === "password" ? "text" : "password";

if (icon) {
  icon.name =
    input.type === "password" ? "eye-off-outline" : "eye-outline";
}

});
});

// Check whether the reset token exists
if (!resetToken) {
showMessage(
"Your password reset link is missing its token. Please request a new reset link."
);

if (resetButton) {
resetButton.disabled = true;
resetButton.classList.add("opacity-50", "cursor-not-allowed");
}
}

// Reset password
resetPasswordForm?.addEventListener("submit", async (event) => {
event.preventDefault();

message.classList.add("hidden");
passwordMessage.textContent = "";

if (!resetToken) {
showMessage("Please request a new password reset link.");
return;
}

const password = passwordInput.value;
const confirmPassword = confirmPasswordInput.value;

if (!password || !confirmPassword) {
passwordMessage.textContent = "Please fill in both password fields.";
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

const originalButtonHTML = resetButton.innerHTML;

resetButton.disabled = true;
resetButton.textContent = "Changing password...";

try {
const response = await fetch(
`${APIBASEURL}/api/auth/reset-password`,
{
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
token: resetToken,
newPassword: password,
}),
}
);

const result = await response.json().catch(() => ({}));

if (!response.ok || result.success === false) {
  showMessage(
    result.message ||
      "Unable to reset your password. The link may have expired. Please request a new one."
  );
  return;
}

showMessage(
  result.message ||
    "Your password has been changed successfully. You can now log in.",
  "success"
);

resetPasswordForm.reset();

// Redirect to login after a short delay.
setTimeout(() => {
  window.location.href = "./login.html";
}, 2000);

} catch (error) {
console.error("Reset password error:", error);

showMessage(
  "Unable to connect to the server. Please check your connection and try again."
);

} finally {
resetButton.disabled = false;
resetButton.innerHTML = originalButtonHTML;
}
});
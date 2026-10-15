const APIBASEURL =
"https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

const forgotPasswordForm = document.getElementById("forgot-password-form");
const emailInput = document.getElementById("email");
const message = document.getElementById("message");

forgotPasswordForm?.addEventListener("submit", async (event) => {
event.preventDefault();

message.textContent = "";
message.classList.add("hidden");
message.classList.remove("text-red-500", "text-green-600");

const email = emailInput.value.trim();

if (!email) {
showMessage("Please enter your email address.", "error");
return;
}

const submitButton = forgotPasswordForm.querySelector(
'button[type="submit"]'
);
const originalButtonHTML = submitButton.innerHTML;

submitButton.disabled = true;
submitButton.innerHTML = "Sending...";

try {
const response = await fetch(
`${APIBASEURL}/api/auth/forgot-password`,
{
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({ emailOrPhone: email }),
}
);

const result = await response.json().catch(() => ({}));

if (!response.ok || result.success === false) {
  showMessage(
    result.message || "Unable to send the reset link. Please try again.",
    "error"
  );
  return;
}

showMessage(
  result.message ||
    "If an account exists for this email, you will receive a password reset link shortly.",
  "success"
);

forgotPasswordForm.reset();

} catch (error) {
console.error("Forgot password error:", error);

showMessage(
  "Unable to connect to the server. Please check your connection and try again.",
  "error"
);

} finally {
submitButton.disabled = false;
submitButton.innerHTML = originalButtonHTML;
}
});

function showMessage(text, type) {
message.textContent = text;
message.classList.remove("hidden");

if (type === "success") {
message.classList.add("text-green-600");
} else {
message.classList.add("text-red-500");
}
}
const APIBASEURL = "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

const sentEmail = document.getElementById("sent-email");
const resendButton = document.getElementById("resend-email");
const resendMessage = document.getElementById("resend-message");

const emailOrPhone = sessionStorage.getItem("signupEmail");

if (sentEmail && emailOrPhone) {
  sentEmail.textContent = emailOrPhone;
}

resendButton?.addEventListener("click", async () => {
  if (!emailOrPhone) {
    resendMessage.textContent =
      "Your email address was not found. Please return to signup and try again.";
    return;
  }

  resendButton.disabled = true;
  resendButton.textContent = "Sending...";
  resendMessage.textContent = "";

  try {
    const response = await fetch(
      `${APIBASEURL}/api/auth/resend-verification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailOrPhone }),
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      resendMessage.textContent =
        result.message || "Unable to resend the verification email.";
      return;
    }

    resendMessage.textContent =
      result.message || "Verification email requested. Please check your inbox.";
  } catch (error) {
    console.error("Resend verification error:", error);

    resendMessage.textContent =
      "Unable to connect to the server. Please try again.";
  } finally {
    resendButton.disabled = false;
    resendButton.textContent = "Resend Verification Email";
  }
});
const verificationTitle = document.getElementById("verification-title");
const verificationMessage = document.getElementById("verification-message");
const verificationLogin = document.getElementById("verification-login");

async function verifyEmail() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const APIBASEURL = "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

  if (!token) {
    verificationTitle.textContent = "Verification link invalid";
    verificationMessage.textContent = "The verification token is missing. Please open the link in your email again.";
    return;
  }

  try {
    // Replace this endpoint with the actual backend route.
    const response = await fetch(`${APIBASEURL}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
      {
        method: "GET"
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Email verification failed."
      );
    }

    verificationTitle.textContent = "Congratulations!";
    verificationMessage.textContent = "Your email has been verified. You can now log in to ExamPrep NG.";
    verificationLogin.classList.remove("hidden");

  } catch (error) {
    verificationTitle.textContent = "Verification unsuccessful";
    verificationMessage.textContent = error.message;
  }
}

verifyEmail();
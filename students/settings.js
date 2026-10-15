const API_BASE =
  "https://exam-prep-backend-git-staging-bidex327s-projects.vercel.app";

const LANDING_PAGE = "../index.html";
const SETTINGS_ENDPOINT = "/api/settings";
const PROFILE_PICTURE_ENDPOINT = "/api/settings/profile-picture";

const settingsForm = document.getElementById("settings-form");
const editProfileButton = document.getElementById("edit-profile");
const logoutButton = document.getElementById("logout-button");

const fullNameInput = document.getElementById("full-name");
const emailInput = document.getElementById("email");
const timezoneInput = document.getElementById("timezone");
const locationInput = document.getElementById("location");

const profileAvatar = document.getElementById("profile-avatar");
const profileInitial = document.getElementById("profile-initial");
const uploadPhotoButton = document.getElementById("upload-photo");
const photoInput = document.getElementById("profile-photo-input");

const photoOptionsModal = document.getElementById("photo-options-modal");
const changePhotoOption = document.getElementById("change-photo-option");
const removePhotoOption = document.getElementById("remove-photo-option");
const cancelPhotoOptions = document.getElementById("cancel-photo-options");
const cancelPhotoButton = document.getElementById("cancel-photo-button");

const logoutModal = document.getElementById("logout-modal");
const cancelLogoutButton = document.getElementById("cancel-logout");
const confirmLogoutButton = document.getElementById("confirm-logout");

const toast = document.getElementById("settings-toast");
const toastTitle = document.getElementById("toast-title");
const toastMessage = document.getElementById("toast-message");
const toastIcon = document.getElementById("toast-icon");
const closeToastButton = document.getElementById("close-settings-toast");

let settingsData = {};
let isEditing = false;
let toastTimeout;
let currentPreviewUrl = null;

async function settingsApiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = LANDING_PAGE;
    throw new Error("You are not logged in.");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    ...options.headers,
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const responseText = await response.text();
  let result = {};

  try {
    result = responseText ? JSON.parse(responseText) : {};
  } catch {
    result = { message: responseText };
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || result.error || `Request failed (${response.status})`,
    );
  }

  return result;
}

function getSettingsPayload(result) {
  return (
    result?.data?.settings ??
    result?.data?.user ??
    result?.data ??
    result?.settings ??
    result ??
    {}
  );
}

function getProfilePictureUrl(data) {
  return (
    data?.profilePicture ||
    data?.profileImage ||
    data?.avatarUrl ||
    data?.profilePictureUrl ||
    data?.user?.profilePicture ||
    data?.user?.profileImage ||
    data?.user?.avatarUrl ||
    data?.user?.profilePictureUrl ||
    null
  );
}

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "TU"
  );
}

function formatJoinedDate(dateValue) {
  if (!dateValue) return "Join date unavailable";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Join date unavailable";
  }

  return `Joined on ${date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;
}

function setSelectValue(select, value) {
  if (!select || value === undefined || value === null || value === "") {
    return;
  }

  const stringValue = String(value).trim();

  const matchingOption = [...select.options].find(
    (option) =>
      option.value.trim() === stringValue ||
      option.textContent.trim() === stringValue,
  );

  if (matchingOption) {
    select.value = matchingOption.value;
    return;
  }

  const newOption = new Option(stringValue, stringValue);
  select.add(newOption);
  select.value = stringValue;
}

function showSettingsToast(message, type = "success") {
  if (!toast || !toastTitle || !toastMessage || !toastIcon) {
    return;
  }

  clearTimeout(toastTimeout);

  const isError = type === "error";

  toastTitle.textContent = isError ? "Something went wrong" : "Success";
  toastMessage.textContent = message;

  toastIcon.setAttribute("name", isError ? "alert-circle" : "checkmark-circle");

  toastIcon.classList.toggle("text-red-600", isError);
  toastIcon.classList.toggle("text-green-600", !isError);

  toast.classList.remove("hidden");
  toast.classList.add("flex");

  toastTimeout = setTimeout(() => {
    hideSettingsToast();
  }, 4000);
}

function hideSettingsToast() {
  clearTimeout(toastTimeout);
  toast?.classList.add("hidden");
  toast?.classList.remove("flex");
}

closeToastButton?.addEventListener("click", hideSettingsToast);

function showProfileImage(imageUrl) {
  if (!profileAvatar || !imageUrl) return;

  let image = profileAvatar.querySelector("img");

  if (!image) {
    image = document.createElement("img");
    image.alt = "Profile picture";
    image.className = "absolute inset-0 z-[1] h-full w-full object-cover";

    profileAvatar.prepend(image);
  }

  image.onerror = () => {
    console.error("Unable to display profile image:", imageUrl);
  };

  image.src = imageUrl;

  profileInitial?.classList.add("hidden");
}

function resetProfileImage() {
  const image = profileAvatar?.querySelector("img");

  if (image) {
    image.remove();
  }

  profileInitial?.classList.remove("hidden");
}

function updateProfileDisplay(data = {}) {
  const name =
    data.fullName ||
    data.name ||
    data.user?.fullName ||
    data.user?.name ||
    "Student";

  const email =
    data.email ||
    data.emailOrPhone ||
    data.user?.email ||
    data.user?.emailOrPhone ||
    "";

  fullNameInput.value = name;
  emailInput.value = email;

  const nameHeading = document.querySelector("#profile-details h3");

  if (nameHeading) {
    nameHeading.textContent = name;
  }

  const emailDisplay = document.getElementById("profile-email-display");

  if (emailDisplay) {
    emailDisplay.textContent = email;
  }

  const joinedDate = document.getElementById("profile-joined-date");

  if (joinedDate) {
    joinedDate.textContent = formatJoinedDate(
      data.createdAt ||
        data.joinedAt ||
        data.created_at ||
        data.user?.createdAt ||
        data.user?.created_at,
    );
  }

  setSelectValue(timezoneInput, data.timezone ?? data.timeZone);

  setSelectValue(locationInput, data.location);

  const initials = getInitials(name);

  if (profileInitial) {
    profileInitial.textContent = initials;
  }

  const headerInitials = document.getElementById("profile-initials");

  if (headerInitials) {
    headerInitials.textContent = initials;
  }

  const headerName = document.querySelector("#profile-name p");

  if (headerName) {
    headerName.textContent = name;
  }

  const imageUrl = getProfilePictureUrl(data);

  if (imageUrl) {
    showProfileImage(imageUrl);
  }
}

async function loadSettings() {
  try {
    const result = await settingsApiRequest(SETTINGS_ENDPOINT);

    settingsData = getSettingsPayload(result);

    updateProfileDisplay(settingsData);

    const imageUrl = getProfilePictureUrl(settingsData);

    if (imageUrl) {
      showProfileImage(imageUrl);
    } else {
      console.warn("No profile picture URL found in the settings response.");
    }
  } catch (error) {
    console.error("Unable to load settings:", error);

    showSettingsToast(`Unable to load settings: ${error.message}`, "error");
  }
}

function setEditing(enabled) {
  isEditing = enabled;

  fullNameInput.disabled = true;
  emailInput.disabled = true;

  timezoneInput.disabled = !enabled;
  locationInput.disabled = !enabled;

  document.querySelectorAll(".profile-input").forEach((input) => {
    input.classList.toggle("bg-gray-50", enabled);
  });

  if (editProfileButton) {
    editProfileButton.textContent = enabled ? "Cancel Edit" : "Edit Profile";
  }

  const saveButton = settingsForm?.querySelector('button[type="submit"]');

  saveButton?.classList.toggle("hidden", !enabled);
}

editProfileButton?.addEventListener("click", () => {
  if (isEditing) {
    updateProfileDisplay(settingsData);
    setEditing(false);
  } else {
    setEditing(true);
  }
});

settingsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isEditing) return;

  const saveButton = settingsForm.querySelector('button[type="submit"]');

  const payload = {
    timezone: timezoneInput.value,
    location: locationInput.value,
  };

  try {
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = "Saving...";
    }

    const result = await settingsApiRequest(SETTINGS_ENDPOINT, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    const returnedData = getSettingsPayload(result);

    settingsData = {
      ...settingsData,
      ...returnedData,
      ...payload,
    };

    updateProfileDisplay(settingsData);
    setEditing(false);

    showSettingsToast("Your settings have been saved.");
  } catch (error) {
    console.error("Unable to save settings:", error);

    showSettingsToast(`Unable to save settings: ${error.message}`, "error");
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = "Save changes";
    }
  }
});

function openPhotoOptions() {
  if (!photoOptionsModal) return;

  photoOptionsModal.classList.remove("hidden");
  photoOptionsModal.classList.add("flex");
  photoOptionsModal.setAttribute("aria-hidden", "false");

  changePhotoOption?.focus();
}

function closePhotoOptions() {
  if (!photoOptionsModal) return;

  if (photoOptionsModal.contains(document.activeElement)) {
    document.activeElement.blur();
  }

  photoOptionsModal.classList.add("hidden");
  photoOptionsModal.classList.remove("flex");
  photoOptionsModal.setAttribute("aria-hidden", "true");

  profileAvatar?.focus();
}
profileAvatar?.addEventListener("click", openPhotoOptions);

profileAvatar?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openPhotoOptions();
  }
});

uploadPhotoButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  openPhotoOptions();
});

cancelPhotoOptions?.addEventListener("click", closePhotoOptions);
cancelPhotoButton?.addEventListener("click", closePhotoOptions);

photoOptionsModal?.addEventListener("click", (event) => {
  if (event.target === photoOptionsModal) {
    closePhotoOptions();
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !photoOptionsModal?.classList.contains("hidden")
  ) {
    closePhotoOptions();
  }
});

changePhotoOption?.addEventListener("click", () => {
  closePhotoOptions();

  photoInput?.click();
});

photoInput?.addEventListener("change", async () => {
  const file = photoInput.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showSettingsToast("Please select a valid image file.", "error");
    photoInput.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showSettingsToast("Please choose an image smaller than 5 MB.", "error");

    photoInput.value = "";
    return;
  }

  let previewUrl = null;

  try {
    if (uploadPhotoButton) {
      uploadPhotoButton.disabled = true;
    }

    console.log("Uploading profile picture:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    previewUrl = URL.createObjectURL(file);
    showProfileImage(previewUrl);

    const formData = new FormData();

    formData.append("profilePicture", file);

    const result = await settingsApiRequest(PROFILE_PICTURE_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    const returnedData = getSettingsPayload(result);
    const returnedImageUrl = getProfilePictureUrl(returnedData);

    if (returnedImageUrl) {
      showProfileImage(returnedImageUrl);

      settingsData = {
        ...settingsData,
        ...returnedData,
      };
    }

    // Fetch settings again to confirm the saved image URL.
    const settingsResult = await settingsApiRequest(SETTINGS_ENDPOINT);
    const refreshedData = getSettingsPayload(settingsResult);
    const savedImageUrl = getProfilePictureUrl(refreshedData);

    settingsData = {
      ...settingsData,
      ...refreshedData,
    };

    if (savedImageUrl) {
      showProfileImage(savedImageUrl);

      showSettingsToast("Your profile picture has been uploaded successfully.");
    } else {
      console.warn(
        "The upload returned successfully, but GET /api/settings did not return a saved picture URL.",
      );

      showSettingsToast(
        "Upload request completed, but the saved picture URL was not found in the settings response.",
        "error",
      );
    }
  } catch (error) {
    console.error("Profile picture upload failed:", error);

    await loadSettings();

    showSettingsToast(
      `Unable to upload profile picture: ${error.message}`,
      "error",
    );
  } finally {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (uploadPhotoButton) {
      uploadPhotoButton.disabled = false;
    }

    if (photoInput) {
      photoInput.value = "";
    }
  }
});

removePhotoOption?.addEventListener("click", async () => {
closePhotoOptions();

try {
removePhotoOption.disabled = true;
removePhotoOption.textContent = "Removing...";

// Send the DELETE request to the backend.
await settingsApiRequest(PROFILE_PICTURE_ENDPOINT, {
  method: "DELETE",
});

// Clear the image from the screen immediately.
resetProfileImage();

// Update local settings data.
settingsData = {
  ...settingsData,
  profilePicture: null,
  profileImage: null,
  avatarUrl: null,
  profilePictureUrl: null,
};

// Update the header avatar too.
const headerAvatar = document.getElementById("profile-initials");

if (headerAvatar) {
  headerAvatar.textContent = getInitials(
    settingsData.fullName || settingsData.name || "Student"
  );

  const headerImage = headerAvatar.querySelector("img");
  headerImage?.remove();
}

// Confirm that the backend has saved the removal.
const result = await settingsApiRequest(SETTINGS_ENDPOINT);
settingsData = getSettingsPayload(result);

const savedImageUrl = getProfilePictureUrl(settingsData);

if (savedImageUrl) {
  showProfileImage(savedImageUrl);

  showSettingsToast(
    "The server still returns a profile picture. Please check the backend.",
    "error"
  );
} else {
  resetProfileImage();

  if (headerAvatar) {
    headerAvatar.textContent = getInitials(
      settingsData.fullName || settingsData.name || "Student"
    );
  }

  showSettingsToast("Your profile picture has been removed.");
}

} catch (error) {
console.error("Profile picture removal failed:", error);

// Reload settings to restore the actual saved state.
await loadSettings();

showSettingsToast(
  `Unable to remove profile picture: ${error.message}`,
  "error"
);

} finally {
removePhotoOption.disabled = false;
removePhotoOption.textContent = "Remove photo";
}
});

const accountSection = document.getElementById("account");

const personalInfoSection = document
  .querySelector("#settings-form")
  ?.closest("section");

const privacyPanel = document.getElementById("privacy-panel");

document.querySelectorAll(".setting-tab").forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;

    if (tab === "notification") {
      window.location.href = "./notification.html";
      return;
    }

    if (tab === "privacy") {
      accountSection?.classList.add("hidden");
      personalInfoSection?.classList.add("hidden");
      privacyPanel?.classList.remove("hidden");
      return;
    }

    if (tab === "account") {
      privacyPanel?.classList.add("hidden");
      accountSection?.classList.remove("hidden");
      personalInfoSection?.classList.remove("hidden");

      accountSection?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

document.getElementById("back-to-account")?.addEventListener("click", () => {
  document.querySelector('[data-tab="account"]')?.click();
});

function openLogoutModal() {
  if (!logoutModal) return;

  logoutModal.classList.remove("hidden");
  logoutModal.classList.add("flex");

  cancelLogoutButton?.focus();
}

function closeLogoutModal() {
  logoutModal?.classList.add("hidden");
  logoutModal?.classList.remove("flex");
}

logoutButton?.addEventListener("click", openLogoutModal);
cancelLogoutButton?.addEventListener("click", closeLogoutModal);

logoutModal?.addEventListener("click", (event) => {
  if (event.target === logoutModal) {
    closeLogoutModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !logoutModal?.classList.contains("hidden")) {
    closeLogoutModal();
  }
});

confirmLogoutButton?.addEventListener("click", () => {
  confirmLogoutButton.disabled = true;
  confirmLogoutButton.textContent = "Logging out...";

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("student");
  localStorage.removeItem("userData");

  window.location.replace(LANDING_PAGE);
});

setEditing(false);
loadSettings();

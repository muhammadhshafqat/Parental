document.addEventListener("DOMContentLoaded", () => {
  // Generic form handler: works for signup forms and childForm
  const form = document.querySelector("form#childForm") || document.querySelector("form");
  if (!form) return;

  // Helper to find inputs by id if present
  const nameField = form.querySelector("#name");
  const dobField = form.querySelector("#dob"); // date input replaces age
  const ageField = form.querySelector("#age"); // optional legacy field
  const interestsField = form.querySelector("#interests");
  const passwordField = form.querySelector("#password");
  const cpasswordField = form.querySelector("#cpassword");
  const emailField = form.querySelector("#email");

  // Build list of inputs to validate dynamically
  const inputs = Array.from(form.querySelectorAll("input")).filter(i => i.type !== "hidden");

  // Ensure each input has an error span (idempotent)
  inputs.forEach(field => {
    let error = field.parentNode.querySelector(".error-message");
    if (!error) {
      error = document.createElement("small");
      error.className = "error-message";
      error.style.display = "none";
      field.parentNode.appendChild(error);
    }

    // Mark touched on blur and validate
    field.addEventListener("blur", () => {
      field.classList.add("touched");
      validateField(field);
    });

    // Live validation for confirm password and email
    if (field.id === "cpassword" || field.id === "email") {
      field.addEventListener("input", () => validateField(field));
    }
  });

  // Set max for dob to today to prevent future dates
  if (dobField) {
    const today = new Date().toISOString().split("T")[0];
    dobField.setAttribute("max", today);
  }

  function showError(field, message) {
    if (!field || !field.parentNode) return;
    const error = field.parentNode.querySelector(".error-message");
    if (error) {
      error.textContent = message;
      error.style.display = "block";
    }
    field.classList.add("touched");
    field.setAttribute("aria-invalid", "true");
  }

  function clearError(field) {
    if (!field || !field.parentNode) return;
    const error = field.parentNode.querySelector(".error-message");
    if (error) {
      error.textContent = "";
      error.style.display = "none";
    }
    field.removeAttribute("aria-invalid");
  }

  function validateField(field) {
    if (!field) return;
    const id = field.id;
    const value = (field.value || "").trim();

    // Name validation
    if (id === "name") {
      if (value.length < 3 || value.length > 50) {
        showError(field, "Name must be between 3 and 50 characters.");
        return false;
      } else {
        clearError(field);
        return true;
      }
    }

    // DOB validation (replaces age)
    if (id === "dob") {
      if (!value) {
        showError(field, "Please select the date of birth.");
        return false;
      }
      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) {
        showError(field, "Invalid date format.");
        return false;
      }
      const today = new Date();
      if (parsed > today) {
        showError(field, "Date of birth cannot be in the future.");
        return false;
      }
      // optional age range check if you want to enforce min/max ages
      // const age = today.getFullYear() - parsed.getFullYear() - (today < new Date(today.getFullYear(), parsed.getMonth(), parsed.getDate()) ? 1 : 0);
      // if (age < 3 || age > 20) { showError(field, "Age must be between 3 and 20."); return false; }
      clearError(field);
      return true;
    }

    // Legacy age field validation (if still present)
    if (id === "age") {
      const age = parseInt(value, 10);
      if (isNaN(age) || age < 3 || age > 19) {
        showError(field, "Age must be between 3 and 19.");
        return false;
      } else {
        clearError(field);
        return true;
      }
    }

    // Email validation
    if (id === "email") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        showError(field, "Enter a valid email address.");
        return false;
      } else {
        clearError(field);
        return true;
      }
    }

    // Password validation
    if (id === "password") {
      if (value.length < 6) {
        showError(field, "Password must be at least 6 characters.");
        return false;
      } else {
        clearError(field);
        return true;
      }
    }

    // Confirm password validation
    if (id === "cpassword") {
      const pw = passwordField ? passwordField.value : "";
      if (value !== pw) {
        showError(field, "Passwords do not match.");
        return false;
      } else {
        clearError(field);
        return true;
      }
    }

    // Interests validation
    if (id === "interests") {
      if (/[,.]$/.test(value)) {
        showError(field, "Interests must not end with a comma or full stop.");
        return false;
      } else {
        clearError(field);
        return true;
      }
    }

    // Default: clear error
    clearError(field);
    return true;
  }

  // On submit validate all relevant fields
  form.addEventListener("submit", (e) => {
    let valid = true;

    // Prefer dob over age; if dob missing but age present, validate age
    const toValidate = [];
    if (nameField) toValidate.push(nameField);
    if (dobField) toValidate.push(dobField);
    else if (ageField) toValidate.push(ageField);
    if (interestsField) toValidate.push(interestsField);
    if (emailField) toValidate.push(emailField);
    if (passwordField) toValidate.push(passwordField);
    if (cpasswordField) toValidate.push(cpasswordField);

    toValidate.forEach(field => {
      const ok = validateField(field);
      if (!ok) valid = false;
    });

    if (!valid) {
      e.preventDefault();
      // focus first invalid field for accessibility
      const firstInvalid = form.querySelector("[aria-invalid='true']");
      if (firstInvalid) firstInvalid.focus();
    }
  });
});

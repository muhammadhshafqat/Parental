document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const inputs = form.querySelectorAll("input");

  // Add error spans dynamically
  inputs.forEach(field => {
    const error = document.createElement("small");
    error.className = "error-message";
    field.parentNode.appendChild(error);

    // Mark as touched when user leaves the field
    field.addEventListener("blur", () => {
      field.classList.add("touched");
      validateField(field);
    });

    // Live validation for confirm password
    if (field.id === "cpassword") {
      field.addEventListener("input", () => validateField(field));
    }
  });

  function showError(field, message) {
    const error = field.parentNode.querySelector(".error-message");
    error.textContent = message;
    error.style.display = "block";
  }

  function clearError(field) {
    const error = field.parentNode.querySelector(".error-message");
    error.textContent = "";
    error.style.display = "none";
  }

  function validateField(field) {
    const value = field.value.trim();
    switch (field.id) {
      case "name":
        if (value.length < 3) showError(field, "Name must be at least 3 characters.");
        else clearError(field);
        break;
      case "dob":
        if (!value) showError(field, "Please select your date of birth.");
        else clearError(field);
        break;
      case "email":
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) showError(field, "Enter a valid email address.");
        else clearError(field);
        break;
      case "password":
        if (value.length < 6) showError(field, "Password must be at least 6 characters.");
        else clearError(field);
        break;
      case "cpassword":
        const passwordValue = document.getElementById("password").value;
        if (value !== passwordValue) showError(field, "Passwords do not match.");
        else clearError(field);
        break;
    }
  }

  form.addEventListener("submit", e => {
    let valid = true;
    inputs.forEach(field => {
      field.classList.add("touched");
      validateField(field);
      const error = field.parentNode.querySelector(".error-message");
      if (error.textContent) valid = false;
    });
    if (!valid) e.preventDefault();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("childForm");
  const nameField = document.getElementById("name");
  const ageField = document.getElementById("age");
  const interestsField = document.getElementById("interests");
  const inputs = [nameField, ageField, interestsField];

  function showError(field, message) {
    const error = field.parentNode.querySelector(".error-message");
    error.textContent = message;
    error.style.display = "block";
    field.classList.add("touched");
  }

  function clearError(field) {
    const error = field.parentNode.querySelector(".error-message");
    error.textContent = "";
    error.style.display = "none";
    field.classList.add("touched");
  }

  function validateField(field) {
    const value = field.value.trim();
    if (field.id === "name") {
      if (value.length < 3 || value.length > 20) {
        showError(field, "Name must be between 3 and 20 characters.");
      } else {
        clearError(field);
      }
    }
    if (field.id === "age") {
      const age = parseInt(value, 10);
      if (isNaN(age) || age < 3 || age > 20) {
        showError(field, "Age must be between 3 and 20.");
      } else {
        clearError(field);
      }
    }
    if (field.id === "interests") {
      if (/[,.]$/.test(value)) {
        showError(field, "Interests must not end with a comma or full stop.");
      } else {
        clearError(field);
      }
    }
  }

  // Add blur listeners
  inputs.forEach(field => {
    field.addEventListener("blur", () => validateField(field));
  });

  form.addEventListener("submit", e => {
    let valid = true;
    inputs.forEach(field => {
      validateField(field);
      const error = field.parentNode.querySelector(".error-message");
      if (error.textContent) valid = false;
    });
    if (!valid) e.preventDefault();
  });
});

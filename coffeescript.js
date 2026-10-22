"use strict";

/* ==========================================================
   BrewBox registration page
   Flow on submit:
     1. Read the form into a User object
     2. Validate (needs the REAL password to look for ! or ?)
     3. Replace the password with asterisks
     4. Write the result to the DOM
   ========================================================== */

/* ---------- The User object ---------- */
class User {
  constructor(firstName, lastName, email, password, dob) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.dob = dob;
  }
}

/* ---------- Constants & DOM references ---------- */
const FIELD_IDS = ["firstName", "lastName", "email", "password", "dob"];

// Labels and keys for the information we show back to the user
const DISPLAY_FIELDS = [
  ["First Name", "firstName"],
  ["Last Name", "lastName"],
  ["Email Address", "email"],
  ["Password", "password"],
  ["Date of Birth", "dob"],
];

const SPECIAL_CHARACTERS = /[!?]/;              // our two allowed special characters
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // simple "looks like an email" check

const form = document.getElementById("registrationForm");
const resultSection = document.getElementById("result");
const dobInput = document.getElementById("dob");

/* ---------- Step 1: read the form into a User object ---------- */
function readUser() {
  return new User(
    document.getElementById("firstName").value.trim(),
    document.getElementById("lastName").value.trim(),
    document.getElementById("email").value.trim(),
    document.getElementById("password").value, // not trimmed: spaces count as characters
    document.getElementById("dob").value       // "YYYY-MM-DD" or ""
  );
}

/* ---------- Step 2: validation ----------
   Returns a list of { field, message }. An empty list means the form is valid. */
function validate(user) {
  const errors = [];

  // a. All fields must be present
  if (!user.firstName) {
    errors.push({ field: "firstName", message: "First name is required." });
  }

  if (!user.lastName) {
    errors.push({ field: "lastName", message: "Last name is required." });
  }

  if (!user.email) {
    errors.push({ field: "email", message: "Email address is required." });
  } else if (!EMAIL_PATTERN.test(user.email)) {
    // Extra check beyond the assignment: make sure the email looks like an email
    errors.push({ field: "email", message: "Please enter a valid email address." });
  }

  if (!user.password) {
    errors.push({ field: "password", message: "Password is required." });
  } else if (!SPECIAL_CHARACTERS.test(user.password)) {
    // b. Password must contain a special character (! or ?)
    errors.push({ field: "password", message: "Password must contain a special character (! or ?)." });
  }

  if (!user.dob) {
    errors.push({ field: "dob", message: "Date of birth is required." });
  } else if (isFutureDate(user.dob)) {
    // Extra check beyond the assignment: nobody is born in the future
    errors.push({ field: "dob", message: "Date of birth cannot be in the future." });
  }

  return errors;
}

/* ---------- Step 3: hide the password ---------- */
function maskPassword(password) {
  return "*".repeat(password.length); // "123" -> "***"
}

/* ---------- Date helpers ---------- */
function parseDate(dateString) {
  // Build the date from its parts so time zones can't shift it by a day
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isFutureDate(dateString) {
  return parseDate(dateString) > new Date();
}

function formatDate(dateString) {
  const date = parseDate(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function todayAsInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/* ---------- Inline field feedback (Bootstrap's is-invalid) ---------- */
function clearFieldErrors() {
  FIELD_IDS.forEach((id) => document.getElementById(id).classList.remove("is-invalid"));
}

function showFieldErrors(errors) {
  errors.forEach(({ field, message }) => {
    const input = document.getElementById(field);
    input.classList.add("is-invalid");
    input.parentElement.querySelector(".invalid-feedback").textContent = message;
  });
}

/* ---------- Step 4: write the result to the DOM ----------
   Values are added with textContent (never innerHTML) so anything a user
   types is displayed as plain text and can't inject HTML. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderResult(user, errors) {
  const success = errors.length === 0;

  const card = el("div", `card shadow-sm result-card ${success ? "is-success" : "is-failure"}`);
  const body = el("div", "card-body p-4 p-md-5");
  card.appendChild(body);

  // Heading + message
  if (success) {
    body.appendChild(el("h2", "h3 fw-bold text-success", "\u2705 Registration Successful!"));
    body.appendChild(el("p", "lead", `Welcome to BrewBox, ${user.firstName}! Here is the information we have on file:`));
  } else {
    body.appendChild(el("h2", "h3 fw-bold text-danger", "\u274C Registration Failed"));
    body.appendChild(el("p", "mb-2", "Please fix the following and try again:"));

    const list = el("ul", "text-danger");
    errors.forEach(({ message }) => list.appendChild(el("li", "", message)));
    body.appendChild(list);

    body.appendChild(el("p", "fw-semibold mt-4 mb-2", "What you entered:"));
  }

  // The information from the User object
  const details = el("dl", "row mb-0");
  DISPLAY_FIELDS.forEach(([label, key]) => {
    const value = user[key];
    const term = el("dt", "col-sm-4", label);
    const description = el("dd", "col-sm-8");

    if (!value) {
      description.className += " text-muted fst-italic";
      description.textContent = "Not provided";
    } else if (key === "dob") {
      description.textContent = formatDate(value);
    } else {
      if (key === "password") description.className += " password-masked";
      description.textContent = value;
    }

    details.appendChild(term);
    details.appendChild(description);
  });
  body.appendChild(details);

  resultSection.replaceChildren(card);
  resultSection.classList.remove("d-none");
}

/* ---------- Wire it all together ---------- */
form.addEventListener("submit", (event) => {
  event.preventDefault(); // stay on the page
  clearFieldErrors();

  const user = readUser();                         // 1. read the form into a User
  const errors = validate(user);                   // 2. validate with the real password
  user.password = maskPassword(user.password);     // 3. replace the password with stars

  showFieldErrors(errors);
  renderResult(user, errors);                      // 4. show success or failure + user info

  if (errors.length === 0) form.reset();           // clear the form after a good registration

  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  resultSection.focus({ preventScroll: true });
});

// Remove the red error state as soon as the user starts fixing a field
FIELD_IDS.forEach((id) => {
  document.getElementById(id).addEventListener("input", (event) => {
    event.target.classList.remove("is-invalid");
  });
});

// Small touches
dobInput.max = todayAsInputValue(); // date picker won't offer future dates
document.getElementById("year").textContent = new Date().getFullYear();

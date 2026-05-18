// ==========================================================================
// CONFIGURATION
// ==========================================================================
// Replace this with your Google Apps Script Web App Deployment URL
// After deploying the Google Apps Script, copy the URL here.
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwyFEwnGLuNYsZQjFVNvUa6oAaCJA_LbeI29F0p6Cqy2XvHECJHDFZp6gps3jxjG3c6NA/exec';

// ==========================================================================
// INITIALIZATION & DOME ELEMENTS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  detectBoothId();
  setupValidationListeners();
});

const formCard = document.getElementById('form-card');
const successCard = document.getElementById('success-card');
const regForm = document.getElementById('registration-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnIcon = document.getElementById('btn-icon');
const btnSpinner = document.getElementById('btn-spinner');

// Terms Modal Elements
const termsModal = document.getElementById('terms-modal');
const termsCheckbox = document.getElementById('terms');

// ==========================================================================
// 1. BOOTH ID DETECTION FROM URL
// ==========================================================================
function detectBoothId() {
  const urlParams = new URLSearchParams(window.location.search);
  // Support both booth_id and booth in URL query
  let boothId = urlParams.get('booth_id') || urlParams.get('booth') || '';

  if (boothId) {
    // Format booth name nicely for display (e.g. "booth_1" -> "Booth 1")
    let formattedName = boothId
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    // Save in hidden input
    document.getElementById('booth_id').value = boothId;

    // Update badge in banner
    const boothTag = document.getElementById('booth-tag');
    const boothNameSpan = document.getElementById('booth-name');
    if (boothTag && boothNameSpan) {
      boothNameSpan.innerText = `${formattedName} Registered`;
      boothTag.style.display = 'flex';
    }
    console.log(`Detected Marathon Registration Point: ${formattedName}`);
  }
}

// ==========================================================================
// 2. GENDER SELECTION HANDLER
// ==========================================================================
function selectGender(value) {
  const genderInput = document.getElementById('gender_input');
  genderInput.value = value;

  // Toggle active class on cards
  const cards = document.querySelectorAll('.gender-card');
  cards.forEach(card => {
    if (card.getAttribute('data-value') === value) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  // Hide gender error if shown
  const genderError = document.getElementById('error-gender');
  if (genderError) {
    genderError.style.display = 'none';
  }
}

// ==========================================================================
// 3. TERMS & CONDITIONS MODAL
// ==========================================================================
function openModal(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  termsModal.classList.add('open');
  document.body.style.overflow = 'hidden'; // Lock background scroll
}

function closeModal() {
  termsModal.classList.remove('open');
  document.body.style.overflow = 'auto'; // Restore scroll
}

function acceptTerms() {
  termsCheckbox.checked = true;
  const termsError = document.getElementById('error-terms');
  if (termsError) {
    termsError.style.display = 'none';
  }
  closeModal();
}

// Close modal if clicking outside of it
window.addEventListener('click', (e) => {
  if (e.target === termsModal) {
    closeModal();
  }
});

// ==========================================================================
// 4. CLIENT SIDE VALIDATION
// ==========================================================================
function setupValidationListeners() {
  const inputs = regForm.querySelectorAll('.form-input');

  inputs.forEach(input => {
    input.addEventListener('blur', () => {
      validateField(input);
    });

    input.addEventListener('input', () => {
      // Clear error as user types
      if (input.classList.contains('invalid')) {
        validateField(input);
      }
    });
  });

  termsCheckbox.addEventListener('change', () => {
    const errorTerms = document.getElementById('error-terms');
    if (termsCheckbox.checked) {
      errorTerms.style.display = 'none';
    } else {
      errorTerms.style.display = 'block';
    }
  });
}

function validateField(input) {
  const id = input.id;
  const val = input.value.trim();
  let isValid = true;
  let errorElement = document.getElementById(`error-${input.name}`);

  if (!errorElement) return true;

  if (id === 'full_name') {
    isValid = val.length >= 2;
  } else if (id === 'age') {
    const ageVal = parseInt(val, 10);
    isValid = !isNaN(ageVal) && ageVal >= 5 && ageVal <= 100;
  } else if (id === 'contact_number' || id === 'emergency_contact') {
    // Basic phone validation (allows optional +, spaces, dashes, parentheses and expects 10 to 15 digits)
    const phoneRegex = /^\+?[0-9\s\-()]{10,15}$/;
    isValid = phoneRegex.test(val);
  }

  if (isValid) {
    input.classList.remove('invalid');
    errorElement.style.display = 'none';
  } else {
    input.classList.add('invalid');
    errorElement.style.display = 'block';
  }

  return isValid;
}

function validateForm() {
  let isFormValid = true;

  // Validate standard inputs
  const inputs = regForm.querySelectorAll('.form-input');
  inputs.forEach(input => {
    if (!validateField(input)) {
      isFormValid = false;
    }
  });

  // Validate Gender
  const genderInput = document.getElementById('gender_input');
  const errorGender = document.getElementById('error-gender');
  if (!genderInput.value) {
    errorGender.style.display = 'block';
    isFormValid = false;
  } else {
    errorGender.style.display = 'none';
  }

  // Validate Terms
  const errorTerms = document.getElementById('error-terms');
  if (!termsCheckbox.checked) {
    errorTerms.style.display = 'block';
    isFormValid = false;
  } else {
    errorTerms.style.display = 'none';
  }

  // Accessibility focus on first error
  if (!isFormValid) {
    const firstError = regForm.querySelector('.invalid, .error-msg[style*="display: block"]');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (firstError.classList.contains('form-input')) {
        firstError.focus();
      }
    }
  }

  return isFormValid;
}

// ==========================================================================
// 5. FORM SUBMISSION
// ==========================================================================
regForm.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  // Update UI to loading state
  setLoadingState(true);

  // Capture Form Data
  const formData = {
    fullName: document.getElementById('full_name').value.trim(),
    age: document.getElementById('age').value.trim(),
    gender: document.getElementById('gender_input').value,
    contactNumber: document.getElementById('contact_number').value.trim(),
    emergencyContact: document.getElementById('emergency_contact').value.trim(),
    boothId: document.getElementById('booth_id').value || 'Direct Web Visit',
    agreedToTerms: termsCheckbox.checked
  };

  // If Script URL is not set yet, trigger developer sandbox preview
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
    console.warn("GOOGLE_SCRIPT_URL is not set. Simulating database submission for developer preview...");
    setTimeout(() => {
      setLoadingState(false);
      showSuccess(formData);
    }, 1500);
    return;
  }

  // Build URL parameters for URL-encoded posting (prevents CORS preflight pre-requests)
  const postParams = new URLSearchParams();
  for (const key in formData) {
    postParams.append(key, formData[key]);
  }

  // Send data to Google Sheet Web App
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors', // Bypasses browser CORS redirects with standard Apps Script Web Apps
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: postParams
  })
    .then(() => {
      // With 'no-cors', the response status is opaque (0), but if it gets here, the request was successfully sent!
      setLoadingState(false);
      showSuccess(formData);
    })
    .catch(error => {
      console.error('Submission error:', error);
      setLoadingState(false);
      alert('We encountered an issue submitting your registration. Please check your internet connection or try again later.');
    });
});

function setLoadingState(isLoading) {
  if (isLoading) {
    submitBtn.disabled = true;
    btnText.innerText = 'Registering Runner...';
    btnIcon.style.display = 'none';
    btnSpinner.style.display = 'block';
  } else {
    submitBtn.disabled = false;
    btnText.innerText = 'Confirm Registration';
    btnIcon.style.display = 'block';
    btnSpinner.style.display = 'none';
  }
}

// ==========================================================================
// 6. SUCCESS & RESET STATES
// ==========================================================================
function showSuccess(data) {
  // Populate details card
  document.getElementById('summary-name').innerText = data.fullName;
  document.getElementById('summary-age-gender').innerText = `${data.age} yrs, ${data.gender}`;
  document.getElementById('summary-contact').innerText = data.contactNumber;

  const boothRow = document.getElementById('summary-booth-row');
  const boothBadge = document.getElementById('summary-booth');

  if (data.boothId && data.boothId !== 'Direct Web Visit') {
    let formattedBooth = data.boothId
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    boothBadge.innerText = formattedBooth;
    boothRow.style.display = 'flex';
  } else {
    boothRow.style.display = 'none';
  }

  // Smoothly slide out form and slide in success card
  formCard.style.display = 'none';
  successCard.style.display = 'block';

  // Scroll to top of window
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  // Reset fields
  regForm.reset();

  // Reset gender selection
  document.getElementById('gender_input').value = '';
  document.querySelectorAll('.gender-card').forEach(card => card.classList.remove('active'));

  // Reset invalid styling
  regForm.querySelectorAll('.form-input').forEach(input => input.classList.remove('invalid'));
  regForm.querySelectorAll('.error-msg').forEach(msg => msg.style.display = 'none');

  // Re-detect Booth ID from URL in case they scan again or we want to preserve it
  detectBoothId();

  // Toggle displays
  successCard.style.display = 'none';
  formCard.style.display = 'block';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

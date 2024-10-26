// Displays a user-friendly error message at the top of the page
function displayError(message) {
    const errorContainer = document.getElementById('error-container');
    // Extract the main error message, ignoring any prefixes
    const cleanMessage = message.includes(':') ? message.split(':').pop().trim() : message;
    errorContainer.textContent = cleanMessage;
    errorContainer.style.display = 'block';
    
    // Automatically hide the error after 5 seconds
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

// Clears any displayed error messages
function clearError() {
    const errorContainer = document.getElementById('error-container');
    errorContainer.style.display = 'none';
}

// Sanitizes user input to prevent XSS attacks
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Displays an error message (alias for displayError)
function showError(message) {
    displayError(message);
}

// Toggles the loading indicator on or off
function toggleLoading(isLoading) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = isLoading ? 'block' : 'none';
    }
}

// Logs an error message to the console with additional details
function logError(message, error) {
    console.error(message, error);
    if (error.response) {
        console.error('Response:', error.response);
    }
}

// Validates an email address format
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Checks if a password meets minimum length requirements
function isValidPassword(password) {
    return password.length >= 6; 
}

// Validates form inputs based on their types
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input');
    let isValid = true;

    inputs.forEach(input => {
        if (input.type === 'email' && !isValidEmail(input.value)) {
            displayError('Neteisingas el. pašto formatas', `${formId}-error`);
            isValid = false;
        }
        if (input.type === 'password' && !isValidPassword(input.value)) {
            displayError('Slaptažodis turi būti bent 6 simbolių ilgio', `${formId}-error`);
            isValid = false;
        }
    });

    return isValid;
}

// Debounces a function to limit how often it's called
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Formats a date string into a more readable format
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Truncates a string to a specified length, adding ellipsis if needed
function truncateString(str, maxLength) {
    return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;
}

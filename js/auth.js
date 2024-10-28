// Validate user input for registration and login
function validateInput(input, type) {
    if (type === 'username' && input.length < 3) {
        return 'Username must be at least 3 characters long';
    }
    if (type === 'password' && input.length < 6) {
        return 'Password must be at least 6 characters long';
    }
    if (type === 'email' && !input.includes('@')) {
        return 'Please enter a valid email address';
    }
    return null;
}

// Handle user login
async function handleLogin(e) {
    e.preventDefault();
    clearError();

    // Validate form inputs before proceeding with login
    if (!validateForm('login-form')) {
        return;
    }

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const usernameError = validateInput(username, 'username');
    const passwordError = validateInput(password, 'password');

    if (usernameError || passwordError) {
        displayError(usernameError || passwordError);
        return;
    }

    toggleLoading(true);
    try {
        // Fetch API call for login
        const response = await fetch(`${API_URL}/Auth?username=${username}&password=${password}`, {
            method: 'GET',
            headers: { 
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            // Store user data in localStorage for persistent login state
            const user = await response.json();
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            showTodoSection();
            todoList.innerHTML = '';
            fetchTodos();
        } else {
            // Centralized error handling for API errors
            await handleApiError(response);
        }
    } catch (error) {
        console.error('Login error:', error);
        displayError(`Login failed: ${error.message}`);
    } finally {
        // Ensure loading state is always toggled off, even if an error occurs
        toggleLoading(false);
    }
}

// Handle user registration
async function handleRegister(e) {
    e.preventDefault();
    clearError();

    if (!validateForm('register-form')) {
        return;
    }

    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const email = document.getElementById('register-email').value.trim();

    // Check if passwords match
    if (password !== confirmPassword) {
        displayError('Passwords do not match');
        return;
    }

    const usernameError = validateInput(username, 'username');
    const passwordError = validateInput(password, 'password');
    const emailError = validateInput(email, 'email');

    if (usernameError || passwordError || emailError) {
        displayError(usernameError || passwordError || emailError);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/Auth`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ userName: username, password, email })
        });

        if (response.ok) {
            alert('Registration successful. Please login.');
            registerForm.reset();
            // Switch to login view after successful registration
            document.getElementById('register-container').style.display = 'none';
            document.getElementById('login-container').style.display = 'block';
        } else {
            await handleApiError(response);
        }
    } catch (error) {
        console.error('Registration error:', error);
        displayError(`Registration failed: ${error.message}`);
    }
}

// Clear user data on logout
function clearUserData() {
    localStorage.removeItem('currentUser');
    // Clear any other user-related data from localStorage if needed
}

// Handle user logout
function handleLogout() {
    currentUser = null;
    clearUserData();
    todoList.innerHTML = '';
    showAuthSection();
}

// Handle API errors
async function handleApiError(response) {
    let errorMessage = 'An error occurred. Please try again.';
    try {
        const errorData = await response.json();
        if (errorData.error) {
            errorMessage = errorData.error;
        }
    } catch (e) {
        // If parsing JSON fails, use the status text
        errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
}

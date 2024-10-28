// API endpoint
const API_URL = 'https://localhost:7171/api';

// Global user state
let currentUser = null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const todoSection = document.getElementById('todo-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const addTodoForm = document.getElementById('add-todo-form');
const todoList = document.getElementById('todo-list');
const logoutButton = document.getElementById('logout-button');
const sortSelect = document.getElementById('sort-select');
const filterInput = document.getElementById('filter-input');

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
addTodoForm.addEventListener('submit', handleAddTodo);
logoutButton.addEventListener('click', handleLogout);
sortSelect.addEventListener('change', fetchTodos);
// Debounce applied to fetchTodos for performance optimization
filterInput.addEventListener('input', debounce(fetchTodos, 300));

// Toggle between login and register forms
document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
});

// Display the todo section and hide auth section
function showTodoSection() {
    authSection.style.display = 'none';
    todoSection.style.display = 'block';
    document.getElementById('user-info').style.display = 'flex';
    
    const userNameElement = document.getElementById('user-name');
    if (currentUser && currentUser.userName) {
        userNameElement.textContent = `Welcome, ${currentUser.userName}!`;
    }
}

// Display the auth section and hide todo section
function showAuthSection() {
    authSection.style.display = 'block';
    todoSection.style.display = 'none';
    document.getElementById('user-info').style.display = 'none';
}

// Check for logged-in user on page load
function checkLoggedInUser() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        showTodoSection();
        todoList.innerHTML = ''; 
        // Error handling for initial todo fetch
        fetchTodos().catch(error => {
            console.error('Error fetching todos:', error);
            displayError('Failed to fetch todos. Please try again.');
        });
    } else {
        showAuthSection();
    }
}

// Initialization function for better organization
function initializeApp() {
    checkLoggedInUser();
    // Add any other initialization logic here
}

// Call initializeApp to start the application
initializeApp();

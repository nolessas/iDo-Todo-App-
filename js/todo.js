// Fetches todos for the current user from the API
async function fetchTodos() {
    // Ensure user is logged in before fetching todos
    if (!currentUser || !currentUser.id) {
        console.error('No user logged in');
        return;
    }

    toggleLoading(true);
    try {
        // Fetch todos for the current user
        const response = await fetch(`${API_URL}/ToDo?userId=${currentUser.id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const todos = await response.json();
        // Filter todos on the client side for added security
        const filteredTodos = todos.filter(todo => todo.userId === currentUser.id);
        renderTodos(filteredTodos);
    } catch (error) {
        console.error('Fetch todos error:', error);
        displayError('Failed to fetch todos. Please try again.');
    } finally {
        toggleLoading(false);
    }
}

// Validates user input for a new todo item
function validateTodoInput(content, type, endDate) {
    if (!content.trim()) {
        return 'Todo content cannot be empty';
    }
    if (content.length > 2000) {
        return 'Todo content cannot exceed 2000 characters';
    }
    if (!type || !type.trim()) {
        return 'Todo type is required';
    }
    if (type.length > 50) {
        return 'Todo type cannot exceed 50 characters';
    }
    if (endDate && new Date(endDate) < new Date()) {
        return 'End date cannot be in the past';
    }
    return null;
}

// Handles the creation of a new todo item
async function handleAddTodo(e) {
    e.preventDefault();
    // Sanitize inputs to prevent XSS attacks
    const content = sanitizeInput(document.getElementById('todo-content').value);
    const type = sanitizeInput(document.getElementById('todo-type').value);
    const endDate = document.getElementById('todo-end-date').value;

    // Validate todo input
    const validationError = validateTodoInput(content, type, endDate);
    if (validationError) {
        displayError(validationError);
        return;
    }

    toggleLoading(true);
    try {
        const response = await fetch(`${API_URL}/ToDo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,  
                type,
                content,
                endDate: endDate || null
            })
        });

        if (response.ok) {
            fetchTodos();  
            addTodoForm.reset();
        } else {
            const errorData = await response.json();
            showError(`Failed to add todo: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Add todo error:', error);
        showError(`Failed to add todo: ${error.message}`);
    } finally {
        toggleLoading(false);
    }
}

// Updates the UI optimistically before API confirmation
function optimisticallyUpdateTodo(todoId, updateFunction) {
    const todoElement = document.querySelector(`li[data-id="${todoId}"]`);
    if (todoElement) {
        updateFunction(todoElement);
    }
}

// Toggles the completion status of a todo item
async function handleCompleteTodo(id) {
    // Optimistically update UI
    const todoElement = document.querySelector(`li[data-id="${id}"]`);
    if (todoElement) {
        todoElement.classList.toggle('completed');
        const completeButton = todoElement.querySelector('button:first-child');
        completeButton.textContent = todoElement.classList.contains('completed') ? 'Undo' : 'Done';
    }

    try {
        const response = await fetch(`${API_URL}/ToDo/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch todo');
        }
        const todo = await response.json();
        
        const newType = todo.type.includes('(Completed)') 
            ? todo.type.replace(' (Completed)', '') 
            : todo.type + ' (Completed)';

        const updateResponse = await fetch(`${API_URL}/ToDo/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...todo, type: newType })
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to update todo');
        }

        // Update the type in the UI
        const typeSpan = todoElement.querySelector('span:nth-child(2)');
        if (typeSpan) {
            typeSpan.textContent = `(${newType})`;
        }
    } catch (error) {
        console.error('Complete todo error:', error);
        displayError(`Failed to update todo: ${error.message}`);
        // Revert optimistic update if the API call fails
        if (todoElement) {
            todoElement.classList.toggle('completed');
            const completeButton = todoElement.querySelector('button:first-child');
            completeButton.textContent = todoElement.classList.contains('completed') ? 'Undo' : 'Done';
        }
    }
}

// Allows editing of an existing todo item
async function handleEditTodo(id) {
    try {
        const response = await fetch(`${API_URL}/ToDo/${id}`);
        if (response.ok) {
            const todo = await response.json();
            
            // Create edit form
            const editForm = document.createElement('form');
            editForm.innerHTML = `
                <input type="text" id="edit-content" value="${todo.content}" maxlength="2000" required>
                <input type="text" id="edit-type" value="${todo.type}" maxlength="50">
                <input type="datetime-local" id="edit-end-date" value="${todo.endDate ? todo.endDate.slice(0, 16) : ''}">
                <button type="submit">Save</button>
                <button type="button" id="cancel-edit">Cancel</button>
            `;

            // Replace todo item with edit form
            const todoItem = document.querySelector(`li[data-id="${id}"]`);
            todoItem.innerHTML = '';
            todoItem.appendChild(editForm);

            // Handle form submission
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newContent = document.getElementById('edit-content').value;
                const newType = document.getElementById('edit-type').value;
                const newEndDate = document.getElementById('edit-end-date').value;

                try {
                    const updateResponse = await fetch(`${API_URL}/ToDo/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...todo,
                            content: newContent,
                            type: newType,
                            endDate: newEndDate || null
                        })
                    });

                    if (updateResponse.ok) {
                        fetchTodos();
                    } else {
                        throw new Error('Failed to update todo');
                    }
                } catch (error) {
                    console.error('Edit todo error:', error);
                    alert(`Failed to edit todo: ${error.message}`);
                }
            });

            // Handle cancel button
            document.getElementById('cancel-edit').addEventListener('click', () => {
                fetchTodos();
            });
        } else {
            throw new Error('Failed to fetch todo');
        }
    } catch (error) {
        console.error('Edit todo error:', error);
        alert(`Failed to edit todo: ${error.message}`);
    }
}

// Renders the list of todos with sorting and filtering
function renderTodos(todos) {
    const sortValue = sortSelect.value;
    const filterText = filterInput.value.toLowerCase();

    // Sort todos based on user selection
    todos.sort((a, b) => {
        if (sortValue === 'date') {

            return new Date(a.endDate) - new Date(b.endDate);
        } else if (sortValue === 'content') {
            return a.content.localeCompare(b.content);
        } else if (sortValue === 'type') {
            return a.type.localeCompare(b.type);
        }
    });

    // Filter todos based on user input
    todos = todos.filter(todo => 
        todo.content.toLowerCase().includes(filterText) ||
        todo.type.toLowerCase().includes(filterText)
    );

    // Render filtered and sorted todos
    todoList.innerHTML = '';
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.type.includes('(Completed)') ? 'completed' : ''}`;
        li.dataset.id = todo.id;
        li.innerHTML = `
            <div class="todo-item-content">
                <span class="todo-content">${todo.content}</span>
                <span class="todo-type">(${todo.type})</span>
                <span class="todo-date">${todo.endDate ? formatDate(todo.endDate) : 'No end date'}</span>
            </div>
            <div class="todo-actions">
                <button onclick="handleCompleteTodo(${todo.id})">${todo.type.includes('(Completed)') ? 'Undo' : 'Done'}</button>
                <button onclick="handleEditTodo(${todo.id})">Edit</button>
                <button onclick="handleDeleteTodo(${todo.id}, this)">Delete</button>
            </div>
        `;
        todoList.appendChild(li);
    });
}

// Handles the deletion of a todo item with confirmation
async function handleDeleteTodo(id, button) {
    if (button.textContent === 'Delete') {
        button.textContent = 'Sure?';
        button.style.backgroundColor = 'red';
        
        // Reset the button after 3 seconds if not clicked
        setTimeout(() => {
            if (button.textContent === 'Sure?') {
                button.textContent = 'Delete';
                button.style.backgroundColor = '';
            }
        }, 3000);
        
        return;
    }

    if (button.textContent === 'Sure?') {
        toggleLoading(true);
        try {
            const response = await fetch(`${API_URL}/ToDo/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Remove the todo item from the UI
                const todoElement = document.querySelector(`li[data-id="${id}"]`);
                if (todoElement) {
                    todoElement.remove();
                }
                // Optionally, you can re-fetch the todos to ensure the UI is in sync with the server
                fetchTodos();
            } else {
                throw new Error('Failed to delete todo');
            }
        } catch (error) {
            console.error('Delete todo error:', error);
            displayError(`Failed to delete todo: ${error.message}`);
        } finally {
            toggleLoading(false);
        }
    }
}

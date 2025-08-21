// Club Volunteer Management System - Main JavaScript

// Global variables
let currentEventData = null;
let isVerified = false;
const VOLUNTEER_GATE_CODE = '1957';
let currentVolunteerToDelete = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadEventData();
    initializeEventListeners();
});

// Load event data from server
async function loadEventData() {
    try {
        const response = await fetch('/api/event');
        if (response.ok) {
            currentEventData = await response.json();
            updatePageWithEventData();
            displayTasks();
        } else {
            console.error('Failed to load event data');
            showError('Failed to load event information');
        }
    } catch (error) {
        console.error('Error loading event data:', error);
        showError('Unable to connect to server');
    }
}

// Update page with event information
function updatePageWithEventData() {
    if (!currentEventData) return;

    // Update header
    document.getElementById('event-title').textContent = currentEventData.name || 'Club Work Hours';
    document.getElementById('event-date').textContent = `${currentEventData.date || 'TBD'} • ${currentEventData.time || 'Time TBD'}`;

    // Update event info section
    document.getElementById('event-description').textContent = currentEventData.description || 'Event details will be updated soon.';
    document.getElementById('event-time').textContent = currentEventData.time || 'Schedule TBD';

    // Update task dropdown
    const taskSelect = document.getElementById('work_role');
    taskSelect.innerHTML = '<option value="">Select a task...</option>';

    if (currentEventData.tasks && currentEventData.tasks.length > 0) {
        currentEventData.tasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = `${task.name} (${task.volunteers.length}/${task.needed} volunteers)`;

            // Disable if full
            if (task.volunteers.length >= task.needed) {
                option.disabled = true;
                option.textContent += ' - FULL';
            }

            taskSelect.appendChild(option);
        });
    }
}

// Display tasks with current volunteers
function displayTasks() {
    const container = document.getElementById('tasks-container');

    if (!currentEventData || !currentEventData.tasks || currentEventData.tasks.length === 0) {
        container.innerHTML = `
            <div class="info-message">
                <i class="fas fa-info-circle"></i>
                <p>No tasks have been configured for this event yet. Check back later!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    currentEventData.tasks.forEach(task => {
        const progressPercentage = Math.min((task.volunteers.length / task.needed) * 100, 100);
        const isFull = task.volunteers.length >= task.needed;
        const isUrgent = task.volunteers.length === 0 && task.needed > 0;

        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${isFull ? 'full' : ''} ${isUrgent ? 'urgent' : ''}`;

        let volunteersHtml = '';
        if (task.volunteers.length > 0) {
            volunteersHtml = `
                <div class="volunteers-list">
                    <h4>Current Volunteers:</h4>
                    ${task.volunteers.map(volunteer => `
                        <div class="volunteer-item">
                            <div>
                                <div class="volunteer-name">${volunteer.name}</div>
                                <div class="volunteer-email">${volunteer.email}</div>
                            </div>
                            ${isVerified ? `
                                <button class="remove-volunteer-btn" onclick="showDeleteModal('${task.id}', '${volunteer.id}', '${volunteer.name}', '${task.name}')">
                                    ×
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            volunteersHtml = `
                <div class="volunteers-list">
                    <p style="text-align: center; color: #6b7280; font-style: italic; padding: 15px;">
                        No volunteers yet - be the first to help!
                    </p>
                </div>
            `;
        }

        taskCard.innerHTML = `
            <div class="task-header">
                <div class="task-name">${task.name}</div>
                <div class="task-progress">${task.volunteers.length}/${task.needed}</div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
            ${volunteersHtml}
        `;

        container.appendChild(taskCard);
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // Form submission
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmission);
    }

    // Gate code modal - Enter key support
    const gateCodeInput = document.getElementById('gate-code-input');
    if (gateCodeInput) {
        gateCodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyGateCode();
            }
        });
    }

    // Click outside modal to close
    window.addEventListener('click', function(e) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Handle signup form submission
function handleSignupSubmission(e) {
    e.preventDefault();

    if (!isVerified) {
        showGateCodeModal();
        return;
    }

    submitVolunteerForm();
}

// Show gate code verification modal
function showGateCodeModal() {
    document.getElementById('gate-code-modal').style.display = 'flex';
    document.getElementById('gate-code-input').focus();
    document.getElementById('gate-code-error').style.display = 'none';
}

// Verify gate code
function verifyGateCode() {
    const code = document.getElementById('gate-code-input').value;
    const errorDiv = document.getElementById('gate-code-error');

    if (code === VOLUNTEER_GATE_CODE) {
        isVerified = true;
        document.getElementById('verification-status').style.display = 'block';
        closeGateCodeModal();
        submitVolunteerForm();
        errorDiv.style.display = 'none';
    } else {
        errorDiv.style.display = 'block';
        document.getElementById('gate-code-input').value = '';
        document.getElementById('gate-code-input').focus();
    }
}

// Close gate code modal
function closeGateCodeModal() {
    document.getElementById('gate-code-modal').style.display = 'none';
    document.getElementById('gate-code-input').value = '';
    document.getElementById('gate-code-error').style.display = 'none';
}

// Submit volunteer form
async function submitVolunteerForm() {
    const formData = new FormData(document.getElementById('signup-form'));

    const volunteerData = {
        gateCode: VOLUNTEER_GATE_CODE,
        volunteer: {
            name: formData.get('member_name'),
            email: formData.get('email'),
            phone: formData.get('phone') || '',
            notes: formData.get('notes') || '',
            taskId: formData.get('work_role')
        }
    };

    // Validation
    if (!volunteerData.volunteer.name || !volunteerData.volunteer.email || !volunteerData.volunteer.taskId) {
        showError('Please fill in all required fields');
        return;
    }

    try {
        const response = await fetch('/api/volunteer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(volunteerData)
        });

        if (response.ok) {
            document.getElementById('success-modal').style.display = 'flex';
            document.getElementById('signup-form').reset();

            // Refresh event data to show new volunteer
            setTimeout(() => {
                loadEventData();
            }, 1000);
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to register volunteer');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showError('Network error occurred. Please try again.');
    }
}

// Show delete confirmation modal
function showDeleteModal(taskId, volunteerId, volunteerName, taskName) {
    currentVolunteerToDelete = { taskId, volunteerId, volunteerName, taskName };

    document.getElementById('delete-volunteer-name').textContent = volunteerName;
    document.getElementById('delete-volunteer-role').textContent = taskName;
    document.getElementById('delete-modal').style.display = 'flex';
}

// Confirm volunteer deletion
async function confirmDelete() {
    if (!currentVolunteerToDelete) return;

    try {
        const response = await fetch(`/api/volunteer/${currentVolunteerToDelete.taskId}/${currentVolunteerToDelete.volunteerId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ gateCode: VOLUNTEER_GATE_CODE })
        });

        if (response.ok) {
            closeDeleteModal();
            loadEventData(); // Refresh to show updated data
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to remove volunteer');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showError('Network error occurred');
    }
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    currentVolunteerToDelete = null;
}

// Show success modal
function showSuccess(message) {
    document.querySelector('#success-modal p').textContent = message;
    document.getElementById('success-modal').style.display = 'flex';
}

// Show error modal
function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-modal').style.display = 'flex';
}

// Close success modal
function closeModal() {
    document.getElementById('success-modal').style.display = 'none';
}

// Close error modal
function closeErrorModal() {
    document.getElementById('error-modal').style.display = 'none';
}

// Utility function to format date
function formatDate(dateString) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Print volunteer list (for organizers)
function printVolunteerList() {
    if (!currentEventData) {
        alert('No event data available to print');
        return;
    }

    const printWindow = window.open('', '_blank');
    let printContent = `
        <html>
        <head>
            <title>Volunteer List - ${currentEventData.name}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    color: #333;
                }
                h1, h2 { 
                    color: #2563eb; 
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 10px;
                }
                .event-info { 
                    background: #f8fafc; 
                    padding: 20px; 
                    margin-bottom: 30px; 
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                }
                .task-group { 
                    margin-bottom: 40px; 
                    page-break-inside: avoid;
                }
                .volunteer { 
                    margin: 15px 0; 
                    padding: 15px; 
                    border-left: 4px solid #2563eb;
                    background: #f8fafc;
                    border-radius: 0 8px 8px 0;
                }
                .volunteer-name {
                    font-weight: bold;
                    font-size: 1.1em;
                    color: #1f2937;
                }
                .volunteer-details {
                    margin-top: 5px;
                    color: #6b7280;
                }
                .stats {
                    background: #eff6ff;
                    padding: 10px;
                    border-radius: 6px;
                    border: 1px solid #bfdbfe;
                    margin-bottom: 20px;
                }
                .print-date {
                    text-align: right;
                    color: #6b7280;
                    font-size: 0.9em;
                    border-top: 1px solid #e5e7eb;
                    padding-top: 15px;
                    margin-top: 30px;
                }
            </style>
        </head>
        <body>
            <div class="event-info">
                <h1>${currentEventData.name}</h1>
                <p><strong>Date:</strong> ${currentEventData.date}</p>
                <p><strong>Time:</strong> ${currentEventData.time}</p>
                <p><strong>Description:</strong> ${currentEventData.description}</p>
            </div>
    `;

    // Calculate totals
    const totalNeeded = currentEventData.tasks.reduce((sum, task) => sum + task.needed, 0);
    const totalSignedUp = currentEventData.tasks.reduce((sum, task) => sum + task.volunteers.length, 0);

    printContent += `
        <div class="stats">
            <strong>Volunteer Summary:</strong> ${totalSignedUp}/${totalNeeded} positions filled (${Math.round(totalSignedUp/totalNeeded*100)}% complete)
        </div>
    `;

    currentEventData.tasks.forEach(task => {
        printContent += `
            <div class="task-group">
                <h2>${task.name} (${task.volunteers.length}/${task.needed} volunteers)</h2>
        `;

        if (task.volunteers.length > 0) {
            task.volunteers.forEach(volunteer => {
                printContent += `
                    <div class="volunteer">
                        <div class="volunteer-name">${volunteer.name}</div>
                        <div class="volunteer-details">
                            Email: ${volunteer.email}<br>
                            ${volunteer.phone ? `Phone: ${volunteer.phone}<br>` : ''}
                            ${volunteer.notes ? `Notes: ${volunteer.notes}<br>` : ''}
                            <small>Signed up: ${new Date(volunteer.signupTime).toLocaleString()}</small>
                        </div>
                    </div>
                `;
            });
        } else {
            printContent += '<p style="text-align: center; color: #6b7280; font-style: italic; padding: 30px;">No volunteers signed up yet</p>';
        }

        printContent += '</div>';
    });

    printContent += `
            <div class="print-date">
                Printed on: ${new Date().toLocaleString()}
            </div>
        </body></html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// Auto-refresh data every 2 minutes to show new signups
setInterval(() => {
    if (document.visibilityState === 'visible') {
        loadEventData();
    }
}, 120000);

// Handle page visibility change to refresh when user returns
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        loadEventData();
    }
});

// Export functions for global access
window.verifyGateCode = verifyGateCode;
window.closeGateCodeModal = closeGateCodeModal;
window.closeModal = closeModal;
window.closeErrorModal = closeErrorModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.showDeleteModal = showDeleteModal;
window.printVolunteerList = printVolunteerList;
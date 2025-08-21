const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Gate codes
const VOLUNTEER_GATE_CODE = '1957';
const ORGANIZER_GATE_CODE = '5791';

// Email configuration
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Database file paths
const EVENTS_DB = path.join(__dirname, 'data', 'events.json');
const VOLUNTEERS_DB = path.join(__dirname, 'data', 'volunteers.json');

// Initialize database files
async function initializeDatabase() {
    try {
        // Create data directory if it doesn't exist
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });

        // Initialize events.json
        try {
            await fs.access(EVENTS_DB);
        } catch {
            const defaultEvent = {
                id: 'spring-cleanup-2024',
                name: 'Spring Cleanup & Maintenance',
                date: '2024-04-15',
                time: '9:00 AM - 4:00 PM',
                description: 'Join us for our spring work day! Help maintain our beautiful club facilities with landscaping, cleaning, and general maintenance tasks.',
                organizerEmail: 'organizer@club.com',
                tasks: [
                    { id: 'landscaping', name: 'Landscaping & Grounds', needed: 6, volunteers: [] },
                    { id: 'maintenance', name: 'General Maintenance', needed: 4, volunteers: [] },
                    { id: 'cleaning', name: 'Clubhouse Cleaning', needed: 3, volunteers: [] },
                    { id: 'painting', name: 'Touch-up Painting', needed: 2, volunteers: [] }
                ]
            };
            await fs.writeFile(EVENTS_DB, JSON.stringify(defaultEvent, null, 2));
        }

        // Initialize volunteers.json
        try {
            await fs.access(VOLUNTEERS_DB);
        } catch {
            await fs.writeFile(VOLUNTEERS_DB, JSON.stringify([], null, 2));
        }

        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
}

// Helper functions
async function readEventData() {
    try {
        const data = await fs.readFile(EVENTS_DB, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading event data:', error);
        return null;
    }
}

async function writeEventData(data) {
    try {
        await fs.writeFile(EVENTS_DB, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing event data:', error);
        return false;
    }
}

async function readVolunteers() {
    try {
        const data = await fs.readFile(VOLUNTEERS_DB, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading volunteers:', error);
        return [];
    }
}

async function writeVolunteers(data) {
    try {
        await fs.writeFile(VOLUNTEERS_DB, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing volunteers:', error);
        return false;
    }
}

// API Routes

// Get current event data
app.get('/api/event', async (req, res) => {
    const eventData = await readEventData();
    if (eventData) {
        res.json(eventData);
    } else {
        res.status(500).json({ error: 'Failed to load event data' });
    }
});

// Update event (organizer only)
app.post('/api/event', async (req, res) => {
    const { gateCode, eventData } = req.body;

    if (gateCode !== ORGANIZER_GATE_CODE) {
        return res.status(401).json({ error: 'Invalid organizer gate code' });
    }

    const success = await writeEventData(eventData);
    if (success) {
        res.json({ message: 'Event updated successfully' });
    } else {
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// Volunteer signup
app.post('/api/volunteer', async (req, res) => {
    const { gateCode, volunteer } = req.body;

    if (gateCode !== VOLUNTEER_GATE_CODE) {
        return res.status(401).json({ error: 'Invalid gate code' });
    }

    try {
        // Get current event and volunteers
        const eventData = await readEventData();
        const volunteers = await readVolunteers();

        if (!eventData) {
            return res.status(500).json({ error: 'Event data not available' });
        }

        // Add volunteer to appropriate task
        const taskIndex = eventData.tasks.findIndex(t => t.id === volunteer.taskId);
        if (taskIndex === -1) {
            return res.status(400).json({ error: 'Invalid task selected' });
        }

        // Check if task is full
        if (eventData.tasks[taskIndex].volunteers.length >= eventData.tasks[taskIndex].needed) {
            return res.status(400).json({ error: 'This task is already full' });
        }

        // Add volunteer to task
        const newVolunteer = {
            id: Date.now().toString(),
            name: volunteer.name,
            email: volunteer.email,
            phone: volunteer.phone || '',
            notes: volunteer.notes || '',
            signupTime: new Date().toISOString()
        };

        eventData.tasks[taskIndex].volunteers.push(newVolunteer);
        volunteers.push({ ...newVolunteer, taskId: volunteer.taskId, taskName: eventData.tasks[taskIndex].name });

        // Save data
        await writeEventData(eventData);
        await writeVolunteers(volunteers);

        // Send thank you email to volunteer
        if (process.env.EMAIL_USER) {
            const volunteerEmailHtml = `
                <h2>Thank you for volunteering!</h2>
                <p>Dear ${volunteer.name},</p>
                <p>Thank you for signing up to help with <strong>${eventData.name}</strong>!</p>
                <p><strong>Event Details:</strong></p>
                <ul>
                    <li><strong>Date:</strong> ${eventData.date}</li>
                    <li><strong>Time:</strong> ${eventData.time}</li>
                    <li><strong>Your Task:</strong> ${eventData.tasks[taskIndex].name}</li>
                </ul>
                <p>${eventData.description}</p>
                <p>We'll send you more details as the event approaches. Thank you for your commitment to our club!</p>
                <p>Best regards,<br>Club Event Organizers</p>
            `;

            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: volunteer.email,
                    subject: `Thank you for volunteering - ${eventData.name}`,
                    html: volunteerEmailHtml
                });
            } catch (emailError) {
                console.error('Failed to send volunteer email:', emailError);
            }
        }

        // Send roster update to organizer
        if (process.env.EMAIL_USER && eventData.organizerEmail) {
            const rosterHtml = `
                <h2>New Volunteer Signup - ${eventData.name}</h2>
                <p><strong>New Volunteer:</strong> ${volunteer.name} (${volunteer.email})</p>
                <p><strong>Task:</strong> ${eventData.tasks[taskIndex].name}</p>
                <p><strong>Signup Time:</strong> ${new Date().toLocaleString()}</p>

                <h3>Complete Current Roster:</h3>
                ${eventData.tasks.map(task => `
                    <h4>${task.name} (${task.volunteers.length}/${task.needed})</h4>
                    ${task.volunteers.length > 0 ? `
                        <ul>
                            ${task.volunteers.map(v => `
                                <li>${v.name} - ${v.email}${v.phone ? ` - ${v.phone}` : ''}${v.notes ? ` - Notes: ${v.notes}` : ''}</li>
                            `).join('')}
                        </ul>
                    ` : '<p>No volunteers yet</p>'}
                `).join('')}
            `;

            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: eventData.organizerEmail,
                    subject: `Volunteer Roster Update - ${eventData.name}`,
                    html: rosterHtml
                });
            } catch (emailError) {
                console.error('Failed to send organizer email:', emailError);
            }
        }

        res.json({ message: 'Volunteer registered successfully', volunteer: newVolunteer });

    } catch (error) {
        console.error('Volunteer signup error:', error);
        res.status(500).json({ error: 'Failed to register volunteer' });
    }
});

// Remove volunteer
app.delete('/api/volunteer/:taskId/:volunteerId', async (req, res) => {
    const { taskId, volunteerId } = req.params;
    const { gateCode } = req.body;

    if (gateCode !== VOLUNTEER_GATE_CODE) {
        return res.status(401).json({ error: 'Invalid gate code' });
    }

    try {
        const eventData = await readEventData();
        const volunteers = await readVolunteers();

        // Remove from event task
        const taskIndex = eventData.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            eventData.tasks[taskIndex].volunteers = eventData.tasks[taskIndex].volunteers.filter(v => v.id !== volunteerId);
        }

        // Remove from volunteers list
        const updatedVolunteers = volunteers.filter(v => v.id !== volunteerId);

        // Save data
        await writeEventData(eventData);
        await writeVolunteers(updatedVolunteers);

        res.json({ message: 'Volunteer removed successfully' });

    } catch (error) {
        console.error('Remove volunteer error:', error);
        res.status(500).json({ error: 'Failed to remove volunteer' });
    }
});

// Verify gate codes
app.post('/api/verify-gate-code', (req, res) => {
    const { code, type } = req.body;

    if (type === 'volunteer' && code === VOLUNTEER_GATE_CODE) {
        res.json({ valid: true, message: 'Volunteer gate code verified' });
    } else if (type === 'organizer' && code === ORGANIZER_GATE_CODE) {
        res.json({ valid: true, message: 'Organizer gate code verified' });
    } else {
        res.status(401).json({ valid: false, message: 'Invalid gate code' });
    }
});

// Serve main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Initialize database and start server
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Club Volunteer System running on port ${PORT}`);
        console.log(`📱 Main page: http://localhost:${PORT}`);
        console.log(`⚙️ Admin page: http://localhost:${PORT}/admin`);
    });
});

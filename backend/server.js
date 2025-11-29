require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// File to store owner's tokens
const TOKENS_FILE = path.join(__dirname, 'tokens.json');

// Configuration from environment
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${PORT}/auth/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'your@email.com';
const OWNER_NAME = process.env.OWNER_NAME || 'Your Name';

// ============================================
// SCHEDULING CONFIGURATION - Customize these!
// ============================================
const SCHEDULING_CONFIG = {
    maxDaysInAdvance: 15,      // How far ahead users can book
    minHoursNotice: 4,         // Minimum hours before appointment
    meetingDuration: 45,       // Meeting length in minutes
    slotInterval: 45,          // Time between slot options
    timezone: 'Asia/Kolkata'   // Your timezone
};

// Working hours for each day (24-hour format)
// Set to null to mark a day as unavailable
const WORKING_HOURS = {
    0: { start: '14:00', end: '20:00' },  // Sunday
    1: { start: '09:00', end: '17:00' },  // Monday
    2: { start: '09:00', end: '17:00' },  // Tuesday
    3: { start: '09:00', end: '17:00' },  // Wednesday
    4: { start: '09:00', end: '17:00' },  // Thursday
    5: { start: '09:00', end: '17:00' },  // Friday
    6: null                               // Saturday (closed)
};

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ============================================
// HELPER FUNCTIONS
// ============================================

function createOAuth2Client() {
    return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

function loadTokens() {
    try {
        if (fs.existsSync(TOKENS_FILE)) {
            return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading tokens:', error);
    }
    return null;
}

function saveTokens(tokens) {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    console.log('Tokens saved');
}

function isAuthenticated() {
    const tokens = loadTokens();
    return tokens && tokens.access_token;
}

async function getCalendarClient() {
    const tokens = loadTokens();
    if (!tokens) return null;

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(tokens);

    // Refresh token if expired
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date - 60000) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            saveTokens(credentials);
            oauth2Client.setCredentials(credentials);
        } catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        }
    }

    return google.calendar({ version: 'v3', auth: oauth2Client });
}

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatTimeDisplay(hours, minutes) {
    const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    const period = hours >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Google Meet Scheduler API',
        connected: isAuthenticated(),
        setupUrl: isAuthenticated() ? null : '/auth/setup'
    });
});

// OAuth setup - Visit this URL to connect your Google Calendar
app.get('/auth/setup', (req, res) => {
    if (isAuthenticated()) {
        return res.send(`
            <html><body style="font-family: sans-serif; padding: 40px; text-align: center;">
                <h1>Already Connected!</h1>
                <p>Your Google Calendar is connected.</p>
                <p><a href="/auth/disconnect">Disconnect</a></p>
            </body></html>
        `);
    }

    const oauth2Client = createOAuth2Client();
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ]
    });

    res.redirect(authUrl);
});

// OAuth callback
app.get('/auth/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        return res.send(`<html><body><h1>Error: ${error}</h1></body></html>`);
    }

    try {
        const oauth2Client = createOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        saveTokens(tokens);

        res.send(`
            <html><body style="font-family: sans-serif; padding: 40px; text-align: center;">
                <h1 style="color: green;">Success!</h1>
                <p>Google Calendar connected. You can now accept bookings.</p>
            </body></html>
        `);
    } catch (error) {
        res.send(`<html><body><h1>Error</h1><p>${error.message}</p></body></html>`);
    }
});

// Disconnect
app.get('/auth/disconnect', (req, res) => {
    if (fs.existsSync(TOKENS_FILE)) fs.unlinkSync(TOKENS_FILE);
    res.send(`<html><body style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h1>Disconnected</h1><p><a href="/auth/setup">Reconnect</a></p>
    </body></html>`);
});

// Get config
app.get('/api/config', (req, res) => {
    res.json({
        meetingDuration: SCHEDULING_CONFIG.meetingDuration,
        maxDaysInAdvance: SCHEDULING_CONFIG.maxDaysInAdvance,
        minHoursNotice: SCHEDULING_CONFIG.minHoursNotice,
        ownerName: OWNER_NAME
    });
});

// Get available dates
app.get('/api/available-dates', async (req, res) => {
    if (!isAuthenticated()) {
        return res.status(503).json({ error: 'Calendar not connected' });
    }

    const { month, year } = req.query;
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    const now = new Date();
    const maxDate = new Date(now.getTime() + SCHEDULING_CONFIG.maxDaysInAdvance * 24 * 60 * 60 * 1000);

    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(yearNum, monthNum - 1, day);
        if (date >= now && date <= maxDate && WORKING_HOURS[date.getDay()]) {
            dates.push(`${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        }
    }

    res.json({ dates });
});

// Get available time slots
app.get('/api/availability', async (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date required' });

    const calendar = await getCalendarClient();
    if (!calendar) return res.status(503).json({ error: 'Calendar not connected' });

    try {
        const [year, month, day] = date.split('-').map(Number);
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        const hours = WORKING_HOURS[dayOfWeek];

        if (!hours) return res.json({ slots: [] });

        // Get busy times
        const dayStart = new Date(year, month - 1, day, 0, 0, 0);
        const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

        const freeBusy = await calendar.freebusy.query({
            requestBody: {
                timeMin: dayStart.toISOString(),
                timeMax: dayEnd.toISOString(),
                items: [{ id: 'primary' }]
            }
        });

        const busyPeriods = freeBusy.data.calendars.primary.busy || [];

        // Generate available slots
        const slots = [];
        const now = new Date();
        const minTime = new Date(now.getTime() + SCHEDULING_CONFIG.minHoursNotice * 60 * 60 * 1000);

        let current = timeToMinutes(hours.start);
        const end = timeToMinutes(hours.end) - SCHEDULING_CONFIG.meetingDuration;

        while (current <= end) {
            const slotHour = Math.floor(current / 60);
            const slotMin = current % 60;
            const slotStart = new Date(year, month - 1, day, slotHour, slotMin);
            const slotEnd = new Date(slotStart.getTime() + SCHEDULING_CONFIG.meetingDuration * 60000);

            if (slotStart > minTime) {
                const isBusy = busyPeriods.some(busy => {
                    const busyStart = new Date(busy.start);
                    const busyEnd = new Date(busy.end);
                    return slotStart < busyEnd && slotEnd > busyStart;
                });

                if (!isBusy) {
                    slots.push({
                        time: `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`,
                        display: formatTimeDisplay(slotHour, slotMin),
                        start: slotStart.toISOString(),
                        end: slotEnd.toISOString()
                    });
                }
            }

            current += SCHEDULING_CONFIG.slotInterval;
        }

        res.json({ slots, date });
    } catch (error) {
        console.error('Availability error:', error);
        res.status(500).json({ error: 'Failed to get availability' });
    }
});

// Check slot availability
app.post('/api/check-slot', async (req, res) => {
    const { start, end } = req.body;
    const calendar = await getCalendarClient();
    if (!calendar) return res.status(503).json({ error: 'Calendar not connected' });

    try {
        const freeBusy = await calendar.freebusy.query({
            requestBody: {
                timeMin: start,
                timeMax: end,
                items: [{ id: 'primary' }]
            }
        });

        const busy = freeBusy.data.calendars.primary.busy || [];
        res.json({ available: busy.length === 0 });
    } catch (error) {
        res.status(500).json({ error: 'Check failed' });
    }
});

// Book meeting
app.post('/api/book', async (req, res) => {
    const { name, email, start, end, notes } = req.body;

    if (!name || !email || !start || !end) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const calendar = await getCalendarClient();
    if (!calendar) return res.status(503).json({ error: 'Calendar not connected' });

    try {
        // Double-check availability
        const freeBusy = await calendar.freebusy.query({
            requestBody: {
                timeMin: start,
                timeMax: end,
                items: [{ id: 'primary' }]
            }
        });

        if (freeBusy.data.calendars.primary.busy?.length > 0) {
            return res.status(409).json({ error: 'Slot no longer available' });
        }

        // Create event with Google Meet
        const event = {
            summary: `Meeting with ${name}`,
            description: `Client: ${name}\nEmail: ${email}\n\nNotes: ${notes || 'None'}`,
            start: { dateTime: start, timeZone: SCHEDULING_CONFIG.timezone },
            end: { dateTime: end, timeZone: SCHEDULING_CONFIG.timezone },
            attendees: [{ email, displayName: name }],
            conferenceData: {
                createRequest: {
                    requestId: uuidv4(),
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 60 },
                    { method: 'popup', minutes: 15 }
                ]
            }
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
            sendUpdates: 'all'
        });

        const meetLink = response.data.hangoutLink;

        // Generate ICS
        const icsContent = generateICS(name, email, start, end, meetLink, notes);

        res.json({
            success: true,
            meetLink,
            eventId: response.data.id,
            icsContent
        });

    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ error: 'Booking failed' });
    }
});

// Generate ICS file
function generateICS(name, email, start, end, meetLink, notes) {
    const formatDate = (d) => new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Meet Scheduler//EN
BEGIN:VEVENT
UID:${uuidv4()}@scheduler
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:Meeting with ${OWNER_NAME}
DESCRIPTION:Notes: ${notes || 'None'}\\n\\nJoin: ${meetLink}
LOCATION:${meetLink}
ORGANIZER;CN=${OWNER_NAME}:mailto:${OWNER_EMAIL}
ATTENDEE;CN=${name}:mailto:${email}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

// Start server
app.listen(PORT, () => {
    console.log(`
====================================
  Google Meet Scheduler API
====================================
  Port: ${PORT}
  Connected: ${isAuthenticated() ? 'Yes' : 'No'}
  Setup: http://localhost:${PORT}/auth/setup
====================================
    `);
});

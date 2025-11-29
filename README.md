# Google Meet Scheduler

<div align="center">

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange.svg)

**A self-hosted meeting scheduler with Google Calendar integration and automatic Google Meet link generation.**

[Live Demo](https://shekharh500.github.io/google-meet-scheduler-demo.github.io/) • [Report Bug](https://github.com/shekharh500/google-meet-scheduler-demo/issues) • [Request Feature](https://github.com/shekharh500/google-meet-scheduler-demo/issues)

### ✨ Demo in Action

![Demo GIF](demo.gif)

[📹 Watch Full Video Demo](demo.mp4)

</div>

---

## Features

| Feature | Demo | Production |
|---------|:----:|:----------:|
| 📅 Interactive Calendar | ✅ | ✅ |
| ⏰ Time Slot Selection | ✅ | ✅ |
| 🔐 OTP Email Verification | ✅ (simulated) | ✅ |
| 🏢 Business Email Only | ✅ | ✅ |
| 🚫 Duplicate Booking Prevention | ✅ | ✅ |
| 🌙 Dark Mode | ✅ | ✅ |
| 🎉 Success Confetti | ✅ | ✅ |
| 📧 Calendar Invites | ❌ | ✅ |
| 🔗 Google Meet Links | ❌ | ✅ |

---

## 🎬 Quick Start

### ⚡ Try the Live Demo (No Setup Required)
**[🚀 Click here to use the scheduler now!](https://shekharh500.github.io/google-meet-scheduler-demo.github.io/)**

Or clone and open locally:
```bash
git clone https://github.com/shekharh500/google-meet-scheduler-demo.git
open index.html
```

### 📹 See It In Action

**GIF Demo:**
![Demo Animation](demo.gif)

**Full Video Demo:**
https://github.com/shekharh500/google-meet-scheduler-demo/assets/demo.mp4

**Demo Credentials:**
- Test Email: Use any business email (not gmail, yahoo, etc.)
- OTP Code: `123456`

---

## What's Included

```
google-meet-scheduler-demo/
├── index.html           # Demo - Try the UI (no setup needed)
├── frontend/
│   └── index.html       # Production frontend
├── backend/
│   ├── server.js        # Express API server
│   ├── package.json
│   └── .env.example     # Environment template
├── demo.png             # Screenshot
├── VisualDiagram.png    # Architecture diagram
└── README.md
```

---

## Demo Features

### 🔐 OTP Email Verification
The demo simulates OTP-based email verification. Enter any business email and use code `123456` to verify.

### 🏢 Business Email Validation
Personal email domains are blocked:
- Gmail, Yahoo, Outlook, Hotmail
- iCloud, ProtonMail, AOL
- And 15+ other personal email providers

Only business/company email addresses are accepted.

### 🚫 Duplicate Booking Prevention
Once an email is used to book a meeting (in the current session), it cannot book another slot.

### 🌙 Dark Mode
Toggle between light and dark themes. Your preference is saved to localStorage.

### 🎉 Success Animation
Confetti celebration when a booking is confirmed!

---

## Production Setup

For real Google Calendar integration, follow these steps:

### Prerequisites

- Node.js 18+
- Google Cloud account
- Vercel account (free)

### Step 1: Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: `Meeting Scheduler`
3. Enable **Google Calendar API**
4. Configure **OAuth consent screen** (External)
5. Add scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`

### Step 2: Create OAuth Credentials

1. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
2. Select **Web application**
3. Add redirect URI: `http://localhost:3000/auth/callback`
4. Save your **Client ID** and **Client Secret**

### Step 3: Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
REDIRECT_URI=http://localhost:3000/auth/callback
FRONTEND_URL=http://localhost:5500
OWNER_EMAIL=your@email.com
OWNER_NAME=Your Name
```

Start the server:
```bash
npm start
```

### Step 4: Connect Google Calendar

1. Visit `http://localhost:3000/auth/setup`
2. Sign in with Google
3. Grant calendar permissions
4. You should see: **"Success! Google Calendar connected."**

### Step 5: Test Locally

```bash
cd frontend
python -m http.server 5500
# or
npx serve -p 5500
```

Open `http://localhost:5500` and book a meeting!

---

## Deploy to Production

### Backend (Vercel)

```bash
cd backend
npm install -g vercel
vercel login
vercel
```

Add environment variables in Vercel Dashboard:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `REDIRECT_URI` → `https://your-app.vercel.app/auth/callback`
- `FRONTEND_URL` → `https://your-frontend-url`
- `OWNER_EMAIL`
- `OWNER_NAME`

Update Google Cloud redirect URIs to include your Vercel URL.

### Frontend (GitHub Pages / Vercel)

Update `frontend/index.html`:
```javascript
const API_BASE = 'https://your-backend.vercel.app';
```

Deploy to GitHub Pages or Vercel.

---

## Configuration

### Scheduling Rules

Edit `backend/server.js`:

```javascript
const SCHEDULING_CONFIG = {
    maxDaysInAdvance: 15,      // How far ahead users can book
    minHoursNotice: 4,         // Minimum hours before appointment
    meetingDuration: 45,       // Meeting length in minutes
    slotInterval: 45,          // Time between slots
    timezone: 'Asia/Kolkata'   // Your timezone
};
```

### Working Hours

```javascript
const WORKING_HOURS = {
    0: { start: '14:00', end: '20:00' },  // Sunday
    1: { start: '09:00', end: '17:00' },  // Monday
    2: { start: '09:00', end: '17:00' },  // Tuesday
    3: { start: '09:00', end: '17:00' },  // Wednesday
    4: { start: '09:00', end: '17:00' },  // Thursday
    5: { start: '09:00', end: '17:00' },  // Friday
    6: null                               // Saturday (closed)
};
```

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/auth/setup` | GET | Start Google OAuth |
| `/auth/callback` | GET | OAuth callback |
| `/auth/disconnect` | GET | Disconnect calendar |
| `/api/config` | GET | Get scheduler config |
| `/api/available-dates` | GET | Get bookable dates |
| `/api/availability?date=YYYY-MM-DD` | GET | Get time slots |
| `/api/send-otp` | POST | Send OTP to email |
| `/api/verify-otp` | POST | Verify OTP code |
| `/api/book` | POST | Create booking |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Calendar not connected" | Visit `/auth/setup` to connect |
| "Access blocked" | Check redirect URI in Google Console |
| "Token refresh failed" | Disconnect and reconnect calendar |
| No available dates | Check `WORKING_HOURS` config |
| CORS errors | Ensure `FRONTEND_URL` matches your domain |

---

## Tech Stack

- **Frontend**: Vanilla JavaScript, CSS3
- **Backend**: Node.js, Express
- **APIs**: Google Calendar API, Gmail API
- **Deployment**: Vercel, GitHub Pages
- **Icons**: Bootstrap Icons

---

## Screenshots

### Light Mode
![Light Mode](demo.png)

### Architecture
![Architecture](VisualDiagram.png)

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Author

**Himanshu Shekhar**

- GitHub: [@shekharh500](https://github.com/shekharh500)
- LinkedIn: [Himanshu Shekhar](https://linkedin.com/in/shekharh500)

---

<div align="center">

⭐ **Star this repo if you find it useful!** ⭐

</div>

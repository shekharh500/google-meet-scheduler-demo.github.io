# Google Meet Scheduler

A self-hosted meeting scheduler with **Google Calendar integration** and **automatic Google Meet link generation**.

**Author**: [@shekharh500](https://github.com/shekharh500)

---

## What's Included

| File | Description |
|------|-------------|
| `index.html` | **Demo** - Try the UI with mock data (no setup needed) |
| `frontend/index.html` | **Production frontend** - Connects to real backend |
| `backend/` | **API server** - Google Calendar integration |

---

## Quick Demo

Just open `index.html` in your browser - works immediately with mock data!

---

## Full Setup Guide (Real Google Calendar Integration)

Follow these steps to deploy your own scheduler with real Google Calendar integration.

### Prerequisites

- Node.js 18+
- Google account
- Vercel account (free) for deployment

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. Click **Select a project** → **New Project**
   - Name: `Meeting Scheduler`
   - Click **Create**

3. Wait for project creation, then select it

---

## Step 2: Enable Google Calendar API

1. Go to **APIs & Services** → **Library**

2. Search for **Google Calendar API**

3. Click on it → Click **Enable**

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**

2. Select **External** → Click **Create**

3. Fill in the form:
   - **App name**: `Meeting Scheduler`
   - **User support email**: Your email
   - **Developer contact**: Your email

4. Click **Save and Continue**

5. **Scopes** page:
   - Click **Add or Remove Scopes**
   - Find and select:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Click **Update** → **Save and Continue**

6. **Test users** page:
   - Click **Add Users**
   - Add your Gmail address
   - Click **Save and Continue**

7. Click **Back to Dashboard**

---

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**

2. Click **Create Credentials** → **OAuth client ID**

3. Select **Web application**

4. Name: `Meeting Scheduler`

5. **Authorized redirect URIs** - Add these:
   ```
   http://localhost:3000/auth/callback
   ```
   (We'll add the Vercel URL later)

6. Click **Create**

7. **Save your credentials:**
   - Client ID: `xxxxxx.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxxxxx`

---

## Step 5: Set Up Backend Locally

1. Open terminal and navigate to backend:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your credentials:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   REDIRECT_URI=http://localhost:3000/auth/callback
   FRONTEND_URL=http://localhost:5500
   OWNER_EMAIL=your@email.com
   OWNER_NAME=Your Name
   ```

5. Start the server:
   ```bash
   npm start
   ```

6. You should see:
   ```
   ====================================
     Google Meet Scheduler API
   ====================================
     Port: 3000
     Connected: No
     Setup: http://localhost:3000/auth/setup
   ====================================
   ```

---

## Step 6: Connect Your Google Calendar

1. Open browser: `http://localhost:3000/auth/setup`

2. Sign in with your Google account

3. Click **Continue** (ignore "unverified app" warning - it's your own app)

4. Grant calendar permissions

5. You should see: **"Success! Google Calendar connected."**

---

## Step 7: Test Locally

1. Open `frontend/index.html` in your browser

2. Or serve it with any static server:
   ```bash
   # Using Python
   cd frontend
   python -m http.server 5500

   # Using Node.js
   npx serve frontend -p 5500
   ```

3. Open `http://localhost:5500`

4. Try booking a meeting - it will create a real Google Calendar event!

---

## Step 8: Deploy Backend to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy backend:
   ```bash
   cd backend
   vercel
   ```

4. Follow prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? `meet-scheduler-api`
   - Directory? `./`

5. Note your deployment URL: `https://meet-scheduler-api.vercel.app`

6. Add environment variables in Vercel:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to **Settings** → **Environment Variables**
   - Add each variable:

   | Name | Value |
   |------|-------|
   | `GOOGLE_CLIENT_ID` | Your client ID |
   | `GOOGLE_CLIENT_SECRET` | Your client secret |
   | `REDIRECT_URI` | `https://your-project.vercel.app/auth/callback` |
   | `FRONTEND_URL` | `https://your-frontend.vercel.app` |
   | `OWNER_EMAIL` | Your email |
   | `OWNER_NAME` | Your name |

7. Redeploy to apply variables:
   ```bash
   vercel --prod
   ```

---

## Step 9: Update Google Cloud Redirect URI

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)

2. Go to **APIs & Services** → **Credentials**

3. Click on your OAuth client

4. Add new **Authorized redirect URI**:
   ```
   https://your-project.vercel.app/auth/callback
   ```

5. Click **Save**

---

## Step 10: Connect Calendar on Production

1. Visit: `https://your-project.vercel.app/auth/setup`

2. Sign in and grant permissions

3. Your production calendar is now connected!

---

## Step 11: Deploy Frontend

1. Update `frontend/index.html`:
   ```javascript
   const API_BASE = 'https://your-project.vercel.app';
   ```

2. Deploy frontend:
   ```bash
   cd frontend
   vercel
   ```

3. Your scheduler is now live!

---

## Configuration

### Scheduling Rules

Edit `backend/server.js`:

```javascript
const SCHEDULING_CONFIG = {
    maxDaysInAdvance: 15,      // How far ahead users can book
    minHoursNotice: 4,         // Minimum hours before appointment
    meetingDuration: 45,       // Meeting length in minutes
    slotInterval: 45,          // Time between slot options
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

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/auth/setup` | GET | Start Google OAuth |
| `/auth/callback` | GET | OAuth callback |
| `/auth/disconnect` | GET | Disconnect calendar |
| `/api/config` | GET | Get scheduler config |
| `/api/available-dates` | GET | Get bookable dates |
| `/api/availability?date=YYYY-MM-DD` | GET | Get time slots |
| `/api/check-slot` | POST | Verify slot available |
| `/api/book` | POST | Create booking |

---

## Troubleshooting

### "Calendar not connected"
Visit `/auth/setup` on your backend URL to connect Google Calendar.

### "Access blocked: This app's request is invalid"
Make sure your redirect URI in Google Console exactly matches your backend URL + `/auth/callback`.

### "Token refresh failed"
Visit `/auth/disconnect` then `/auth/setup` to reconnect.

### No available dates showing
- Check `WORKING_HOURS` configuration
- Dates must be within `maxDaysInAdvance`

### CORS errors
Ensure `FRONTEND_URL` environment variable matches your frontend domain.

---

## Customization

### Colors
Edit CSS variables in `frontend/index.html`:
```css
:root {
    --primary: #4F46E5;
    --primary-dark: #4338CA;
    ...
}
```

### Branding
Update the sidebar in `frontend/index.html` with your name/logo.

---

## License

MIT

---

## Author

**Himanshu Shekhar**
- GitHub: [@shekharh500](https://github.com/shekharh500)

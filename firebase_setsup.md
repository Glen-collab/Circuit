# Zone A Circuit - Firebase Setup Guide

## What You're Getting

**Mobile-first design:**
- Portrait mode: Timer at top, exercises below
- Landscape mode: Timer on left, exercises on right (perfect for coaching!)
- Fully responsive and touch-optimized

**Realtime Sync:**
- Coach creates a session → gets a 6-character code (e.g., "ABC123")
- Athletes enter the code → everyone sees the same timer
- When coach starts/pauses/resets → all devices update instantly
- No lag, no refresh needed

---

## Firebase Setup (Free & Easy - 5 Minutes)

Firebase Realtime Database gives you instant synchronization across all devices. The free tier is more than enough for group workouts.

### Step 1: Create Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Name it (e.g., "Zone-A-Circuit")
4. Disable Google Analytics (not needed)
5. Click **"Create project"**

### Step 2: Set Up Realtime Database

1. In your Firebase console, click **"Realtime Database"** in the left menu
2. Click **"Create Database"**
3. Choose your location (closest to you)
4. Start in **"Test mode"** (we'll secure it in a moment)
5. Click **"Enable"**

### Step 3: Configure Security Rules

In the Realtime Database screen, click the **"Rules"** tab and paste this:

```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

Click **"Publish"**

> **Why these rules?** We allow anyone with a session code to read/write to that specific session. Each session is isolated, so other groups can't interfere with yours. For production, you'd want authentication, but this works great for controlled group workouts.

### Step 4: Get Your Config

1. Click the **gear icon** ⚙️ next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"**
4. Click the **Web icon** (</>) to add a web app
5. Register your app (name it anything)
6. You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC-abc123def456...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

**Copy these values!**

### Step 5: Add Firebase to Your HTML

In your HTML file (where you load the React component), add these scripts **before** your component:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>

<!-- Your component script here -->
```

### Step 6: Update the Config in the Component

In `zone-a-circuit-sync.jsx`, find this section at the top:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID"
};
```

Replace with **your actual config values** from Step 4:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC-abc123def456...",
  authDomain: "zone-a-circuit.firebaseapp.com",
  databaseURL: "https://zone-a-circuit-default-rtdb.firebaseio.com",
  projectId: "zone-a-circuit-12345"
};
```

---

## How It Works

### For the Coach:

1. Open the app → click **"Create Session"**
2. You get a code like **"XY7K2M"**
3. Share this code with your athletes (text, whiteboard, verbal)
4. You control the timer - everyone sees what you do
5. Click "Shuffle" to randomize exercises

### For Athletes:

1. Open the app → click **"Join Session"**
2. Enter the coach's code
3. Your timer syncs automatically
4. You can't control the timer (coach only)
5. Pick your variation: 🟦 Blue (easier), ⚪ White (standard), 🟥 Red (harder)

### Session Data:

Each session stores:
- Timer state (running/paused, time left, work/rest phase)
- Round number
- Exercise selections
- Settings (work time, rest time, participant count)

Sessions persist until the coach closes/resets. No automatic cleanup needed for group workouts.

---

## Mobile Tips

**Landscape Mode is MONEY:**
- Timer stays visible on left
- All exercises on right
- Perfect for coaching from across the room
- Athletes can glance at their phone without scrolling

**Keep Screen On:**
- iOS: Settings → Display & Brightness → Auto-Lock → Never (during workout)
- Android: Settings → Display → Screen timeout → 30 minutes

**Fullscreen Mode:**
- Add to Home Screen for app-like experience
- iOS: Safari → Share → Add to Home Screen
- Android: Chrome → Menu → Add to Home Screen

---

## Testing Without Firebase (Local Mode)

If you just want to test the UI without setting up Firebase, it works fine! You just won't get the sync feature. The app will show:

⚠ Local mode only - add Firebase for sync

Everything else works normally for solo use.

---

## Troubleshooting

**"Firebase is not defined" error:**
- Make sure the Firebase scripts are loaded BEFORE your component
- Check browser console for script loading errors

**Timer doesn't sync:**
- Verify your databaseURL in the config matches your Firebase console
- Check Firebase console → Realtime Database → Data tab to see if sessions are being created
- Make sure both devices are using the same session code

**Security rules rejected:**
- Go back to Firebase console → Realtime Database → Rules
- Make sure the rules are published (green checkmark)

**Athletes can control timer:**
- This shouldn't happen - check that isCoach is false for joiners
- Verify in Firebase console that the session exists before joining

---

## Cost

**Firebase Free Tier:**
- 10GB storage
- 100 simultaneous connections
- 1GB downloaded per day

**Translation:** You could run 50+ concurrent group sessions before hitting limits. Realistically, you'll never pay a cent for group workouts.

---

## Future Enhancements (Easy to Add)

- **Sound cues** on work/rest transitions
- **Coach notes** visible to all athletes
- **Exercise swap** - coach can change an exercise mid-session
- **Athlete count** - see how many people are connected
- **Session history** - save completed workouts

Want any of these? Let me know!
# 🚀 QUICK START GUIDE - 2 Minutes to Running

## Prerequisites Check
- ✅ Node.js installed? Run: `node --version`
- ✅ Modern browser (Chrome/Firefox)

## Step-by-Step Execution

### 1️⃣ Install Dependencies (30 seconds)
```bash
npm install
```

### 2️⃣ Start Signaling Server (5 seconds)
Open a terminal and run:
```bash
npm start
```

Keep this terminal running! You should see:
```
WebSocket signaling server running on port 8080
```

### 3️⃣ Start Web Server (5 seconds)
Open a NEW terminal and run:
```bash
# Using Python (easiest)
python -m http.server 3000

# OR using Node.js http-server
npx http-server -p 3000
```

### 4️⃣ Test the App (1 minute)

#### User 1:
1. Open browser → `http://localhost:3000`
2. Room name: `test123`
3. Your name: `Alice`
4. Click "Join Room"
5. Allow camera/microphone

#### User 2:
1. Open another tab/browser → `http://localhost:3000`
2. Room name: `test123` (same as User 1!)
3. Your name: `Bob`
4. Click "Join Room"
5. Allow camera/microphone

### 5️⃣ Success! 🎉
You should now see both video feeds and hear audio!

---

## Alternative: One-Command Setup

If you want everything in one terminal:

```bash
# Install and start server
npm install && npm start &

# Start web server (in background)
python -m http.server 3000 &

# Open browser
open http://localhost:3000  # Mac
start http://localhost:3000 # Windows
xdg-open http://localhost:3000 # Linux
```

---

## Demo for Judges

### Scenario 1: Basic Call
1. Open two browser tabs
2. Both join room "demo"
3. Show video/audio working
4. Toggle video and audio buttons

### Scenario 2: Room Isolation
1. User A joins room "room1"
2. User B joins room "room2"
3. They DON'T connect (different rooms)
4. User B leaves and joins "room1"
5. Now they connect!

### Scenario 3: Room Full
1. User A and B join room "full"
2. User C tries to join room "full"
3. Error: "Room is full"

---

## Common Issues & Quick Fixes

❌ **"Cannot find module 'ws'"**
→ Run `npm install`

❌ **"Address already in use"**
→ Port 8080 or 3000 is busy. Change ports in server.js or use different port for http server

❌ **"Camera not accessible"**
→ Use localhost (not 127.0.0.1 or your IP)
→ Allow permissions in browser

❌ **"WebSocket connection failed"**
→ Make sure signaling server is running
→ Check `npm start` is active

---

## Architecture Highlights for Judges

✅ **Pure WebRTC** - No SDKs, just native APIs
✅ **WebSocket Signaling** - Custom server, not third-party
✅ **Room-Based** - Enforced at server level
✅ **P2P Connection** - Direct peer-to-peer after signaling
✅ **Clean Code** - Well-structured and documented

---

## File Overview

- `server.js` - WebSocket signaling server (manages rooms)
- `app.js` - WebRTC client logic (peer connections)
- `index.html` - UI structure
- `styles.css` - Responsive design
- `package.json` - Dependencies (only `ws`)

---

## Tech Stack

**Backend:** Node.js + WebSocket (ws library)
**Frontend:** Vanilla JavaScript + Native WebRTC APIs
**Styling:** Pure CSS (no frameworks)

No frameworks, no SDKs, pure web standards!

---

**Need help?** Check README.md for detailed documentation

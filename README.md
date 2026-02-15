# WebRTC One-to-One Video Calling App

A real-time video calling application built with native WebRTC APIs and WebSocket signaling. Users can join rooms and have one-to-one video calls with room-based access control.

## Features

✅ **Native WebRTC** - Uses native WebRTC APIs (no third-party SDKs like Twilio or Daily)
✅ **Room-Based Access** - Only users in the same room can connect
✅ **WebSocket Signaling** - Custom signaling server for peer connection setup
✅ **Camera & Microphone Access** - Access to user's media devices
✅ **Video/Audio Controls** - Toggle video and audio on/off
✅ **Responsive Design** - Works on desktop and mobile devices
✅ **Real-Time Connection** - Peer-to-peer video streaming

## Architecture

### Components

1. **Signaling Server** (`server.js`)
   - Node.js WebSocket server
   - Manages rooms and participants
   - Routes signaling messages between peers
   - Enforces one-to-one connection limit

2. **Client Application** (`index.html`, `app.js`, `styles.css`)
   - Web interface for video calling
   - WebRTC peer connection management
   - Media stream handling
   - WebSocket client for signaling

### WebRTC Flow

```
User A                  Signaling Server              User B
  |                            |                         |
  |------ Join Room ---------> |                         |
  |                            |                         |
  |                            | <------ Join Room ------|
  |                            |                         |
  | <--- Peer Joined --------- | -------- Peer Joined -->|
  |                            |                         |
  |------ Offer ------------> |                         |
  |                            | -------- Offer -------> |
  |                            |                         |
  |                            | <------- Answer --------|
  | <----- Answer ------------ |                         |
  |                            |                         |
  |--- ICE Candidates -------> | --- ICE Candidates ---> |
  | <-- ICE Candidates ------- | <-- ICE Candidates ---- |
  |                            |                         |
  |========== P2P Video/Audio Connection ===============|
```

## Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)
- **HTTPS or localhost** (required for camera/microphone access)

## Installation & Setup

### Step 1: Install Dependencies

```bash
npm install
```

This will install:
- `ws` - WebSocket library for Node.js
- `nodemon` - Development server with auto-reload (optional)

### Step 2: Start the Signaling Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:8080`

You should see:
```
WebSocket signaling server running on port 8080
```

### Step 3: Serve the Client Application

You need to serve the HTML/CSS/JS files. You have several options:

#### Option A: Using Python (Simplest)

If you have Python installed:

```bash
# Python 3
python -m http.server 3000

# Python 2
python -m SimpleHTTPServer 3000
```

#### Option B: Using Node.js http-server

```bash
# Install globally
npm install -g http-server

# Run server
http-server -p 3000
```

#### Option C: Using VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Step 4: Open the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

## How to Use

### Starting a Video Call

1. **Open the Application**
   - Navigate to `http://localhost:3000` in your browser

2. **Join a Room**
   - Enter a room name (e.g., "room123")
   - Enter your name
   - Click "Join Room"
   - Allow camera and microphone access when prompted

3. **Wait for Peer**
   - You'll see your video in the bottom-right corner
   - Wait for another participant to join the same room

4. **Second User Joins**
   - Open the app in another browser tab/window or on another device
   - Enter the **same room name**
   - Enter their name
   - Click "Join Room"

5. **Connection Established**
   - Both users will see each other's video
   - Audio will be enabled automatically
   - Connection status will show "Connected"

### During the Call

- **Toggle Video**: Click the video camera icon to turn video on/off
- **Toggle Audio**: Click the microphone icon to mute/unmute
- **Leave Call**: Click "Leave Call" button to exit the room

### Testing Locally

To test with one device:

1. Open `http://localhost:3000` in one browser tab (User A)
2. Open `http://localhost:3000` in another tab (User B)
3. Use the same room name for both
4. Both users should connect and see each other

**Note**: You'll see your own video twice (local + remote) since it's the same device.

## Configuration

### Change WebSocket Server URL

In `app.js`, modify the `WEBSOCKET_URL`:

```javascript
const WEBSOCKET_URL = 'ws://localhost:8080';
```

For production, use your server's WebSocket URL:

```javascript
const WEBSOCKET_URL = 'wss://your-domain.com';
```

### Change Server Port

In `server.js`, modify the PORT:

```javascript
const PORT = process.env.PORT || 8080;
```

Or set environment variable:

```bash
PORT=9000 npm start
```

### Customize STUN Servers

In `app.js`, modify the `ICE_SERVERS`:

```javascript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};
```

## Project Structure

```
webrtc-video-call/
├── server.js           # WebSocket signaling server
├── app.js             # Client-side JavaScript (WebRTC logic)
├── index.html         # HTML structure
├── styles.css         # Styling
├── package.json       # Node.js dependencies
└── README.md          # Documentation
```

## Troubleshooting

### Camera/Microphone Access Denied

**Problem**: Browser doesn't request permission for camera/microphone

**Solution**: 
- Use HTTPS or localhost (HTTP only works on localhost)
- Check browser settings for camera/microphone permissions
- Try a different browser (Chrome/Firefox recommended)

### Connection Failed

**Problem**: Peers can't connect to each other

**Solution**:
- Ensure both users are in the same room
- Check that signaling server is running
- Verify WebSocket URL is correct
- Check browser console for errors
- Ensure firewall allows WebSocket connections

### Server Connection Failed

**Problem**: Can't connect to signaling server

**Solution**:
- Verify server is running (`npm start`)
- Check the WebSocket URL in `app.js`
- Ensure port 8080 is not blocked
- Check server logs for errors

### Video Not Showing

**Problem**: Local or remote video is black/not displaying

**Solution**:
- Verify camera is not being used by another app
- Check browser console for errors
- Ensure video track is enabled
- Try refreshing the page

### Room is Full Error

**Problem**: Can't join room - "Room is full" message

**Solution**:
- Only 2 participants allowed per room
- Use a different room name
- Wait for a participant to leave
- Ask existing participant to leave

## Browser Compatibility

✅ **Chrome/Chromium** - Full support
✅ **Firefox** - Full support
✅ **Safari** - Full support (iOS 11+)
✅ **Edge** - Full support
❌ **Internet Explorer** - Not supported

## Security Considerations

### For Production Deployment

1. **Use HTTPS/WSS**
   - WebRTC requires secure context
   - Use TLS certificates for HTTPS
   - Use WSS (WebSocket Secure) instead of WS

2. **Add Authentication**
   - Implement user authentication
   - Verify room access permissions
   - Rate limit connections

3. **Add TURN Server**
   - Add TURN server for NAT traversal
   - Required for some network configurations
   - Example: Coturn, Twilio TURN, etc.

4. **Validate Input**
   - Sanitize room names
   - Validate user IDs
   - Prevent injection attacks

## Performance Tips

1. **Video Quality**
   - Adjust resolution in `initializeMedia()` function
   - Lower resolution for mobile devices
   - Implement adaptive bitrate

2. **Connection Optimization**
   - Use multiple STUN servers
   - Add TURN server for reliability
   - Implement connection quality monitoring

3. **Scalability**
   - Use Redis for room management (multi-server setup)
   - Implement load balancing
   - Add reconnection logic

## Advanced Features (Not Implemented)

Potential enhancements:

- Screen sharing
- Recording functionality
- Text chat alongside video
- Group calls (mesh or SFU architecture)
- Virtual backgrounds
- Noise cancellation
- Beauty filters

## License

MIT License - Feel free to use this for your hackathon or personal projects!

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console errors
3. Verify server logs
4. Test with different browsers/devices

## Hackathon Submission Checklist

✅ Native WebRTC APIs (no third-party SDKs)
✅ Camera and microphone access
✅ Peer-to-peer connection established
✅ WebSocket signaling server
✅ Local and remote video display
✅ Room-based access control
✅ Clean, responsive UI
✅ Error handling
✅ Documentation

---

**Built with ❤️ using native WebRTC APIs**

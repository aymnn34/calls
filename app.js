// Configuration
const WEBSOCKET_URL = 'https://uusedtocallme.netlify.app/';
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Global state
let ws = null;
let peerConnection = null;
let localStream = null;
let roomName = null;
let clientId = null;
let isVideoEnabled = true;
let isAudioEnabled = true;

// DOM elements
const joinSection = document.getElementById('join-section');
const callSection = document.getElementById('call-section');
const roomInput = document.getElementById('room-input');
const nameInput = document.getElementById('name-input');
const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const currentRoomSpan = document.getElementById('current-room');
const joinError = document.getElementById('join-error');
const waitingMessage = document.getElementById('waiting-message');
const connectionStatus = document.getElementById('connection-status');
const toggleVideoBtn = document.getElementById('toggle-video');
const toggleAudioBtn = document.getElementById('toggle-audio');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  joinBtn.addEventListener('click', joinRoom);
  leaveBtn.addEventListener('click', leaveRoom);
  toggleVideoBtn.addEventListener('click', toggleVideo);
  toggleAudioBtn.addEventListener('click', toggleAudio);

  // Allow Enter key to join
  roomInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinRoom();
  });
  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinRoom();
  });
});

// Join room function
async function joinRoom() {
  const room = roomInput.value.trim();
  const name = nameInput.value.trim();

  if (!room) {
    showError('Please enter a room name');
    return;
  }

  if (!name) {
    showError('Please enter your name');
    return;
  }

  try {
    joinBtn.disabled = true;
    joinBtn.textContent = 'Joining...';
    showError('');

    // Generate unique client ID
    clientId = `${name}-${Date.now()}`;
    roomName = room;

    // Get user media
    await initializeMedia();

    // Connect to WebSocket
    await connectWebSocket();

    // Join the room
    sendMessage({
      type: 'join',
      room: roomName,
      id: clientId
    });

  } catch (error) {
    console.error('Error joining room:', error);
    showError(error.message || 'Failed to join room. Please check your camera/microphone permissions.');
    joinBtn.disabled = false;
    joinBtn.textContent = 'Join Room';
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
  }
}

// Initialize media (camera and microphone)
async function initializeMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    localVideo.srcObject = localStream;
    console.log('Local media initialized');
  } catch (error) {
    console.error('Error accessing media devices:', error);
    throw new Error('Could not access camera/microphone. Please grant permissions.');
  }
}

// Connect to WebSocket signaling server
function connectWebSocket() {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log('WebSocket connected');
      updateStatus('Connected to signaling server');
      resolve();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      reject(new Error('Failed to connect to signaling server'));
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      updateStatus('Disconnected from server');
      
      // Clean up if we're still in a call
      if (callSection.classList.contains('hidden') === false) {
        alert('Connection to server lost. Please rejoin.');
        leaveRoom();
      }
    };

    ws.onmessage = handleSignalingMessage;
  });
}

// Handle incoming signaling messages
async function handleSignalingMessage(event) {
  try {
    const data = JSON.parse(event.data);
    console.log('Received message:', data.type);

    switch (data.type) {
      case 'joined':
        handleJoined();
        break;
      case 'peer-joined':
        handlePeerJoined(data);
        break;
      case 'offer':
        await handleOffer(data);
        break;
      case 'answer':
        await handleAnswer(data);
        break;
      case 'ice-candidate':
        await handleIceCandidate(data);
        break;
      case 'peer-left':
        handlePeerLeft();
        break;
      case 'error':
        handleServerError(data);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  } catch (error) {
    console.error('Error handling signaling message:', error);
  }
}

// Handle successful room join
function handleJoined() {
  console.log('Successfully joined room:', roomName);
  
  // Switch to call section
  joinSection.classList.add('hidden');
  callSection.classList.remove('hidden');
  currentRoomSpan.textContent = roomName;
  
  updateStatus('Waiting for another participant...');
  waitingMessage.style.display = 'flex';
}

// Handle peer joining the room
async function handlePeerJoined(data) {
  console.log('Peer joined:', data.peerId);
  updateStatus('Peer joined. Establishing connection...');
  
  // Close existing peer connection if any
  if (peerConnection) {
    console.log('Closing existing peer connection');
    peerConnection.close();
    peerConnection = null;
  }
  
  // Create new peer connection
  createPeerConnection();
  
  // Create and send offer
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    sendMessage({
      type: 'offer',
      room: roomName,
      offer: offer
    });
    
    console.log('Offer sent');
  } catch (error) {
    console.error('Error creating offer:', error);
    updateStatus('Failed to create connection');
  }
}

// Create WebRTC peer connection
function createPeerConnection() {
  if (peerConnection) {
    console.log('Peer connection already exists');
    return;
  }

  console.log('Creating peer connection');
  peerConnection = new RTCPeerConnection(ICE_SERVERS);

  // Add local stream tracks to peer connection
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
    console.log('Added local track:', track.kind);
  });

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('Sending ICE candidate');
      sendMessage({
        type: 'ice-candidate',
        room: roomName,
        candidate: event.candidate
      });
    }
  };

  // Handle remote stream
  peerConnection.ontrack = (event) => {
    console.log('Received remote track:', event.track.kind);
    
    if (!remoteVideo.srcObject) {
      remoteVideo.srcObject = event.streams[0];
      waitingMessage.style.display = 'none';
      updateStatus('Connected');
      console.log('Remote stream set');
    }
  };

  // Handle connection state changes
  peerConnection.onconnectionstatechange = () => {
    console.log('Connection state:', peerConnection.connectionState);
    
    switch (peerConnection.connectionState) {
      case 'connected':
        updateStatus('Connected');
        break;
      case 'disconnected':
        updateStatus('Disconnected');
        break;
      case 'failed':
        updateStatus('Connection failed');
        break;
      case 'closed':
        updateStatus('Connection closed');
        break;
    }
  };

  // Handle ICE connection state changes
  peerConnection.oniceconnectionstatechange = () => {
    console.log('ICE connection state:', peerConnection.iceConnectionState);
  };
}

// Handle incoming offer
async function handleOffer(data) {
  console.log('Received offer');
  
  // Create peer connection if it doesn't exist
  if (!peerConnection) {
    createPeerConnection();
  }
  
  // If peer connection is in wrong state, reset it
  if (peerConnection.signalingState !== 'stable' && peerConnection.signalingState !== 'have-local-offer') {
    console.log('Peer connection in wrong state, resetting...');
    peerConnection.close();
    peerConnection = null;
    createPeerConnection();
  }

  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    console.log('Remote description set (offer)');
    
    // Create and send answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    sendMessage({
      type: 'answer',
      room: roomName,
      answer: answer
    });
    
    console.log('Answer sent');
  } catch (error) {
    console.error('Error handling offer:', error);
    updateStatus('Failed to establish connection. Try refreshing.');
  }
}

// Handle incoming answer
async function handleAnswer(data) {
  console.log('Received answer');
  
  if (!peerConnection) {
    console.error('No peer connection exists');
    return;
  }
  
  // Only set remote description if we're expecting an answer
  if (peerConnection.signalingState !== 'have-local-offer') {
    console.log('Not expecting answer, current state:', peerConnection.signalingState);
    return;
  }
  
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    console.log('Remote description set (answer)');
  } catch (error) {
    console.error('Error handling answer:', error);
    updateStatus('Connection error. Try refreshing the page.');
  }
}

// Handle incoming ICE candidate
async function handleIceCandidate(data) {
  console.log('Received ICE candidate');
  
  if (!peerConnection) {
    console.log('No peer connection yet, ignoring ICE candidate');
    return;
  }
  
  // Only add ICE candidates after remote description is set
  if (peerConnection.remoteDescription) {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      console.log('ICE candidate added');
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  } else {
    console.log('Remote description not set yet, ignoring ICE candidate');
  }
}

// Handle peer leaving
function handlePeerLeft() {
  console.log('Peer left the room');
  updateStatus('Peer left. Waiting for another participant...');
  
  // Stop remote video
  if (remoteVideo.srcObject) {
    remoteVideo.srcObject.getTracks().forEach(track => track.stop());
    remoteVideo.srcObject = null;
  }
  
  // Close peer connection
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  
  waitingMessage.style.display = 'flex';
}

// Handle server errors
function handleServerError(data) {
  console.error('Server error:', data.message);
  alert(data.message);
  leaveRoom();
}

// Leave room function
function leaveRoom() {
  console.log('Leaving room');

  // Send leave message
  if (ws && ws.readyState === WebSocket.OPEN) {
    sendMessage({
      type: 'leave',
      room: roomName
    });
  }

  // Close WebSocket
  if (ws) {
    ws.close();
    ws = null;
  }

  // Close peer connection
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  // Stop local stream
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  // Stop remote video
  if (remoteVideo.srcObject) {
    remoteVideo.srcObject.getTracks().forEach(track => track.stop());
    remoteVideo.srcObject = null;
  }

  // Reset UI
  callSection.classList.add('hidden');
  joinSection.classList.remove('hidden');
  joinBtn.disabled = false;
  joinBtn.textContent = 'Join Room';
  roomInput.value = '';
  nameInput.value = '';
  showError('');
  
  // Reset state
  roomName = null;
  clientId = null;
  isVideoEnabled = true;
  isAudioEnabled = true;
  toggleVideoBtn.classList.remove('off');
  toggleAudioBtn.classList.remove('off');
}

// Toggle video
function toggleVideo() {
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      isVideoEnabled = !isVideoEnabled;
      videoTrack.enabled = isVideoEnabled;
      toggleVideoBtn.classList.toggle('off', !isVideoEnabled);
      console.log('Video:', isVideoEnabled ? 'enabled' : 'disabled');
    }
  }
}

// Toggle audio
function toggleAudio() {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      isAudioEnabled = !isAudioEnabled;
      audioTrack.enabled = isAudioEnabled;
      toggleAudioBtn.classList.toggle('off', !isAudioEnabled);
      console.log('Audio:', isAudioEnabled ? 'enabled' : 'disabled');
    }
  }
}

// Send message through WebSocket
function sendMessage(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.error('WebSocket is not connected');
  }
}

// Update status message
function updateStatus(message) {
  connectionStatus.textContent = message;
}

// Show error message
function showError(message) {
  joinError.textContent = message;
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    sendMessage({
      type: 'leave',
      room: roomName
    });
  }
});

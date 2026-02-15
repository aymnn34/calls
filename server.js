const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store rooms and their participants
const rooms = new Map();

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  let currentRoom = null;
  let clientId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data.type, 'from room:', data.room);

      switch (data.type) {
        case 'join':
          handleJoin(ws, data);
          break;
        case 'offer':
        case 'answer':
        case 'ice-candidate':
          handleSignaling(data);
          break;
        case 'leave':
          handleLeave();
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    handleLeave();
  });

  function handleJoin(ws, data) {
    const { room, id } = data;
    
    // If client is already in a room, handle it
    if (currentRoom && currentRoom !== room) {
      handleLeave();
    }
    
    currentRoom = room;
    clientId = id;

    // Create room if it doesn't exist
    if (!rooms.has(room)) {
      rooms.set(room, new Map());
    }

    const roomParticipants = rooms.get(room);

    // Check if this client is already in the room (reconnection)
    if (roomParticipants.has(id)) {
      console.log(`Client ${id} is reconnecting to room ${room}`);
      roomParticipants.set(id, ws);
      
      // Notify about reconnection
      ws.send(JSON.stringify({
        type: 'joined',
        room: room,
        id: id
      }));
      
      // Notify other participant about reconnection
      roomParticipants.forEach((participantWs, participantId) => {
        if (participantId !== id && participantWs.readyState === WebSocket.OPEN) {
          participantWs.send(JSON.stringify({
            type: 'peer-joined',
            peerId: id
          }));
        }
      });
      return;
    }

    // Check if room already has 2 participants
    if (roomParticipants.size >= 2) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Room is full. Maximum 2 participants allowed.'
      }));
      return;
    }

    // Add client to room
    roomParticipants.set(id, ws);
    console.log(`Client ${id} joined room ${room}. Total participants: ${roomParticipants.size}`);

    // Notify the client they joined successfully
    ws.send(JSON.stringify({
      type: 'joined',
      room: room,
      id: id
    }));

    // If there's another participant, notify both to start connection
    if (roomParticipants.size === 2) {
      const otherParticipant = Array.from(roomParticipants.entries()).find(([otherId]) => otherId !== id);
      
      if (otherParticipant) {
        const [otherId, otherWs] = otherParticipant;
        
        // Tell the existing participant about the new joiner
        otherWs.send(JSON.stringify({
          type: 'peer-joined',
          peerId: id
        }));

        // Tell the new joiner about the existing participant
        ws.send(JSON.stringify({
          type: 'peer-joined',
          peerId: otherId
        }));
      }
    }
  }

  function handleSignaling(data) {
    if (!currentRoom) return;

    const roomParticipants = rooms.get(currentRoom);
    if (!roomParticipants) return;

    // Forward signaling message to the other participant in the room
    roomParticipants.forEach((participantWs, participantId) => {
      if (participantId !== clientId && participantWs.readyState === WebSocket.OPEN) {
        participantWs.send(JSON.stringify({
          ...data,
          from: clientId
        }));
      }
    });
  }

  function handleLeave() {
    if (currentRoom && clientId) {
      const roomParticipants = rooms.get(currentRoom);
      
      if (roomParticipants) {
        // Notify other participant
        roomParticipants.forEach((participantWs, participantId) => {
          if (participantId !== clientId && participantWs.readyState === WebSocket.OPEN) {
            participantWs.send(JSON.stringify({
              type: 'peer-left',
              peerId: clientId
            }));
          }
        });

        // Remove client from room
        roomParticipants.delete(clientId);

        // Clean up empty rooms
        if (roomParticipants.size === 0) {
          rooms.delete(currentRoom);
          console.log(`Room ${currentRoom} deleted (empty)`);
        }
      }

      console.log(`Client ${clientId} left room ${currentRoom}`);
      currentRoom = null;
      clientId = null;
    }
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket signaling server running on port ${PORT}`);
});

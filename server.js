const express = require('express');

// Silence console in production
if (process.env.NODE_ENV === 'production') {
  ['log', 'warn', 'info', 'debug', 'error'].forEach((m) => {
    // eslint-disable-next-line no-console
    console[m] = () => {};
  });
}

const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Import modules
const gameRoutes = require('./src/routes/gameRoutes');
const socketHandlers = require('./src/socket/socketHandlers');
const autoFinalizationService = require('./src/services/autoFinalizationService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,    // 60 seconds
  pingInterval: 25000,   // 25 seconds
  transports: ['websocket', 'polling']
});     
       
// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/games', gameRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'RPS MagicBlock Backend Server',
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  socketHandlers.handleSocketConnection(socket, io);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`RPS MagicBlock Backend Server running on port ${PORT}`);
  console.log(`WebSocket server ready for real-time gameplay`);
  
  // Initialize auto-finalization service
  console.log(`🚀 Initializing auto-finalization service...`);
  autoFinalizationService.initializeService().then(() => {
    console.log(`✅ Modern blockchain game UX: Winners get SOL automatically!`);
  }).catch(err => {
    console.error(`❌ Failed to initialize auto-finalization service:`, err);
  });
}); 
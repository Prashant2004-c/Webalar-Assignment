const express = require('express');
require('dotenv').config({quiet: true});
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { initializeSocketEvents } = require('./services/socketService');


const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const actionLogRoutes = require('./routes/actionLogRoutes');

const app = express();
const server = http.createServer(app);
connectDB();

const PORT = process.env.PORT || 5050;

// Define allowed origins based on environment variables for production
const CLIENT_LOCAL_ORIGIN = 'http://localhost:5173';
const CLIENT_DEPLOYED_ORIGIN = process.env.CLIENT_DEPLOYED_ORIGIN; // This will be set on Render for the frontend

const allowedOrigins = [CLIENT_LOCAL_ORIGIN];
if (CLIENT_DEPLOYED_ORIGIN) {
  allowedOrigins.push(CLIENT_DEPLOYED_ORIGIN);
}

// CORS Options for Express
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO CORS Configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Socket.IO can take an array of origins directly
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

initializeSocketEvents(io);

app.set('io', io);

app.get('/', (req, res) => { 
  res.json({ message: 'Welcome to the Todo Board API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/actions', actionLogRoutes);


server.listen(PORT, () => {
  console.log(`Server started on PORT ${PORT}`);
});


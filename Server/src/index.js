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

const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new Server(server, {
  cors: {
    origin: '*',
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


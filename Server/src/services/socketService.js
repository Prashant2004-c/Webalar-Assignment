
const activeUsers = new Map();


const activeEditors = new Map();


exports.initializeSocketEvents = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user authentication
    socket.on('authenticate', (userData) => {
      if (userData && userData.userId) {
        // Store user data
        activeUsers.set(socket.id, {
          userId: userData.userId,
          username: userData.username
        });

        // Join user's personal room
        socket.join(`user:${userData.userId}`);

        // Notify others that user is online
        socket.broadcast.emit('user_online', {
          userId: userData.userId,
          username: userData.username
        });

        // Send active users list to the newly connected user
        const users = Array.from(activeUsers.values());
        socket.emit('active_users', users);
      }
    });

    // Handle task editing
    socket.on('start_editing', (taskData) => {
      const user = activeUsers.get(socket.id);
      if (!user || !taskData.taskId) return;

      // Add user to active editors for this task
      if (!activeEditors.has(taskData.taskId)) {
        activeEditors.set(taskData.taskId, new Map());
      }
      
      const taskEditors = activeEditors.get(taskData.taskId);
      taskEditors.set(user.userId, {
        userId: user.userId,
        username: user.username,
        socketId: socket.id
      });

      // Notify all users that someone is editing this task
      io.emit('editing_task', {
        taskId: taskData.taskId,
        editors: Array.from(taskEditors.values())
      });
    });

    // Handle task editing stopped
    socket.on('stop_editing', (taskData) => {
      const user = activeUsers.get(socket.id);
      if (!user || !taskData.taskId) return;

      // Remove user from active editors for this task
      if (activeEditors.has(taskData.taskId)) {
        const taskEditors = activeEditors.get(taskData.taskId);
        taskEditors.delete(user.userId);

        // If no one is editing this task anymore, delete the task entry
        if (taskEditors.size === 0) {
          activeEditors.delete(taskData.taskId);
        }

        // Notify all users that someone stopped editing this task
        io.emit('editing_task', {
          taskId: taskData.taskId,
          editors: Array.from(taskEditors.values() || [])
        });
      }
    });

    // Handle task created
    socket.on('task_created', (taskData) => {
      // Broadcast to all clients
      socket.broadcast.emit('task_created', taskData);
    });

    // Handle task updated
    socket.on('task_updated', (taskData) => {
      // Broadcast to all clients
      socket.broadcast.emit('task_updated', taskData);
    });

    // Handle task deleted
    socket.on('task_deleted', (taskData) => {
      // Broadcast to all clients
      socket.broadcast.emit('task_deleted', taskData);
    });

    // Handle task moved
    socket.on('task_moved', (taskData) => {
      // Broadcast to all clients
      socket.broadcast.emit('task_moved', taskData);
    });

    // Handle task assigned
    socket.on('task_assigned', (taskData) => {
      // Broadcast to all clients
      socket.broadcast.emit('task_assigned', taskData);

      // Send specific notification to assigned user
      if (taskData.assignedTo) {
        io.to(`user:${taskData.assignedTo}`).emit('task_assigned_to_you', taskData);
      }
    });

    // Handle action logged
    socket.on('action_logged', (actionData) => {
      // Broadcast to all clients
      socket.broadcast.emit('action_logged', actionData);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      // Get user data
      const user = activeUsers.get(socket.id);
      if (user) {
        // Remove user from active users
        activeUsers.delete(socket.id);

        // Notify others that user is offline
        socket.broadcast.emit('user_offline', {
          userId: user.userId,
          username: user.username
        });

        // Remove user from all active editors
        for (const [taskId, editors] of activeEditors.entries()) {
          if (editors.has(user.userId)) {
            editors.delete(user.userId);

            // If no one is editing this task anymore, delete the task entry
            if (editors.size === 0) {
              activeEditors.delete(taskId);
            } else {
              // Notify all users that someone stopped editing this task
              io.emit('editing_task', {
                taskId,
                editors: Array.from(editors.values())
              });
            }
          }
        }
      }
    });
  });
};

/**
 * Emit an event to all connected clients
 * @param {Object} io - Socket.IO server instance
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
exports.emitToAll = (io, event, data) => {
  io.emit(event, data);
};

/**
 * Emit an event to a specific user
 * @param {Object} io - Socket.IO server instance
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
exports.emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Get active editors for a task
 * @param {string} taskId - Task ID
 * @returns {Array} - Array of active editors
 */
exports.getActiveEditors = (taskId) => {
  if (!activeEditors.has(taskId)) {
    return [];
  }
  
  return Array.from(activeEditors.get(taskId).values());
};
import { Server } from 'socket.io';
import Notification from './models/Notification.js';
import User from './models/User.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const userId = socket.handshake.auth.userId;
      if (!userId) {
        return next(new Error('Authentication required'));
      }

      const user = await User.findById(userId);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = userId;
      socket.userRole = user.role;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(` User ${socket.userId} connected to WebSocket`);

    // Join user's personal room
    socket.join(`user_${socket.userId}`);

    // Join role-based room for broadcasts
    socket.join(`role_${socket.userRole}`);

    // Handle high-priority notification acknowledgment
    socket.on('acknowledge_alert', async (notificationId) => {
      await Notification.findByIdAndUpdate(notificationId, {
        isRead: true,
        readAt: new Date(),
        deliveryStatus: 'DELIVERED'
      });

      socket.emit('alert_acknowledged', { notificationId });
    });

    socket.on('disconnect', () => {
      console.log(` User ${socket.userId} disconnected from WebSocket`);
    });
  });

  console.log(' Socket.io initialized');
  return io;
};

// Helper to emit notifications to a specific user
export const emitNotification = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit('new_notification', notification);
  }
};

// Helper to emit broadcast to a role
export const emitBroadcast = (role, notification) => {
  if (io) {
    io.to(`role_${role}`).emit('broadcast', notification);
  }
};

// Helper to emit SOS alerts
export const emitSOS = (notification) => {
  if (io) {
    io.to('role_admin').emit('sos_alert', notification);
  }
};

export default { initSocket, emitNotification, emitBroadcast, emitSOS };
import { Server, Socket } from 'socket.io';

export const setupNotificationSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;

    // Join room based on role
    if (user) {
      socket.join(`role:${user.role}`);
      socket.join(`user:${user.id}`);
    }

    // Handle ambulance accepting an emergency
    socket.on('ambulance:accept', (data: { emergencyId: string }) => {
      io.to('role:ers_officer').emit('notification', {
        type: 'ambulance_accepted',
        message: 'Ambulance accepted the emergency assignment',
        data,
      });
    });

    // Handle emergency status updates
    socket.on('emergency:update', (data: { emergencyId: string; status: string; message: string }) => {
      io.emit('emergency:status', {
        emergencyId: data.emergencyId,
        status: data.status,
        message: data.message,
      });
    });

    // Handle traffic clearance confirmation
    socket.on('traffic:cleared', (data: { emergencyId: string }) => {
      io.to('role:ers_officer').emit('notification', {
        type: 'traffic_cleared',
        message: 'Traffic police confirmed route clearance',
        data,
      });
    });
  });
};

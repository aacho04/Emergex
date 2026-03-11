import { Server, Socket } from 'socket.io';
import Ambulance from '../modules/ambulance/ambulance.model';
import TrafficPolice from '../modules/traffic-police/traffic.model';

export const setupLocationSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;

    if (user) {
      socket.join(`user:${user.id}`);
      socket.join(`role:${user.role}`);
      console.log(`User connected: ${user.username} (${user.role})`);
    }

    // Ambulance location update
    socket.on('ambulance:update-location', async (data: { lat: number; lng: number }) => {
      try {
        if (user) {
          await Ambulance.findOneAndUpdate(
            { user: user.id },
            {
              currentLocation: {
                type: 'Point',
                coordinates: [data.lng, data.lat],
              },
            }
          );

          io.emit('ambulance:location', {
            userId: user.id,
            location: data,
          });
        }
      } catch (error) {
        console.error('Error updating ambulance location:', error);
      }
    });

    // Traffic police location update
    socket.on('traffic:update-location', async (data: { lat: number; lng: number }) => {
      try {
        if (user) {
          await TrafficPolice.findOneAndUpdate(
            { user: user.id },
            {
              currentLocation: {
                type: 'Point',
                coordinates: [data.lng, data.lat],
              },
            }
          );

          io.emit('traffic:location', {
            userId: user.id,
            location: data,
          });
        }
      } catch (error) {
        console.error('Error updating traffic police location:', error);
      }
    });

    socket.on('disconnect', () => {
      if (user) {
        console.log(`User disconnected: ${user.username}`);
      }
    });
  });
};

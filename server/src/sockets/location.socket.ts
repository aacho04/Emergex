import { Server, Socket } from 'socket.io';
import Ambulance from '../modules/ambulance/ambulance.model';
import TrafficPolice from '../modules/traffic-police/traffic.model';
import Volunteer from '../modules/volunteer/volunteer.model';

export const setupLocationSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;

    if (user) {
      socket.join(`user:${user.id}`);
      socket.join(`role:${user.role}`);
      console.log(`User connected: ${user.username} (${user.role})`);
    }

    // Ambulance location update — broadcasts to all listeners for live tracking
    socket.on('ambulance:update-location', async (data: { lat: number; lng: number }) => {
      try {
        if (user) {
          const ambulance = await Ambulance.findOneAndUpdate(
            { user: user.id },
            {
              currentLocation: {
                type: 'Point',
                coordinates: [data.lng, data.lat],
              },
            },
            { new: true }
          );

          if (ambulance) {
            // Broadcast to everyone tracking this ambulance (volunteers, traffic police, ERS)
            io.emit('ambulance:location', {
              userId: user.id,
              ambulanceId: ambulance._id,
              emergencyId: ambulance.currentEmergency,
              location: data,
            });
          }
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

    // Volunteer location update
    socket.on('volunteer:update-location', async (data: { volunteerId: string; lat: number; lng: number }) => {
      try {
        await Volunteer.findByIdAndUpdate(data.volunteerId, {
          location: {
            type: 'Point',
            coordinates: [data.lng, data.lat],
          },
        });

        io.emit('volunteer:location', {
          volunteerId: data.volunteerId,
          location: { lat: data.lat, lng: data.lng },
        });
      } catch (error) {
        console.error('Error updating volunteer location:', error);
      }
    });

    socket.on('disconnect', () => {
      if (user) {
        console.log(`User disconnected: ${user.username}`);
      }
    });
  });
};

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { prismaService } from './prisma.service';

export interface SocketUser {
  userId: number;
  userType: 'service_provider' | 'consumer';
  socketId: string;
}

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', async (data: { userId: number; userType: 'service_provider' | 'consumer' }) => {
        try {
          // Verify user exists
          if (data.userType === 'service_provider') {
            const user = await prismaService.getPrismaClient().serviceProvider.findUnique({
              where: { id: data.userId }
            });
            if (!user) {
              socket.emit('auth_error', { message: 'Service provider not found' });
              return;
            }
          } else {
            const user = await prismaService.getPrismaClient().consumer.findUnique({
              where: { id: data.userId }
            });
            if (!user) {
              socket.emit('auth_error', { message: 'Consumer not found' });
              return;
            }
          }

          // Store user connection
          this.connectedUsers.set(socket.id, {
            userId: data.userId,
            userType: data.userType,
            socketId: socket.id
          });

          // Join user-specific room
          socket.join(`${data.userType}_${data.userId}`);
          
          socket.emit('authenticated', { message: 'Successfully authenticated' });
          console.log(`User authenticated: ${data.userType} ${data.userId}`);
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Handle joining conversation
      socket.on('join_conversation', (conversationId: number) => {
        socket.join(`conversation_${conversationId}`);
        console.log(`User joined conversation: ${conversationId}`);
      });

      // Handle leaving conversation
      socket.on('leave_conversation', (conversationId: number) => {
        socket.leave(`conversation_${conversationId}`);
        console.log(`User left conversation: ${conversationId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.connectedUsers.delete(socket.id);
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  }

  // Send message to specific conversation
  public sendMessageToConversation(conversationId: number, message: any) {
    this.io.to(`conversation_${conversationId}`).emit('new_message', message);
  }

  // Send message to specific user
  public sendMessageToUser(userId: number, userType: 'service_provider' | 'consumer', message: any) {
    this.io.to(`${userType}_${userId}`).emit('new_message', message);
  }

  // Send notification to user
  public sendNotification(userId: number, userType: 'service_provider' | 'consumer', notification: any) {
    this.io.to(`${userType}_${userId}`).emit('notification', notification);
  }

  // Check if user is online
  public isUserOnline(userId: number, userType: 'service_provider' | 'consumer'): boolean {
    for (const user of this.connectedUsers.values()) {
      if (user.userId === userId && user.userType === userType) {
        return true;
      }
    }
    return false;
  }

  // Get all online users
  public getOnlineUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  // Get socket instance
  public getIO(): SocketIOServer {
    return this.io;
  }
}

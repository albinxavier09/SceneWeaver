import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { getProjectRole, hasProjectAccess } from './database';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  cursor?: {
    x: number;
    y: number;
    sceneId?: string;
  };
  isActive: boolean;
  lastSeen: Date;
}

interface ProjectRoom {
  projectId: string;
  users: Map<string, User>;
  lastActivity: Date;
}

class CollaborationServer {
  private io: SocketIOServer;
  private projectRooms: Map<string, ProjectRoom> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Join project room
      socket.on('join-project', async (data: { projectId: string; userId: string; userInfo: any }) => {
        try {
          const { projectId, userId, userInfo } = data;
          
          // Verify user has access to project
          const hasAccess = await hasProjectAccess(parseInt(projectId), parseInt(userId));
          if (!hasAccess) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          // Get user role
          const role = await getProjectRole(parseInt(projectId), parseInt(userId));
          
          // Join socket room
          socket.join(`project-${projectId}`);
          
          // Add user to project room
          if (!this.projectRooms.has(projectId)) {
            this.projectRooms.set(projectId, {
              projectId,
              users: new Map(),
              lastActivity: new Date()
            });
          }

          const projectRoom = this.projectRooms.get(projectId)!;
          const user: User = {
            id: userId,
            name: userInfo.name,
            email: userInfo.email,
            role: role || 'owner',
            isActive: true,
            lastSeen: new Date()
          };

          projectRoom.users.set(userId, user);
          projectRoom.lastActivity = new Date();

          // Notify all users in the project about the new user
          this.io.to(`project-${projectId}`).emit('user-joined', {
            user,
            onlineUsers: Array.from(projectRoom.users.values())
          });

          // Send current online users to the new user
          socket.emit('online-users', Array.from(projectRoom.users.values()));

          console.log(`User ${userInfo.name} joined project ${projectId}`);
        } catch (error) {
          console.error('Error joining project:', error);
          socket.emit('error', { message: 'Failed to join project' });
        }
      });

      // Handle cursor movement
      socket.on('cursor-move', (data: { projectId: string; userId: string; cursor: { x: number; y: number; sceneId?: string } }) => {
        const { projectId, userId, cursor } = data;
        const projectRoom = this.projectRooms.get(projectId);
        
        if (projectRoom && projectRoom.users.has(userId)) {
          const user = projectRoom.users.get(userId)!;
          user.cursor = cursor;
          user.lastSeen = new Date();
          
          // Broadcast cursor position to other users
          socket.to(`project-${projectId}`).emit('user-cursor-move', {
            userId,
            cursor
          });
        }
      });

      // Handle scene updates
      socket.on('scene-update', (data: { projectId: string; userId: string; sceneId: string; updates: any }) => {
        const { projectId, userId, sceneId, updates } = data;
        const projectRoom = this.projectRooms.get(projectId);
        
        if (projectRoom && projectRoom.users.has(userId)) {
          const user = projectRoom.users.get(userId)!;
          user.lastSeen = new Date();
          projectRoom.lastActivity = new Date();
          
          // Broadcast scene update to other users
          socket.to(`project-${projectId}`).emit('scene-updated', {
            sceneId,
            updates,
            updatedBy: {
              id: user.id,
              name: user.name,
              role: user.role
            }
          });
        }
      });

      // Handle node position updates
      socket.on('node-move', (data: { projectId: string; userId: string; nodeId: string; position: { x: number; y: number } }) => {
        const { projectId, userId, nodeId, position } = data;
        const projectRoom = this.projectRooms.get(projectId);
        
        if (projectRoom && projectRoom.users.has(userId)) {
          const user = projectRoom.users.get(userId)!;
          user.lastSeen = new Date();
          projectRoom.lastActivity = new Date();
          
          // Broadcast node movement to other users
          socket.to(`project-${projectId}`).emit('node-moved', {
            nodeId,
            position,
            movedBy: {
              id: user.id,
              name: user.name,
              role: user.role
            }
          });
        }
      });

      // Handle node resize updates
      socket.on('node-resize', (data: { projectId: string; userId: string; nodeId: string; dimensions: { width: number; height: number } }) => {
        const { projectId, userId, nodeId, dimensions } = data;
        const projectRoom = this.projectRooms.get(projectId);
        
        if (projectRoom && projectRoom.users.has(userId)) {
          const user = projectRoom.users.get(userId)!;
          user.lastSeen = new Date();
          projectRoom.lastActivity = new Date();
          
          // Broadcast node resize to other users
          socket.to(`project-${projectId}`).emit('node-resized', {
            nodeId,
            dimensions,
            resizedBy: {
              id: user.id,
              name: user.name,
              role: user.role
            }
          });
        }
      });

      // Handle connection updates
      socket.on('connection-update', (data: { projectId: string; userId: string; connection: any }) => {
        const { projectId, userId, connection } = data;
        const projectRoom = this.projectRooms.get(projectId);
        
        if (projectRoom && projectRoom.users.has(userId)) {
          const user = projectRoom.users.get(userId)!;
          user.lastSeen = new Date();
          projectRoom.lastActivity = new Date();
          
          // Broadcast connection update to other users
          socket.to(`project-${projectId}`).emit('connection-updated', {
            connection,
            updatedBy: {
              id: user.id,
              name: user.name,
              role: user.role
            }
          });
        }
      });

      // Handle user activity
      socket.on('user-activity', (data: { projectId: string; userId: string; activity: string }) => {
        const { projectId, userId, activity } = data;
        const projectRoom = this.projectRooms.get(projectId);
        
        if (projectRoom && projectRoom.users.has(userId)) {
          const user = projectRoom.users.get(userId)!;
          user.lastSeen = new Date();
          projectRoom.lastActivity = new Date();
          
          // Broadcast activity to other users
          socket.to(`project-${projectId}`).emit('user-activity-update', {
            userId,
            activity,
            user: {
              id: user.id,
              name: user.name,
              role: user.role
            }
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        // Find and remove user from all project rooms
        for (const [projectId, projectRoom] of this.projectRooms.entries()) {
          for (const [userId, user] of projectRoom.users.entries()) {
            if (user.id === socket.id) {
              projectRoom.users.delete(userId);
              
              // Notify other users about the disconnection
              this.io.to(`project-${projectId}`).emit('user-left', {
                userId,
                onlineUsers: Array.from(projectRoom.users.values())
              });
              
              // Clean up empty rooms
              if (projectRoom.users.size === 0) {
                this.projectRooms.delete(projectId);
              }
              break;
            }
          }
        }
      });
    });
  }

  public getIO() {
    return this.io;
  }
}

export default CollaborationServer;

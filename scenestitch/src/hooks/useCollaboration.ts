import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface User {
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

interface CollaborationState {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: User[];
  currentUser: User | null;
}

export function useCollaboration(projectId: string, userInfo: { id: string; name: string; email: string }) {
  const [state, setState] = useState<CollaborationState>({
    socket: null,
    isConnected: false,
    onlineUsers: [],
    currentUser: null
  });

  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!projectId || !userInfo.id) return;

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      transports: ['websocket'],
      upgrade: true,
      rememberUpgrade: true
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to collaboration server');
      setState(prev => ({ ...prev, isConnected: true }));
      
      // Join project room
      socket.emit('join-project', {
        projectId,
        userId: userInfo.id,
        userInfo
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
      setState(prev => ({ ...prev, isConnected: false }));
    });

    // User events
    socket.on('user-joined', (data: { user: User; onlineUsers: User[] }) => {
      console.log('User joined:', data.user.name);
      setState(prev => ({
        ...prev,
        onlineUsers: data.onlineUsers,
        currentUser: data.onlineUsers.find(u => u.id === userInfo.id) || prev.currentUser
      }));
    });

    socket.on('user-left', (data: { userId: string; onlineUsers: User[] }) => {
      console.log('User left:', data.userId);
      setState(prev => ({
        ...prev,
        onlineUsers: data.onlineUsers,
        currentUser: data.onlineUsers.find(u => u.id === userInfo.id) || prev.currentUser
      }));
    });

    socket.on('online-users', (users: User[]) => {
      setState(prev => ({
        ...prev,
        onlineUsers: users,
        currentUser: users.find(u => u.id === userInfo.id) || prev.currentUser
      }));
    });

    // Cursor events
    socket.on('user-cursor-move', (data: { userId: string; cursor: { x: number; y: number; sceneId?: string } }) => {
      setState(prev => ({
        ...prev,
        onlineUsers: prev.onlineUsers.map(user => 
          user.id === data.userId 
            ? { ...user, cursor: data.cursor, lastSeen: new Date() }
            : user
        )
      }));
    });

    // Scene events
    socket.on('scene-updated', (data: { sceneId: string; updates: any; updatedBy: any }) => {
      console.log('Scene updated by:', data.updatedBy.name);
      // This will be handled by the parent component
    });

    socket.on('node-moved', (data: { nodeId: string; position: { x: number; y: number }; movedBy: any }) => {
      console.log('Node moved by:', data.movedBy.name);
      // This will be handled by the parent component
    });

    socket.on('node-resized', (data: { nodeId: string; dimensions: { width: number; height: number }; resizedBy: any }) => {
      console.log('Node resized by:', data.resizedBy.name);
      // This will be handled by the parent component
    });

    socket.on('connection-updated', (data: { connection: any; updatedBy: any }) => {
      console.log('Connection updated by:', data.updatedBy.name);
      // This will be handled by the parent component
    });

    socket.on('user-activity-update', (data: { userId: string; activity: string; user: any }) => {
      console.log('User activity:', data.user.name, data.activity);
      // This will be handled by the parent component
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Collaboration error:', error.message);
    });

    setState(prev => ({ ...prev, socket }));

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, userInfo.id, userInfo.name, userInfo.email]);

  // Send cursor movement
  const sendCursorMove = useCallback((cursor: { x: number; y: number; sceneId?: string }) => {
    if (socketRef.current && state.isConnected) {
      socketRef.current.emit('cursor-move', {
        projectId,
        userId: userInfo.id,
        cursor
      });
    }
  }, [projectId, userInfo.id, state.isConnected]);

  // Send scene update
  const sendSceneUpdate = useCallback((sceneId: string, updates: any) => {
    if (socketRef.current && state.isConnected) {
      socketRef.current.emit('scene-update', {
        projectId,
        userId: userInfo.id,
        sceneId,
        updates
      });
    }
  }, [projectId, userInfo.id, state.isConnected]);

  // Send node movement
  const sendNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    if (socketRef.current && state.isConnected) {
      socketRef.current.emit('node-move', {
        projectId,
        userId: userInfo.id,
        nodeId,
        position
      });
    }
  }, [projectId, userInfo.id, state.isConnected]);

  // Send node resize
  const sendNodeResize = useCallback((nodeId: string, dimensions: { width: number; height: number }) => {
    if (socketRef.current && state.isConnected) {
      socketRef.current.emit('node-resize', {
        projectId,
        userId: userInfo.id,
        nodeId,
        dimensions
      });
    }
  }, [projectId, userInfo.id, state.isConnected]);

  // Send connection update
  const sendConnectionUpdate = useCallback((connection: any) => {
    if (socketRef.current && state.isConnected) {
      socketRef.current.emit('connection-update', {
        projectId,
        userId: userInfo.id,
        connection
      });
    }
  }, [projectId, userInfo.id, state.isConnected]);

  // Send user activity
  const sendUserActivity = useCallback((activity: string) => {
    if (socketRef.current && state.isConnected) {
      socketRef.current.emit('user-activity', {
        projectId,
        userId: userInfo.id,
        activity
      });
    }
  }, [projectId, userInfo.id, state.isConnected]);

  return {
    ...state,
    sendCursorMove,
    sendSceneUpdate,
    sendNodeMove,
    sendNodeResize,
    sendConnectionUpdate,
    sendUserActivity
  };
}

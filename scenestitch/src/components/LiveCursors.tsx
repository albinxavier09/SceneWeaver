import { useEffect, useState } from 'react';
import { User } from '@/hooks/useCollaboration';

interface LiveCursorsProps {
  onlineUsers: User[];
  currentUserId: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function LiveCursors({ onlineUsers, currentUserId, containerRef }: LiveCursorsProps) {
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number; user: User }>>(new Map());

  useEffect(() => {
    const otherUsers = onlineUsers.filter(user => user.id !== currentUserId);
    const newCursors = new Map();

    otherUsers.forEach(user => {
      if (user.cursor) {
        newCursors.set(user.id, {
          x: user.cursor.x,
          y: user.cursor.y,
          user
        });
      }
    });

    setCursors(newCursors);
  }, [onlineUsers, currentUserId]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return '#f59e0b'; // yellow-500
      case 'editor':
        return '#3b82f6'; // blue-500
      case 'viewer':
        return '#6b7280'; // gray-500
      default:
        return '#6b7280';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return '👑';
      case 'editor':
        return '✏️';
      case 'viewer':
        return '👁️';
      default:
        return '👤';
    }
  };

  if (!containerRef.current) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {Array.from(cursors.entries()).map(([userId, cursorData]) => {
        const { x, y, user } = cursorData;
        const color = getRoleColor(user.role);
        
        return (
          <div
            key={userId}
            className="absolute transition-all duration-100 ease-out"
            style={{
              left: x,
              top: y,
              transform: 'translate(-2px, -2px)'
            }}
          >
            {/* Cursor */}
            <div
              className="w-4 h-4 relative"
              style={{ color }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="drop-shadow-sm"
              >
                <path
                  d="M2 2L2 12L6 8L8 10L10 8L6 4L2 2Z"
                  fill={color}
                  stroke="white"
                  strokeWidth="0.5"
                />
              </svg>
            </div>
            
            {/* User Label */}
            <div
              className="absolute top-4 left-2 px-2 py-1 rounded-md text-xs font-medium text-white whitespace-nowrap shadow-lg"
              style={{ backgroundColor: color }}
            >
              <div className="flex items-center space-x-1">
                <span>{getRoleIcon(user.role)}</span>
                <span>{user.name}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

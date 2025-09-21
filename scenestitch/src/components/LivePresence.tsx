import { useState, useEffect } from 'react';
import { Users, Circle, Crown, Edit, Eye, Activity } from 'lucide-react';

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

interface LivePresenceProps {
  onlineUsers: User[];
  currentUserId: string;
  isConnected: boolean;
}

export default function LivePresence({ onlineUsers, currentUserId, isConnected }: LivePresenceProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-yellow-600" />;
      case 'editor':
        return <Edit className="h-3 w-3 text-blue-600" />;
      case 'viewer':
        return <Eye className="h-3 w-3 text-gray-600" />;
      default:
        return <Users className="h-3 w-3 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'editor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500' : 'bg-gray-400';
  };

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const otherUsers = onlineUsers.filter(user => user.id !== currentUserId);
  const currentUser = onlineUsers.find(user => user.id === currentUserId);

  return (
    <div className="relative">
      {/* Presence Indicator */}
      <div 
        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <Users className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {onlineUsers.length} online
          </span>
        </div>
        {isConnected && (
          <div className="flex -space-x-1">
            {otherUsers.slice(0, 3).map((user, index) => (
              <div
                key={user.id}
                className="w-6 h-6 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700"
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {otherUsers.length > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                +{otherUsers.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed Presence Panel */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Live Collaboration</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Current User */}
            {currentUser && (
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 mb-2">You</div>
                <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{currentUser.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(currentUser.role)}`}>
                        {getRoleIcon(currentUser.role)}
                        <span className="ml-1 capitalize">{currentUser.role}</span>
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{currentUser.email}</div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(currentUser.isActive)}`}></div>
                    <span className="text-xs text-gray-500">Active</span>
                  </div>
                </div>
              </div>
            )}

            {/* Other Users */}
            {otherUsers.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">Team Members</div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {otherUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{user.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="ml-1 capitalize">{user.role}</span>
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                        {user.cursor && (
                          <div className="text-xs text-blue-600 flex items-center space-x-1">
                            <Activity className="h-3 w-3" />
                            <span>Editing scene</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(user.isActive)}`}></div>
                        <span className="text-xs text-gray-500">
                          {user.isActive ? 'Active' : formatLastSeen(user.lastSeen)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {otherUsers.length === 0 && (
              <div className="text-center py-4">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No other team members online</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

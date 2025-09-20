export interface CollaborationCursor {
  userId: string;
  x: number;
  y: number;
  color: string;
  name: string;
}

export interface CollaborationEvent {
  type: "cursor_move" | "scene_edit" | "scene_move" | "scene_select" | "comment_add";
  userId: string;
  data: any;
  timestamp: string;
}

export const generateUserColor = (userId: string): string => {
  const colors = [
    "#3B82F6", // blue
    "#10B981", // emerald
    "#F59E0B", // amber
    "#EF4444", // red
    "#8B5CF6", // violet
    "#06B6D4", // cyan
    "#F97316", // orange
    "#84CC16", // lime
  ];
  
  // Generate consistent color based on userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export const getUserDisplayName = (userId: string): string => {
  // In a real app, this would look up the user's display name
  const names = {
    "user-123": "You",
    "john-doe": "John Doe",
    "sarah-miller": "Sarah Miller", 
    "alex-lee": "Alex Lee",
  };
  
  return names[userId as keyof typeof names] || `User ${userId.slice(-4)}`;
};

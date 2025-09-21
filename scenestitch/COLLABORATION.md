# Real-Time Collaboration Features

SceneWeaver now includes comprehensive real-time collaboration features that allow multiple users to work together on storyboard projects simultaneously.

## 🚀 Features Implemented

### 1. **Live Presence System**
- **Online User Indicators**: See who's currently online in the project
- **Role-Based Display**: Different icons and colors for owners, editors, and viewers
- **Activity Status**: Shows if users are active or when they were last seen
- **Real-Time Updates**: Presence updates instantly when users join/leave

### 2. **Real-Time Scene Updates**
- **Live Scene Editing**: Changes to scenes are synchronized across all users
- **Node Movement**: See other users moving and resizing scene nodes in real-time
- **Connection Updates**: New connections between scenes appear instantly for all users
- **Collaborative Editing**: Multiple users can edit different scenes simultaneously

### 3. **Live Cursors**
- **Cursor Tracking**: See other users' mouse cursors on the canvas
- **User Identification**: Cursors show user names and roles with color coding
- **Scene Context**: Cursors indicate which scene users are working on
- **Smooth Animation**: Cursors move smoothly and update in real-time

### 4. **Team Management**
- **Role-Based Permissions**: Owner, Editor, and Viewer roles with different capabilities
- **Invitation System**: Invite team members via email with secure tokens
- **Team Panel**: Manage team members, roles, and pending invitations
- **Activity Logging**: Track all collaboration activities and changes

## 🛠️ Technical Implementation

### WebSocket Infrastructure
- **Socket.IO Server**: Handles real-time communication
- **Room-Based Architecture**: Each project has its own collaboration room
- **Event-Driven Updates**: Efficient real-time synchronization
- **Connection Management**: Automatic reconnection and error handling

### Database Schema
- **project_members**: Team member management
- **project_invitations**: Invitation system with tokens
- **activity_log**: Collaboration activity tracking
- **Permission System**: Role-based access control

### Frontend Components
- **useCollaboration Hook**: Manages WebSocket connection and state
- **LivePresence Component**: Shows online users and their status
- **LiveCursors Component**: Displays other users' cursors
- **CollaborationPanel**: Team management interface

## 🚀 Getting Started

### 1. Start the Collaboration Server
```bash
# Development mode
npm run dev:collab

# Production mode
npm run start:collab
```

### 2. Environment Configuration
Create a `.env.local` file with:
```env
NEXT_PUBLIC_WS_URL=http://localhost:3001
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Using Collaboration Features

#### For Project Owners:
1. **Invite Team Members**: Click the "Team" button to open the collaboration panel
2. **Send Invitations**: Enter email addresses and select roles (Editor/Viewer)
3. **Manage Roles**: Change team member roles or remove members
4. **View Activity**: See all collaboration activities in the team panel

#### For Team Members:
1. **Accept Invitations**: Click invitation links in emails
2. **Join Projects**: Automatically join projects you have access to
3. **Collaborate**: See other users' cursors and changes in real-time
4. **Edit Scenes**: Make changes that sync instantly with other users

## 🎯 User Roles

### **Owner**
- Full project control
- Invite and manage team members
- Edit all scenes and connections
- Delete projects and scenes

### **Editor**
- Create and edit scenes
- Move and resize nodes
- Create connections between scenes
- View all project content

### **Viewer**
- View all project content
- See live cursors and updates
- Cannot make changes
- Read-only access

## 🔧 Real-Time Events

### Client → Server
- `join-project`: Join a project collaboration room
- `cursor-move`: Send cursor position updates
- `scene-update`: Send scene content changes
- `node-move`: Send node position changes
- `node-resize`: Send node dimension changes
- `connection-update`: Send connection changes
- `user-activity`: Send user activity updates

### Server → Client
- `user-joined`: New user joined the project
- `user-left`: User left the project
- `online-users`: Current online users list
- `user-cursor-move`: Other user's cursor moved
- `scene-updated`: Scene was updated by another user
- `node-moved`: Node was moved by another user
- `node-resized`: Node was resized by another user
- `connection-updated`: Connection was updated by another user
- `user-activity-update`: User activity update

## 🎨 UI Components

### Live Presence Indicator
- Shows number of online users
- Displays user avatars
- Connection status indicator
- Click to see detailed user list

### Collaboration Panel
- Team member management
- Invitation system
- Role management
- Activity feed

### Live Cursors
- Real-time cursor tracking
- User identification
- Role-based color coding
- Smooth animations

## 🔒 Security Features

- **Permission Validation**: All actions are validated against user roles
- **Secure Invitations**: Time-limited tokens for project invitations
- **Access Control**: Users can only access projects they're members of
- **Activity Logging**: All collaboration activities are logged

## 🚀 Performance Optimizations

- **Efficient Updates**: Only changed data is transmitted
- **Room-Based Broadcasting**: Updates only sent to relevant users
- **Connection Pooling**: Efficient WebSocket connection management
- **Debounced Events**: Cursor movements are debounced to reduce traffic

## 🐛 Troubleshooting

### Common Issues
1. **WebSocket Connection Failed**: Check if the collaboration server is running
2. **Users Not Appearing**: Verify user has access to the project
3. **Cursors Not Showing**: Check if the canvas container ref is properly set
4. **Updates Not Syncing**: Verify WebSocket connection is active

### Debug Mode
Enable console logging to see real-time events:
```javascript
// In browser console
localStorage.setItem('debug', 'collaboration:*');
```

## 🔮 Future Enhancements

- **Voice Chat**: Integrated voice communication
- **Screen Sharing**: Share screen during collaboration
- **Version History**: Track and revert changes
- **Comments System**: Add comments to scenes
- **Notification System**: Real-time notifications for changes
- **Mobile Support**: Mobile-optimized collaboration features

---

**SceneWeaver Collaboration** - Bringing teams together for better storytelling! 🎬✨

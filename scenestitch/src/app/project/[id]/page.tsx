'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  NodeResizer,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, ArrowLeft, Save, Users, Bell } from 'lucide-react';
import { 
  Add, 
  ArrowBack, 
  Save as SaveIcon,
  AutoAwesome,
  Dashboard,
  Movie,
  Note
} from '@mui/icons-material';
import SceneNode from '@/components/SceneNode';
import CollaborationPanel from '@/components/CollaborationPanel';
import LivePresence from '@/components/LivePresence';
import LiveCursors from '@/components/LiveCursors';
import NotificationCenter from '@/components/NotificationCenter';
import { useCollaboration } from '@/hooks/useCollaboration';

  const nodeTypes = {
    scene: SceneNode,
  };

  const defaultViewport = { x: 0, y: 0, zoom: 1 };

interface Project {
  id: number;
  name: string;
  description: string;
}

interface Scene {
  id: number;
  title: string;
  description: string;
  image_url: string;
  dialogue: string;
  technical_details: string;
  status: string;
  tags: string;
  notes: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateScene, setShowCreateScene] = useState(false);
  const [newScene, setNewScene] = useState({ title: '', description: '' });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [userRole, setUserRole] = useState<string>('owner');
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [userInfo, setUserInfo] = useState<{ id: string; name: string; email: string } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Initialize collaboration
  const collaboration = useCollaboration(projectId, userInfo || { id: '', name: '', email: '' });

  // Handle node changes
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    // Mark as unsaved when nodes are being modified
    if (changes.some((change: any) => change.type === 'position' || change.type === 'remove' || change.type === 'add' || change.type === 'dimensions')) {
      setSaveStatus('unsaved');
    }
    
    // Handle resize changes
    changes.forEach((change: any) => {
      if (change.type === 'dimensions' && change.dimensions) {
        const nodeId = change.id;
        const { width, height } = change.dimensions;
        
        // Update the node's dimensions in the database
        updateNodeDimensions(parseInt(nodeId), width, height);
        
        // Send real-time update
        collaboration.sendNodeResize(nodeId, { width, height });
      }
      
      if (change.type === 'position' && change.position) {
        const nodeId = change.id;
        const { x, y } = change.position;
        
        // Send real-time update
        collaboration.sendNodeMove(nodeId, { x, y });
      }
    });
  }, [onNodesChange, collaboration]);

  const updateNodeDimensions = async (nodeId: number, width: number, height: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/scenes/${nodeId}/dimensions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ width, height }),
      });
      
      if (response.ok) {
        console.log('Node dimensions updated successfully');
      }
    } catch (error) {
      console.error('Error updating node dimensions:', error);
    }
  };

  // Handle edge changes
  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    // Mark as unsaved when edges are being modified
    if (changes.some((change: any) => change.type === 'remove' || change.type === 'add')) {
      setSaveStatus('unsaved');
    }
  }, [onEdgesChange]);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchScenes();
      fetchUserRole();
      fetchUserInfo();
      fetchNotificationCount();
    }
  }, [projectId]);

  // Real-time collaboration event listeners
  useEffect(() => {
    if (!collaboration.socket) return;

    const socket = collaboration.socket;

    const handleSceneUpdate = (data: { sceneId: string; updates: any; updatedBy: any }) => {
      console.log('Received scene update from:', data.updatedBy.name);
      // Handle scene updates from other users
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === data.sceneId 
            ? { ...node, data: { ...node.data, ...data.updates } }
            : node
        )
      );
    };

    const handleNodeMove = (data: { nodeId: string; position: { x: number; y: number }; movedBy: any }) => {
      console.log('Received node move from:', data.movedBy.name);
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === data.nodeId 
            ? { ...node, position: data.position }
            : node
        )
      );
    };

    const handleNodeResize = (data: { nodeId: string; dimensions: { width: number; height: number }; resizedBy: any }) => {
      console.log('Received node resize from:', data.resizedBy.name);
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === data.nodeId 
            ? { ...node, style: { ...node.style, width: data.dimensions.width, height: data.dimensions.height } }
            : node
        )
      );
    };

    const handleConnectionUpdate = (data: { connection: any; updatedBy: any }) => {
      console.log('Received connection update from:', data.updatedBy.name);
      // Handle connection updates from other users
      if (data.connection) {
        setEdges(prevEdges => addEdge(data.connection, prevEdges));
      }
    };

    socket.on('scene-updated', handleSceneUpdate);
    socket.on('node-moved', handleNodeMove);
    socket.on('node-resized', handleNodeResize);
    socket.on('connection-updated', handleConnectionUpdate);

    return () => {
      socket.off('scene-updated', handleSceneUpdate);
      socket.off('node-moved', handleNodeMove);
      socket.off('node-resized', handleNodeResize);
      socket.off('connection-updated', handleConnectionUpdate);
    };
  }, [collaboration.socket, setNodes, setEdges]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchUserRole = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/role`);
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.user);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const fetchScenes = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/scenes`);
      if (response.ok) {
        const data = await response.json();
        setScenes(data.scenes || []);
        
        // Convert scenes to nodes
        const sceneNodes: Node[] = data.scenes.map((scene: Scene) => ({
          id: scene.id.toString(),
          type: 'scene',
          position: { x: scene.position_x || Math.random() * 400, y: scene.position_y || Math.random() * 400 },
          data: { 
            label: scene.title,
            scene: scene,
            onUpdate: handleSceneUpdate
          },
          style: {
            width: scene.width || 300,
            height: scene.height || 400,
            minWidth: 250,
            minHeight: 200,
            maxWidth: 500,
            maxHeight: 800,
          },
          resizing: true,
        }));
        
        setNodes(sceneNodes);
        
        // Fetch and set connections
        await fetchConnections();
      }
    } catch (error) {
      console.error('Error fetching scenes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/scenes`);
      if (response.ok) {
        const data = await response.json();
        const connections = data.connections || [];
        
        // Convert connections to edges
        const sceneEdges: Edge[] = connections.map((conn: any) => ({
          id: `e${conn.from_scene_id}-${conn.to_scene_id}`,
          source: conn.from_scene_id.toString(),
          target: conn.to_scene_id.toString(),
          type: 'smoothstep',
          animated: false,
        }));
        
        setEdges(sceneEdges);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const handleCreateScene = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScene.title.trim()) return;

    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/projects/${projectId}/scenes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newScene),
      });

      if (response.ok) {
        setNewScene({ title: '', description: '' });
        setShowCreateScene(false);
        await fetchScenes();
        setSaveStatus('saved');
        setLastSaved(new Date());
      } else {
        setSaveStatus('unsaved');
      }
    } catch (error) {
      console.error('Error creating scene:', error);
      setSaveStatus('unsaved');
    }
  };

  // Function to handle scene updates from SceneNode
  const handleSceneUpdate = useCallback(async () => {
    console.log('🔄 handleSceneUpdate called - refreshing scene data');
    setSaveStatus('saving');
    // Refresh scene data from database
    await fetchScenes();
    console.log('✅ Scene data refreshed from database');
    // Reset to saved after a short delay
    setTimeout(() => {
      setSaveStatus('saved');
      setLastSaved(new Date());
    }, 500);
  }, []);

  const onConnect = useCallback(
    async (params: Connection) => {
      if (params.source && params.target) {
        setEdges((eds) => addEdge(params, eds));
        setSaveStatus('saving');
        
        // Send real-time update
        collaboration.sendConnectionUpdate(params);
        
        // Save connection to database
        try {
          await fetch(`/api/projects/${projectId}/connections`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fromSceneId: params.source,
              toSceneId: params.target,
              connectionType: 'default'
            }),
          });
          setSaveStatus('saved');
          setLastSaved(new Date());
        } catch (error) {
          console.error('Error saving connection:', error);
          setSaveStatus('unsaved');
        }
      }
    },
    [setEdges, projectId, collaboration]
  );

  const onNodeDragStop = useCallback(
    async (event: any, node: Node) => {
      setSaveStatus('saving');
      
      // Save node position to database
      try {
        await fetch(`/api/projects/${projectId}/scenes/${node.id}/position`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            positionX: node.position.x,
            positionY: node.position.y
          }),
        });
        setSaveStatus('saved');
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error saving position:', error);
        setSaveStatus('unsaved');
      }
    },
    [projectId]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600 font-doodle-body">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-doodle-title text-gray-900 mb-4">Project not found</h1>
          <p className="text-gray-600 font-doodle-body mb-8">This project doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors font-doodle-fun inline-flex items-center"
          >
            <Dashboard className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-black transition-colors p-2"
              >
                <ArrowBack className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-doodle-title text-gray-900">{project.name}</h1>
                {project.description && (
                  <p className="text-sm font-doodle-body text-gray-600">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Save Status Indicator */}
              <div className="flex items-center space-x-2 text-sm">
                {saveStatus === 'saving' && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                    <span>Saving...</span>
                  </div>
                )}
                {saveStatus === 'saved' && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>Saved</span>
                    {lastSaved && (
                      <span className="text-gray-500">
                        {lastSaved.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                )}
                {saveStatus === 'unsaved' && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span>Unsaved</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <LivePresence 
                  onlineUsers={collaboration.onlineUsers}
                  currentUserId={userInfo?.id || ''}
                  isConnected={collaboration.isConnected}
                />
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors inline-flex items-center space-x-2 font-doodle-fun"
                >
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowCollaboration(!showCollaboration)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors inline-flex items-center space-x-2 font-doodle-fun"
                >
                  <Users className="h-4 w-4" />
                  <span>Team</span>
                </button>
              </div>
              <button
                onClick={() => setShowCreateScene(true)}
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors inline-flex items-center space-x-2 font-doodle-fun"
              >
                <Add className="h-4 w-4" />
                <span>Add Scene</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Storyboard Canvas */}
        <div className={`flex-1 transition-all duration-300 ${showCollaboration ? 'w-2/3' : 'w-full'} relative`} ref={canvasRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onMouseMove={(event) => {
              if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                collaboration.sendCursorMove({ x, y });
              }
            }}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            selectNodesOnDrag={false}
            panOnDrag={true}
            zoomOnScroll={true}
            panOnScroll={false}
            preventScrolling={true}
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
          
          {/* Live Cursors */}
          <LiveCursors 
            onlineUsers={collaboration.onlineUsers}
            currentUserId={userInfo?.id || ''}
            containerRef={canvasRef}
          />
        </div>

        {/* Collaboration Panel */}
        {showCollaboration && (
          <div className="w-1/3 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
            <CollaborationPanel projectId={parseInt(projectId)} userRole={userRole} />
          </div>
        )}
      </div>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Create Scene Modal */}
      {showCreateScene && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-doodle-title mb-4">Create New Scene</h2>
            <form onSubmit={handleCreateScene} className="space-y-4">
              <div>
                <label className="flex items-center space-x-2 text-sm font-doodle-fun text-gray-700 mb-2">
                  <Movie className="h-4 w-4" />
                  <span>Scene Title</span>
                </label>
                <input
                  type="text"
                  value={newScene.title}
                  onChange={(e) => setNewScene({ ...newScene, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black font-doodle-body"
                  placeholder="Enter scene title"
                  required
                />
              </div>
              <div>
                <label className="flex items-center space-x-2 text-sm font-doodle-fun text-gray-700 mb-2">
                  <Note className="h-4 w-4" />
                  <span>Description (Optional)</span>
                </label>
                <textarea
                  value={newScene.description}
                  onChange={(e) => setNewScene({ ...newScene, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black font-doodle-body resize-none"
                  placeholder="Enter scene description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateScene(false)}
                  className="px-4 py-2 text-gray-600 hover:text-black transition-colors font-doodle-fun"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors font-doodle-fun"
                >
                  Create Scene
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

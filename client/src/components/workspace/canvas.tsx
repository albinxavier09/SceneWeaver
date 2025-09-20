import { useRef, useState, useCallback } from "react";
import { Scene } from "@shared/schema";
import SceneCard from "@/components/workspace/scene-card";
import { useCanvas } from "@/hooks/use-canvas";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CanvasProps {
  scenes: Scene[];
  selectedSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
  tool: "select" | "add-scene" | "comment";
  projectId: string;
  sendMessage: (message: any) => void;
}

interface CollaborationCursor {
  userId: string;
  x: number;
  y: number;
  color: string;
  name: string;
}

export default function Canvas({ 
  scenes, 
  selectedSceneId, 
  onSceneSelect, 
  tool, 
  projectId,
  sendMessage 
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [collaborationCursors, setCollaborationCursors] = useState<CollaborationCursor[]>([]);
  const queryClient = useQueryClient();
  
  const { zoom, pan, handleZoom, handlePan } = useCanvas();

  const createSceneMutation = useMutation({
    mutationFn: async (position: { x: number; y: number }) => {
      const maxOrder = Math.max(...scenes.map(s => s.order), 0);
      return apiRequest("POST", `/api/projects/${projectId}/scenes`, {
        title: "New Scene",
        description: "",
        dialogue: "",
        characters: [],
        cameraNote: "",
        mood: "neutral",
        duration: 5000,
        position,
        order: maxOrder + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "scenes"] });
    },
  });

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (tool === "add-scene") {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;
        createSceneMutation.mutate({ x, y });
      }
    }
  }, [tool, pan, zoom, createSceneMutation]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      sendMessage({
        type: "cursor_move",
        data: { x, y },
      });
    }
  }, [sendMessage]);

  return (
    <div 
      ref={canvasRef}
      className="w-full h-full relative overflow-hidden bg-background cursor-crosshair"
      style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        cursor: tool === "add-scene" ? "crosshair" : "default",
      }}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      data-testid="canvas"
    >
      {/* Canvas Content */}
      <div
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: '0 0',
        }}
      >
        {/* Scene Cards */}
        {scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            isSelected={selectedSceneId === scene.id}
            onSelect={() => onSceneSelect(scene.id)}
            projectId={projectId}
            sendMessage={sendMessage}
          />
        ))}

        {/* Connection Lines */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          style={{ zIndex: -1 }}
        >
          <defs>
            <marker 
              id="arrowhead" 
              markerWidth="10" 
              markerHeight="7" 
              refX="10" 
              refY="3.5" 
              orient="auto"
            >
              <polygon 
                points="0 0, 10 3.5, 0 7" 
                fill="hsl(var(--muted-foreground))" 
              />
            </marker>
          </defs>
          {scenes
            .sort((a, b) => a.order - b.order)
            .slice(0, -1)
            .map((scene, index) => {
              const nextScene = scenes.find(s => s.order === scene.order + 1);
              if (!nextScene || !scene.position || !nextScene.position) return null;
              
              return (
                <line
                  key={`${scene.id}-${nextScene.id}`}
                  x1={scene.position.x + 160}
                  y1={scene.position.y + 100}
                  x2={nextScene.position.x}
                  y2={nextScene.position.y + 100}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                  strokeDasharray="5,5"
                />
              );
            })}
        </svg>

        {/* Add Scene Button (when not in add-scene mode) */}
        {tool !== "add-scene" && (
          <Button
            className="absolute rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-shadow"
            style={{ top: 300, left: 900 }}
            onClick={(e) => {
              e.stopPropagation();
              const rect = canvasRef.current?.getBoundingClientRect();
              if (rect) {
                const x = (900 - pan.x) / zoom;
                const y = (300 - pan.y) / zoom;
                createSceneMutation.mutate({ x, y });
              }
            }}
            data-testid="button-add-scene-canvas"
          >
            <Plus className="w-6 h-6" />
          </Button>
        )}
      </div>

      {/* Collaboration Cursors */}
      {collaborationCursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute pointer-events-none z-50"
          style={{ 
            top: cursor.y, 
            left: cursor.x,
            transform: 'translate(-2px, -2px)',
          }}
        >
          <div className="flex items-center">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: cursor.color }}
            />
            <div 
              className="ml-2 px-2 py-1 rounded text-xs font-medium text-white shadow-sm"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.name}
            </div>
          </div>
        </div>
      ))}

      {/* Tool Instructions */}
      {tool === "add-scene" && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium shadow-lg">
          Click anywhere to add a new scene
        </div>
      )}
    </div>
  );
}

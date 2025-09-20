import { Button } from "@/components/ui/button";
import { Scene } from "@shared/schema";
import { MousePointer, Plus, MessageSquare, Sparkles, Quote, ExpandIcon, Image } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  scenes: Scene[];
  selectedSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
  tool: "select" | "add-scene" | "comment";
  onToolChange: (tool: "select" | "add-scene" | "comment") => void;
  projectId: string;
}

export default function Sidebar({ 
  scenes, 
  selectedSceneId, 
  onSceneSelect, 
  tool, 
  onToolChange, 
  projectId 
}: SidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSceneMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = Math.max(...scenes.map(s => s.order), 0);
      return apiRequest("POST", `/api/projects/${projectId}/scenes`, {
        title: "New Scene",
        description: "",
        dialogue: "",
        characters: [],
        cameraNote: "",
        mood: "neutral",
        duration: 5000,
        position: { x: 100 + scenes.length * 50, y: 100 + scenes.length * 50 },
        order: maxOrder + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "scenes"] });
      toast({
        title: "Scene created",
        description: "New scene added to storyboard",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create scene",
        variant: "destructive",
      });
    },
  });

  const generateDialogueMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSceneId) throw new Error("No scene selected");
      const scene = scenes.find(s => s.id === selectedSceneId);
      if (!scene) throw new Error("Scene not found");
      
      return apiRequest("POST", "/api/ai/improve-dialogue", {
        dialogue: scene.dialogue || "Add some dialogue here...",
        mood: scene.mood || "neutral",
        context: scene.description || "",
      });
    },
    onSuccess: () => {
      toast({
        title: "AI assistance",
        description: "Dialogue suggestions generated",
      });
    },
  });

  const expandSceneMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSceneId) throw new Error("No scene selected");
      const scene = scenes.find(s => s.id === selectedSceneId);
      if (!scene) throw new Error("Scene not found");
      
      return apiRequest("POST", "/api/ai/expand-scene", {
        title: scene.title,
        description: scene.description || "",
        duration: scene.duration || 5000,
      });
    },
    onSuccess: () => {
      toast({
        title: "AI assistance",
        description: "Scene ideas expanded",
      });
    },
  });

  const generateReferenceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSceneId) throw new Error("No scene selected");
      const scene = scenes.find(s => s.id === selectedSceneId);
      if (!scene) throw new Error("Scene not found");
      
      return apiRequest("POST", "/api/ai/generate-reference", {
        description: scene.description || scene.title,
        style: "photorealistic",
      });
    },
    onSuccess: () => {
      toast({
        title: "AI assistance",
        description: "Reference image generated",
      });
    },
  });

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* Tools Section */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold mb-3">Tools</h3>
        <div className="space-y-2">
          <Button
            variant={tool === "select" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => onToolChange("select")}
            data-testid="tool-select"
          >
            <MousePointer className="w-4 h-4 mr-3" />
            Select
          </Button>
          <Button
            variant={tool === "add-scene" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => onToolChange("add-scene")}
            data-testid="tool-add-scene"
          >
            <Plus className="w-4 h-4 mr-3" />
            Add Scene
          </Button>
          <Button
            variant={tool === "comment" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => onToolChange("comment")}
            data-testid="tool-comment"
          >
            <MessageSquare className="w-4 h-4 mr-3" />
            Comment
          </Button>
        </div>
      </div>

      {/* Scenes List */}
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Scenes</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createSceneMutation.mutate()}
            disabled={createSceneMutation.isPending}
            data-testid="button-add-scene"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="space-y-2">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className={`p-2 rounded-md cursor-pointer transition-colors ${
                selectedSceneId === scene.id 
                  ? "bg-primary/10 border border-primary/20" 
                  : "hover:bg-secondary"
              }`}
              onClick={() => onSceneSelect(scene.id)}
              data-testid={`scene-item-${scene.id}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" data-testid={`scene-title-${scene.id}`}>
                  {scene.title}
                </span>
                <span className="text-xs text-muted-foreground" data-testid={`scene-duration-${scene.id}`}>
                  {((scene.duration || 0) / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* AI Assistant Panel */}
        <div className="mt-6 p-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-emerald-800">AI Assistant</span>
          </div>
          <p className="text-xs text-emerald-700 mb-3">Need help with your storyboard?</p>
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 h-8"
              onClick={() => generateDialogueMutation.mutate()}
              disabled={!selectedSceneId || generateDialogueMutation.isPending}
              data-testid="button-generate-dialogue"
            >
              <Quote className="w-3 h-3 mr-1" />
              Generate dialogue
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 h-8"
              onClick={() => expandSceneMutation.mutate()}
              disabled={!selectedSceneId || expandSceneMutation.isPending}
              data-testid="button-expand-scene"
            >
              <ExpandIcon className="w-3 h-3 mr-1" />
              Expand scene ideas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 h-8"
              onClick={() => generateReferenceMutation.mutate()}
              disabled={!selectedSceneId || generateReferenceMutation.isPending}
              data-testid="button-generate-reference"
            >
              <Image className="w-3 h-3 mr-1" />
              Generate references
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

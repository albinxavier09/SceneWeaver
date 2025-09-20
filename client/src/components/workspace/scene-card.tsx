import { useState, useRef } from "react";
import { Scene, Comment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash, Sparkles, Music, Expand, Brush, Upload, Bot } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DrawingModal from "./drawing-modal";
import ImageUploadModal from "./image-upload-modal";

interface SceneCardProps {
  scene: Scene;
  isSelected: boolean;
  onSelect: () => void;
  projectId: string;
  sendMessage: (message: any) => void;
}

export default function SceneCard({ 
  scene, 
  isSelected, 
  onSelect, 
  projectId,
  sendMessage 
}: SceneCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [aiProvider, setAiProvider] = useState<string>("openai");
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ["/api/scenes", scene.id, "comments"],
  }) as { data: Comment[] };

  const updateSceneMutation = useMutation({
    mutationFn: async (updates: Partial<Scene>) => {
      return apiRequest("PATCH", `/api/scenes/${scene.id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "scenes"] });
    },
  });

  const deleteSceneMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/scenes/${scene.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "scenes"] });
      toast({
        title: "Scene deleted",
        description: "Scene removed from storyboard",
      });
    },
  });

  const generateReferenceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/generate-reference", {
        description: scene.description || scene.title,
        style: "photorealistic",
        provider: aiProvider,
      });
      const data = await response.json();
      return updateSceneMutation.mutateAsync({ referenceImageUrl: data.url });
    },
    onSuccess: () => {
      toast({
        title: "Reference generated",
        description: `AI generated a new reference image using ${aiProvider}`,
      });
    },
  });

  const improveDialogueMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/improve-dialogue", {
        dialogue: scene.dialogue || "Add dialogue here...",
        mood: scene.mood || "neutral",
        context: scene.description || "",
        provider: aiProvider,
      });
      const data = await response.json();
      return updateSceneMutation.mutateAsync({ dialogue: data.improved });
    },
    onSuccess: () => {
      toast({
        title: "Dialogue improved",
        description: `AI enhanced the dialogue using ${aiProvider}`,
      });
    },
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    
    setIsDragging(true);
    onSelect();
    
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: scene.position?.x || 0,
      initialY: scene.position?.y || 0,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      
      const newPosition = {
        x: dragRef.current.initialX + deltaX,
        y: dragRef.current.initialY + deltaY,
      };

      sendMessage({
        type: "scene_move",
        data: { sceneId: scene.id, position: newPosition },
      });
    };

    const handleMouseUp = () => {
      if (!dragRef.current) return;
      
      const deltaX = dragRef.current.startX - dragRef.current.startX;
      const deltaY = dragRef.current.startY - dragRef.current.startY;
      
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        const newPosition = {
          x: dragRef.current.initialX + deltaX,
          y: dragRef.current.initialY + deltaY,
        };
        updateSceneMutation.mutate({ position: newPosition });
      }
      
      setIsDragging(false);
      dragRef.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleFieldUpdate = (field: keyof Scene, value: any) => {
    updateSceneMutation.mutate({ [field]: value });
    sendMessage({
      type: "scene_edit",
      data: { sceneId: scene.id, field, value },
    });
  };

  const handleImageUpload = (imageUrl: string) => {
    handleFieldUpdate("referenceImageUrl", imageUrl);
  };

  const handleDrawingSave = async (drawingData: string) => {
    try {
      const response = await fetch("/api/save-drawing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          drawingData,
          sceneId: scene.id,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        handleFieldUpdate("referenceImageUrl", data.url);
        toast({
          title: "Drawing saved",
          description: "Your custom drawing has been saved",
        });
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save drawing",
        variant: "destructive",
      });
    }
  };

  const unresolvedComments = (comments as Comment[]).filter(c => !c.resolved);

  return (
    <div
      className={`absolute bg-card border border-border rounded-lg shadow-sm transition-all duration-200 ${
        isSelected ? "ring-2 ring-primary" : ""
      } ${isDragging ? "z-50" : "z-10"} ${
        isExpanded ? "w-80" : "w-64"
      }`}
      style={{
        top: scene.position?.y || 0,
        left: scene.position?.x || 0,
        cursor: isDragging ? "grabbing" : "grab",
        transform: isDragging ? "scale(1.02)" : "scale(1)",
      }}
      onMouseDown={handleMouseDown}
      onClick={() => !isDragging && onSelect()}
      data-testid={`scene-card-${scene.id}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <Input
            value={scene.title}
            onChange={(e) => handleFieldUpdate("title", e.target.value)}
            className="font-semibold text-lg bg-transparent border-none p-0 h-auto focus-visible:ring-0"
            data-testid={`input-scene-title-${scene.id}`}
          />
          <div className="flex items-center space-x-1">
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
              {((scene.duration || 0) / 1000).toFixed(1)}s
            </span>
            <Button variant="ghost" size="sm" className="p-1" data-testid={`button-duplicate-${scene.id}`}>
              <Copy className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                deleteSceneMutation.mutate();
              }}
              data-testid={`button-delete-${scene.id}`}
            >
              <Trash className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              data-testid={`button-toggle-expand-${scene.id}`}
            >
              <Expand className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {isExpanded ? (
          <>
            {/* Reference Image */}
            {scene.referenceImageUrl && (
              <div className="mb-3 bg-muted rounded-md overflow-hidden">
                <img
                  src={scene.referenceImageUrl}
                  alt="Scene reference"
                  className="w-full h-32 object-cover"
                  data-testid={`img-reference-${scene.id}`}
                />
                <div className="p-2 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Reference image</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-emerald-200 text-emerald-600 hover:text-emerald-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      generateReferenceMutation.mutate();
                    }}
                    disabled={generateReferenceMutation.isPending}
                    data-testid={`button-generate-reference-${scene.id}`}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Generate new
                  </Button>
                </div>
              </div>
            )}

            {!scene.referenceImageUrl && (
              <div className="mb-3 bg-muted rounded-md p-4 space-y-3">
                {/* AI Provider Selection */}
                <div className="flex items-center space-x-2">
                  <Bot className="w-3 h-3 text-muted-foreground" />
                  <Select value={aiProvider} onValueChange={setAiProvider}>
                    <SelectTrigger className="w-full text-xs bg-background border-0 h-6" data-testid={`select-ai-provider-${scene.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="gemini">Gemini</SelectItem>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-emerald-200 text-emerald-600 hover:text-emerald-700 h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      generateReferenceMutation.mutate();
                    }}
                    disabled={generateReferenceMutation.isPending}
                    data-testid={`button-generate-ai-${scene.id}`}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-blue-200 text-blue-600 hover:text-blue-700 h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDrawingModal(true);
                    }}
                    data-testid={`button-draw-${scene.id}`}
                  >
                    <Brush className="w-3 h-3 mr-1" />
                    Draw
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-purple-200 text-purple-600 hover:text-purple-700 h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowImageUploadModal(true);
                    }}
                    data-testid={`button-upload-${scene.id}`}
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-3">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Textarea
                value={scene.description || ""}
                onChange={(e) => handleFieldUpdate("description", e.target.value)}
                className="w-full text-sm bg-secondary border-0 rounded-md resize-none"
                rows={2}
                placeholder="Scene description..."
                data-testid={`textarea-description-${scene.id}`}
              />
            </div>

            {/* Dialogue */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">Dialogue / VO</label>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-emerald-200 text-emerald-600 hover:text-emerald-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    improveDialogueMutation.mutate();
                  }}
                  disabled={improveDialogueMutation.isPending}
                  data-testid={`button-improve-dialogue-${scene.id}`}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Improve
                </Button>
              </div>
              <Textarea
                value={scene.dialogue || ""}
                onChange={(e) => handleFieldUpdate("dialogue", e.target.value)}
                className="w-full text-sm bg-secondary border-0 rounded-md resize-none"
                rows={2}
                placeholder="What do they say..."
                data-testid={`textarea-dialogue-${scene.id}`}
              />
            </div>

            {/* Characters & Props */}
            <div className="mb-3">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Characters / Props</label>
              <div className="flex flex-wrap gap-1">
                {scene.characters?.map((character, index) => (
                  <Badge key={index} variant="secondary" className="text-xs" data-testid={`badge-character-${scene.id}-${index}`}>
                    {character}
                  </Badge>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-dashed h-6"
                  data-testid={`button-add-character-${scene.id}`}
                >
                  + Add
                </Button>
              </div>
            </div>

            {/* Camera Notes */}
            <div className="mb-3">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Camera Notes</label>
              <Input
                value={scene.cameraNote || ""}
                onChange={(e) => handleFieldUpdate("cameraNote", e.target.value)}
                className="w-full text-sm bg-secondary border-0 rounded-md"
                placeholder="Close-up, medium shot..."
                data-testid={`input-camera-note-${scene.id}`}
              />
            </div>

            {/* Music & Mood */}
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Mood</label>
                <Select
                  value={scene.mood || "neutral"}
                  onValueChange={(value) => handleFieldUpdate("mood", value)}
                >
                  <SelectTrigger className="w-full text-sm bg-secondary border-0 rounded-md" data-testid={`select-mood-${scene.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frustrated">Frustrated</SelectItem>
                    <SelectItem value="upbeat">Upbeat</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="exciting">Exciting</SelectItem>
                    <SelectItem value="hopeful">Hopeful</SelectItem>
                    <SelectItem value="overwhelming">Overwhelming</SelectItem>
                    <SelectItem value="motivating">Motivating</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="sm" className="mt-4 p-2" data-testid={`button-music-${scene.id}`}>
                <Music className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="truncate">{scene.description}</p>
            <div className="flex items-center justify-between">
              <span>{scene.cameraNote}</span>
              {scene.mood && (
                <Badge variant="secondary" className="text-xs">
                  {scene.mood}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comment indicator */}
      {unresolvedComments.length > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
          {unresolvedComments.length}
        </div>
      )}

      {/* Modals */}
      <DrawingModal
        isOpen={showDrawingModal}
        onClose={() => setShowDrawingModal(false)}
        onSave={handleDrawingSave}
        sceneId={scene.id}
      />

      <ImageUploadModal
        isOpen={showImageUploadModal}
        onClose={() => setShowImageUploadModal(false)}
        onImageUploaded={handleImageUpload}
      />
    </div>
  );
}

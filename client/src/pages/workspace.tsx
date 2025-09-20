import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Toolbar from "@/components/workspace/toolbar";
import Sidebar from "@/components/workspace/sidebar";
import Canvas from "@/components/workspace/canvas";
import CommentsPanel from "@/components/workspace/comments-panel";
import TimelineModal from "@/components/workspace/timeline-modal";
import ExportModal from "@/components/workspace/export-modal";
import { useWebSocket } from "@/hooks/use-websocket";
import { Project } from "@shared/schema";

export default function Workspace() {
  const { projectId = "default" } = useParams();
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [tool, setTool] = useState<"select" | "add-scene" | "comment">("select");

  const { data: project } = useQuery({
    queryKey: ["/api/projects", projectId],
  }) as { data: Project | undefined };

  const { data: scenes = [] } = useQuery({
    queryKey: ["/api/projects", projectId, "scenes"],
  });

  // WebSocket for real-time collaboration
  const { sendMessage } = useWebSocket(projectId, "user-123");

  const handleSceneSelect = (sceneId: string) => {
    setSelectedSceneId(sceneId);
    sendMessage({
      type: "scene_select",
      data: { sceneId },
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Toolbar
        project={project}
        onExport={() => setShowExport(true)}
        onTimeline={() => setShowTimeline(true)}
        tool={tool}
        onToolChange={setTool}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          scenes={scenes}
          selectedSceneId={selectedSceneId}
          onSceneSelect={handleSceneSelect}
          tool={tool}
          onToolChange={setTool}
          projectId={projectId}
        />
        
        <main className="flex-1 relative">
          <Canvas
            scenes={scenes}
            selectedSceneId={selectedSceneId}
            onSceneSelect={handleSceneSelect}
            tool={tool}
            projectId={projectId}
            sendMessage={sendMessage}
          />
        </main>
        
        {showComments && (
          <CommentsPanel
            selectedSceneId={selectedSceneId}
            onClose={() => setShowComments(false)}
          />
        )}
      </div>

      {showTimeline && (
        <TimelineModal
          scenes={scenes}
          onClose={() => setShowTimeline(false)}
        />
      )}

      {showExport && (
        <ExportModal
          project={project}
          scenes={scenes}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

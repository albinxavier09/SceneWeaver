import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Film, Download, Settings, Plus, Minus, Users } from "lucide-react";
import { Project } from "@shared/schema";

interface ToolbarProps {
  project?: Project;
  onExport: () => void;
  onTimeline: () => void;
  tool: "select" | "add-scene" | "comment";
  onToolChange: (tool: "select" | "add-scene" | "comment") => void;
}

export default function Toolbar({ project, onExport, onTimeline, tool, onToolChange }: ToolbarProps) {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 relative z-50" data-testid="toolbar">
      {/* Logo and Project Info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-md flex items-center justify-center">
            <Film className="text-white w-4 h-4" />
          </div>
          <span className="font-semibold text-lg">StoryFlow</span>
        </div>
        <div className="text-sm text-muted-foreground">
          <span data-testid="project-name">{project?.name || "Marketing Video Concept"}</span>
          <span className="mx-2">•</span>
          <span data-testid="last-saved">Saved 2 min ago</span>
        </div>
      </div>

      {/* Center Controls */}
      <div className="flex items-center space-x-2">
        {/* View Mode Toggle */}
        <div className="bg-secondary rounded-md p-1 flex">
          <Button
            variant={tool === "select" ? "secondary" : "ghost"}
            size="sm"
            className="text-xs"
            data-testid="button-canvas-view"
          >
            Canvas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={onTimeline}
            data-testid="button-timeline-view"
          >
            Timeline
          </Button>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex items-center space-x-1 bg-secondary rounded-md p-1">
          <Button variant="ghost" size="sm" className="p-1" data-testid="button-zoom-out">
            <Minus className="w-3 h-3" />
          </Button>
          <span className="px-2 text-xs font-medium" data-testid="zoom-level">75%</span>
          <Button variant="ghost" size="sm" className="p-1" data-testid="button-zoom-in">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-3">
        {/* Collaboration Avatars */}
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-card flex items-center justify-center text-white text-xs font-medium">
            JD
          </div>
          <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-card flex items-center justify-center text-white text-xs font-medium">
            SM
          </div>
          <div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-card flex items-center justify-center text-white text-xs font-medium">
            AL
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 rounded-full p-0"
            data-testid="button-invite-collaborators"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Actions */}
        <Button onClick={onExport} data-testid="button-export">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        
        <Button variant="ghost" size="sm" data-testid="button-settings">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}

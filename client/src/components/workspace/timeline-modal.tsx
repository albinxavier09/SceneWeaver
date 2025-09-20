import { Scene } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { X, Play } from "lucide-react";

interface TimelineModalProps {
  scenes: Scene[];
  onClose: () => void;
}

export default function TimelineModal({ scenes, onClose }: TimelineModalProps) {
  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);
  const totalDuration = sortedScenes.reduce((sum, scene) => sum + (scene.duration || 0), 0);

  const getSceneProgress = (sceneIndex: number) => {
    const progressWidth = sortedScenes.slice(0, sceneIndex).reduce((sum, scene) => sum + (scene.duration || 0), 0);
    return (progressWidth / totalDuration) * 100;
  };

  const getSceneWidth = (scene: Scene) => {
    return ((scene.duration || 0) / totalDuration) * 100;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose} data-testid="timeline-modal">
      <div 
        className="w-full bg-card rounded-t-lg p-6 max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Timeline View</h2>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-timeline">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Timeline Scrubber */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-2">
            <span className="text-sm font-medium" data-testid="total-duration">
              Total Duration: {(totalDuration / 1000).toFixed(1)}s
            </span>
            <Button variant="outline" size="sm" data-testid="button-play-preview">
              <Play className="w-4 h-4 mr-1" />
              Preview
            </Button>
          </div>
          
          <div className="relative">
            {/* Timeline Background */}
            <div className="h-2 bg-muted rounded-full relative overflow-hidden">
              {/* Progress Bars for each scene */}
              {sortedScenes.map((scene, index) => (
                <div
                  key={scene.id}
                  className="absolute top-0 h-full bg-primary opacity-70"
                  style={{
                    left: `${getSceneProgress(index)}%`,
                    width: `${getSceneWidth(scene)}%`,
                  }}
                  data-testid={`timeline-bar-${scene.id}`}
                />
              ))}
            </div>
            
            {/* Time Markers */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
              {Array.from({ length: Math.ceil(totalDuration / 5000) + 1 }, (_, i) => (
                <span key={i} data-testid={`time-marker-${i * 5}`}>
                  {i * 5}s
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Timeline Cards */}
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {sortedScenes.map((scene, index) => {
            const startTime = sortedScenes
              .slice(0, index)
              .reduce((sum, s) => sum + (s.duration || 0), 0) / 1000;
            const endTime = startTime + (scene.duration || 0) / 1000;
            
            return (
              <div
                key={scene.id}
                className={`flex-shrink-0 w-48 rounded-lg p-3 ${
                  index === 2 ? "bg-primary/10 border border-primary/20" : "bg-secondary"
                }`}
                data-testid={`timeline-card-${scene.id}`}
              >
                <h4 className="font-medium mb-2" data-testid={`timeline-title-${scene.id}`}>
                  {scene.title}
                </h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div data-testid={`timeline-duration-${scene.id}`}>
                    Duration: {((scene.duration || 0) / 1000).toFixed(1)}s
                  </div>
                  <div data-testid={`timeline-start-${scene.id}`}>
                    Start: {startTime.toFixed(1)}s
                  </div>
                  <div data-testid={`timeline-end-${scene.id}`}>
                    End: {endTime.toFixed(1)}s
                  </div>
                </div>
                {scene.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2" data-testid={`timeline-description-${scene.id}`}>
                    {scene.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

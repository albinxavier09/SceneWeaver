import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Save, RotateCcw, Palette } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import SignatureCanvas from "react-signature-canvas";

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (drawingData: string) => void;
  sceneId: string;
}

export default function DrawingModal({ isOpen, onClose, onSave, sceneId }: DrawingModalProps) {
  const canvasRef = useRef<SignatureCanvas>(null);
  const [penColor, setPenColor] = useState("#000000");
  const [penWidth, setPenWidth] = useState([2]);

  const colors = [
    "#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", 
    "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#FFC0CB"
  ];

  const handleSave = () => {
    if (canvasRef.current) {
      const drawingData = canvasRef.current.getTrimmedCanvas().toDataURL();
      onSave(drawingData);
      onClose();
    }
  };

  const handleClear = () => {
    canvasRef.current?.clear();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} data-testid="drawing-modal">
      <div 
        className="bg-card rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Draw Scene Illustration</h2>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-drawing">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Drawing Tools */}
        <div className="flex items-center space-x-4 mb-4 p-3 bg-secondary rounded-lg">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span className="text-sm">Color:</span>
            <div className="flex space-x-1">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full border-2 ${
                    penColor === color ? "border-primary" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setPenColor(color)}
                  data-testid={`color-${color}`}
                />
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm">Width:</span>
            <div className="w-20">
              <Slider
                value={penWidth}
                onValueChange={setPenWidth}
                max={10}
                min={1}
                step={1}
                data-testid="pen-width-slider"
              />
            </div>
            <span className="text-xs text-muted-foreground">{penWidth[0]}px</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            data-testid="button-clear-drawing"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>

        {/* Drawing Canvas */}
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 mb-4">
          <SignatureCanvas
            ref={canvasRef}
            canvasProps={{
              width: 800,
              height: 500,
              className: "rounded-lg",
              style: { width: "100%", height: "auto" }
            }}
            penColor={penColor}
            minWidth={penWidth[0]}
            maxWidth={penWidth[0]}
            data-testid="drawing-canvas"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Draw directly on the canvas above to create a custom illustration for this scene.
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel-drawing">
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="button-save-drawing">
              <Save className="w-4 h-4 mr-1" />
              Save Drawing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
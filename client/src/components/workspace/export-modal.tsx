import { Project, Scene } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { X, FileText, Presentation, Table, Smartphone } from "lucide-react";

interface ExportModalProps {
  project?: Project;
  scenes: Scene[];
  onClose: () => void;
}

export default function ExportModal({ project, scenes, onClose }: ExportModalProps) {
  const handleExportPDF = () => {
    // Implementation would generate PDF with jsPDF or similar
    console.log("Exporting PDF storyboard...");
    onClose();
  };

  const handleExportPresentation = () => {
    // Implementation would create an interactive slideshow
    console.log("Opening presentation mode...");
    onClose();
  };

  const handleExportTable = () => {
    // Implementation would generate CSV/Excel export
    console.log("Exporting data table...");
    onClose();
  };

  const handleExportShorts = () => {
    // Implementation would optimize for vertical format
    console.log("Exporting shorts format...");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} data-testid="export-modal">
      <div 
        className="bg-card rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Export Storyboard</h2>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-export">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          <Button
            variant="ghost"
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-secondary rounded-md transition-colors"
            onClick={handleExportPDF}
            data-testid="button-export-pdf"
          >
            <div className="w-10 h-10 bg-red-100 rounded-md flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="font-medium">PDF Storyboard</div>
              <div className="text-sm text-muted-foreground">Complete storyboard with images and notes</div>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-secondary rounded-md transition-colors"
            onClick={handleExportPresentation}
            data-testid="button-export-presentation"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center">
              <Presentation className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">Presentation Mode</div>
              <div className="text-sm text-muted-foreground">Interactive slideshow for client reviews</div>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-secondary rounded-md transition-colors"
            onClick={handleExportTable}
            data-testid="button-export-table"
          >
            <div className="w-10 h-10 bg-green-100 rounded-md flex items-center justify-center">
              <Table className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium">Data Table</div>
              <div className="text-sm text-muted-foreground">Excel/CSV format for production planning</div>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-secondary rounded-md transition-colors"
            onClick={handleExportShorts}
            data-testid="button-export-shorts"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-md flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="font-medium">Shorts Format</div>
              <div className="text-sm text-muted-foreground">Optimized for TikTok/Instagram Reels</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}

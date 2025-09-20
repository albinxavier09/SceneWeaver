import { useState, useCallback } from "react";

interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
}

export function useCanvas() {
  const [state, setState] = useState<CanvasState>({
    zoom: 0.75,
    pan: { x: 0, y: 0 },
  });

  const handleZoom = useCallback((delta: number) => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(0.25, Math.min(2, prev.zoom + delta)),
    }));
  }, []);

  const handlePan = useCallback((deltaX: number, deltaY: number) => {
    setState(prev => ({
      ...prev,
      pan: {
        x: prev.pan.x + deltaX,
        y: prev.pan.y + deltaY,
      },
    }));
  }, []);

  const resetView = useCallback(() => {
    setState({
      zoom: 0.75,
      pan: { x: 0, y: 0 },
    });
  }, []);

  return {
    zoom: state.zoom,
    pan: state.pan,
    handleZoom,
    handlePan,
    resetView,
  };
}

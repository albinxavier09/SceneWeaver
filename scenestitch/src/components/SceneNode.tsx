import { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { 
  Image as ImageIcon, 
  Wand2, 
  Upload, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { 
  AutoAwesome,
  CloudUpload,
  ExpandMore,
  ExpandLess,
  Movie,
  Chat,
  Settings,
  Note,
  LocalOffer
} from '@mui/icons-material';

interface SceneData {
  label: string;
  scene: {
    id: number;
    project_id?: number;
    title: string;
    description: string;
    image_url: string;
    dialogue: string;
    technical_details: string;
    status: string;
    tags: string;
    notes: string;
  };
  onUpdate?: () => void;
}

const SceneNode = memo(({ data, selected }: NodeProps<SceneData>) => {
  const { scene, onUpdate } = data;
  const [editData, setEditData] = useState({
    title: scene.title || '',
    description: scene.description || '',
    image_url: scene.image_url || '',
    dialogue: scene.dialogue || '',
    technical_details: scene.technical_details || '',
    status: scene.status || 'Draft',
    tags: scene.tags || '',
    notes: scene.notes || '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editDataRef = useRef(editData);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [imageHeight, setImageHeight] = useState(160);

  // Sync editData with scene prop changes (only when scene ID changes)
  useEffect(() => {
    console.log('🔄 useEffect triggered - syncing editData with scene prop');
    console.log('📊 Scene prop:', scene);
    const newEditData = {
      title: scene.title || '',
      description: scene.description || '',
      image_url: scene.image_url || '',
      dialogue: scene.dialogue || '',
      technical_details: scene.technical_details || '',
      status: scene.status || 'Draft',
      tags: scene.tags || '',
      notes: scene.notes || '',
    };
    setEditData(newEditData);
    editDataRef.current = newEditData;
  }, [scene.id]); // Only sync when scene ID changes, not when any property changes

  // Update ref whenever editData changes
  useEffect(() => {
    editDataRef.current = editData;
  }, [editData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Handle node resizing to ensure dropdown works properly
  // Track previous dimensions to detect manual resizing
  const prevDimensions = useRef({ width: 0, height: 0 });
  const resizeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle manual resize only (not dropdown state changes)
  useEffect(() => {
    const handleManualResize = () => {
      if (nodeRef.current) {
        // Force re-render of dropdown elements when node is manually resized
        const selectElement = nodeRef.current.querySelector('select');
        if (selectElement) {
          // Trigger a reflow to ensure proper positioning
          selectElement.style.transform = 'translateZ(0)';
          setTimeout(() => {
            selectElement.style.transform = '';
          }, 0);
        }

        // Update expandable content height based on current state
        const expandableContent = nodeRef.current.querySelector('[data-expandable-content]') as HTMLElement;
        if (expandableContent && isExpanded) {
          const nodeHeight = nodeRef.current.offsetHeight;
          const availableHeight = nodeHeight - 180; // Account for image (120px) + title + controls
          expandableContent.style.maxHeight = `${Math.max(120, availableHeight)}px`;
        }

        // Update image height based on node size
        const nodeHeight = nodeRef.current.offsetHeight;
        if (isExpanded) {
          // When expanded, keep image at fixed 120px height
          setImageHeight(120);
        } else {
          // When collapsed, scale image with node size
          const calculatedHeight = Math.max(120, Math.min(200, nodeHeight * 0.4));
          setImageHeight(calculatedHeight);
        }
      }
    };

    // Debounced resize handler to prevent rapid firing
    const debouncedResize = () => {
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
      resizeTimeout.current = setTimeout(handleManualResize, 100);
    };

    // Use ResizeObserver to detect manual size changes only
    if (nodeRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const { width, height } = entry.contentRect;
          const prev = prevDimensions.current;
          
          // Only trigger if the change is significant (more than 30px difference)
          // This prevents dropdown state changes from triggering resize
          const widthDiff = Math.abs(width - prev.width);
          const heightDiff = Math.abs(height - prev.height);
          
          if (widthDiff > 30 || heightDiff > 30) {
            prevDimensions.current = { width, height };
            debouncedResize();
          }
        });
      });
      resizeObserver.observe(nodeRef.current);
      
      // Initialize previous dimensions
      if (nodeRef.current) {
        prevDimensions.current = {
          width: nodeRef.current.offsetWidth,
          height: nodeRef.current.offsetHeight
        };
      }
      
      return () => {
        resizeObserver.disconnect();
        if (resizeTimeout.current) {
          clearTimeout(resizeTimeout.current);
        }
      };
    }
  }, []); // No dependencies to prevent dropdown-triggered resizes

  // Handle dropdown state changes separately (no resize observer)
  useEffect(() => {
    if (nodeRef.current) {
      const expandableContent = nodeRef.current.querySelector('[data-expandable-content]') as HTMLElement;
      if (expandableContent) {
        if (isExpanded) {
          // When expanded, set a reasonable max height without forcing resize
          expandableContent.style.maxHeight = 'calc(100% - 200px)';
          setImageHeight(120);
        } else {
          // When collapsed, let the image scale naturally
          const nodeHeight = nodeRef.current.offsetHeight;
          const calculatedHeight = Math.max(120, Math.min(200, nodeHeight * 0.4));
          setImageHeight(calculatedHeight);
        }
      }
    }
  }, [isExpanded]); // Only handle dropdown state changes

  // Force re-render when dropdown state changes to ensure proper icon display
  useEffect(() => {
    // This ensures the icon updates immediately when state changes
    if (nodeRef.current) {
      const button = nodeRef.current.querySelector('button[title*="details"]') as HTMLButtonElement;
      if (button) {
        // Trigger a small reflow to ensure icon updates
        button.style.transform = 'translateZ(0)';
        setTimeout(() => {
          button.style.transform = '';
        }, 0);
      }
    }
  }, [isExpanded]);

  const statusColors = {
    'Draft': 'bg-gray-100 text-gray-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Ditched': 'bg-red-100 text-red-800',
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="inline-flex items-center animate-pulse">
      <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-blue-500"></div>
      <span className="ml-1 text-xs text-blue-600 font-medium">AI...</span>
    </div>
  );

  // Format AI response to clean up markdown and formatting
  const formatAIResponse = (text: string): string => {
    if (!text) return '';
    
    return text
      // Remove markdown headers (##, ###, etc.)
      .replace(/^#{1,6}\s*/gm, '')
      // Remove markdown bold/italic markers
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Convert markdown bullet points to simple dashes
      .replace(/^\s*[-*+]\s*/gm, '• ')
      // Convert numbered lists to simple format
      .replace(/^\s*\d+\.\s*/gm, '• ')
      // Remove excessive line breaks (more than 2 consecutive)
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace
      .trim()
      // Remove any remaining markdown code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove any remaining markdown links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Clean up any remaining special characters
      .replace(/[^\w\s.,!?;:()\-•]/g, '');
  };


  const handleSave = async () => {
    try {
      const currentEditData = editDataRef.current;
      console.log('💾 Saving scene with editData:', currentEditData);
      
      const response = await fetch(`/api/projects/${scene.project_id || 'unknown'}/scenes/${scene.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentEditData),
      });

      if (response.ok) {
        console.log('✅ Scene saved successfully');
        // Auto-save successful
        onUpdate?.();
      } else {
        console.error('❌ Failed to save scene:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error saving scene:', error);
    }
  };

  // Auto-save on field change
  const handleInputChange = (field: string, value: string) => {
    console.log('🔄 handleInputChange called with:', field, '=', value);
    setEditData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('📊 Updated editData:', newData);
      editDataRef.current = newData; // Update ref immediately
      return newData;
    });
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for debounced auto-save
    saveTimeoutRef.current = setTimeout(() => {
      console.log('💾 Auto-saving scene...');
      handleSave();
    }, 1000);
  };

  const generateWithAI = async (type: 'description' | 'dialogue' | 'technical') => {
    setIsGenerating(true);
    setGeneratingField(type);
    try {
      let response;
      switch (type) {
        case 'description':
          response = await fetch('/api/ai/generate-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editData),
          });
          if (response.ok) {
            const data = await response.json();
            // Clean and format the AI response
            const cleanDescription = formatAIResponse(data.description);
            handleInputChange('description', cleanDescription);
          } else {
            console.error('Failed to generate description:', response.status);
          }
          break;
        case 'dialogue':
          response = await fetch('/api/ai/generate-dialogue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sceneData: editData,
              character: 'Main Character',
              tone: 'natural'
            }),
          });
          if (response.ok) {
            const data = await response.json();
            // Clean and format the AI response
            const cleanDialogue = formatAIResponse(data.dialogue);
            handleInputChange('dialogue', cleanDialogue);
          } else {
            console.error('Failed to generate dialogue:', response.status);
          }
          break;
        case 'technical':
          response = await fetch('/api/ai/generate-technical', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editData),
          });
          if (response.ok) {
            const data = await response.json();
            // Clean and format the AI response
            const cleanTechnical = formatAIResponse(data.technicalDetails);
            handleInputChange('technical_details', cleanTechnical);
          } else {
            console.error('Failed to generate technical details:', response.status);
          }
          break;
      }
    } catch (error) {
      console.error('Error generating with AI:', error);
    } finally {
      setIsGenerating(false);
      setGeneratingField(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('🚀 Starting file upload:', file.name);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Upload successful, fileUrl:', data.fileUrl);
        console.log('📝 Calling handleInputChange with image_url:', data.fileUrl);
        handleInputChange('image_url', data.fileUrl);
      } else {
        console.error('❌ Upload failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Error uploading file:', error);
    }
  };

  // Debug: Log current editData state
  console.log('🎨 SceneNode render - editData:', editData);
  console.log('🎨 SceneNode render - scene prop:', scene);

  return (
    <div 
      ref={nodeRef}
      className={`bg-white border-2 rounded-lg shadow-lg w-full h-full flex flex-col relative ${
        selected ? 'border-black' : 'border-gray-300'
      }`} 
      style={{ 
        width: '100%', 
        height: '100%',
        minWidth: '250px',
        minHeight: '200px',
        maxWidth: '500px',
        maxHeight: '800px'
      }}
    >
      <NodeResizer
        color="#000000"
        isVisible={selected}
        minWidth={250}
        minHeight={200}
        maxWidth={500}
        maxHeight={800}
        keepAspectRatio={false}
      />
      {/* Main Image Display - Always visible and editable */}
      <div className="relative flex-shrink-0" style={{ 
        height: isExpanded ? '120px' : `${imageHeight}px`, 
        minHeight: '120px' 
      }}>
        {/* Image */}
        <div className="bg-gray-100 rounded-t-lg h-full flex items-center justify-center relative">
          {editData.image_url && editData.image_url.trim() !== '' ? (
            <img 
              src={editData.image_url} 
              alt={editData.title}
              className="w-full h-full object-cover rounded-t-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="text-center">
              <Movie className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-doodle-body">No image</p>
            </div>
          )}
          
          {/* Upload Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-lg opacity-0 hover:opacity-100 transition-opacity">
            <label className="bg-white text-black px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-gray-100 flex items-center space-x-2">
              <CloudUpload className="h-4 w-4" />
              <span>Upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Title Input - Always visible */}
      <div className="relative flex-shrink-0 p-2">
        <input
          type="text"
          value={editData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="text-gray-900 font-doodle-title text-sm bg-transparent border-none outline-none w-full placeholder-gray-500"
          placeholder="Scene Title"
        />
      </div>

      {/* Status Badge and Controls - Always visible */}
      <div className="absolute top-2 left-2 z-10">
        <select
          value={editData.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className={`px-2 py-1 rounded-full text-xs font-doodle-fun ${
            statusColors[editData.status as keyof typeof statusColors] || statusColors.Draft
          } border border-gray-300 appearance-none cursor-pointer bg-white`}
          style={{ 
            minWidth: '60px',
            maxWidth: '120px',
            fontSize: '10px',
            padding: '2px 6px',
            position: 'relative',
            zIndex: 1000
          }}
        >
          <option value="Draft">Draft</option>
          <option value="In Progress">In Progress</option>
          <option value="Approved">Approved</option>
          <option value="Ditched">Ditched</option>
        </select>
      </div>

            {/* Expand/Collapse Button - Always visible */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-1 transition-colors z-10 shadow-sm"
              title={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

      {/* Expandable Details */}
      {isExpanded && (
        <div 
          data-expandable-content
          className="flex-1 p-3 space-y-3 border-t border-gray-200 bg-gray-50/30" 
          style={{ 
            maxHeight: 'calc(100% - 200px)', // More space for content
            minHeight: '140px',
            width: '100%'
          }}
        >
          {/* Tags */}
          <div className="flex-shrink-0">
            <label className="flex items-center space-x-1 text-xs font-doodle-fun text-gray-700 mb-1">
              <LocalOffer className="h-3 w-3" />
              <span>Tags</span>
            </label>
            <input
              type="text"
              value={editData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black text-xs font-doodle-body"
              placeholder="Action, Indoor, Dialogue..."
            />
          </div>

          {/* Description Section */}
          <div className="flex-shrink-0">
            <div className="flex justify-between items-center mb-1">
              <label className="flex items-center space-x-1 text-xs font-doodle-fun text-gray-700">
                <Movie className="h-3 w-3" />
                <span>Description</span>
              </label>
              {generatingField === 'description' ? (
                <LoadingSpinner />
              ) : (
                <button
                  onClick={() => generateWithAI('description')}
                  disabled={isGenerating}
                  className="text-xs text-black hover:text-gray-600 disabled:opacity-50 flex items-center"
                >
                  <AutoAwesome className="h-3 w-3 mr-1" />
                  AI
                </button>
              )}
            </div>
            <textarea
              value={editData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={2}
              className={`w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-black focus:border-black text-xs font-doodle-body whitespace-pre-wrap resize-none overflow-hidden ${
                generatingField === 'description' 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-300'
              }`}
              placeholder={generatingField === 'description' ? "AI is generating description..." : "Describe what happens in this scene..."}
              disabled={generatingField === 'description'}
              style={{ 
                lineHeight: '1.4', 
                minHeight: '60px',
                maxHeight: '120px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>

          {/* Dialogue Section */}
          <div className="flex-shrink-0">
            <div className="flex justify-between items-center mb-1">
              <label className="flex items-center space-x-1 text-xs font-doodle-fun text-gray-700">
                <Chat className="h-3 w-3" />
                <span>Dialogue</span>
              </label>
              {generatingField === 'dialogue' ? (
                <LoadingSpinner />
              ) : (
                <button
                  onClick={() => generateWithAI('dialogue')}
                  disabled={isGenerating}
                  className="text-xs text-black hover:text-gray-600 disabled:opacity-50 flex items-center"
                >
                  <AutoAwesome className="h-3 w-3 mr-1" />
                  AI
                </button>
              )}
            </div>
            <textarea
              value={editData.dialogue}
              onChange={(e) => handleInputChange('dialogue', e.target.value)}
              rows={2}
              className={`w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-black focus:border-black text-xs font-doodle-body whitespace-pre-wrap resize-none overflow-hidden ${
                generatingField === 'dialogue' 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-300'
              }`}
              placeholder={generatingField === 'dialogue' ? "AI is generating dialogue..." : "Enter dialogue for this scene..."}
              disabled={generatingField === 'dialogue'}
              style={{ 
                lineHeight: '1.4', 
                minHeight: '60px',
                maxHeight: '120px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>

          {/* Technical Details Section */}
          <div className="flex-shrink-0">
            <div className="flex justify-between items-center mb-1">
              <label className="flex items-center space-x-1 text-xs font-doodle-fun text-gray-700">
                <Settings className="h-3 w-3" />
                <span>Technical Details</span>
              </label>
              {generatingField === 'technical' ? (
                <LoadingSpinner />
              ) : (
                <button
                  onClick={() => generateWithAI('technical')}
                  disabled={isGenerating}
                  className="text-xs text-black hover:text-gray-600 disabled:opacity-50 flex items-center"
                >
                  <AutoAwesome className="h-3 w-3 mr-1" />
                  AI
                </button>
              )}
            </div>
            <textarea
              value={editData.technical_details}
              onChange={(e) => handleInputChange('technical_details', e.target.value)}
              rows={2}
              className={`w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-black focus:border-black text-xs font-doodle-body whitespace-pre-wrap resize-none overflow-hidden ${
                generatingField === 'technical' 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-300'
              }`}
              placeholder={generatingField === 'technical' ? "AI is generating technical details..." : "Camera angles, lighting, audio, transitions..."}
              disabled={generatingField === 'technical'}
              style={{ 
                lineHeight: '1.4', 
                minHeight: '60px',
                maxHeight: '120px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>

          {/* Notes Section */}
          <div className="flex-shrink-0">
            <label className="flex items-center space-x-1 text-xs font-doodle-fun text-gray-700 mb-1">
              <Note className="h-3 w-3" />
              <span>Notes & References</span>
            </label>
            <textarea
              value={editData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black text-xs font-doodle-body resize-none overflow-hidden"
              placeholder="Additional notes, references, or ideas..."
              style={{ 
                lineHeight: '1.4', 
                minHeight: '60px',
                maxHeight: '120px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
        </div>
      )}

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-black border-2 border-white hover:bg-gray-600 transition-colors"
        style={{ top: -8 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 bg-black border-2 border-white hover:bg-gray-600 transition-colors"
        style={{ bottom: -8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 bg-black border-2 border-white hover:bg-gray-600 transition-colors"
        style={{ left: -8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 bg-black border-2 border-white hover:bg-gray-600 transition-colors"
        style={{ right: -8 }}
      />
    </div>
  );
});

SceneNode.displayName = 'SceneNode';

export default SceneNode;

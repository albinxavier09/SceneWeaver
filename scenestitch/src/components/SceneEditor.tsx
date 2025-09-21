'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Wand2, Save, Eye, EyeOff } from 'lucide-react';

interface Scene {
  id: number;
  title: string;
  description: string;
  image_url: string;
  dialogue: string;
  technical_details: string;
  status: string;
  tags: string;
  notes: string;
}

interface SceneEditorProps {
  scene: Scene;
  onClose: () => void;
  onSave: (updatedScene: Partial<Scene>) => void;
}

export default function SceneEditor({ scene, onClose, onSave }: SceneEditorProps) {
  const [formData, setFormData] = useState({
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
  const [activeTab, setActiveTab] = useState<'basic' | 'dialogue' | 'technical' | 'notes'>('basic');
  const [showAI, setShowAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync formData with scene prop changes
  useEffect(() => {
    setFormData({
      title: scene.title || '',
      description: scene.description || '',
      image_url: scene.image_url || '',
      dialogue: scene.dialogue || '',
      technical_details: scene.technical_details || '',
      status: scene.status || 'Draft',
      tags: scene.tags || '',
      notes: scene.notes || '',
    });
  }, [scene]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('🚀 SceneEditor: Starting file upload:', file.name);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SceneEditor: Upload successful, fileUrl:', data.fileUrl);
        console.log('📝 SceneEditor: Calling onSave with image_url:', data.fileUrl);
        onSave({ image_url: data.fileUrl });
      } else {
        console.error('❌ SceneEditor: Upload failed:', response.status);
      }
    } catch (error) {
      console.error('❌ SceneEditor: Error uploading file:', error);
    }
  };

  const generateWithAI = async (type: 'description' | 'dialogue' | 'technical') => {
    setIsGenerating(true);
    try {
      let response;
      switch (type) {
        case 'description':
          response = await fetch('/api/ai/generate-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: formData.title }),
          });
          if (response.ok) {
            const data = await response.json();
            handleInputChange('description', data.description);
          }
          break;
        case 'dialogue':
          response = await fetch('/api/ai/generate-dialogue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sceneContext: formData.description,
              character: 'Main Character',
              tone: 'natural'
            }),
          });
          if (response.ok) {
            const data = await response.json();
            handleInputChange('dialogue', data.dialogue);
          }
          break;
        case 'technical':
          response = await fetch('/api/ai/generate-technical', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sceneDescription: formData.description }),
          });
          if (response.ok) {
            const data = await response.json();
            handleInputChange('technical_details', data.technicalDetails);
          }
          break;
      }
    } catch (error) {
      console.error('Error generating with AI:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'dialogue', label: 'Dialogue' },
    { id: 'technical', label: 'Technical' },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">Edit Scene</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAI(!showAI)}
              className={`px-3 py-1 rounded-md text-sm ${
                showAI ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {showAI ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              AI
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-black text-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scene Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scene Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {scene.image_url ? (
                    <div className="space-y-4">
                      <img
                        src={scene.image_url}
                        alt={scene.title}
                        className="max-h-48 mx-auto rounded-md"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <Upload className="h-4 w-4 mr-2 inline" />
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                        >
                          Upload Image
                        </button>
                        <p className="text-sm text-gray-500 mt-2">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  {showAI && (
                    <button
                      onClick={() => generateWithAI('description')}
                      disabled={isGenerating}
                      className="text-sm text-black hover:text-gray-600 disabled:opacity-50 flex items-center"
                    >
                      <Wand2 className="h-4 w-4 mr-1" />
                      Generate with AI
                    </button>
                  )}
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                  placeholder="Describe what happens in this scene..."
                />
              </div>

              {/* Status and Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                  >
                    <option value="Draft">Draft</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Approved">Approved</option>
                    <option value="Ditched">Ditched</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                    placeholder="Action, Indoor, Dialogue..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dialogue' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Dialogue
                </label>
                {showAI && (
                  <button
                    onClick={() => generateWithAI('dialogue')}
                    disabled={isGenerating}
                    className="text-sm text-black hover:text-gray-600 disabled:opacity-50 flex items-center"
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    Generate with AI
                  </button>
                )}
              </div>
              <textarea
                value={formData.dialogue}
                onChange={(e) => handleInputChange('dialogue', e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                placeholder="Enter dialogue for this scene..."
              />
            </div>
          )}

          {activeTab === 'technical' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Technical Details
                </label>
                {showAI && (
                  <button
                    onClick={() => generateWithAI('technical')}
                    disabled={isGenerating}
                    className="text-sm text-black hover:text-gray-600 disabled:opacity-50 flex items-center"
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    Generate with AI
                  </button>
                )}
              </div>
              <textarea
                value={formData.technical_details}
                onChange={(e) => handleInputChange('technical_details', e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                placeholder="Camera angles, lighting, audio, transitions..."
              />
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes & References
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                placeholder="Additional notes, references, or ideas..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

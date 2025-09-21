'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Folder, Trash2, Edit2, Play, BarChart3, TrendingUp, Clock, CheckCircle, AlertCircle, FileText, Calendar } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  scene_count: number;
  approved_scenes: number;
}

interface Analytics {
  totalProjects: number;
  totalScenes: number;
  approvedScenes: number;
  inProgressScenes: number;
  draftScenes: number;
  ditchedScenes: number;
  recentActivity: Array<{
    type: string;
    project: string;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [analytics, setAnalytics] = useState<Analytics>({
    totalProjects: 0,
    totalScenes: 0,
    approvedScenes: 0,
    inProgressScenes: 0,
    draftScenes: 0,
    ditchedScenes: 0,
    recentActivity: []
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const calculateAnalytics = (projects: Project[]) => {
    const totalProjects = projects.length;
    const totalScenes = projects.reduce((sum, project) => sum + project.scene_count, 0);
    const approvedScenes = projects.reduce((sum, project) => sum + project.approved_scenes, 0);
    
    // Mock data for scene status breakdown (in a real app, this would come from the API)
    const inProgressScenes = Math.floor(totalScenes * 0.3);
    const draftScenes = Math.floor(totalScenes * 0.5);
    const ditchedScenes = Math.floor(totalScenes * 0.1);
    
    // Mock recent activity (in a real app, this would come from the API)
    const recentActivity = projects.slice(0, 5).map(project => ({
      type: 'project_updated',
      project: project.name,
      timestamp: project.updated_at
    }));
    
    return {
      totalProjects,
      totalScenes,
      approvedScenes,
      inProgressScenes,
      draftScenes,
      ditchedScenes,
      recentActivity
    };
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        const projectsData = data.projects || [];
        setProjects(projectsData);
        setAnalytics(calculateAnalytics(projectsData));
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });

      if (response.ok) {
        setNewProject({ name: '', description: '' });
        setShowCreateForm(false);
        fetchProjects();
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-black">
                Scenestitch
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.href = '/')}
                className="text-gray-600 hover:text-black transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Overview of your storyboard projects and analytics</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </button>
        </div>

        {/* Analytics Section */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <BarChart3 className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Analytics Overview</h2>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Folder className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalProjects}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Scenes</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalScenes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved Scenes</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.approvedScenes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalScenes > 0 ? Math.round((analytics.approvedScenes / analytics.totalScenes) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scene Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scene Status Breakdown</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">Draft</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{analytics.draftScenes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">In Progress</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{analytics.inProgressScenes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">Approved</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{analytics.approvedScenes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-400 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">Ditched</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{analytics.ditchedScenes}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {analytics.recentActivity.length > 0 ? (
                  analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center">
                      <div className="p-1 bg-gray-100 rounded-full mr-3">
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.project}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <Folder className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
          </div>
        </div>

        {/* Create Project Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Project</h2>
              <form onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                    placeholder="Enter project description"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Create your first storyboard project to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {project.description && (
                  <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                )}
                
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>{project.scene_count} scenes</span>
                  <span>{project.approved_scenes} approved</span>
                </div>
                
                <div className="flex space-x-2">
                  <Link
                    href={`/project/${project.id}`}
                    className="flex-1 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-center inline-flex items-center justify-center"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Open Project
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

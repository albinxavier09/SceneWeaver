import { type Project, type InsertProject, type Scene, type InsertScene, type Comment, type InsertComment, type CollaborationEvent, type InsertCollaborationEvent } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;

  // Scenes
  getScenesByProjectId(projectId: string): Promise<Scene[]>;
  getScene(id: string): Promise<Scene | undefined>;
  createScene(scene: InsertScene): Promise<Scene>;
  updateScene(id: string, scene: Partial<InsertScene>): Promise<Scene | undefined>;
  deleteScene(id: string): Promise<boolean>;

  // Comments
  getCommentsBySceneId(sceneId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, comment: Partial<InsertComment>): Promise<Comment | undefined>;
  deleteComment(id: string): Promise<boolean>;

  // Collaboration
  addCollaborationEvent(event: InsertCollaborationEvent): Promise<CollaborationEvent>;
  getRecentCollaborationEvents(projectId: string, since?: Date): Promise<CollaborationEvent[]>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project>;
  private scenes: Map<string, Scene>;
  private comments: Map<string, Comment>;
  private collaborationEvents: Map<string, CollaborationEvent>;

  constructor() {
    this.projects = new Map();
    this.scenes = new Map();
    this.comments = new Map();
    this.collaborationEvents = new Map();

    // Initialize with a sample project
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    const projectId = randomUUID();
    const project: Project = {
      id: projectId,
      name: "Marketing Video Concept",
      description: "Storyboard for product marketing video",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(projectId, project);

    // Create sample scenes
    const sampleScenes = [
      {
        title: "Opening Hook",
        description: "Frustrated user struggling with current solution, looking confused and overwhelmed",
        dialogue: '"Ugh, why is this so complicated? There has to be a better way..."',
        characters: ["User (20s-30s)", "Smartphone"],
        cameraNote: "Close-up on face, shallow depth of field",
        mood: "frustrated",
        duration: 3500,
        position: { x: 100, y: 100 },
        order: 1,
      },
      {
        title: "Problem Setup",
        description: "Show the pain points - multiple apps, confusing interfaces, wasted time",
        dialogue: '"Sound familiar? You\'re juggling multiple apps, losing track of progress..."',
        characters: ["Multiple users"],
        cameraNote: "Quick cuts",
        mood: "overwhelming",
        duration: 5200,
        position: { x: 460, y: 100 },
        order: 2,
      },
      {
        title: "Solution Intro",
        description: "Introduce our solution with smooth transition - clean, simple, powerful",
        dialogue: '"Meet StoryFlow - the simple way to organize your creative projects."',
        characters: ["Product showcase"],
        cameraNote: "Hero shot",
        mood: "hopeful",
        duration: 4800,
        position: { x: 280, y: 400 },
        order: 3,
      },
      {
        title: "Demo Flow",
        description: "Screen recording of key features in action",
        dialogue: "Voiceover explaining key features",
        characters: ["Screen recording"],
        cameraNote: "Screen recording",
        mood: "exciting",
        duration: 8100,
        position: { x: 640, y: 400 },
        order: 4,
      },
      {
        title: "CTA & Close",
        description: "Call-to-action with compelling offer",
        dialogue: '"Ready to simplify your workflow? Try StoryFlow free today."',
        characters: ["CTA button"],
        cameraNote: "Call-to-action",
        mood: "motivating",
        duration: 2900,
        position: { x: 460, y: 700 },
        order: 5,
      },
    ];

    for (const sceneData of sampleScenes) {
      const sceneId = randomUUID();
      const scene: Scene = {
        id: sceneId,
        projectId,
        ...sceneData,
        referenceImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.scenes.set(sceneId, scene);

      // Add sample comments for first scene
      if (sceneData.order === 1) {
        const comment1Id = randomUUID();
        const comment1: Comment = {
          id: comment1Id,
          sceneId,
          author: "Sarah Miller",
          content: "The frustrated expression could be more pronounced. Maybe show them trying multiple apps?",
          resolved: false,
          position: { x: 100, y: 200 },
          createdAt: new Date(Date.now() - 120000), // 2 minutes ago
        };
        this.comments.set(comment1Id, comment1);

        const comment2Id = randomUUID();
        const comment2: Comment = {
          id: comment2Id,
          sceneId,
          author: "John Doe",
          content: "Love the dialogue here! Should we add a subtitle for accessibility?",
          resolved: false,
          position: { x: 100, y: 250 },
          createdAt: new Date(Date.now() - 300000), // 5 minutes ago
        };
        this.comments.set(comment2Id, comment2);
      }
    }
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      description: insertProject.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject = {
      ...project,
      ...updateData,
      updatedAt: new Date(),
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async getScenesByProjectId(projectId: string): Promise<Scene[]> {
    return Array.from(this.scenes.values())
      .filter(scene => scene.projectId === projectId)
      .sort((a, b) => a.order - b.order);
  }

  async getScene(id: string): Promise<Scene | undefined> {
    return this.scenes.get(id);
  }

  async createScene(insertScene: InsertScene): Promise<Scene> {
    const id = randomUUID();
    const scene: Scene = {
      ...insertScene,
      id,
      description: insertScene.description || null,
      dialogue: insertScene.dialogue || null,
      characters: insertScene.characters || null,
      cameraNote: insertScene.cameraNote || null,
      mood: insertScene.mood || null,
      duration: insertScene.duration || null,
      position: insertScene.position || null,
      referenceImageUrl: insertScene.referenceImageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.scenes.set(id, scene);
    return scene;
  }

  async updateScene(id: string, updateData: Partial<InsertScene>): Promise<Scene | undefined> {
    const scene = this.scenes.get(id);
    if (!scene) return undefined;

    const updatedScene = {
      ...scene,
      ...updateData,
      updatedAt: new Date(),
    };
    this.scenes.set(id, updatedScene);
    return updatedScene;
  }

  async deleteScene(id: string): Promise<boolean> {
    return this.scenes.delete(id);
  }

  async getCommentsBySceneId(sceneId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.sceneId === sceneId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      ...insertComment,
      id,
      position: insertComment.position || null,
      resolved: insertComment.resolved || null,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }

  async updateComment(id: string, updateData: Partial<InsertComment>): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;

    const updatedComment = {
      ...comment,
      ...updateData,
    };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }

  async deleteComment(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }

  async addCollaborationEvent(insertEvent: InsertCollaborationEvent): Promise<CollaborationEvent> {
    const id = randomUUID();
    const event: CollaborationEvent = {
      ...insertEvent,
      id,
      data: insertEvent.data || null,
      createdAt: new Date(),
    };
    this.collaborationEvents.set(id, event);
    return event;
  }

  async getRecentCollaborationEvents(projectId: string, since?: Date): Promise<CollaborationEvent[]> {
    const cutoff = since || new Date(Date.now() - 300000); // 5 minutes ago
    return Array.from(this.collaborationEvents.values())
      .filter(event => event.projectId === projectId && (event.createdAt?.getTime() || 0) >= cutoff.getTime())
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }
}

export const storage = new MemStorage();

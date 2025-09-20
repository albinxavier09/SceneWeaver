import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertSceneSchema, insertCommentSchema, insertCollaborationEventSchema } from "@shared/schema";
import { improveDialogue, expandScene, generateReferenceImage, generateSceneSuggestions, type AIProvider } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Configure multer for file uploads
  const uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'uploads/';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ 
    storage: uploadStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // WebSocket server for real-time collaboration
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, { ws: WebSocket; projectId: string; userId: string }>();

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const projectId = url.searchParams.get('projectId');
    const userId = url.searchParams.get('userId');

    if (!projectId || !userId) {
      ws.close();
      return;
    }

    const clientId = `${projectId}-${userId}-${Date.now()}`;
    clients.set(clientId, { ws, projectId, userId });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Store collaboration event
        await storage.addCollaborationEvent({
          projectId,
          userId,
          eventType: message.type,
          data: message.data,
        });

        // Broadcast to other clients in the same project
        for (const [id, client] of Array.from(clients.entries())) {
          if (id !== clientId && 
              client.projectId === projectId && 
              client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
              type: message.type,
              userId,
              data: message.data,
              timestamp: new Date().toISOString(),
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
    });
  });

  // Project routes
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to get project" });
    }
  });

  // Scene routes
  app.get("/api/projects/:projectId/scenes", async (req, res) => {
    try {
      const scenes = await storage.getScenesByProjectId(req.params.projectId);
      res.json(scenes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get scenes" });
    }
  });

  app.post("/api/projects/:projectId/scenes", async (req, res) => {
    try {
      const sceneData = insertSceneSchema.parse({
        ...req.body,
        projectId: req.params.projectId,
      });
      const scene = await storage.createScene(sceneData);
      res.json(scene);
    } catch (error) {
      res.status(400).json({ message: "Invalid scene data" });
    }
  });

  app.patch("/api/scenes/:id", async (req, res) => {
    try {
      const scene = await storage.updateScene(req.params.id, req.body);
      if (!scene) {
        return res.status(404).json({ message: "Scene not found" });
      }
      res.json(scene);
    } catch (error) {
      res.status(500).json({ message: "Failed to update scene" });
    }
  });

  app.delete("/api/scenes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteScene(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Scene not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete scene" });
    }
  });

  // Comment routes
  app.get("/api/scenes/:sceneId/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsBySceneId(req.params.sceneId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get comments" });
    }
  });

  app.post("/api/scenes/:sceneId/comments", async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse({
        ...req.body,
        sceneId: req.params.sceneId,
      });
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  app.patch("/api/comments/:id", async (req, res) => {
    try {
      const comment = await storage.updateComment(req.params.id, req.body);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  // AI routes with provider support
  app.post("/api/ai/improve-dialogue", async (req, res) => {
    try {
      const { dialogue, mood, context, provider = "openai" } = req.body;
      const result = await improveDialogue(dialogue, mood || "neutral", context || "", provider as AIProvider);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/ai/expand-scene", async (req, res) => {
    try {
      const { title, description, duration, provider = "openai" } = req.body;
      const result = await expandScene(title, description, duration || 5000, provider as AIProvider);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/ai/generate-reference", async (req, res) => {
    try {
      const { description, style, provider = "openai" } = req.body;
      const result = await generateReferenceImage(description, style || "photorealistic", provider as AIProvider);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/ai/suggest-scenes", async (req, res) => {
    try {
      const { projectContext, existingScenes, provider = "openai" } = req.body;
      const result = await generateSceneSuggestions(projectContext || "", existingScenes || [], provider as AIProvider);
      res.json({ suggestions: result });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Image upload route
  app.post("/api/upload-image", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl, filename: req.file.filename });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload image: " + (error as Error).message });
    }
  });

  // Save drawing route
  app.post("/api/save-drawing", async (req, res) => {
    try {
      const { drawingData, sceneId } = req.body;
      
      if (!drawingData) {
        return res.status(400).json({ message: "No drawing data provided" });
      }

      // Remove data URL prefix to get base64 data
      const base64Data = drawingData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      
      const filename = `drawing-${sceneId}-${Date.now()}.png`;
      const filepath = path.join('uploads', filename);
      
      // Ensure uploads directory exists
      if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads', { recursive: true });
      }
      
      fs.writeFileSync(filepath, buffer);
      
      res.json({ url: `/uploads/${filename}`, filename });
    } catch (error) {
      res.status(500).json({ message: "Failed to save drawing: " + (error as Error).message });
    }
  });

  // Collaboration events
  app.get("/api/projects/:projectId/collaboration", async (req, res) => {
    try {
      const since = req.query.since ? new Date(req.query.since as string) : undefined;
      const events = await storage.getRecentCollaborationEvents(req.params.projectId, since);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to get collaboration events" });
    }
  });

  return httpServer;
}

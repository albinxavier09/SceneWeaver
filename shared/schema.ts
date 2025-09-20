import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const scenes = pgTable("scenes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dialogue: text("dialogue"),
  characters: text("characters").array(),
  cameraNote: text("camera_note"),
  mood: text("mood"),
  duration: integer("duration"), // in milliseconds
  position: json("position").$type<{ x: number; y: number }>(),
  referenceImageUrl: text("reference_image_url"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sceneId: varchar("scene_id").references(() => scenes.id).notNull(),
  author: text("author").notNull(),
  content: text("content").notNull(),
  resolved: boolean("resolved").default(false),
  position: json("position").$type<{ x: number; y: number }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const collaborationEvents = pgTable("collaboration_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  userId: text("user_id").notNull(),
  eventType: text("event_type").notNull(), // cursor_move, scene_edit, comment_add, etc.
  data: json("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSceneSchema = createInsertSchema(scenes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertCollaborationEventSchema = createInsertSchema(collaborationEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertScene = z.infer<typeof insertSceneSchema>;
export type Scene = typeof scenes.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertCollaborationEvent = z.infer<typeof insertCollaborationEventSchema>;
export type CollaborationEvent = typeof collaborationEvents.$inferSelect;

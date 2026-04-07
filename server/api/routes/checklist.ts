import { Express } from "express";
import { storage } from "../../storage";
import { insertMoldChecklistItemSchema } from "@shared/schema";

export function setupChecklistRoutes(app: Express): void {
  app.get("/api/checklist-items", async (_req, res) => {
    try {
      const items = await storage.getAllChecklistItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch checklist items" });
    }
  });

  app.get("/api/checklist-items/:id", async (req, res) => {
    try {
      const item = await storage.getChecklistItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Checklist item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch checklist item" });
    }
  });

  app.post("/api/checklist-items", async (req, res) => {
    try {
      const validatedData = insertMoldChecklistItemSchema.parse(req.body);
      const item = await storage.createChecklistItem(validatedData);
      res.status(201).json(item);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid checklist item data" });
      }
      res.status(400).json({ error: "Invalid checklist item data" });
    }
  });

  app.patch("/api/checklist-items/:id", async (req, res) => {
    try {
      const validatedData = insertMoldChecklistItemSchema.parse(req.body);
      const item = await storage.updateChecklistItem(req.params.id, validatedData);
      if (!item) {
        return res.status(404).json({ error: "Checklist item not found" });
      }
      res.json(item);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid checklist item data" });
      }
      res.status(400).json({ error: "Invalid checklist item data" });
    }
  });

  app.delete("/api/checklist-items/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteChecklistItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Checklist item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete checklist item" });
    }
  });

  app.get("/api/jobs/:jobId/checklist-items", async (req, res) => {
    try {
      const items = await storage.getChecklistItemsByJobId(req.params.jobId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch checklist items" });
    }
  });
}

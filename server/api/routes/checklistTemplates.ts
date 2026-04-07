import { Express } from "express";
import { storage } from "../../storage";
import { insertChecklistTemplateSchema, insertChecklistTemplateItemSchema } from "@shared/schema";

export function setupChecklistTemplateRoutes(app: Express): void {
  // Checklist Templates
  app.get("/api/checklist-templates", async (_req, res) => {
    try {
      const templates = await storage.getAllChecklistTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch checklist templates" });
    }
  });

  app.get("/api/checklist-templates/:id", async (req, res) => {
    try {
      const template = await storage.getChecklistTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Checklist template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch checklist template" });
    }
  });

  app.post("/api/checklist-templates", async (req, res) => {
    try {
      const validatedData = insertChecklistTemplateSchema.parse(req.body);
      const template = await storage.createChecklistTemplate(validatedData);
      res.status(201).json(template);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid template data" });
      }
      res.status(400).json({ error: "Invalid template data" });
    }
  });

  app.patch("/api/checklist-templates/:id", async (req, res) => {
    try {
      const validatedData = insertChecklistTemplateSchema.parse(req.body);
      const template = await storage.updateChecklistTemplate(req.params.id, validatedData);
      if (!template) {
        return res.status(404).json({ error: "Checklist template not found" });
      }
      res.json(template);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid template data" });
      }
      res.status(400).json({ error: "Invalid template data" });
    }
  });

  app.delete("/api/checklist-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteChecklistTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Checklist template not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete checklist template" });
    }
  });

  // Checklist Template Items
  app.get("/api/checklist-templates/:templateId/items", async (req, res) => {
    try {
      const items = await storage.getChecklistTemplateItems(req.params.templateId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template items" });
    }
  });

  app.get("/api/checklist-template-items/:id", async (req, res) => {
    try {
      const item = await storage.getChecklistTemplateItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Template item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template item" });
    }
  });

  app.post("/api/checklist-template-items", async (req, res) => {
    try {
      const validatedData = insertChecklistTemplateItemSchema.parse(req.body);
      const item = await storage.createChecklistTemplateItem(validatedData);
      res.status(201).json(item);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid item data" });
      }
      res.status(400).json({ error: "Invalid item data" });
    }
  });

  app.patch("/api/checklist-template-items/:id", async (req, res) => {
    try {
      const validatedData = insertChecklistTemplateItemSchema.parse(req.body);
      const item = await storage.updateChecklistTemplateItem(req.params.id, validatedData);
      if (!item) {
        return res.status(404).json({ error: "Template item not found" });
      }
      res.json(item);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid item data" });
      }
      res.status(400).json({ error: "Invalid item data" });
    }
  });

  app.delete("/api/checklist-template-items/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteChecklistTemplateItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Template item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template item" });
    }
  });
}

import { Express } from "express";
import { storage } from "../../storage";
import { insertShiftTemplateSchema, insertDayTemplateSchema, insertDayTemplateShiftSchema } from "@shared/schema";

export function setupSchedulingTemplatesRoutes(app: Express): void {
  app.get("/api/shift-templates", async (_req, res) => {
    try {
      const templates = await storage.getAllShiftTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shift templates" });
    }
  });

  app.get("/api/shift-templates/:id", async (req, res) => {
    try {
      const template = await storage.getShiftTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Shift template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shift template" });
    }
  });

  app.post("/api/shift-templates", async (req, res) => {
    try {
      const validatedData = insertShiftTemplateSchema.parse(req.body);
      const template = await storage.createShiftTemplate(validatedData);
      res.status(201).json(template);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid shift template data" });
      }
      res.status(400).json({ error: "Invalid shift template data" });
    }
  });

  app.patch("/api/shift-templates/:id", async (req, res) => {
    try {
      const validatedData = insertShiftTemplateSchema.parse(req.body);
      const template = await storage.updateShiftTemplate(req.params.id, validatedData);
      if (!template) {
        return res.status(404).json({ error: "Shift template not found" });
      }
      res.json(template);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid shift template data" });
      }
      res.status(400).json({ error: "Invalid shift template data" });
    }
  });

  app.delete("/api/shift-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteShiftTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Shift template not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete shift template" });
    }
  });

  app.get("/api/day-templates", async (_req, res) => {
    try {
      const templates = await storage.getAllDayTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch day templates" });
    }
  });

  app.get("/api/day-templates/active", async (_req, res) => {
    try {
      const templates = await storage.getActiveDayTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active day templates" });
    }
  });

  app.get("/api/day-templates/day/:dayOfWeek", async (req, res) => {
    try {
      const dayOfWeek = parseInt(req.params.dayOfWeek);
      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({ error: "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)" });
      }
      const templates = await storage.getDayTemplatesByDayOfWeek(dayOfWeek);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch day templates for day of week" });
    }
  });

  app.get("/api/day-templates/:id", async (req, res) => {
    try {
      const template = await storage.getDayTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Day template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch day template" });
    }
  });

  app.post("/api/day-templates", async (req, res) => {
    try {
      const validatedData = insertDayTemplateSchema.parse(req.body);
      const template = await storage.createDayTemplate(validatedData);
      res.status(201).json(template);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid day template data" });
      }
      res.status(400).json({ error: "Invalid day template data" });
    }
  });

  app.patch("/api/day-templates/:id", async (req, res) => {
    try {
      const validatedData = insertDayTemplateSchema.parse(req.body);
      const template = await storage.updateDayTemplate(req.params.id, validatedData);
      if (!template) {
        return res.status(404).json({ error: "Day template not found" });
      }
      res.json(template);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid day template data" });
      }
      res.status(400).json({ error: "Invalid day template data" });
    }
  });

  app.delete("/api/day-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDayTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Day template not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete day template" });
    }
  });

  app.get("/api/day-templates/:dayTemplateId/shifts", async (req, res) => {
    try {
      const shifts = await storage.getDayTemplateShifts(req.params.dayTemplateId);
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch day template shifts" });
    }
  });

  app.get("/api/day-template-shifts/:id", async (req, res) => {
    try {
      const shift = await storage.getDayTemplateShift(req.params.id);
      if (!shift) {
        return res.status(404).json({ error: "Day template shift not found" });
      }
      res.json(shift);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch day template shift" });
    }
  });

  app.post("/api/day-template-shifts", async (req, res) => {
    try {
      const validatedData = insertDayTemplateShiftSchema.parse(req.body);
      const shift = await storage.createDayTemplateShift(validatedData);
      res.status(201).json(shift);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid day template shift data" });
      }
      res.status(400).json({ error: "Invalid day template shift data" });
    }
  });

  app.patch("/api/day-template-shifts/:id", async (req, res) => {
    try {
      const validatedData = insertDayTemplateShiftSchema.parse(req.body);
      const shift = await storage.updateDayTemplateShift(req.params.id, validatedData);
      if (!shift) {
        return res.status(404).json({ error: "Day template shift not found" });
      }
      res.json(shift);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid day template shift data" });
      }
      res.status(400).json({ error: "Invalid day template shift data" });
    }
  });

  app.delete("/api/day-template-shifts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDayTemplateShift(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Day template shift not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete day template shift" });
    }
  });
}

import { Express } from "express";
import { storage } from "../../storage";
import { insertMaterialSchema } from "@shared/schema";

export function setupMaterialRoutes(app: Express): void {
  app.get("/api/materials", async (_req, res) => {
    try {
      const materials = await storage.getAllMaterials();
      res.json(materials);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  app.get("/api/materials/:id", async (req, res) => {
    try {
      const material = await storage.getMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch material" });
    }
  });

  app.post("/api/materials", async (req, res) => {
    try {
      const validatedData = insertMaterialSchema.parse(req.body);
      const material = await storage.createMaterial(validatedData);
      res.status(201).json(material);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid material data" });
      }
      res.status(400).json({ error: "Invalid material data" });
    }
  });

  app.patch("/api/materials/:id", async (req, res) => {
    try {
      const validatedData = insertMaterialSchema.parse(req.body);
      const material = await storage.updateMaterial(req.params.id, validatedData);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(material);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid material data" });
      }
      res.status(400).json({ error: "Invalid material data" });
    }
  });

  app.delete("/api/materials/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMaterial(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete material" });
    }
  });
}

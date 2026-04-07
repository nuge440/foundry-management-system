import { Express } from "express";
import { storage } from "../../storage";
import { insertNdtSpecificationSchema } from "@shared/schema";

export function setupNdtSpecificationRoutes(app: Express): void {
  app.get("/api/ndt-specifications", async (_req, res) => {
    try {
      const specs = await storage.getAllNdtSpecifications();
      res.json(specs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch NDT specifications" });
    }
  });

  app.get("/api/ndt-specifications/:id", async (req, res) => {
    try {
      const spec = await storage.getNdtSpecification(req.params.id);
      if (!spec) {
        return res.status(404).json({ error: "NDT specification not found" });
      }
      res.json(spec);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch NDT specification" });
    }
  });

  app.post("/api/ndt-specifications", async (req, res) => {
    try {
      const validatedData = insertNdtSpecificationSchema.parse(req.body);
      const spec = await storage.createNdtSpecification(validatedData);
      res.status(201).json(spec);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid NDT specification data" });
      }
      res.status(400).json({ error: "Invalid NDT specification data" });
    }
  });

  app.patch("/api/ndt-specifications/:id", async (req, res) => {
    try {
      const validatedData = insertNdtSpecificationSchema.parse(req.body);
      const spec = await storage.updateNdtSpecification(req.params.id, validatedData);
      if (!spec) {
        return res.status(404).json({ error: "NDT specification not found" });
      }
      res.json(spec);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid NDT specification data" });
      }
      res.status(400).json({ error: "Invalid NDT specification data" });
    }
  });

  app.delete("/api/ndt-specifications/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteNdtSpecification(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "NDT specification not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete NDT specification" });
    }
  });
}

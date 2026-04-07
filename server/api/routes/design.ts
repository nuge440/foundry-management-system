import { Express } from "express";
import { storage } from "../../storage";
import { insertDesignInfoSchema } from "@shared/schema";

export function setupDesignRoutes(app: Express): void {
  app.get("/api/jobs/:jobId/design-info", async (req, res) => {
    try {
      const designInfo = await storage.getDesignInfoByJobId(req.params.jobId);
      if (!designInfo) {
        return res.status(404).json({ error: "Design info not found" });
      }
      res.json(designInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch design info" });
    }
  });

  app.patch("/api/jobs/:jobId/design-info", async (req, res) => {
    try {
      const validatedData = insertDesignInfoSchema.parse(req.body);
      const existingInfo = await storage.getDesignInfoByJobId(req.params.jobId);
      
      let designInfo;
      if (existingInfo) {
        designInfo = await storage.updateDesignInfo(existingInfo.id, validatedData);
      } else {
        designInfo = await storage.createDesignInfo({ ...validatedData, jobId: req.params.jobId });
      }
      
      res.json(designInfo);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid design info data" });
      }
      res.status(400).json({ error: "Invalid design info data" });
    }
  });

  app.post("/api/design-info", async (req, res) => {
    try {
      const validatedData = insertDesignInfoSchema.parse(req.body);
      const designInfo = await storage.createDesignInfo(validatedData);
      res.status(201).json(designInfo);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid design info data" });
      }
      res.status(400).json({ error: "Invalid design info data" });
    }
  });

  app.patch("/api/design-info/:id", async (req, res) => {
    try {
      const validatedData = insertDesignInfoSchema.parse(req.body);
      const designInfo = await storage.updateDesignInfo(req.params.id, validatedData);
      if (!designInfo) {
        return res.status(404).json({ error: "Design info not found" });
      }
      res.json(designInfo);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid design info data" });
      }
      res.status(400).json({ error: "Invalid design info data" });
    }
  });
}

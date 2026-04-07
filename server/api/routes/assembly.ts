import { Express } from "express";
import { storage } from "../../storage";
import { insertAssemblyInfoSchema } from "@shared/schema";

export function setupAssemblyRoutes(app: Express): void {
  app.get("/api/jobs/:jobId/assembly-info", async (req, res) => {
    try {
      const assemblyInfo = await storage.getAssemblyInfoByJobId(req.params.jobId);
      if (!assemblyInfo) {
        return res.status(404).json({ error: "Assembly info not found" });
      }
      res.json(assemblyInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assembly info" });
    }
  });

  app.patch("/api/jobs/:jobId/assembly-info", async (req, res) => {
    try {
      const validatedData = insertAssemblyInfoSchema.parse(req.body);
      const existingInfo = await storage.getAssemblyInfoByJobId(req.params.jobId);
      
      let assemblyInfo;
      if (existingInfo) {
        assemblyInfo = await storage.updateAssemblyInfo(existingInfo.id, validatedData);
      } else {
        assemblyInfo = await storage.createAssemblyInfo({ ...validatedData, jobId: req.params.jobId });
      }
      
      res.json(assemblyInfo);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid assembly info data" });
      }
      res.status(400).json({ error: "Invalid assembly info data" });
    }
  });

  app.post("/api/assembly-info", async (req, res) => {
    try {
      const validatedData = insertAssemblyInfoSchema.parse(req.body);
      const assemblyInfo = await storage.createAssemblyInfo(validatedData);
      res.status(201).json(assemblyInfo);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid assembly info data" });
      }
      res.status(400).json({ error: "Invalid assembly info data" });
    }
  });

  app.patch("/api/assembly-info/:id", async (req, res) => {
    try {
      const validatedData = insertAssemblyInfoSchema.parse(req.body);
      const assemblyInfo = await storage.updateAssemblyInfo(req.params.id, validatedData);
      if (!assemblyInfo) {
        return res.status(404).json({ error: "Assembly info not found" });
      }
      res.json(assemblyInfo);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid assembly info data" });
      }
      res.status(400).json({ error: "Invalid assembly info data" });
    }
  });
}

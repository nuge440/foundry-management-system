import { Express } from "express";
import { storage } from "../../storage";
import { insertCleaningRoomInfoSchema } from "@shared/schema";

export function setupCleaningRoutes(app: Express): void {
  app.get("/api/jobs/:jobId/cleaning-info", async (req, res) => {
    try {
      const cleaningInfo = await storage.getCleaningRoomInfoByJobId(req.params.jobId);
      if (!cleaningInfo) {
        return res.status(404).json({ error: "Cleaning info not found" });
      }
      res.json(cleaningInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cleaning info" });
    }
  });

  app.patch("/api/jobs/:jobId/cleaning-info", async (req, res) => {
    try {
      const validatedData = insertCleaningRoomInfoSchema.parse(req.body);
      const existingInfo = await storage.getCleaningRoomInfoByJobId(req.params.jobId);
      
      let cleaningInfo;
      if (existingInfo) {
        cleaningInfo = await storage.updateCleaningRoomInfo(existingInfo.id, validatedData);
      } else {
        cleaningInfo = await storage.createCleaningRoomInfo({ ...validatedData, jobId: req.params.jobId });
      }
      
      res.json(cleaningInfo);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid cleaning info data" });
      }
      res.status(400).json({ error: "Invalid cleaning info data" });
    }
  });

  app.post("/api/cleaning-info", async (req, res) => {
    try {
      const validatedData = insertCleaningRoomInfoSchema.parse(req.body);
      const cleaningInfo = await storage.createCleaningRoomInfo(validatedData);
      res.status(201).json(cleaningInfo);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid cleaning info data" });
      }
      res.status(400).json({ error: "Invalid cleaning info data" });
    }
  });

  app.patch("/api/cleaning-info/:id", async (req, res) => {
    try {
      const validatedData = insertCleaningRoomInfoSchema.parse(req.body);
      const cleaningInfo = await storage.updateCleaningRoomInfo(req.params.id, validatedData);
      if (!cleaningInfo) {
        return res.status(404).json({ error: "Cleaning info not found" });
      }
      res.json(cleaningInfo);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid cleaning info data" });
      }
      res.status(400).json({ error: "Invalid cleaning info data" });
    }
  });
}

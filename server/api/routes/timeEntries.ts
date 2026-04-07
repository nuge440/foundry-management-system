import { Express } from "express";
import { storage } from "../../storage";
import { insertTimeEntrySchema } from "@shared/schema";

export function setupTimeEntriesRoutes(app: Express): void {
  app.get("/api/time-entries", async (_req, res) => {
    try {
      const entries = await storage.getAllTimeEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time entries" });
    }
  });

  app.get("/api/time-entries/active", async (_req, res) => {
    try {
      const entries = await storage.getActiveTimeEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active time entries" });
    }
  });

  app.get("/api/time-entries/user/:userId", async (req, res) => {
    try {
      const entries = await storage.getTimeEntriesByUserId(req.params.userId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time entries for user" });
    }
  });

  app.get("/api/time-entries/job/:jobId", async (req, res) => {
    try {
      const entries = await storage.getTimeEntriesByJobId(req.params.jobId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time entries for job" });
    }
  });

  app.get("/api/time-entries/:id", async (req, res) => {
    try {
      const entry = await storage.getTimeEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ error: "Time entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time entry" });
    }
  });

  app.post("/api/time-entries", async (req, res) => {
    try {
      const validatedData = insertTimeEntrySchema.parse(req.body);
      const entry = await storage.createTimeEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid time entry data" });
      }
      res.status(400).json({ error: "Invalid time entry data" });
    }
  });

  app.patch("/api/time-entries/:id", async (req, res) => {
    try {
      const validatedData = insertTimeEntrySchema.parse(req.body);
      const entry = await storage.updateTimeEntry(req.params.id, validatedData);
      if (!entry) {
        return res.status(404).json({ error: "Time entry not found" });
      }
      res.json(entry);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid time entry data" });
      }
      res.status(400).json({ error: "Invalid time entry data" });
    }
  });

  app.patch("/api/time-entries/:id/clock-out", async (req, res) => {
    try {
      const { clockOut, piecesCompleted } = req.body;
      const existing = await storage.getTimeEntry(req.params.id);
      
      if (!existing) {
        return res.status(404).json({ error: "Time entry not found" });
      }

      if (existing.clockOut) {
        return res.status(400).json({ error: "Time entry already clocked out" });
      }

      const updated = await storage.updateTimeEntry(req.params.id, {
        ...existing,
        clockOut,
        piecesCompleted: piecesCompleted || existing.piecesCompleted
      });

      if (updated && updated.jobId && piecesCompleted > 0) {
        const job = await storage.getJob(updated.jobId);
        if (job) {
          const newQuantityCompleted = job.quantityCompleted + piecesCompleted;
          await storage.updateJob(updated.jobId, {
            ...job,
            quantityCompleted: newQuantityCompleted
          });
        }
      }

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to clock out" });
    }
  });

  app.delete("/api/time-entries/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTimeEntry(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Time entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete time entry" });
    }
  });
}

import { Express } from "express";
import { storage } from "../../storage";
import { insertScheduleSchema } from "@shared/schema";

export function setupSchedulesRoutes(app: Express): void {
  app.get("/api/schedules", async (_req, res) => {
    try {
      const schedules = await storage.getAllSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  app.get("/api/schedules/user/:userId", async (req, res) => {
    try {
      const schedules = await storage.getSchedulesByUserId(req.params.userId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedules for user" });
    }
  });

  app.get("/api/schedules/date/:date", async (req, res) => {
    try {
      const schedules = await storage.getSchedulesByDate(req.params.date);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedules for date" });
    }
  });

  app.get("/api/schedules/date-range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate query parameters are required" });
      }
      const schedules = await storage.getSchedulesByDateRange(startDate as string, endDate as string);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedules for date range" });
    }
  });

  app.get("/api/schedules/:id", async (req, res) => {
    try {
      const schedule = await storage.getSchedule(req.params.id);
      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedule" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const validatedData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid schedule data" });
      }
      res.status(400).json({ error: "Invalid schedule data" });
    }
  });

  app.patch("/api/schedules/:id", async (req, res) => {
    try {
      const validatedData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.updateSchedule(req.params.id, validatedData);
      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid schedule data" });
      }
      res.status(400).json({ error: "Invalid schedule data" });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSchedule(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule" });
    }
  });
}

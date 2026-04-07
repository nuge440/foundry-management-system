import { Express } from "express";
import { mongoJobStorage } from "../../mongoStorage";
import { getDatabase, getJobsCollection } from "../../mongodb";

export function setupMongoJobRoutes(app: Express): void {
  app.get("/api/mongo/jobs/meta/unique-tasks", async (_req, res) => {
    try {
      const jobs = await mongoJobStorage.getActiveJobs();
      const taskCounts: Record<string, number> = {};
      jobs.forEach(job => {
        if (job.task) {
          taskCounts[job.task] = (taskCounts[job.task] || 0) + 1;
        }
      });
      const tasks = Object.entries(taskCounts)
        .map(([task, count]) => ({ task, count }))
        .sort((a, b) => b.count - a.count);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching unique tasks:", error);
      res.status(500).json({ error: "Failed to fetch unique tasks" });
    }
  });

  app.get("/api/mongo/jobs", async (req, res) => {
    try {
      const filter = req.query.filter as string | undefined;
      if (filter === "active") {
        const jobs = await mongoJobStorage.getActiveJobs();
        res.json(jobs);
      } else {
        const jobs = await mongoJobStorage.getAllJobs();
        res.json(jobs);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs from MongoDB" });
    }
  });

  app.get("/api/mongo/jobs/:id", async (req, res) => {
    try {
      const job = await mongoJobStorage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  app.get("/api/mongo/jobs/:id/operations", async (req, res) => {
    try {
      const result = await mongoJobStorage.getJobOperations(req.params.id);
      if (!result) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error fetching job operations:", error);
      res.status(500).json({ error: "Failed to fetch job operations" });
    }
  });

  app.post("/api/mongo/jobs", async (req, res) => {
    try {
      const job = await mongoJobStorage.createJob(req.body);
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(400).json({ error: "Failed to create job" });
    }
  });

  app.post("/api/mongo/jobs/wipe", async (req, res) => {
    try {
      const collection = await getJobsCollection();
      const countBefore = await collection.countDocuments();
      await collection.deleteMany({});

      const db = await getDatabase();
      const syncMetaCollection = db.collection("sync_metadata");
      await syncMetaCollection.deleteMany({});

      res.json({
        message: `Wiped ${countBefore} jobs and sync metadata from MongoDB. Run your sync script to repopulate.`,
        deletedCount: countBefore,
        syncMetadataCleared: true,
      });
    } catch (error: any) {
      console.error("Error wiping jobs collection:", error);
      res.status(500).json({ error: error.message || "Failed to wipe jobs collection" });
    }
  });

  app.patch("/api/mongo/jobs/:id", async (req, res) => {
    try {
      const { changedBy: _ignored, ...updates } = req.body;
      const sessionUser = req.authUserName || "Unknown";
      const job = await mongoJobStorage.updateJob(req.params.id, updates, sessionUser);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(400).json({ error: "Failed to update job" });
    }
  });

  app.delete("/api/mongo/jobs/:id", async (req, res) => {
    try {
      const deleted = await mongoJobStorage.deleteJob(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  app.patch("/api/mongo/jobs/:id/design-info", async (req, res) => {
    try {
      const { changedBy: _ignored, ...designInfo } = req.body;
      const sessionUser = req.authUserName || "Unknown";
      const job = await mongoJobStorage.updateDesignInfo(req.params.id, designInfo, sessionUser);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error updating design info:", error);
      res.status(400).json({ error: "Failed to update design info" });
    }
  });

  app.patch("/api/mongo/jobs/:id/assembly-info", async (req, res) => {
    try {
      const { changedBy: _ignored, ...assemblyInfo } = req.body;
      const sessionUser = req.authUserName || "Unknown";
      const job = await mongoJobStorage.updateAssemblyInfo(req.params.id, assemblyInfo, sessionUser);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error updating assembly info:", error);
      res.status(400).json({ error: "Failed to update assembly info" });
    }
  });

  app.patch("/api/mongo/jobs/:id/cleaning-info", async (req, res) => {
    try {
      const { changedBy: _ignored, ...cleaningInfo } = req.body;
      const sessionUser = req.authUserName || "Unknown";
      const job = await mongoJobStorage.updateCleaningInfo(req.params.id, cleaningInfo, sessionUser);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error updating cleaning info:", error);
      res.status(400).json({ error: "Failed to update cleaning info" });
    }
  });

  app.patch("/api/mongo/jobs/:id/pouring-instructions", async (req, res) => {
    try {
      const { changedBy: _ignored, ...pouringInstructions } = req.body;
      const sessionUser = req.authUserName || "Unknown";
      const job = await mongoJobStorage.updatePouringInstructions(req.params.id, pouringInstructions, sessionUser);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error updating pouring instructions:", error);
      res.status(400).json({ error: "Failed to update pouring instructions" });
    }
  });

  app.patch("/api/mongo/jobs/:id/nd-test-requirements", async (req, res) => {
    try {
      const { changedBy: _ignored, ...ndTestRequirements } = req.body;
      const sessionUser = req.authUserName || "Unknown";
      const job = await mongoJobStorage.updateNdTestRequirements(req.params.id, ndTestRequirements, sessionUser);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error updating ND test requirements:", error);
      res.status(400).json({ error: "Failed to update ND test requirements" });
    }
  });

  app.post("/api/mongo/jobs/:id/lessons-learned", async (req, res) => {
    try {
      const job = await mongoJobStorage.addLessonLearned(req.params.id, req.body);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.status(201).json(job);
    } catch (error) {
      console.error("Error adding lesson learned:", error);
      res.status(400).json({ error: "Failed to add lesson learned" });
    }
  });

  app.patch("/api/mongo/jobs/:id/lessons-learned/:lessonId", async (req, res) => {
    try {
      const job = await mongoJobStorage.updateLessonLearned(req.params.id, req.params.lessonId, req.body);
      if (!job) {
        return res.status(404).json({ error: "Job or lesson not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error updating lesson learned:", error);
      res.status(400).json({ error: "Failed to update lesson learned" });
    }
  });

  app.delete("/api/mongo/jobs/:id/lessons-learned/:lessonId", async (req, res) => {
    try {
      const job = await mongoJobStorage.deleteLessonLearned(req.params.id, req.params.lessonId);
      if (!job) {
        return res.status(404).json({ error: "Job or lesson not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error deleting lesson learned:", error);
      res.status(500).json({ error: "Failed to delete lesson learned" });
    }
  });

  app.post("/api/mongo/jobs/:id/split", async (req, res) => {
    try {
      const splitCount = parseInt(req.body.splitCount);
      if (!splitCount || splitCount < 2) {
        return res.status(400).json({ error: "splitCount must be at least 2" });
      }
      const children = await mongoJobStorage.splitJob(req.params.id, splitCount);
      res.status(201).json(children);
    } catch (error: any) {
      console.error("Error splitting job:", error);
      res.status(400).json({ error: error.message || "Failed to split job" });
    }
  });

  app.post("/api/mongo/jobs/:jobNumber/unsplit", async (req, res) => {
    try {
      const result = await mongoJobStorage.unsplitJob(req.params.jobNumber);
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "No child jobs found to unsplit" });
      }
      res.json({ message: `Removed ${result.deletedCount} child jobs`, deletedCount: result.deletedCount });
    } catch (error: any) {
      console.error("Error unsplitting job:", error);
      res.status(500).json({ error: error.message || "Failed to unsplit job" });
    }
  });

  app.post("/api/mongo/jobs/:id/toggle-remake", async (req, res) => {
    try {
      const job = await mongoJobStorage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      const isRemake = !job.isRemake;
      const update: Partial<any> = {
        isRemake,
        remakeReason: isRemake ? (req.body.reason || "") : "",
        remakeDate: isRemake ? new Date().toISOString() : "",
      };
      const sessionUser = req.authUserName || "Unknown";
      const updated = await mongoJobStorage.updateJob(req.params.id, update, sessionUser);
      res.json(updated);
    } catch (error: any) {
      console.error("Error toggling remake:", error);
      res.status(500).json({ error: error.message || "Failed to toggle remake" });
    }
  });

  app.get("/api/mongo/jobs/:jobNumber/children", async (req, res) => {
    try {
      const children = await mongoJobStorage.getChildJobs(req.params.jobNumber);
      res.json(children);
    } catch (error) {
      console.error("Error fetching child jobs:", error);
      res.status(500).json({ error: "Failed to fetch child jobs" });
    }
  });

  // Diagnostic endpoint to check MongoDB connection details
  app.get("/api/mongo/sync-status", async (_req, res) => {
    try {
      const db = await getDatabase();
      const syncDoc = await db.collection("sync_metadata").findOne({ _id: "last_sync" as any });
      if (syncDoc && syncDoc.timestamp) {
        let ts: string;
        if (syncDoc.timestamp instanceof Date) {
          ts = syncDoc.timestamp.toISOString();
        } else if (typeof syncDoc.timestamp === "string") {
          ts = syncDoc.timestamp;
        } else {
          ts = new Date(syncDoc.timestamp).toISOString();
        }
        const updatedAt = syncDoc.updated_at instanceof Date
          ? syncDoc.updated_at.toISOString()
          : syncDoc.updated_at || null;
        res.json({ lastSync: ts, updatedAt, synced: true });
      } else {
        res.json({ lastSync: null, synced: false });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message, synced: false });
    }
  });

  app.get("/api/mongo/diagnostic", async (req, res) => {
    try {
      const db = await getDatabase();
      const serverStatus = await db.command({ connectionStatus: 1 });
      const collection = await getJobsCollection();
      const count = await collection.countDocuments();
      
      res.json({
        databaseName: db.databaseName,
        jobsCount: count,
        connected: true,
        authInfo: serverStatus.authInfo || "N/A"
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: error.message,
        connected: false 
      });
    }
  });

}

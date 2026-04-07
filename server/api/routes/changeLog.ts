import { Express } from "express";
import { mongoJobStorage } from "../../mongoStorage";

export function setupChangeLogRoutes(app: Express): void {
  app.get("/api/change-log/stream", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write("data: {\"type\":\"connected\"}\n\n");

    const unsubscribe = mongoJobStorage.onChangeLogEntry((entry) => {
      res.write(`data: ${JSON.stringify(entry)}\n\n`);
    });

    const keepAlive = setInterval(() => {
      res.write(": keepalive\n\n");
    }, 30000);

    req.on("close", () => {
      unsubscribe();
      clearInterval(keepAlive);
    });
  });

  app.get("/api/change-log", async (req, res) => {
    try {
      const { jobNumber, changedBy, startDate, endDate, limit, offset } = req.query;

      const result = await mongoJobStorage.getChangeLog({
        jobNumber: jobNumber as string | undefined,
        changedBy: changedBy as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error fetching change log:", error);
      res.status(500).json({ error: error.message || "Failed to fetch change log" });
    }
  });

  app.get("/api/change-log/job/:jobNumber", async (req, res) => {
    try {
      const entries = await mongoJobStorage.getChangeLogForJob(req.params.jobNumber);
      res.json(entries);
    } catch (error: any) {
      console.error("Error fetching change log for job:", error);
      res.status(500).json({ error: error.message || "Failed to fetch change log for job" });
    }
  });
}

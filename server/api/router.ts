import { Express } from "express";
import { setupAuthRoutes, requireAuth, tokenAuthMiddleware } from "./routes/auth";
import { setupJobRoutes } from "./routes/jobs";
import { setupDesignRoutes } from "./routes/design";
import { setupAssemblyRoutes } from "./routes/assembly";
import { setupCleaningRoutes } from "./routes/cleaning";
import { setupChecklistRoutes } from "./routes/checklist";
import { setupChecklistTemplateRoutes } from "./routes/checklistTemplates";
import { setupWorkflowRoutes } from "./routes/workflow";
import { setupUserRoutes } from "./routes/users";
import { setupMaterialRoutes } from "./routes/materials";
import { setupNdtSpecificationRoutes } from "./routes/ndtSpecifications";
import { setupAttachmentRoutes } from "./routes/attachments";
import { setupJobBossImportRoutes } from "./routes/jobBossImport";
import { setupTimeEntriesRoutes } from "./routes/timeEntries";
import { setupSchedulesRoutes } from "./routes/schedules";
import { setupSchedulingTemplatesRoutes } from "./routes/scheduling-templates";
import { setupOrganizationRoutes } from "./routes/organization";
import { setupMongoJobRoutes } from "./routes/mongoJobs";
import { setupImportJobsRoutes } from "./routes/importJobs";
import { setupMongoDatasetsRoutes } from "./routes/mongoDatasets";
import { setupBambooHRRoutes } from "./routes/bamboohr";
import { setupChangeLogRoutes } from "./routes/changeLog";
import { getAvailableDatabases, getActiveDatabaseName, switchDatabase, type DatabaseName } from "../mongodb";

const PUBLIC_EXACT_GET = new Set([
  "/api/database/active",
  "/api/workflow-statuses",
  "/api/workflow-departments",
  "/api/mongo/jobs",
  "/api/mongo/jobs/meta/unique-tasks",
  "/api/change-log/stream",
]);

function isPublicRoute(method: string, path: string): boolean {
  if (path.startsWith("/api/auth/")) return true;
  if (method === "GET") {
    return PUBLIC_EXACT_GET.has(path);
  }
  return false;
}

export function setupRoutes(app: Express): void {
  app.use(tokenAuthMiddleware);
  setupAuthRoutes(app);

  app.use((req, res, next) => {
    if (!req.path.startsWith("/api/") || isPublicRoute(req.method, req.path)) return next();
    return requireAuth(req, res, next);
  });

  app.get("/api/database/active", (_req, res) => {
    res.json({
      active: getActiveDatabaseName(),
      available: getAvailableDatabases(),
    });
  });

  app.post("/api/database/switch", async (req, res) => {
    try {
      const { database } = req.body;
      if (!database) {
        return res.status(400).json({ error: "database field is required" });
      }
      await switchDatabase(database as DatabaseName);
      res.json({ active: getActiveDatabaseName() });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  // Domain-specific routes
  setupJobRoutes(app);
  setupDesignRoutes(app);
  setupAssemblyRoutes(app);
  setupCleaningRoutes(app);
  setupChecklistRoutes(app);
  setupChecklistTemplateRoutes(app);
  setupWorkflowRoutes(app);
  setupUserRoutes(app);
  setupMaterialRoutes(app);
  setupNdtSpecificationRoutes(app);
  setupAttachmentRoutes(app);
  setupJobBossImportRoutes(app);
  setupTimeEntriesRoutes(app);
  setupSchedulesRoutes(app);
  setupSchedulingTemplatesRoutes(app);
  setupOrganizationRoutes(app);
  
  // MongoDB routes for job data
  setupMongoJobRoutes(app);
  setupImportJobsRoutes(app);
  setupMongoDatasetsRoutes(app);
  
  // BambooHR and Change Log routes
  setupBambooHRRoutes(app);
  setupChangeLogRoutes(app);
}

import { Express } from "express";
import { storage } from "../../storage";
import { insertJobAttachmentSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "../../objectStorage";

export function setupAttachmentRoutes(app: Express): void {
  app.get("/api/attachments/:jobId", async (req, res) => {
    try {
      const attachments = await storage.getAttachmentsByJobId(req.params.jobId);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attachments" });
    }
  });

  app.post("/api/attachments/upload", async (req, res) => {
    try {
      const { fileName } = req.body;
      if (!fileName) {
        return res.status(400).json({ error: "fileName is required" });
      }
      const objectStorageService = new ObjectStorageService();
      const { uploadURL, filePath } = await objectStorageService.getUploadURL(fileName);
      res.json({ uploadURL, filePath });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.post("/api/attachments/powerpoint-view", async (req, res) => {
    try {
      const { filePath } = req.body;
      if (!filePath) {
        return res.status(400).json({ error: "filePath is required" });
      }
      const objectStorageService = new ObjectStorageService();
      const viewURL = await objectStorageService.getViewURL(filePath);
      res.json({ viewURL });
    } catch (error) {
      console.error("Error getting view URL:", error);
      res.status(500).json({ error: "Failed to get view URL" });
    }
  });

  app.post("/api/attachments/resolve-urls", async (req, res) => {
    try {
      const { filePaths } = req.body;
      if (!Array.isArray(filePaths) || filePaths.length === 0) {
        return res.json({ urls: {} });
      }
      const objectStorageService = new ObjectStorageService();
      const urls: Record<string, string> = {};
      await Promise.all(
        filePaths.filter(Boolean).map(async (fp: string) => {
          try {
            urls[fp] = await objectStorageService.getViewURL(fp);
          } catch {
            // skip files that can't be resolved
          }
        })
      );
      res.json({ urls });
    } catch (error) {
      console.error("Error resolving URLs:", error);
      res.status(500).json({ error: "Failed to resolve URLs" });
    }
  });

  app.post("/api/attachments", async (req, res) => {
    try {
      const validatedData = insertJobAttachmentSchema.parse(req.body);
      const attachment = await storage.createAttachment(validatedData);
      res.status(201).json(attachment);
    } catch (error: any) {
      console.error("Attachment validation error:", error);
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid attachment data", details: error.errors });
      }
      res.status(400).json({ error: "Invalid attachment data" });
    }
  });

  app.delete("/api/attachments/:id", async (req, res) => {
    try {
      const attachment = await storage.getAttachmentById(req.params.id);
      if (!attachment) {
        return res.status(404).json({ error: "Attachment not found" });
      }

      if (attachment.attachmentType === "upload" && attachment.filePath) {
        try {
          const objectStorageService = new ObjectStorageService();
          await objectStorageService.deleteFile(attachment.filePath);
        } catch (err) {
          console.error("Error deleting file from object storage:", err);
        }
      }

      await storage.deleteAttachment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting attachment:", error);
      res.status(500).json({ error: "Failed to delete attachment" });
    }
  });

  app.get("/api/attachments/view/:id", async (req, res) => {
    try {
      const attachment = await storage.getAttachmentById(req.params.id);
      if (!attachment) {
        return res.status(404).json({ error: "Attachment not found" });
      }

      if (attachment.attachmentType === "local_link") {
        return res.status(400).json({
          error: "Cannot view local file links in browser",
          localFilePath: attachment.localFilePath
        });
      }

      if (!attachment.filePath) {
        return res.status(400).json({ error: "No file path available" });
      }

      const objectStorageService = new ObjectStorageService();
      const viewURL = await objectStorageService.getViewURL(attachment.filePath);

      res.json({
        viewURL,
        fileName: attachment.fileName,
        fileType: attachment.fileType
      });
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      console.error("Error generating view URL:", error);
      res.status(500).json({ error: "Failed to generate view URL" });
    }
  });

  app.get("/api/attachments/download/:id", async (req, res) => {
    try {
      const attachment = await storage.getAttachmentById(req.params.id);
      if (!attachment) {
        return res.status(404).json({ error: "Attachment not found" });
      }

      if (attachment.attachmentType === "local_link") {
        return res.status(400).json({
          error: "Cannot download local file links",
          localFilePath: attachment.localFilePath
        });
      }

      if (!attachment.filePath) {
        return res.status(400).json({ error: "No file path available" });
      }

      const objectStorageService = new ObjectStorageService();
      const file = await objectStorageService.getFileFromPath(attachment.filePath);
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      console.error("Error downloading attachment:", error);
      res.status(500).json({ error: "Failed to download attachment" });
    }
  });
}

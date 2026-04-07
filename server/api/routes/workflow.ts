import { Express } from "express";
import { getWorkflowStatusesCollection, WorkflowStatusDoc, ObjectId } from "../../mongodb";
import { DEPARTMENT_ORDER } from "../../mongoStorage";

const DEFAULT_STATUSES = [
  { task: "Awaiting Routing", color: "#808080", department: "Engineering" },
  { task: "Waiting", color: "#C0C0C0", department: "Engineering" },
  { task: "On Hold", color: "#E6E6FA", department: "Engineering" },
  { task: "Engineering Prep", color: "#800080", department: "Engineering" },
  { task: "Solidification / Gating", color: "#D2B48C", department: "Engineering" },
  { task: "CAD", color: "#9370DB", department: "Engineering" },
  { task: "Programming", color: "#6A5ACD", department: "Engineering" },
  { task: "Waiting on Core-Vox", color: "#FF00FF", department: "Core Room" },
  { task: "Core-Vox", color: "#DA70D6", department: "Core Room" },
  { task: "Mold -Loop", color: "#FFA500", department: "Mold / Pattern" },
  { task: "Pattern Machining", color: "#FF8C00", department: "Mold / Pattern" },
  { task: "Waiting on Molds", color: "#FFD700", department: "Mold / Pattern" },
  { task: "Ready for Robot", color: "#FF0000", department: "Robot / iCast" },
  { task: "Running on Robot", color: "#FFFF00", department: "Robot / iCast" },
  { task: "Waiting to be Assembled", color: "#A9A9A9", department: "Robot / iCast" },
  { task: "Being Assembled", color: "#90EE90", department: "Robot / iCast" },
  { task: "Assembled", color: "#D2B48C", department: "Robot / iCast" },
  { task: "Ready to Pour", color: "#BC8F8F", department: "Pouring / Melt" },
  { task: "Cooling", color: "#87CEEB", department: "Post-Pour / Finishing" },
  { task: "Grinding Room", color: "#8B4513", department: "Post-Pour / Finishing" },
  { task: "Shakeout", color: "#A0522D", department: "Post-Pour / Finishing" },
  { task: "Heat Treat", color: "#8B0000", department: "Post-Pour / Finishing" },
  { task: "Straightening", color: "#CD853F", department: "Post-Pour / Finishing" },
  { task: "Bench Work", color: "#DEB887", department: "Post-Pour / Finishing" },
  { task: "Dye Penetrant", color: "#B22222", department: "Post-Pour / Finishing" },
  { task: "MPI Testing", color: "#DC143C", department: "Post-Pour / Finishing" },
  { task: "Inspection", color: "#00FFFF", department: "Inspection / QC" },
  { task: "Laser Scan", color: "#5F9EA0", department: "Inspection / QC" },
  { task: "CMM Measurement", color: "#008B8B", department: "Inspection / QC" },
  { task: "NDT Inspection", color: "#48D1CC", department: "Inspection / QC" },
  { task: "At Foundry For Sample", color: "#F0F0F0", department: "Inspection / QC" },
  { task: "At Machine Shop", color: "#FF4500", department: "Machining" },
  { task: "At STL Precision", color: "#FF6347", department: "Machining" },
  { task: "Complete", color: "#228B22", department: "Shipping / Complete" },
  { task: "Shipping", color: "#00FF00", department: "Shipping / Complete" },
  { task: "SHIPPED", color: "#FFDAB9", department: "Shipping / Complete" },
];

function docToStatus(doc: WorkflowStatusDoc & { _id: ObjectId }) {
  return {
    id: doc._id.toHexString(),
    task: doc.task,
    color: doc.color,
    sortOrder: doc.sortOrder,
    department: doc.department || "",
  };
}

async function ensureDefaults() {
  const col = await getWorkflowStatusesCollection();
  const count = await col.countDocuments();
  if (count === 0) {
    const docs = DEFAULT_STATUSES.map((s, i) => ({ ...s, sortOrder: i }));
    await col.insertMany(docs);
    console.log(`Seeded ${docs.length} default workflow statuses`);
  }
}

export function setupWorkflowRoutes(app: Express): void {
  ensureDefaults().catch(err => console.error("Failed to seed workflow statuses:", err));

  app.get("/api/workflow-statuses", async (_req, res) => {
    try {
      const col = await getWorkflowStatusesCollection();
      const docs = await col.find().sort({ sortOrder: 1 }).toArray();
      res.json(docs.map(docToStatus));
    } catch (error) {
      console.error("Failed to fetch workflow statuses:", error);
      res.status(500).json({ error: "Failed to fetch workflow statuses" });
    }
  });

  app.get("/api/workflow-statuses/:id", async (req, res) => {
    try {
      const col = await getWorkflowStatusesCollection();
      const doc = await col.findOne({ _id: new ObjectId(req.params.id) });
      if (!doc) {
        return res.status(404).json({ error: "Workflow status not found" });
      }
      res.json(docToStatus(doc));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflow status" });
    }
  });

  app.get("/api/workflow-departments", async (_req, res) => {
    res.json(DEPARTMENT_ORDER);
  });

  app.post("/api/workflow-statuses", async (req, res) => {
    try {
      const { task, color, department } = req.body;
      if (!task || !color) {
        return res.status(400).json({ error: "task and color are required" });
      }
      const col = await getWorkflowStatusesCollection();
      const maxDoc = await col.find().sort({ sortOrder: -1 }).limit(1).toArray();
      const nextOrder = maxDoc.length > 0 ? maxDoc[0].sortOrder + 1 : 0;
      const doc = { task, color, sortOrder: nextOrder, department: department || "" };
      const result = await col.insertOne(doc);
      res.status(201).json({
        id: result.insertedId.toHexString(),
        ...doc,
      });
    } catch (error) {
      console.error("Failed to create workflow status:", error);
      res.status(400).json({ error: "Invalid workflow status data" });
    }
  });

  app.patch("/api/workflow-statuses/:id", async (req, res) => {
    try {
      const { task, color, department } = req.body;
      if (!task || !color) {
        return res.status(400).json({ error: "task and color are required" });
      }
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const col = await getWorkflowStatusesCollection();
      const updateFields: any = { task, color };
      if (department !== undefined) updateFields.department = department;
      const result = await col.findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: updateFields },
        { returnDocument: "after" }
      );
      if (!result) {
        return res.status(404).json({ error: "Workflow status not found" });
      }
      res.json(docToStatus(result as WorkflowStatusDoc & { _id: ObjectId }));
    } catch (error) {
      res.status(400).json({ error: "Invalid workflow status data" });
    }
  });

  app.put("/api/workflow-statuses/reorder", async (req, res) => {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: "orderedIds must be an array" });
      }
      const col = await getWorkflowStatusesCollection();
      const ops = orderedIds.map((id: string, index: number) => ({
        updateOne: {
          filter: { _id: new ObjectId(id) },
          update: { $set: { sortOrder: index } },
        },
      }));
      await col.bulkWrite(ops);
      const docs = await col.find().sort({ sortOrder: 1 }).toArray();
      res.json(docs.map(docToStatus));
    } catch (error) {
      console.error("Failed to reorder workflow statuses:", error);
      res.status(500).json({ error: "Failed to reorder workflow statuses" });
    }
  });

  app.delete("/api/workflow-statuses/:id", async (req, res) => {
    try {
      const col = await getWorkflowStatusesCollection();
      const result = await col.deleteOne({ _id: new ObjectId(req.params.id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Workflow status not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workflow status" });
    }
  });

  app.post("/api/workflow-statuses/reset-defaults", async (_req, res) => {
    try {
      const col = await getWorkflowStatusesCollection();
      await col.deleteMany({});
      const docs = DEFAULT_STATUSES.map((s, i) => ({ ...s, sortOrder: i }));
      await col.insertMany(docs);
      const allDocs = await col.find().sort({ sortOrder: 1 }).toArray();
      res.json({
        message: `Reset to ${docs.length} default workflow statuses`,
        statuses: allDocs.map(docToStatus),
      });
    } catch (error) {
      console.error("Failed to reset workflow statuses:", error);
      res.status(500).json({ error: "Failed to reset workflow statuses" });
    }
  });
}

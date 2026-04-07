import { Express } from "express";
import { ObjectId } from "mongodb";
import {
  getDepartmentsCollection,
  getPositionsCollection,
  getCustomPermissionsCollection,
  getPositionPermissionsCollection,
} from "../../mongodb";
import { 
  insertDepartmentSchema, 
  insertPositionSchema,
  insertCustomPermissionSchema,
  insertPositionPermissionSchema
} from "@shared/schema";

export function setupOrganizationRoutes(app: Express): void {
  app.get("/api/departments", async (_req, res) => {
    try {
      const col = await getDepartmentsCollection();
      const all = await col.find().toArray();
      res.json(all.map(d => ({ id: d._id!.toString(), name: d.name, description: d.description, parentDepartmentId: d.parentDepartmentId, color: d.color })));
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  app.get("/api/departments/:id", async (req, res) => {
    try {
      const col = await getDepartmentsCollection();
      const doc = await col.findOne({ _id: new ObjectId(req.params.id) });
      if (!doc) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.json({ id: doc._id!.toString(), name: doc.name, description: doc.description, parentDepartmentId: doc.parentDepartmentId, color: doc.color });
    } catch (error) {
      console.error("Error fetching department:", error);
      res.status(500).json({ error: "Failed to fetch department" });
    }
  });

  app.get("/api/departments/:id/children", async (req, res) => {
    try {
      const col = await getDepartmentsCollection();
      const children = await col.find({ parentDepartmentId: req.params.id }).toArray();
      res.json(children.map(d => ({ id: d._id!.toString(), name: d.name, description: d.description, parentDepartmentId: d.parentDepartmentId, color: d.color })));
    } catch (error) {
      console.error("Error fetching child departments:", error);
      res.status(500).json({ error: "Failed to fetch child departments" });
    }
  });

  app.post("/api/departments", async (req, res) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const col = await getDepartmentsCollection();
      const result = await col.insertOne({
        name: validatedData.name,
        description: validatedData.description ?? "",
        parentDepartmentId: validatedData.parentDepartmentId ?? null,
        color: validatedData.color ?? "#64748b",
      });
      res.status(201).json({ id: result.insertedId.toString(), ...validatedData });
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid department data" });
      }
      console.error("Error creating department:", error);
      res.status(400).json({ error: "Invalid department data" });
    }
  });

  app.patch("/api/departments/:id", async (req, res) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const col = await getDepartmentsCollection();
      const result = await col.findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: validatedData },
        { returnDocument: "after" }
      );
      if (!result) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.json({ id: result._id!.toString(), name: result.name, description: result.description, parentDepartmentId: result.parentDepartmentId, color: result.color });
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid department data" });
      }
      console.error("Error updating department:", error);
      res.status(400).json({ error: "Invalid department data" });
    }
  });

  app.delete("/api/departments/:id", async (req, res) => {
    try {
      const col = await getDepartmentsCollection();
      const result = await col.deleteOne({ _id: new ObjectId(req.params.id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ error: "Failed to delete department" });
    }
  });

  app.get("/api/positions", async (_req, res) => {
    try {
      const col = await getPositionsCollection();
      const all = await col.find().toArray();
      res.json(all.map(p => ({ id: p._id!.toString(), name: p.name, description: p.description, departmentId: p.departmentId, level: p.level })));
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  app.get("/api/positions/:id", async (req, res) => {
    try {
      const col = await getPositionsCollection();
      const doc = await col.findOne({ _id: new ObjectId(req.params.id) });
      if (!doc) {
        return res.status(404).json({ error: "Position not found" });
      }
      res.json({ id: doc._id!.toString(), name: doc.name, description: doc.description, departmentId: doc.departmentId, level: doc.level });
    } catch (error) {
      console.error("Error fetching position:", error);
      res.status(500).json({ error: "Failed to fetch position" });
    }
  });

  app.get("/api/departments/:departmentId/positions", async (req, res) => {
    try {
      const col = await getPositionsCollection();
      const deptPositions = await col.find({ departmentId: req.params.departmentId }).toArray();
      res.json(deptPositions.map(p => ({ id: p._id!.toString(), name: p.name, description: p.description, departmentId: p.departmentId, level: p.level })));
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  app.post("/api/positions", async (req, res) => {
    try {
      const validatedData = insertPositionSchema.parse(req.body);
      const col = await getPositionsCollection();
      const result = await col.insertOne({
        name: validatedData.name,
        description: validatedData.description ?? "",
        departmentId: validatedData.departmentId ?? null,
        level: validatedData.level ?? 1,
      });
      res.status(201).json({ id: result.insertedId.toString(), ...validatedData });
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid position data" });
      }
      console.error("Error creating position:", error);
      res.status(400).json({ error: "Invalid position data" });
    }
  });

  app.patch("/api/positions/:id", async (req, res) => {
    try {
      const validatedData = insertPositionSchema.parse(req.body);
      const col = await getPositionsCollection();
      const result = await col.findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: validatedData },
        { returnDocument: "after" }
      );
      if (!result) {
        return res.status(404).json({ error: "Position not found" });
      }
      res.json({ id: result._id!.toString(), name: result.name, description: result.description, departmentId: result.departmentId, level: result.level });
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid position data" });
      }
      console.error("Error updating position:", error);
      res.status(400).json({ error: "Invalid position data" });
    }
  });

  app.delete("/api/positions/:id", async (req, res) => {
    try {
      const col = await getPositionsCollection();
      const result = await col.deleteOne({ _id: new ObjectId(req.params.id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Position not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting position:", error);
      res.status(500).json({ error: "Failed to delete position" });
    }
  });

  app.get("/api/custom-permissions", async (_req, res) => {
    try {
      const col = await getCustomPermissionsCollection();
      const all = await col.find().toArray();
      res.json(all.map(p => ({ id: p._id!.toString(), name: p.name, description: p.description, module: p.module })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  app.get("/api/custom-permissions/:id", async (req, res) => {
    try {
      const col = await getCustomPermissionsCollection();
      const doc = await col.findOne({ _id: new ObjectId(req.params.id) });
      if (!doc) {
        return res.status(404).json({ error: "Permission not found" });
      }
      res.json({ id: doc._id!.toString(), name: doc.name, description: doc.description, module: doc.module });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch permission" });
    }
  });

  app.get("/api/custom-permissions/module/:module", async (req, res) => {
    try {
      const col = await getCustomPermissionsCollection();
      const docs = await col.find({ module: req.params.module }).toArray();
      res.json(docs.map(p => ({ id: p._id!.toString(), name: p.name, description: p.description, module: p.module })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  app.post("/api/custom-permissions", async (req, res) => {
    try {
      const validatedData = insertCustomPermissionSchema.parse(req.body);
      const col = await getCustomPermissionsCollection();
      const result = await col.insertOne({
        name: validatedData.name,
        description: validatedData.description ?? "",
        module: validatedData.module,
      });
      res.status(201).json({ id: result.insertedId.toString(), ...validatedData });
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid permission data" });
      }
      res.status(400).json({ error: "Invalid permission data" });
    }
  });

  app.patch("/api/custom-permissions/:id", async (req, res) => {
    try {
      const validatedData = insertCustomPermissionSchema.parse(req.body);
      const col = await getCustomPermissionsCollection();
      const result = await col.findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: validatedData },
        { returnDocument: "after" }
      );
      if (!result) {
        return res.status(404).json({ error: "Permission not found" });
      }
      res.json({ id: result._id!.toString(), name: result.name, description: result.description, module: result.module });
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid permission data" });
      }
      res.status(400).json({ error: "Invalid permission data" });
    }
  });

  app.delete("/api/custom-permissions/:id", async (req, res) => {
    try {
      const col = await getCustomPermissionsCollection();
      const result = await col.deleteOne({ _id: new ObjectId(req.params.id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Permission not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete permission" });
    }
  });

  app.get("/api/positions/:positionId/permissions", async (req, res) => {
    try {
      const col = await getPositionPermissionsCollection();
      const docs = await col.find({ positionId: req.params.positionId }).toArray();
      res.json(docs.map(pp => ({ id: pp._id!.toString(), positionId: pp.positionId, permissionId: pp.permissionId })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch position permissions" });
    }
  });

  app.post("/api/position-permissions", async (req, res) => {
    try {
      const validatedData = insertPositionPermissionSchema.parse(req.body);
      const col = await getPositionPermissionsCollection();
      const result = await col.insertOne({
        positionId: validatedData.positionId,
        permissionId: validatedData.permissionId,
      });
      res.status(201).json({ id: result.insertedId.toString(), ...validatedData });
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid position permission data" });
      }
      res.status(400).json({ error: "Invalid position permission data" });
    }
  });

  app.delete("/api/position-permissions/:id", async (req, res) => {
    try {
      const col = await getPositionPermissionsCollection();
      const result = await col.deleteOne({ _id: new ObjectId(req.params.id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Position permission not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete position permission" });
    }
  });
}

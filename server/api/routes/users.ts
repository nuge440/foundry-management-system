import { Express } from "express";
import { getUsersCollection } from "../../mongodb";
import { ObjectId } from "mongodb";
import { insertUserManagementSchema } from "@shared/schema";

export function setupUserRoutes(app: Express): void {
  app.get("/api/users", async (_req, res) => {
    try {
      const usersCol = await getUsersCollection();
      const allUsers = await usersCol.find({}, { projection: { password: 0 } }).toArray();
      res.json(allUsers.map(u => ({
        id: u._id!.toString(),
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        permissions: u.permissions,
        department: u.department,
        jobTitle: u.jobTitle,
      })));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const usersCol = await getUsersCollection();
      const user = await usersCol.findOne({ _id: new ObjectId(req.params.id) }, { projection: { password: 0 } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        id: user._id!.toString(),
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        department: user.department,
        jobTitle: user.jobTitle,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserManagementSchema.parse(req.body);
      const username = validatedData.email.split("@")[0];
      const usersCol = await getUsersCollection();

      const existing = await usersCol.findOne({ email: validatedData.email });
      if (existing) {
        return res.status(400).json({ error: "A user with this email already exists" });
      }

      const result = await usersCol.insertOne({
        username,
        password: "placeholder",
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        permissions: validatedData.permissions,
      });

      res.status(201).json({
        id: result.insertedId.toString(),
        username,
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        permissions: validatedData.permissions,
      });
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid user data" });
      }
      console.error("Error creating user:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const validatedData = insertUserManagementSchema.parse(req.body);
      const usersCol = await getUsersCollection();
      const result = await usersCol.findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: {
          name: validatedData.name,
          email: validatedData.email,
          role: validatedData.role,
          permissions: validatedData.permissions,
        }},
        { returnDocument: "after" }
      );
      if (!result) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        id: result._id!.toString(),
        username: result.username,
        name: result.name,
        email: result.email,
        role: result.role,
        permissions: result.permissions,
        department: result.department,
        jobTitle: result.jobTitle,
      });
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid user data" });
      }
      console.error("Error updating user:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const usersCol = await getUsersCollection();
      const result = await usersCol.deleteOne({ _id: new ObjectId(req.params.id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
}

import { Express } from "express";
import { fetchEmployeeDirectory, isBambooHRConfigured } from "../bamboohr";
import { getUsersCollection, getDepartmentsCollection } from "../../mongodb";

let lastSyncTime: string | null = null;
let lastSyncResult: { created: number; updated: number; skipped: number; departments: number } | null = null;

export function setupBambooHRRoutes(app: Express): void {
  app.get("/api/bamboohr/status", (_req, res) => {
    res.json({
      configured: isBambooHRConfigured(),
      lastSyncTime,
      lastSyncResult,
    });
  });

  app.post("/api/bamboohr/sync", async (_req, res) => {
    try {
      if (!isBambooHRConfigured()) {
        return res.status(400).json({
          error: "BambooHR is not configured. Set BAMBOOHR_API_KEY and BAMBOOHR_COMPANY environment variables.",
        });
      }

      const employees = await fetchEmployeeDirectory();

      const deptCol = await getDepartmentsCollection();
      const departmentNames = new Set<string>();
      for (const emp of employees) {
        if (emp.department) departmentNames.add(emp.department);
      }

      let deptCount = 0;
      for (const deptName of Array.from(departmentNames)) {
        const existing = await deptCol.findOne({ name: deptName });
        if (!existing) {
          await deptCol.insertOne({
            name: deptName,
            description: "Synced from BambooHR",
            color: "#64748b",
          });
          deptCount++;
        }
      }

      const usersCol = await getUsersCollection();
      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const emp of employees) {
        if (!emp.workEmail) {
          skipped++;
          continue;
        }

        const role = mapDepartmentToRole(emp.department, emp.jobTitle);
        const username = emp.workEmail.split("@")[0];
        const name = emp.displayName || `${emp.firstName} ${emp.lastName}`.trim();

        const existing = await usersCol.findOne({ email: emp.workEmail });

        if (existing) {
          await usersCol.updateOne(
            { email: emp.workEmail },
            { $set: {
              name,
              role,
              department: emp.department || null,
              jobTitle: emp.jobTitle || null,
            }}
          );
          updated++;
        } else {
          await usersCol.insertOne({
            username,
            password: "bamboohr_placeholder",
            name,
            email: emp.workEmail,
            role,
            permissions: getDefaultPermissions(role),
            department: emp.department || null,
            jobTitle: emp.jobTitle || null,
          });
          created++;
        }
      }

      lastSyncTime = new Date().toISOString();
      lastSyncResult = { created, updated, skipped, departments: deptCount };

      res.json({
        message: `BambooHR sync complete: ${created} created, ${updated} updated, ${skipped} skipped, ${deptCount} new departments`,
        ...lastSyncResult,
        totalEmployees: employees.length,
        syncTime: lastSyncTime,
      });
    } catch (error: any) {
      console.error("BambooHR sync error:", error);
      res.status(500).json({ error: "Failed to sync from BambooHR. Please check API credentials and try again." });
    }
  });
}

function mapDepartmentToRole(department: string, jobTitle: string): string {
  const dept = (department || "").toLowerCase();
  const title = (jobTitle || "").toLowerCase();

  if (title.includes("manager") || title.includes("director") || title.includes("supervisor") || title.includes("superintendent")) {
    return "Manager";
  }
  if (dept.includes("engineering") || dept.includes("design") || dept.includes("cad")) {
    return "Designer";
  }
  if (title.includes("admin") || dept.includes("admin") || dept.includes("it") || dept.includes("human resources")) {
    return "Admin";
  }
  return "Operator";
}

function getDefaultPermissions(role: string): string[] {
  switch (role) {
    case "Admin":
      return ["Dashboard", "Job Information", "Design Information", "Assembly Information", "Cleaning Room Info", "Checklist Design", "Workflow Status", "User Management", "Materials", "Time & Attendance", "Employee Scheduling"];
    case "Manager":
      return ["Dashboard", "Job Information", "Design Information", "Assembly Information", "Cleaning Room Info", "Checklist Design", "Workflow Status", "Materials", "Time & Attendance", "Employee Scheduling"];
    case "Designer":
      return ["Dashboard", "Job Information", "Design Information", "Assembly Information"];
    default:
      return ["Dashboard", "Job Information"];
  }
}

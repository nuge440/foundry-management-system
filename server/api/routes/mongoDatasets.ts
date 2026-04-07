import { Express } from "express";
import { getDatabase } from "../../mongodb";

const checklistTemplates = [
  {
    id: "ct-1",
    name: "Mold Design Checklist",
    description: "Standard checklist for mold design review and approval",
    createdAt: new Date().toISOString(),
    items: [
      { id: "mdc-1", itemDescription: "Verify part dimensions match drawing", fieldType: "picklist", picklistOptions: ["Pass", "Fail", "N/A"], sortOrder: 1 },
      { id: "mdc-2", itemDescription: "Check draft angles", fieldType: "numeric", numericMin: 0.5, numericMax: 5, numericUnit: "degrees", sortOrder: 2 },
      { id: "mdc-3", itemDescription: "Confirm parting line location", fieldType: "picklist", picklistOptions: ["Approved", "Needs Revision"], sortOrder: 3 },
      { id: "mdc-4", itemDescription: "Review gating system design", fieldType: "text", sortOrder: 4 },
      { id: "mdc-5", itemDescription: "Verify riser placement", fieldType: "picklist", picklistOptions: ["Correct", "Incorrect", "Pending Review"], sortOrder: 5 },
      { id: "mdc-6", itemDescription: "Check core box design", fieldType: "text", sortOrder: 6 },
      { id: "mdc-7", itemDescription: "Confirm shrinkage allowance", fieldType: "numeric", numericMin: 0, numericMax: 3, numericUnit: "%", sortOrder: 7 },
      { id: "mdc-8", itemDescription: "Review venting locations", fieldType: "text", sortOrder: 8 },
      { id: "mdc-9", itemDescription: "Verify pattern number assignment", fieldType: "text", sortOrder: 9 },
      { id: "mdc-10", itemDescription: "Check machining stock allowance", fieldType: "numeric", numericMin: 0.0625, numericMax: 0.5, numericUnit: "inches", sortOrder: 10 },
      { id: "mdc-11", itemDescription: "Confirm customer approval received", fieldType: "picklist", picklistOptions: ["Yes", "No", "Pending"], sortOrder: 11 },
      { id: "mdc-12", itemDescription: "Review solidification simulation results", fieldType: "picklist", picklistOptions: ["Acceptable", "Revise Gating", "Revise Risers"], sortOrder: 12 },
      { id: "mdc-13", itemDescription: "Designer initials", fieldType: "text", sortOrder: 13 },
      { id: "mdc-14", itemDescription: "Review date", fieldType: "text", sortOrder: 14 }
    ]
  },
  {
    id: "ct-2",
    name: "Pre-Pour Inspection",
    description: "Checklist for mold inspection before pouring",
    createdAt: new Date().toISOString(),
    items: [
      { id: "ppi-1", itemDescription: "Mold assembled correctly", fieldType: "picklist", picklistOptions: ["Yes", "No"], sortOrder: 1 },
      { id: "ppi-2", itemDescription: "Cores positioned and secured", fieldType: "picklist", picklistOptions: ["Yes", "No", "N/A"], sortOrder: 2 },
      { id: "ppi-3", itemDescription: "Vents clear and open", fieldType: "picklist", picklistOptions: ["Yes", "No"], sortOrder: 3 },
      { id: "ppi-4", itemDescription: "Mold cavity cleaned", fieldType: "picklist", picklistOptions: ["Yes", "No"], sortOrder: 4 },
      { id: "ppi-5", itemDescription: "Mold coating applied", fieldType: "picklist", picklistOptions: ["Yes", "No", "N/A"], sortOrder: 5 },
      { id: "ppi-6", itemDescription: "Weights/clamps in place", fieldType: "picklist", picklistOptions: ["Yes", "No"], sortOrder: 6 },
      { id: "ppi-7", itemDescription: "Pouring basin prepared", fieldType: "picklist", picklistOptions: ["Yes", "No"], sortOrder: 7 },
      { id: "ppi-8", itemDescription: "Inspector initials", fieldType: "text", sortOrder: 8 }
    ]
  },
  {
    id: "ct-3",
    name: "Quality Inspection",
    description: "Final quality inspection checklist for castings",
    createdAt: new Date().toISOString(),
    items: [
      { id: "qi-1", itemDescription: "Visual inspection - surface defects", fieldType: "picklist", picklistOptions: ["Pass", "Fail", "Minor Repair"], sortOrder: 1 },
      { id: "qi-2", itemDescription: "Dimensional check - critical dimensions", fieldType: "picklist", picklistOptions: ["In Spec", "Out of Spec"], sortOrder: 2 },
      { id: "qi-3", itemDescription: "Hardness test result", fieldType: "numeric", numericMin: 0, numericMax: 70, numericUnit: "HRC", sortOrder: 3 },
      { id: "qi-4", itemDescription: "Weight verification", fieldType: "numeric", numericMin: 0, numericMax: 10000, numericUnit: "lbs", sortOrder: 4 },
      { id: "qi-5", itemDescription: "NDT - Magnetic Particle", fieldType: "picklist", picklistOptions: ["Pass", "Fail", "N/A"], sortOrder: 5 },
      { id: "qi-6", itemDescription: "NDT - Dye Penetrant", fieldType: "picklist", picklistOptions: ["Pass", "Fail", "N/A"], sortOrder: 6 },
      { id: "qi-7", itemDescription: "NDT - Radiographic", fieldType: "picklist", picklistOptions: ["Pass", "Fail", "N/A"], sortOrder: 7 },
      { id: "qi-8", itemDescription: "Chemical analysis verified", fieldType: "picklist", picklistOptions: ["Yes", "No"], sortOrder: 8 },
      { id: "qi-9", itemDescription: "Heat treat documentation complete", fieldType: "picklist", picklistOptions: ["Yes", "No", "N/A"], sortOrder: 9 },
      { id: "qi-10", itemDescription: "Certificate of conformance prepared", fieldType: "picklist", picklistOptions: ["Yes", "No"], sortOrder: 10 }
    ]
  }
];

const workflowStatuses = [
  { id: "ws-1", name: "New", color: "#3B82F6", description: "New job entered into system", sortOrder: 1, category: "Initial" },
  { id: "ws-2", name: "Waiting on Doug", color: "#F59E0B", description: "Awaiting Doug's review or decision", sortOrder: 2, category: "Waiting" },
  { id: "ws-3", name: "Waiting On Customer", color: "#F59E0B", description: "Awaiting customer response or approval", sortOrder: 3, category: "Waiting" },
  { id: "ws-4", name: "Waiting On CAD", color: "#8B5CF6", description: "Awaiting CAD model or drawing", sortOrder: 4, category: "Design" },
  { id: "ws-5", name: "Solidification / Gating", color: "#8B5CF6", description: "Running solidification simulation and gating design", sortOrder: 5, category: "Design" },
  { id: "ws-6", name: "CAD (Mold Work)", color: "#6366F1", description: "CAD work in progress for mold design", sortOrder: 6, category: "Design" },
  { id: "ws-7", name: "Waiting on Sample", color: "#EC4899", description: "Waiting for sample casting approval", sortOrder: 7, category: "Waiting" },
  { id: "ws-8", name: "Waiting On Molds", color: "#F97316", description: "Waiting for molds to be completed", sortOrder: 8, category: "Production" },
  { id: "ws-9", name: "Ready For Robot", color: "#10B981", description: "Ready for robotic mold making", sortOrder: 9, category: "Production" },
  { id: "ws-10", name: "Running On Robot", color: "#10B981", description: "Currently running on robot", sortOrder: 10, category: "Production" },
  { id: "ws-11", name: "Waiting On Cores", color: "#F97316", description: "Waiting for cores to be delivered", sortOrder: 11, category: "Production" },
  { id: "ws-12", name: "Waiting to be Assembled", color: "#F97316", description: "Molds waiting for assembly", sortOrder: 12, category: "Assembly" },
  { id: "ws-13", name: "Being Assembled", color: "#10B981", description: "Mold assembly in progress", sortOrder: 13, category: "Assembly" },
  { id: "ws-14", name: "Ready to Pour", color: "#22C55E", description: "Mold assembled and ready for pouring", sortOrder: 14, category: "Pouring" },
  { id: "ws-15", name: "Cooling", color: "#06B6D4", description: "Casting cooling after pour", sortOrder: 15, category: "Pouring" },
  { id: "ws-16", name: "Shakeout", color: "#64748B", description: "Removing casting from mold", sortOrder: 16, category: "Finishing" },
  { id: "ws-17", name: "Grinding Room", color: "#64748B", description: "In grinding/finishing room", sortOrder: 17, category: "Finishing" },
  { id: "ws-18", name: "At Heat Treat", color: "#EF4444", description: "At heat treatment facility", sortOrder: 18, category: "Processing" },
  { id: "ws-19", name: "At Machine Shop", color: "#64748B", description: "At machine shop for machining", sortOrder: 19, category: "Processing" },
  { id: "ws-20", name: "Inspection", color: "#A855F7", description: "Quality inspection in progress", sortOrder: 20, category: "Quality" },
  { id: "ws-21", name: "At Foundry For Sample", color: "#EC4899", description: "Sample at foundry for review", sortOrder: 21, category: "Quality" },
  { id: "ws-22", name: "NDT Testing", color: "#A855F7", description: "Non-destructive testing in progress", sortOrder: 22, category: "Quality" },
  { id: "ws-23", name: "Repair/Rework", color: "#EF4444", description: "Casting requires repair or rework", sortOrder: 23, category: "Quality" },
  { id: "ws-24", name: "Shipping", color: "#22C55E", description: "Ready for shipping", sortOrder: 24, category: "Complete" },
  { id: "ws-25", name: "Shipped", color: "#22C55E", description: "Shipped to customer", sortOrder: 25, category: "Complete" },
  { id: "ws-26", name: "On Hold", color: "#EF4444", description: "Job on hold", sortOrder: 26, category: "Hold" },
  { id: "ws-27", name: "Cancelled", color: "#6B7280", description: "Job cancelled", sortOrder: 27, category: "Complete" },
  { id: "ws-28", name: "Quote", color: "#3B82F6", description: "Quote stage - not yet ordered", sortOrder: 28, category: "Initial" },
  { id: "ws-29", name: "Engineering Review", color: "#8B5CF6", description: "Under engineering review", sortOrder: 29, category: "Design" },
  { id: "ws-30", name: "Awaiting PO", color: "#F59E0B", description: "Awaiting purchase order", sortOrder: 30, category: "Waiting" }
];

const users = [
  { id: "usr-1", username: "admin", firstName: "Admin", lastName: "User", email: "admin@foundry.com", role: "Admin", permissions: ["Dashboard", "Job Information", "Design Information", "Assembly Information", "Cleaning Room Info", "Pouring Instructions", "ND Test Requirements", "Lessons Learned", "Checklist Design", "Workflow Status", "User Management", "Materials", "Time & Attendance", "Employee Scheduling", "Organization Setup"], department: "Administration", isActive: true, createdAt: new Date().toISOString() },
  { id: "usr-2", username: "mmorris", firstName: "Mike", lastName: "Morris", email: "mmorris@foundry.com", role: "Manager", permissions: ["Dashboard", "Job Information", "Design Information", "Assembly Information", "Cleaning Room Info", "Materials"], department: "Engineering", isActive: true, createdAt: new Date().toISOString() },
  { id: "usr-3", username: "ppatel", firstName: "Priya", lastName: "Patel", email: "ppatel@foundry.com", role: "Designer", permissions: ["Dashboard", "Job Information", "Design Information"], department: "Engineering", isActive: true, createdAt: new Date().toISOString() },
  { id: "usr-4", username: "tkumar", firstName: "Tej", lastName: "Kumar", email: "tkumar@foundry.com", role: "Designer", permissions: ["Dashboard", "Job Information", "Design Information", "Assembly Information"], department: "Engineering", isActive: true, createdAt: new Date().toISOString() },
  { id: "usr-5", username: "cmartin", firstName: "Carlos", lastName: "Martin", email: "cmartin@foundry.com", role: "Designer", permissions: ["Dashboard", "Job Information", "Design Information"], department: "Engineering", isActive: true, createdAt: new Date().toISOString() },
  { id: "usr-6", username: "jsmith", firstName: "John", lastName: "Smith", email: "jsmith@foundry.com", role: "Operator", permissions: ["Dashboard", "Job Information"], department: "Production", isActive: true, createdAt: new Date().toISOString() },
  { id: "usr-7", username: "dwilson", firstName: "Doug", lastName: "Wilson", email: "dwilson@foundry.com", role: "Manager", permissions: ["Dashboard", "Job Information", "Design Information", "Assembly Information", "Cleaning Room Info", "User Management"], department: "Operations", isActive: true, createdAt: new Date().toISOString() },
  { id: "usr-8", username: "bjohnson", firstName: "Bill", lastName: "Johnson", email: "bjohnson@foundry.com", role: "Operator", permissions: ["Dashboard", "Job Information", "Assembly Information", "Cleaning Room Info"], department: "Production", isActive: true, createdAt: new Date().toISOString() },
  { id: "usr-9", username: "slee", firstName: "Sarah", lastName: "Lee", email: "slee@foundry.com", role: "Operator", permissions: ["Dashboard", "Job Information", "Cleaning Room Info"], department: "Quality", isActive: true, createdAt: new Date().toISOString() },
  { id: "usr-10", username: "rgarcia", firstName: "Roberto", lastName: "Garcia", email: "rgarcia@foundry.com", role: "Operator", permissions: ["Dashboard", "Job Information"], department: "Production", isActive: false, createdAt: new Date().toISOString() }
];

const materials = [
  { id: "mat-1", code: "WCB", description: "ASTM A216 Grade WCB Carbon Steel", category: "Carbon Steel", density: 0.283, meltTemp: 2800, pourTemp: 2900, documentPath: "" },
  { id: "mat-2", code: "4140", description: "AISI 4140 Chrome-Moly Steel", category: "Alloy Steel", density: 0.283, meltTemp: 2750, pourTemp: 2850, documentPath: "" },
  { id: "mat-3", code: "8620", description: "AISI 8620 Nickel-Chrome-Moly Steel", category: "Alloy Steel", density: 0.283, meltTemp: 2700, pourTemp: 2800, documentPath: "" },
  { id: "mat-4", code: "8630", description: "AISI 8630 Nickel-Chrome-Moly Steel", category: "Alloy Steel", density: 0.283, meltTemp: 2700, pourTemp: 2800, documentPath: "" },
  { id: "mat-5", code: "65-45-12", description: "ASTM A536 65-45-12 Ductile Iron", category: "Ductile Iron", density: 0.256, meltTemp: 2100, pourTemp: 2450, documentPath: "" },
  { id: "mat-6", code: "80-55-06", description: "ASTM A536 80-55-06 Ductile Iron", category: "Ductile Iron", density: 0.256, meltTemp: 2100, pourTemp: 2450, documentPath: "" },
  { id: "mat-7", code: "100-70-03", description: "ASTM A536 100-70-03 Ductile Iron", category: "Ductile Iron", density: 0.256, meltTemp: 2100, pourTemp: 2450, documentPath: "" },
  { id: "mat-8", code: "60-45-15", description: "ASTM A536 60-45-15 Ductile Iron", category: "Ductile Iron", density: 0.256, meltTemp: 2100, pourTemp: 2450, documentPath: "" },
  { id: "mat-9", code: "Class 30 GI", description: "ASTM A48 Class 30 Gray Iron", category: "Gray Iron", density: 0.260, meltTemp: 2100, pourTemp: 2400, documentPath: "" },
  { id: "mat-10", code: "Class 40 GI", description: "ASTM A48 Class 40 Gray Iron", category: "Gray Iron", density: 0.260, meltTemp: 2100, pourTemp: 2400, documentPath: "" },
  { id: "mat-11", code: "Al 319", description: "Aluminum 319 Alloy", category: "Aluminum", density: 0.098, meltTemp: 1120, pourTemp: 1350, documentPath: "" },
  { id: "mat-12", code: "Al 355", description: "Aluminum 355 Alloy", category: "Aluminum", density: 0.097, meltTemp: 1015, pourTemp: 1300, documentPath: "" },
  { id: "mat-13", code: "Al 356", description: "Aluminum 356 Alloy - T6", category: "Aluminum", density: 0.097, meltTemp: 1035, pourTemp: 1300, documentPath: "" },
  { id: "mat-14", code: "Al 357", description: "Aluminum 357 Alloy", category: "Aluminum", density: 0.097, meltTemp: 1035, pourTemp: 1300, documentPath: "" },
  { id: "mat-15", code: "A356-T6", description: "ASTM B26 A356-T6 Aluminum", category: "Aluminum", density: 0.097, meltTemp: 1035, pourTemp: 1300, documentPath: "" },
  { id: "mat-16", code: "C355-T7", description: "ASTM B26 C355-T7 Aluminum", category: "Aluminum", density: 0.097, meltTemp: 1015, pourTemp: 1300, documentPath: "" },
  { id: "mat-17", code: "CF8M", description: "ASTM A351 CF8M (316 SS)", category: "Stainless Steel", density: 0.289, meltTemp: 2550, pourTemp: 2850, documentPath: "" },
  { id: "mat-18", code: "CF8", description: "ASTM A351 CF8 (304 SS)", category: "Stainless Steel", density: 0.289, meltTemp: 2550, pourTemp: 2850, documentPath: "" },
  { id: "mat-19", code: "CF3M", description: "ASTM A351 CF3M (316L SS)", category: "Stainless Steel", density: 0.289, meltTemp: 2550, pourTemp: 2850, documentPath: "" },
  { id: "mat-20", code: "CA15", description: "ASTM A217 CA15 (410 SS)", category: "Stainless Steel", density: 0.276, meltTemp: 2700, pourTemp: 2900, documentPath: "" },
  { id: "mat-21", code: "CA40", description: "ASTM A217 CA40 (420 SS)", category: "Stainless Steel", density: 0.276, meltTemp: 2700, pourTemp: 2900, documentPath: "" },
  { id: "mat-22", code: "CA6NM", description: "ASTM A487 CA6NM Martensitic SS", category: "Stainless Steel", density: 0.280, meltTemp: 2700, pourTemp: 2900, documentPath: "" },
  { id: "mat-23", code: "CD3MN", description: "ASTM A995 CD3MN (2205 Duplex SS)", category: "Stainless Steel", density: 0.278, meltTemp: 2550, pourTemp: 2850, documentPath: "" },
  { id: "mat-24", code: "CB7Cu-1", description: "ASTM A747 CB7Cu-1 (17-4 PH SS)", category: "Stainless Steel", density: 0.282, meltTemp: 2600, pourTemp: 2850, documentPath: "" },
  { id: "mat-25", code: "Ni-Resist D2", description: "ASTM A439 Type D2 Ni-Resist", category: "Specialty", density: 0.264, meltTemp: 2100, pourTemp: 2450, documentPath: "" },
  { id: "mat-26", code: "Ni-Resist D2C", description: "ASTM A439 Type D2C Ni-Resist", category: "Specialty", density: 0.264, meltTemp: 2100, pourTemp: 2450, documentPath: "" },
  { id: "mat-27", code: "A395", description: "ASTM A395 Ferritic Ductile Iron", category: "Ductile Iron", density: 0.256, meltTemp: 2100, pourTemp: 2450, documentPath: "" },
  { id: "mat-28", code: "40 FE", description: "40 FE Cast Iron", category: "Gray Iron", density: 0.260, meltTemp: 2100, pourTemp: 2400, documentPath: "" },
  { id: "mat-29", code: "Hi-Chrome", description: "High Chrome White Iron", category: "Specialty", density: 0.276, meltTemp: 2600, pourTemp: 2800, documentPath: "" },
  { id: "mat-30", code: "Monel", description: "Monel 400 Nickel-Copper Alloy", category: "Specialty", density: 0.319, meltTemp: 2460, pourTemp: 2650, documentPath: "" }
];

const timeAttendanceRecords = [
  { id: "ta-1", odvisleId: "usr-6", date: "2025-01-06", clockIn: "06:00", clockOut: "14:30", breakMinutes: 30, totalHours: 8, department: "Production", status: "Approved" },
  { id: "ta-2", employeeId: "usr-7", date: "2025-01-06", clockIn: "07:00", clockOut: "16:00", breakMinutes: 60, totalHours: 8, department: "Operations", status: "Approved" },
  { id: "ta-3", employeeId: "usr-8", date: "2025-01-06", clockIn: "06:00", clockOut: "14:30", breakMinutes: 30, totalHours: 8, department: "Production", status: "Approved" },
  { id: "ta-4", employeeId: "usr-9", date: "2025-01-06", clockIn: "07:00", clockOut: "15:30", breakMinutes: 30, totalHours: 8, department: "Quality", status: "Approved" },
  { id: "ta-5", employeeId: "usr-6", date: "2025-01-07", clockIn: "06:00", clockOut: "14:30", breakMinutes: 30, totalHours: 8, department: "Production", status: "Pending" },
  { id: "ta-6", employeeId: "usr-7", date: "2025-01-07", clockIn: "07:00", clockOut: "17:00", breakMinutes: 60, totalHours: 9, department: "Operations", status: "Pending" },
  { id: "ta-7", employeeId: "usr-8", date: "2025-01-07", clockIn: "06:00", clockOut: "16:00", breakMinutes: 30, totalHours: 9.5, department: "Production", status: "Pending" },
  { id: "ta-8", employeeId: "usr-3", date: "2025-01-06", clockIn: "08:00", clockOut: "17:00", breakMinutes: 60, totalHours: 8, department: "Engineering", status: "Approved" },
  { id: "ta-9", employeeId: "usr-4", date: "2025-01-06", clockIn: "08:00", clockOut: "17:00", breakMinutes: 60, totalHours: 8, department: "Engineering", status: "Approved" },
  { id: "ta-10", employeeId: "usr-5", date: "2025-01-06", clockIn: "08:00", clockOut: "18:00", breakMinutes: 60, totalHours: 9, department: "Engineering", status: "Approved" }
];

const employeeSchedules = [
  { id: "es-1", employeeId: "usr-6", weekStartDate: "2025-01-06", shift: "Day", department: "Production", monday: { start: "06:00", end: "14:30" }, tuesday: { start: "06:00", end: "14:30" }, wednesday: { start: "06:00", end: "14:30" }, thursday: { start: "06:00", end: "14:30" }, friday: { start: "06:00", end: "14:30" }, saturday: null, sunday: null },
  { id: "es-2", employeeId: "usr-7", weekStartDate: "2025-01-06", shift: "Day", department: "Operations", monday: { start: "07:00", end: "16:00" }, tuesday: { start: "07:00", end: "16:00" }, wednesday: { start: "07:00", end: "16:00" }, thursday: { start: "07:00", end: "16:00" }, friday: { start: "07:00", end: "16:00" }, saturday: null, sunday: null },
  { id: "es-3", employeeId: "usr-8", weekStartDate: "2025-01-06", shift: "Day", department: "Production", monday: { start: "06:00", end: "14:30" }, tuesday: { start: "06:00", end: "14:30" }, wednesday: { start: "06:00", end: "14:30" }, thursday: { start: "06:00", end: "14:30" }, friday: { start: "06:00", end: "14:30" }, saturday: { start: "06:00", end: "12:00" }, sunday: null },
  { id: "es-4", employeeId: "usr-9", weekStartDate: "2025-01-06", shift: "Day", department: "Quality", monday: { start: "07:00", end: "15:30" }, tuesday: { start: "07:00", end: "15:30" }, wednesday: { start: "07:00", end: "15:30" }, thursday: { start: "07:00", end: "15:30" }, friday: { start: "07:00", end: "15:30" }, saturday: null, sunday: null },
  { id: "es-5", employeeId: "usr-3", weekStartDate: "2025-01-06", shift: "Day", department: "Engineering", monday: { start: "08:00", end: "17:00" }, tuesday: { start: "08:00", end: "17:00" }, wednesday: { start: "08:00", end: "17:00" }, thursday: { start: "08:00", end: "17:00" }, friday: { start: "08:00", end: "17:00" }, saturday: null, sunday: null },
  { id: "es-6", employeeId: "usr-4", weekStartDate: "2025-01-06", shift: "Day", department: "Engineering", monday: { start: "08:00", end: "17:00" }, tuesday: { start: "08:00", end: "17:00" }, wednesday: { start: "08:00", end: "17:00" }, thursday: { start: "08:00", end: "17:00" }, friday: { start: "08:00", end: "17:00" }, saturday: null, sunday: null },
  { id: "es-7", employeeId: "usr-5", weekStartDate: "2025-01-06", shift: "Day", department: "Engineering", monday: { start: "08:00", end: "17:00" }, tuesday: { start: "08:00", end: "17:00" }, wednesday: { start: "08:00", end: "17:00" }, thursday: { start: "08:00", end: "17:00" }, friday: { start: "08:00", end: "17:00" }, saturday: null, sunday: null }
];

const shiftDefinitions = [
  { id: "shift-1", name: "Day Shift", startTime: "06:00", endTime: "14:30", breakMinutes: 30, color: "#3B82F6" },
  { id: "shift-2", name: "Swing Shift", startTime: "14:00", endTime: "22:30", breakMinutes: 30, color: "#F59E0B" },
  { id: "shift-3", name: "Night Shift", startTime: "22:00", endTime: "06:30", breakMinutes: 30, color: "#8B5CF6" },
  { id: "shift-4", name: "Office Hours", startTime: "08:00", endTime: "17:00", breakMinutes: 60, color: "#10B981" }
];

const departments = [
  { id: "dept-1", name: "Administration", code: "ADMIN", manager: "usr-1", location: "Main Office", costCenter: "1000" },
  { id: "dept-2", name: "Engineering", code: "ENG", manager: "usr-2", location: "Engineering Building", costCenter: "2000" },
  { id: "dept-3", name: "Production", code: "PROD", manager: "usr-7", location: "Foundry Floor", costCenter: "3000" },
  { id: "dept-4", name: "Quality", code: "QA", manager: "usr-7", location: "Quality Lab", costCenter: "4000" },
  { id: "dept-5", name: "Operations", code: "OPS", manager: "usr-7", location: "Main Office", costCenter: "5000" },
  { id: "dept-6", name: "Maintenance", code: "MAINT", manager: "usr-7", location: "Maintenance Shop", costCenter: "6000" },
  { id: "dept-7", name: "Shipping", code: "SHIP", manager: "usr-7", location: "Shipping Dock", costCenter: "7000" }
];

const organizationSettings = {
  id: "org-1",
  companyName: "RPS Foundry",
  address: "123 Industrial Blvd",
  city: "St. Louis",
  state: "MO",
  zip: "63101",
  phone: "(314) 555-1234",
  email: "info@rpsfoundry.com",
  website: "www.rpsfoundry.com",
  timezone: "America/Chicago",
  dateFormat: "MM/DD/YYYY",
  fiscalYearStart: "January",
  workWeekStart: "Monday",
  defaultShift: "shift-1",
  overtimeThreshold: 40,
  overtimeMultiplier: 1.5,
  logoPath: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const holidayCalendar = [
  { id: "hol-1", name: "New Year's Day", date: "2025-01-01", observed: "2025-01-01", paid: true },
  { id: "hol-2", name: "Martin Luther King Jr. Day", date: "2025-01-20", observed: "2025-01-20", paid: true },
  { id: "hol-3", name: "Presidents Day", date: "2025-02-17", observed: "2025-02-17", paid: true },
  { id: "hol-4", name: "Memorial Day", date: "2025-05-26", observed: "2025-05-26", paid: true },
  { id: "hol-5", name: "Independence Day", date: "2025-07-04", observed: "2025-07-04", paid: true },
  { id: "hol-6", name: "Labor Day", date: "2025-09-01", observed: "2025-09-01", paid: true },
  { id: "hol-7", name: "Thanksgiving", date: "2025-11-27", observed: "2025-11-27", paid: true },
  { id: "hol-8", name: "Day After Thanksgiving", date: "2025-11-28", observed: "2025-11-28", paid: true },
  { id: "hol-9", name: "Christmas Eve", date: "2025-12-24", observed: "2025-12-24", paid: true },
  { id: "hol-10", name: "Christmas Day", date: "2025-12-25", observed: "2025-12-25", paid: true }
];

export function setupMongoDatasetsRoutes(app: Express): void {
  app.post("/api/mongo/datasets/populate-all", async (_req, res) => {
    try {
      const db = await getDatabase();
      const results: Record<string, number> = {};

      await db.collection("checklistTemplates").deleteMany({});
      const ctResult = await db.collection("checklistTemplates").insertMany(checklistTemplates);
      results.checklistTemplates = ctResult.insertedCount;

      await db.collection("workflowStatuses").deleteMany({});
      const wsResult = await db.collection("workflowStatuses").insertMany(workflowStatuses);
      results.workflowStatuses = wsResult.insertedCount;

      await db.collection("users").deleteMany({});
      const usrResult = await db.collection("users").insertMany(users);
      results.users = usrResult.insertedCount;

      await db.collection("materials").deleteMany({});
      const matResult = await db.collection("materials").insertMany(materials);
      results.materials = matResult.insertedCount;

      await db.collection("timeAttendance").deleteMany({});
      const taResult = await db.collection("timeAttendance").insertMany(timeAttendanceRecords);
      results.timeAttendance = taResult.insertedCount;

      await db.collection("employeeSchedules").deleteMany({});
      const esResult = await db.collection("employeeSchedules").insertMany(employeeSchedules);
      results.employeeSchedules = esResult.insertedCount;

      await db.collection("shiftDefinitions").deleteMany({});
      const shiftResult = await db.collection("shiftDefinitions").insertMany(shiftDefinitions);
      results.shiftDefinitions = shiftResult.insertedCount;

      await db.collection("departments").deleteMany({});
      const deptResult = await db.collection("departments").insertMany(departments);
      results.departments = deptResult.insertedCount;

      await db.collection("organizationSettings").deleteMany({});
      await db.collection("organizationSettings").insertOne(organizationSettings);
      results.organizationSettings = 1;

      await db.collection("holidays").deleteMany({});
      const holResult = await db.collection("holidays").insertMany(holidayCalendar);
      results.holidays = holResult.insertedCount;

      console.log("All datasets populated:", results);
      res.json({ 
        success: true, 
        message: "All datasets populated successfully",
        counts: results
      });
    } catch (error) {
      console.error("Error populating datasets:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.get("/api/mongo/datasets/collections", async (_req, res) => {
    try {
      const db = await getDatabase();
      const collections = await db.listCollections().toArray();
      const stats: Record<string, number> = {};
      
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        stats[col.name] = count;
      }
      
      res.json({ collections: stats });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}

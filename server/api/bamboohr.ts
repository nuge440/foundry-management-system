export interface BambooHREmployee {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  department: string;
  jobTitle: string;
  workEmail: string;
  workPhone: string;
  location: string;
  status: string;
  photoUrl?: string;
}

export interface BambooHRDirectory {
  employees: BambooHREmployee[];
  fields: any[];
}

function getConfig(): { apiKey: string; company: string } | null {
  const apiKey = process.env.BAMBOOHR_API_KEY;
  const company = process.env.BAMBOOHR_COMPANY;
  if (!apiKey || !company) return null;
  return { apiKey, company };
}

export function isBambooHRConfigured(): boolean {
  return getConfig() !== null;
}

export async function fetchEmployeeDirectory(): Promise<BambooHREmployee[]> {
  const config = getConfig();
  if (!config) {
    throw new Error("BambooHR is not configured. Set BAMBOOHR_API_KEY and BAMBOOHR_COMPANY environment variables.");
  }

  const { apiKey, company } = config;
  const url = `https://api.bamboohr.com/api/gateway.php/${company}/v1/employees/directory`;
  const auth = Buffer.from(`${apiKey}:x`).toString("base64");

  const response = await fetch(url, {
    headers: {
      "Authorization": `Basic ${auth}`,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BambooHR API error (${response.status}): ${text}`);
  }

  const data: BambooHRDirectory = await response.json();

  return (data.employees || []).map((emp: any) => ({
    id: String(emp.id || ""),
    displayName: emp.displayName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
    firstName: emp.firstName || "",
    lastName: emp.lastName || "",
    department: emp.department || "",
    jobTitle: emp.jobTitle || "",
    workEmail: emp.workEmail || "",
    workPhone: emp.workPhone || emp.workPhoneExtension || "",
    location: emp.location || "",
    status: emp.status || "Active",
    photoUrl: emp.photoUrl || undefined,
  }));
}

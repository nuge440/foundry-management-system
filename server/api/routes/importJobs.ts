import { Router } from "express";
import { mongoJobStorage } from "../../mongoStorage";

const router = Router();

const sampleJobs = [
  { id: "1", status: "Waiting on Doug", task: "Waiting on Doug", company: "Southern Cast", partNumber: "Vertical Saw Stationary - Check with Jeff W", jobNumber: "", sandMoldSize: "Printed Mold", material: "WCB", pourWeight: "93", owner: "MM", quantityNeeded: "1", moldsNeeded: "1", certs: "No", coresOrdered: "7/9/2024", promisedDate: "7/26/2024", heatTreat: "", notes: "Hot top, Build Wall", informMelt: "", moldsSplitOff: "" },
  { id: "2", status: "Waiting On Customer", task: "Waiting On Customer", company: "Mark Andy", partNumber: "403811-017R - ROBOCAST", jobNumber: "35074", sandMoldSize: "Customer to take stock up to 1/4\"", material: "ASTM A48 Cl 30A G.I", pourWeight: "", owner: "", quantityNeeded: "2", moldsNeeded: "", certs: "Yes", coresOrdered: "", promisedDate: "11/22/2025", heatTreat: "", notes: "", informMelt: "", moldsSplitOff: "" },
  { id: "3", status: "Waiting On Customer", task: "Waiting On Customer", company: "Flowserve", partNumber: "F002620319- ROBOCAST-66847830", jobNumber: "35107", sandMoldSize: "Sent question to customer 11/7/25", material: "ASTM A278 Cl 30 G.I", pourWeight: "", owner: "", quantityNeeded: "1", moldsNeeded: "", certs: "Yes", coresOrdered: "", promisedDate: "12/5/2025", heatTreat: "", notes: "", informMelt: "", moldsSplitOff: "" },
  { id: "4", status: "Waiting On Customer", task: "Waiting On Customer", company: "Flowserve", partNumber: "F002613288 - ROBOCAST-66847831", jobNumber: "35108", sandMoldSize: "Sent question to customer 11/7/25", material: "ASTM A278 Cl 30 G.I", pourWeight: "", owner: "", quantityNeeded: "1", moldsNeeded: "", certs: "Yes", coresOrdered: "", promisedDate: "12/5/2025", heatTreat: "", notes: "", informMelt: "", moldsSplitOff: "" },
  { id: "5", status: "Waiting On Customer", task: "Waiting On Customer", company: "RPM", partNumber: "54704-01-UNN-ROBOCAST- RPM1766", jobNumber: "35191", sandMoldSize: "ZH customer confirming model", material: "WCB", pourWeight: "", owner: "", quantityNeeded: "1", moldsNeeded: "", certs: "Yes", coresOrdered: "", promisedDate: "1/7/2026", heatTreat: "Normalized", notes: "", informMelt: "", moldsSplitOff: "" },
  { id: "6", status: "Waiting On Customer", task: "Waiting On Customer", company: "ERL", partNumber: "239AB335C-SS- ROBOCAST-3D MOLD", jobNumber: "35229", sandMoldSize: "Offloaded needs model prep", material: "ASTM A351 CF8M", pourWeight: "", owner: "", quantityNeeded: "3", moldsNeeded: "", certs: "Yes", coresOrdered: "", promisedDate: "1/12/2026", heatTreat: "Austenitize and Quench", notes: "", informMelt: "", moldsSplitOff: "" },
  { id: "7", status: "Waiting On Customer", task: "Waiting On Customer", company: "ERL", partNumber: "238AB116C-2- ROBOCAST-3D MOLD", jobNumber: "35230", sandMoldSize: "Offloaded needs model prep", material: "ASTM A351 CF8M", pourWeight: "", owner: "", quantityNeeded: "1", moldsNeeded: "", certs: "Yes", coresOrdered: "", promisedDate: "1/12/2026", heatTreat: "Austenitize and Quench", notes: "", informMelt: "", moldsSplitOff: "" },
  { id: "8", status: "Waiting On Customer", task: "Waiting On Customer", company: "WMC", partNumber: "168D807 UH- ROBOCAST", jobNumber: "35233", sandMoldSize: "Stock Questions Sent to Customer", material: "DE12-0113J (ASTM A216 WCB)", pourWeight: "", owner: "", quantityNeeded: "1", moldsNeeded: "", certs: "Yes", coresOrdered: "", promisedDate: "1/16/2026", heatTreat: "Normalized and Tempered", notes: "", informMelt: "", moldsSplitOff: "" },
  { id: "9", status: "Waiting On Customer", task: "Waiting On Customer", company: "WMC", partNumber: "168D807 LH - ROBOCAST", jobNumber: "35232", sandMoldSize: "Stock Questions Sent to Customer", material: "DE12-0113J (ASTM A216 WCB)", pourWeight: "", owner: "", quantityNeeded: "1", moldsNeeded: "", certs: "Yes", coresOrdered: "", promisedDate: "1/16/2026", heatTreat: "Normalized and Tempered", notes: "", informMelt: "", moldsSplitOff: "" },
  { id: "10", status: "Waiting On Customer", task: "Waiting On Customer", company: "Siemens", partNumber: "21296-902 - ROBOCAST", jobNumber: "35222", sandMoldSize: "Stock Questions Sent", material: "CM-8631 (WCB)", pourWeight: "", owner: "", quantityNeeded: "1", moldsNeeded: "", certs: "Yes", coresOrdered: "", promisedDate: "1/19/2026", heatTreat: "Normalized", notes: "", informMelt: "", moldsSplitOff: "" },
  { id: "11", status: "Waiting On CAD", task: "Waiting On CAD", company: "SOUTHERN CAST", partNumber: "Cast Test bar on casting", jobNumber: "31199", sandMoldSize: "", material: "Al 319", pourWeight: "", owner: "", quantityNeeded: "4", moldsNeeded: "4", certs: "No", coresOrdered: "", promisedDate: "4/28/2023", heatTreat: "", notes: "", informMelt: "", moldsSplitOff: "" },
  { id: "12", status: "Waiting On CAD", task: "Waiting On CAD", company: "SOUTHERN CAST", partNumber: "Small 3-D Flask", jobNumber: "", sandMoldSize: "50x50x12/12/12", material: "Al 356 - T6", pourWeight: "", owner: "", quantityNeeded: "1", moldsNeeded: "1", certs: "No", coresOrdered: "N/A", promisedDate: "8/1/2023", heatTreat: "T6", notes: "", informMelt: "", moldsSplitOff: "" },
  { id: "13", status: "Waiting On CAD", task: "Waiting On CAD", company: "Vandeventer", partNumber: "SK3047 -ROBO - 2205 SS", jobNumber: "34858", sandMoldSize: "JWA - Review SIMs with BL", material: "ASTM A995 CD3MN 2205SS", pourWeight: "", owner: "TK", quantityNeeded: "1", moldsNeeded: "1", certs: "No", coresOrdered: "", promisedDate: "", heatTreat: "Austenitize and Quench", notes: "", informMelt: "", moldsSplitOff: "", daysOnFloor: 3 },
  { id: "14", status: "Solidification / Gating", task: "Solidification / Gating", company: "SCP", partNumber: "MACHINE SHOP FIXTURE DUAL WEY 24\"", jobNumber: "35200", sandMoldSize: "ZH", material: "40 FE", pourWeight: "", owner: "", quantityNeeded: "2", moldsNeeded: "2", certs: "No", coresOrdered: "", promisedDate: "12/23/2025", heatTreat: "Stress Relieve", notes: "", informMelt: "1", moldsSplitOff: "1", daysOnFloor: 1 },
  { id: "15", status: "Solidification / Gating", task: "Solidification / Gating", company: "ACE Pumps", partNumber: "Z-BAC16750LIN-ROBOCAST-3D MOLD", jobNumber: "35217", sandMoldSize: "TK", material: "ASTM A351 CF8M", pourWeight: "", owner: "", quantityNeeded: "3", moldsNeeded: "", certs: "Yes", coresOrdered: "", promisedDate: "1/12/2026", heatTreat: "Austenitize and Quench", notes: "", informMelt: "", moldsSplitOff: "" },
  { id: "16", status: "CAD (Mold Work)", task: "CAD (Mold Work)", company: "RPM", partNumber: "54836-01-SIM- ROBOCAST-RPM1909", jobNumber: "35226", sandMoldSize: "30x30x10/10/10 -MM", material: "DE12-0534 (ASTM A747 CB7Cu-1)", pourWeight: "220", owner: "MM", quantityNeeded: "4", moldsNeeded: "4", certs: "Yes", coresOrdered: "", promisedDate: "1/26/2026", heatTreat: "See One note", notes: "Hot top, Large Vacuum 45mins", informMelt: "", moldsSplitOff: "" },
  { id: "17", status: "Waiting on Sample", task: "Waiting on Sample", company: "Howden", partNumber: "A053251 - ROBOCAST-5W-74364 - Sample 2", jobNumber: "34497", sandMoldSize: "50x50x16F/16/12", material: "ASTM B26 A356-T6", pourWeight: "677", owner: "CM", quantityNeeded: "4", moldsNeeded: "4", certs: "Yes", coresOrdered: "7/7/2025", promisedDate: "8/6/2025", heatTreat: "T6", notes: "Liquid hot top, vacuum 1 hr", informMelt: "", moldsSplitOff: "" },
  { id: "18", status: "Waiting on Sample", task: "Waiting on Sample", company: "Siemens", partNumber: "P0100024500 - ROBOCAST-CARRIER 2-8", jobNumber: "34654", sandMoldSize: "65x58x20F/10", material: "11315BA (ASTM A439 D2C)", pourWeight: "1125", owner: "PP", quantityNeeded: "8", moldsNeeded: "8", certs: "Yes", coresOrdered: "", promisedDate: "9/1/2025", heatTreat: "", notes: "Hot top, Pour uphill", informMelt: "", moldsSplitOff: "" },
  { id: "19", status: "Waiting On Molds", task: "Waiting On Molds", company: "ACI", partNumber: "Z643-052 - ROBO- Z643-053 - 1/4", jobNumber: "35211", sandMoldSize: "50x50x22F / 12F / 12", material: "ASTM B26 C355-T7", pourWeight: "654", owner: "TK", quantityNeeded: "4", moldsNeeded: "4", certs: "Yes", coresOrdered: "12/4/2025", promisedDate: "1/7/2025", heatTreat: "T7", notes: "Pour Temp 1250, Liquid Hot Top", informMelt: "", moldsSplitOff: "" },
  { id: "20", status: "Waiting On Molds", task: "Waiting On Molds", company: "Siemens", partNumber: "150453-901- ROBOCAST", jobNumber: "35172", sandMoldSize: "40x40x14/14F/12", material: "CM-8631 (WCB)", pourWeight: "970", owner: "CM", quantityNeeded: "1", moldsNeeded: "1", certs: "Yes", coresOrdered: "12/4/2025", promisedDate: "1/7/2026", heatTreat: "Normalized", notes: "Hot top, vacuum 40 min", informMelt: "", moldsSplitOff: "" },
  { id: "21", status: "Ready For Robot", task: "Ready For Robot", company: "Diamond Lane", partNumber: "801186-008WDDUP - ROBOCAST - 1/5", jobNumber: "35045", sandMoldSize: "40x40x20F / 16", material: "046024-KS (65-45-12)", pourWeight: "454", owner: "TK", quantityNeeded: "5", moldsNeeded: "5", certs: "Yes", coresOrdered: "11/14/2025", promisedDate: "11/19/2025", heatTreat: "", notes: "Pour Uphill, 2 Small Vacuums", informMelt: "", moldsSplitOff: "", daysOnFloor: 2 },
  { id: "22", status: "Ready For Robot", task: "Ready For Robot", company: "Flowserve", partNumber: "F002544147 - ROBOCAST-01135865", jobNumber: "35118", sandMoldSize: "60x58x20F/12F/12", material: "ASTM A487 CA6NM CL A", pourWeight: "1655", owner: "PP", quantityNeeded: "1", moldsNeeded: "1", certs: "Yes", coresOrdered: "11/25/2025", promisedDate: "12/17/2025", heatTreat: "Quench and Temper", notes: "Vacuum Vents 45 min", informMelt: "", moldsSplitOff: "" },
  { id: "23", status: "Running On Robot", task: "Running On Robot", company: "WEY", partNumber: "D-6915 DN50/80 S-16022A- MACH", jobNumber: "34800", sandMoldSize: "45x40x16/12", material: "Al 319", pourWeight: "335", owner: "PP", quantityNeeded: "", moldsNeeded: "", certs: "No", coresOrdered: "", promisedDate: "12/8/2025", heatTreat: "", notes: "", informMelt: "", moldsSplitOff: "" },
  { id: "24", status: "Waiting On Cores", task: "Waiting On Cores", company: "Siemens", partNumber: "4643-901- ROBOCAST - 3D MOLD", jobNumber: "35223", sandMoldSize: "Printed Mold", material: "CM-3113 (ASTM A48 Cl 30 G.I)", pourWeight: "24", owner: "TK", quantityNeeded: "1", moldsNeeded: "1", certs: "Yes", coresOrdered: "12/8/2025", promisedDate: "1/19/2026", heatTreat: "", notes: "Hot Top, 1 Small Vaccum", informMelt: "", moldsSplitOff: "" },
  { id: "25", status: "Waiting to be Assembled", task: "Waiting to be Assembled", company: "WEY VALVE", partNumber: "D-3909 WCB ROBO - 1/2 SAMPLE", jobNumber: "34964", sandMoldSize: "85x65x16F/12", material: "WCB", pourWeight: "3930", owner: "CM", quantityNeeded: "2", moldsNeeded: "2", certs: "Yes", coresOrdered: "12/2/2025", promisedDate: "11/4/2025", heatTreat: "Normalized", notes: "Hot top, Pour Uphill", informMelt: "", moldsSplitOff: "" },
  { id: "26", status: "Being Assembled", task: "Being Assembled", company: "CAT", partNumber: "6645235 - ROBOCAST - 1/5", jobNumber: "35034", sandMoldSize: "90x58x12F/16F/12F/12F", material: "1E0356 (65-45-12 D.I)", pourWeight: "1615", owner: "PP", quantityNeeded: "5", moldsNeeded: "5", certs: "Yes", coresOrdered: "11/11/2025", promisedDate: "11/21/2025", heatTreat: "Stress Relieved", notes: "Pour UP Hill", informMelt: "", moldsSplitOff: "", daysOnFloor: 2 },
  { id: "27", status: "Ready to Pour", task: "Ready to Pour", company: "CAT", partNumber: "6664964- ROBOCAST - 4/4", jobNumber: "35036", sandMoldSize: "40x40x12/12", material: "1E0356 (65-45-12 D.I)", pourWeight: "300", owner: "PP", quantityNeeded: "4", moldsNeeded: "4", certs: "Yes", coresOrdered: "N/A", promisedDate: "12/22/2025", heatTreat: "Stress Relieved", notes: "Pour Up Hill", informMelt: "", moldsSplitOff: "", daysOnFloor: 2 },
  { id: "28", status: "Ready to Pour", task: "Ready to Pour", company: "RPM", partNumber: "29876 RPM 229 ROBOCAST 2/2", jobNumber: "35190", sandMoldSize: "65X58X18F/12F/10F/6", material: "65-45-12 D.I", pourWeight: "2700", owner: "PP", quantityNeeded: "2", moldsNeeded: "2", certs: "Chems Only", coresOrdered: "11/25/2025", promisedDate: "12/23/2025", heatTreat: "", notes: "Vacuum Vents 1 hr", informMelt: "", moldsSplitOff: "", daysOnFloor: 1 },
  { id: "29", status: "Ready to Pour", task: "Ready to Pour", company: "Diamond Lane", partNumber: "081651-048UP- ROBOCAST-3D MOLD", jobNumber: "35198", sandMoldSize: "30x30x10/10", material: "46024-FA (60-45-15)", pourWeight: "117", owner: "TK", quantityNeeded: "6", moldsNeeded: "3", certs: "Yes", coresOrdered: "N/A", promisedDate: "12/23/2025", heatTreat: "", notes: "Pour Uphill", informMelt: "", moldsSplitOff: "", daysOnFloor: 2 },
  { id: "30", status: "Cooling", task: "Cooling", company: "Flowserve", partNumber: "F002544147 - ROBOCAST-01135860", jobNumber: "35117", sandMoldSize: "60x58x20F/12F/12", material: "ASTM A487 CA6NM CL A", pourWeight: "1655", owner: "PP", quantityNeeded: "1", moldsNeeded: "1", certs: "Yes", coresOrdered: "11/21/2025", promisedDate: "12/17/2025", heatTreat: "Quench and Temper", notes: "Vacuum 45 min", informMelt: "", moldsSplitOff: "", daysOnFloor: 5 },
  { id: "31", status: "Grinding Room", task: "Grinding Room", company: "CAT", partNumber: "6645243 - 1/4", jobNumber: "35035", sandMoldSize: "45x40x12/12", material: "1E0356 (65-45-12 D.I)", pourWeight: "305", owner: "PP", quantityNeeded: "4", moldsNeeded: "1", certs: "Yes", coresOrdered: "11/5/2025", promisedDate: "11/21/2025", heatTreat: "Stress Relieved", notes: "Pour UP Hill", informMelt: "", moldsSplitOff: "", daysOnFloor: 10 },
  { id: "32", status: "At Heat Treat", task: "At Heat Treat", company: "Howden", partNumber: "A053251 - ROBOCAST-5W-74364", jobNumber: "34497", sandMoldSize: "50x50x16F/16/12", material: "ASTM B26 A356-T6", pourWeight: "677", owner: "CM", quantityNeeded: "4", moldsNeeded: "4", certs: "Yes", coresOrdered: "7/7/2025", promisedDate: "8/6/2025", heatTreat: "T6", notes: "Use virgin material", informMelt: "", moldsSplitOff: "" },
  { id: "33", status: "At Machine Shop", task: "At Machine Shop", company: "RPM", partNumber: "54836-01-SIM- ROBOCAST-RPM1908", jobNumber: "35224", sandMoldSize: "30x30x10/10/10", material: "DE12-0534", pourWeight: "220", owner: "MM", quantityNeeded: "4", moldsNeeded: "4", certs: "Yes", coresOrdered: "", promisedDate: "1/23/2026", heatTreat: "See One note", notes: "Hot top, Large Vacuum", informMelt: "", moldsSplitOff: "" },
  { id: "34", status: "Inspection", task: "Inspection", company: "WMC", partNumber: "P900ANX2_02 - ROBOCAST - 1/2", jobNumber: "35055", sandMoldSize: "60x58x20F/14", material: "DE12J-0549 (CA6NM CL A)", pourWeight: "1731", owner: "MM", quantityNeeded: "2", moldsNeeded: "2", certs: "Yes", coresOrdered: "11/12/2025", promisedDate: "11/26/2025", heatTreat: "Quench and Temper", notes: "Hot top, pour Uphill", informMelt: "", moldsSplitOff: "" },
  { id: "35", status: "At Foundry For Sample", task: "At Foundry For Sample", company: "CAT", partNumber: "6645235 - ROBOCAST - 1/5 SAMPLE", jobNumber: "35034", sandMoldSize: "90x58x12F/16F/12F/12F", material: "1E0356 (65-45-12 D.I)", pourWeight: "1615", owner: "PP", quantityNeeded: "5", moldsNeeded: "5", certs: "Yes", coresOrdered: "11/11/2025", promisedDate: "11/21/2025", heatTreat: "Stress Relieved", notes: "Pour UP Hill", informMelt: "", moldsSplitOff: "" },
  { id: "36", status: "Shipping", task: "Shipping", company: "ACI", partNumber: "C3F-888-1A#1 - ROBOCAST 1/2", jobNumber: "34763", sandMoldSize: "65x58x18F/14F/8", material: "NI-01D (ASTM A395)", pourWeight: "3200", owner: "PP", quantityNeeded: "2", moldsNeeded: "2", certs: "Yes", coresOrdered: "", promisedDate: "10/24/2025", heatTreat: "HT-03", notes: "Vacuum Vents 3 hrs", informMelt: "", moldsSplitOff: "" },
  { id: "37", status: "Shipped", task: "Shipped", company: "Diamond Lane", partNumber: "801186-008WDDUP - ROBOCAST", jobNumber: "35044", sandMoldSize: "40x40x20F / 16", material: "046024-KS (65-45-12)", pourWeight: "454", owner: "TK", quantityNeeded: "1", moldsNeeded: "1", certs: "Yes", coresOrdered: "11/14/2025", promisedDate: "11/18/2025", heatTreat: "", notes: "Pour Uphill", informMelt: "", moldsSplitOff: "" },
  { id: "38", status: "Shipped", task: "Shipped", company: "RPM", partNumber: "54837-01-SIM- ROBOCAST-RPM1909", jobNumber: "35225", sandMoldSize: "40x40x12/12/12", material: "DE12-0534", pourWeight: "287", owner: "TK", quantityNeeded: "4", moldsNeeded: "4", certs: "Yes", coresOrdered: "12/8/2025", promisedDate: "1/26/2026", heatTreat: "See One note", notes: "Hot top, 1 Large Vacuum", informMelt: "", moldsSplitOff: "" },
];

router.post("/import", async (req, res) => {
  try {
    console.log("Starting job import to MongoDB...");
    
    let importCount = 0;
    for (const job of sampleJobs) {
      await mongoJobStorage.createJob({
        jobNumber: job.jobNumber || "",
        status: job.status,
        task: job.task,
        company: job.company,
        partNumber: job.partNumber,
        sandMoldSize: job.sandMoldSize || "",
        moldSize: "",
        material: job.material,
        pourWeight: job.pourWeight,
        owner: job.owner,
        quantityNeeded: job.quantityNeeded,
        quantityCompleted: 0,
        moldsNeeded: job.moldsNeeded,
        certs: job.certs,
        customChills: "",
        coresOrdered: job.coresOrdered,
        promisedDate: job.promisedDate,
        heatTreat: job.heatTreat,
        assemblyCode: "",
        estAssemblyTime: "",
        modelApproved: "",
        notes: job.notes,
        informMelt: job.informMelt,
        moldsSplitOff: job.moldsSplitOff,
        daysOnFloor: (job as any).daysOnFloor || 0,
        designInfo: {},
        assemblyInfo: {},
        cleaningInfo: {},
        pouringInstructions: {},
        ndTestRequirements: {},
        lessonsLearned: [],
      });
      importCount++;
    }
    
    console.log(`Successfully imported ${importCount} jobs to MongoDB`);
    res.json({ success: true, imported: importCount });
  } catch (error) {
    console.error("Error importing jobs:", error);
    res.status(500).json({ error: "Failed to import jobs" });
  }
});

const sampleDesignInfos = [
  { solidification: "Good", solidificationQuality: "A", sprues: 2, basinSize: "4x4", gatingSystem: "Bottom Fill", pourRateDesign: "15 lbs/sec", pourRateActual: "14 lbs/sec", cad: "Complete", cam: "Complete", parting: "Horizontal", moldType: "Green Sand", castingsPerMold: 1, orientation: "Cope Up" },
  { solidification: "Good", solidificationQuality: "A", sprues: 1, basinSize: "3x3", gatingSystem: "Side Fill", pourRateDesign: "12 lbs/sec", pourRateActual: "11 lbs/sec", cad: "In Progress", cam: "Pending", parting: "Horizontal", moldType: "No-Bake", castingsPerMold: 2, orientation: "Cope Up" },
  { solidification: "Fair", solidificationQuality: "B", sprues: 3, basinSize: "5x5", gatingSystem: "Top Fill", pourRateDesign: "20 lbs/sec", pourRateActual: "18 lbs/sec", cad: "Complete", cam: "Complete", parting: "Vertical", moldType: "3D Printed", castingsPerMold: 1, orientation: "Drag Up" },
  { solidification: "Good", solidificationQuality: "A", sprues: 2, basinSize: "4x4", gatingSystem: "Bottom Fill", pourRateDesign: "16 lbs/sec", pourRateActual: "15 lbs/sec", cad: "Complete", cam: "In Progress", parting: "Horizontal", moldType: "Green Sand", castingsPerMold: 1, orientation: "Cope Up" },
  { solidification: "Excellent", solidificationQuality: "A+", sprues: 4, basinSize: "6x6", gatingSystem: "Bottom Fill", pourRateDesign: "25 lbs/sec", pourRateActual: "24 lbs/sec", cad: "Complete", cam: "Complete", parting: "Horizontal", moldType: "No-Bake", castingsPerMold: 2, orientation: "Cope Up" },
];

const sampleAssemblyInfos = [
  { moldSize: "40x40x12/12", paint: "Zircon", robotTimeCope: "45 min", robotTimeDrag: "40 min", mpiCerted: "Yes", assemblyNotes: "Standard assembly procedure", coreBoxes: "2 boxes", specialTooling: "None required" },
  { moldSize: "50x50x16F/16/12", paint: "Graphite", robotTimeCope: "55 min", robotTimeDrag: "50 min", mpiCerted: "Yes", assemblyNotes: "Use alignment pins", coreBoxes: "3 boxes", specialTooling: "Custom jig required" },
  { moldSize: "60x58x20F/12F/12", paint: "Zircon/Graphite Mix", robotTimeCope: "70 min", robotTimeDrag: "65 min", mpiCerted: "No", assemblyNotes: "Check core clearances", coreBoxes: "4 boxes", specialTooling: "Lifting fixture" },
  { moldSize: "30x30x10/10/10", paint: "Zircon", robotTimeCope: "25 min", robotTimeDrag: "20 min", mpiCerted: "Yes", assemblyNotes: "Quick setup", coreBoxes: "1 box", specialTooling: "None" },
  { moldSize: "65x58x18F/14F/8", paint: "Ceramic", robotTimeCope: "80 min", robotTimeDrag: "75 min", mpiCerted: "Yes", assemblyNotes: "Complex assembly - verify core positions", coreBoxes: "5 boxes", specialTooling: "Crane assist" },
];

const sampleCleaningInfos = [
  { cleanTime: "2.5 hrs", moldRating: "Good", pouringPictures: "Yes", castingPictures: "Yes", coreAssembly: "Standard", coreCost: "$150", moldAssembly: "Complete", castingWeightLbs: 93, pourPoint: "Center", assembly: "Standard", additionalNotesInitial: "Clean cut-off area" },
  { cleanTime: "3.0 hrs", moldRating: "Excellent", pouringPictures: "Yes", castingPictures: "Yes", coreAssembly: "Complex", coreCost: "$275", moldAssembly: "Complete", castingWeightLbs: 677, pourPoint: "Side", assembly: "Multi-step", additionalNotesInitial: "Inspect for porosity" },
  { cleanTime: "4.5 hrs", moldRating: "Fair", pouringPictures: "No", castingPictures: "Yes", coreAssembly: "Standard", coreCost: "$200", moldAssembly: "Partial", castingWeightLbs: 1655, pourPoint: "Bottom", assembly: "Heavy duty", additionalNotesInitial: "Extra grinding required" },
  { cleanTime: "1.5 hrs", moldRating: "Good", pouringPictures: "Yes", castingPictures: "No", coreAssembly: "Simple", coreCost: "$75", moldAssembly: "Complete", castingWeightLbs: 117, pourPoint: "Top", assembly: "Quick", additionalNotesInitial: "Standard finish" },
  { cleanTime: "5.0 hrs", moldRating: "Good", pouringPictures: "Yes", castingPictures: "Yes", coreAssembly: "Complex", coreCost: "$350", moldAssembly: "Complete", castingWeightLbs: 2700, pourPoint: "Uphill", assembly: "Custom", additionalNotesInitial: "Weld repair may be needed" },
];

const samplePouringInstructions = [
  { pourTemp: "2750°F", pourTempMin: "2700°F", pourTempMax: "2800°F", pourTime: "45 sec", ladleSize: "500 lbs", inoculant: "FeSi", inoculantAmount: "0.5%", nodulizer: "MgFeSi", nodularizerAmount: "1.2%", filterType: "Ceramic Foam", filterSize: "4x4", skimTime: "30 sec", holdTime: "5 min", shakeoutTime: "4 hrs", specialInstructions: "Pour uphill, maintain steady stream", notes: "Monitor temperature closely" },
  { pourTemp: "2650°F", pourTempMin: "2600°F", pourTempMax: "2700°F", pourTime: "30 sec", ladleSize: "300 lbs", inoculant: "FeSi", inoculantAmount: "0.4%", nodulizer: "None", nodularizerAmount: "N/A", filterType: "Silica", filterSize: "3x3", skimTime: "20 sec", holdTime: "3 min", shakeoutTime: "2 hrs", specialInstructions: "Standard pour", notes: "" },
  { pourTemp: "2800°F", pourTempMin: "2750°F", pourTempMax: "2850°F", pourTime: "60 sec", ladleSize: "1000 lbs", inoculant: "Barium FeSi", inoculantAmount: "0.6%", nodulizer: "MgFeSi", nodularizerAmount: "1.5%", filterType: "Ceramic Foam", filterSize: "6x6", skimTime: "45 sec", holdTime: "8 min", shakeoutTime: "8 hrs", specialInstructions: "Use vacuum assist, pour slowly", notes: "Large casting - monitor shrinkage" },
  { pourTemp: "1350°F", pourTempMin: "1300°F", pourTempMax: "1400°F", pourTime: "25 sec", ladleSize: "200 lbs", inoculant: "None", inoculantAmount: "N/A", nodulizer: "None", nodularizerAmount: "N/A", filterType: "Steel Mesh", filterSize: "3x3", skimTime: "15 sec", holdTime: "2 min", shakeoutTime: "1 hr", specialInstructions: "Aluminum pour - degass before pour", notes: "Use hydrogen detector" },
  { pourTemp: "2900°F", pourTempMin: "2850°F", pourTempMax: "2950°F", pourTime: "90 sec", ladleSize: "2000 lbs", inoculant: "FeSi", inoculantAmount: "0.7%", nodulizer: "MgFeSi", nodularizerAmount: "1.8%", filterType: "Ceramic Foam", filterSize: "8x8", skimTime: "60 sec", holdTime: "10 min", shakeoutTime: "12 hrs", specialInstructions: "Heavy section - extended cooling required", notes: "Schedule crane for shakeout" },
];

const sampleNdTestRequirements = [
  { rtRequired: "Yes", rtLevel: "Level II", utRequired: "Yes", utLevel: "Level I", mtRequired: "Yes", mtLevel: "Level II", ptRequired: "No", ptLevel: "N/A", vtRequired: "Yes", vtLevel: "Level I", hardnessRequired: "Yes", hardnessSpec: "HB 170-230", dimensionalRequired: "Yes", dimensionalSpec: "Per drawing", chemRequired: "Yes", mechRequired: "Yes", notes: "Customer witness required for RT" },
  { rtRequired: "No", rtLevel: "N/A", utRequired: "No", utLevel: "N/A", mtRequired: "Yes", mtLevel: "Level I", ptRequired: "Yes", ptLevel: "Level II", vtRequired: "Yes", vtLevel: "Level I", hardnessRequired: "Yes", hardnessSpec: "HB 150-200", dimensionalRequired: "Yes", dimensionalSpec: "Per drawing", chemRequired: "Yes", mechRequired: "No", notes: "Standard inspection" },
  { rtRequired: "Yes", rtLevel: "Level III", utRequired: "Yes", utLevel: "Level II", mtRequired: "Yes", mtLevel: "Level II", ptRequired: "Yes", ptLevel: "Level II", vtRequired: "Yes", vtLevel: "Level II", hardnessRequired: "Yes", hardnessSpec: "HB 200-260", dimensionalRequired: "Yes", dimensionalSpec: "CMM inspection", chemRequired: "Yes", mechRequired: "Yes", notes: "Full NDE per ASTM E446" },
  { rtRequired: "No", rtLevel: "N/A", utRequired: "No", utLevel: "N/A", mtRequired: "No", mtLevel: "N/A", ptRequired: "No", ptLevel: "N/A", vtRequired: "Yes", vtLevel: "Level I", hardnessRequired: "No", hardnessSpec: "N/A", dimensionalRequired: "Yes", dimensionalSpec: "Per drawing", chemRequired: "Yes", mechRequired: "No", notes: "Visual only - commercial grade" },
  { rtRequired: "Yes", rtLevel: "Level II", utRequired: "No", utLevel: "N/A", mtRequired: "Yes", mtLevel: "Level II", ptRequired: "No", ptLevel: "N/A", vtRequired: "Yes", vtLevel: "Level II", hardnessRequired: "Yes", hardnessSpec: "HRC 28-35", dimensionalRequired: "Yes", dimensionalSpec: "Per drawing + GD&T", chemRequired: "Yes", mechRequired: "Yes", notes: "Aerospace requirements" },
];

const sampleLessonsLearned = [
  [{ date: "2024-06-15", issue: "Porosity in riser area", resolution: "Increased riser size by 15%", addedBy: "MM" }, { date: "2024-07-20", issue: "Cold shut at thin section", resolution: "Raised pour temp by 50°F", addedBy: "PP" }],
  [{ date: "2024-08-10", issue: "Shrinkage cavity near gate", resolution: "Added chill block", addedBy: "TK" }],
  [{ date: "2024-05-22", issue: "Core shift during pour", resolution: "Added core prints and chaplets", addedBy: "CM" }, { date: "2024-09-01", issue: "Surface finish rough", resolution: "Changed to finer sand", addedBy: "PP" }, { date: "2024-10-15", issue: "Dimensional out of spec", resolution: "Adjusted pattern allowance", addedBy: "MM" }],
  [],
  [{ date: "2024-11-05", issue: "Hot tears at junction", resolution: "Modified gating to reduce stress", addedBy: "TK" }],
];

router.post("/add-pouring-instructions", async (req, res) => {
  try {
    console.log("Adding pouring instructions to all jobs...");
    const jobs = await mongoJobStorage.getAllJobs();
    let updateCount = 0;
    
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const pouringInstructions = samplePouringInstructions[i % samplePouringInstructions.length];
      await mongoJobStorage.updatePouringInstructions(job.id, pouringInstructions);
      updateCount++;
    }
    
    console.log(`Successfully added pouring instructions to ${updateCount} jobs`);
    res.json({ success: true, updated: updateCount });
  } catch (error) {
    console.error("Error adding pouring instructions:", error);
    res.status(500).json({ error: "Failed to add pouring instructions" });
  }
});

router.post("/add-nd-test-requirements", async (req, res) => {
  try {
    console.log("Adding ND test requirements to all jobs...");
    const jobs = await mongoJobStorage.getAllJobs();
    let updateCount = 0;
    
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const ndTestRequirements = sampleNdTestRequirements[i % sampleNdTestRequirements.length];
      await mongoJobStorage.updateNdTestRequirements(job.id, ndTestRequirements);
      updateCount++;
    }
    
    console.log(`Successfully added ND test requirements to ${updateCount} jobs`);
    res.json({ success: true, updated: updateCount });
  } catch (error) {
    console.error("Error adding ND test requirements:", error);
    res.status(500).json({ error: "Failed to add ND test requirements" });
  }
});

router.post("/add-lessons-learned", async (req, res) => {
  try {
    console.log("Adding lessons learned to all jobs...");
    const jobs = await mongoJobStorage.getAllJobs();
    let updateCount = 0;
    
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const lessonsLearned = sampleLessonsLearned[i % sampleLessonsLearned.length];
      await mongoJobStorage.updateLessonsLearned(job.id, lessonsLearned);
      updateCount++;
    }
    
    console.log(`Successfully added lessons learned to ${updateCount} jobs`);
    res.json({ success: true, updated: updateCount });
  } catch (error) {
    console.error("Error adding lessons learned:", error);
    res.status(500).json({ error: "Failed to add lessons learned" });
  }
});

router.post("/add-assembly-info", async (req, res) => {
  try {
    console.log("Adding assembly info to all jobs...");
    const jobs = await mongoJobStorage.getAllJobs();
    let updateCount = 0;
    
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const assemblyInfo = sampleAssemblyInfos[i % sampleAssemblyInfos.length];
      await mongoJobStorage.updateAssemblyInfo(job.id, assemblyInfo);
      updateCount++;
    }
    
    console.log(`Successfully added assembly info to ${updateCount} jobs`);
    res.json({ success: true, updated: updateCount });
  } catch (error) {
    console.error("Error adding assembly info:", error);
    res.status(500).json({ error: "Failed to add assembly info" });
  }
});

router.post("/add-cleaning-info", async (req, res) => {
  try {
    console.log("Adding cleaning room info to all jobs...");
    const jobs = await mongoJobStorage.getAllJobs();
    let updateCount = 0;
    
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const cleaningInfo = sampleCleaningInfos[i % sampleCleaningInfos.length];
      await mongoJobStorage.updateCleaningInfo(job.id, cleaningInfo);
      updateCount++;
    }
    
    console.log(`Successfully added cleaning info to ${updateCount} jobs`);
    res.json({ success: true, updated: updateCount });
  } catch (error) {
    console.error("Error adding cleaning info:", error);
    res.status(500).json({ error: "Failed to add cleaning info" });
  }
});

router.post("/add-design-info", async (req, res) => {
  try {
    console.log("Adding design info to all jobs...");
    const jobs = await mongoJobStorage.getAllJobs();
    let updateCount = 0;
    
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const designInfo = sampleDesignInfos[i % sampleDesignInfos.length];
      await mongoJobStorage.updateDesignInfo(job.id, designInfo);
      updateCount++;
    }
    
    console.log(`Successfully added design info to ${updateCount} jobs`);
    res.json({ success: true, updated: updateCount });
  } catch (error) {
    console.error("Error adding design info:", error);
    res.status(500).json({ error: "Failed to add design info" });
  }
});

export function setupImportJobsRoutes(app: Router) {
  app.use("/api/import", router);
}

export default router;

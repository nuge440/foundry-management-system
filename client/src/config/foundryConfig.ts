export interface FieldConfig {
  label: string;
  field: string;
  type?: "text" | "number" | "select" | "textarea" | "date" | "checkbox";
  options?: string[];
  disabled?: boolean;
  colSpan?: number;
  children?: FieldConfig[];
  showWhen?: string;
  placeholder?: string;
}

export interface SectionConfig {
  title: string;
  colorClass: string;
  borderClass: string;
  fields: FieldConfig[];
  hasPhotos?: boolean;
  hasFiles?: boolean;
  layout?: "grid" | "list";
  gridCols?: number;
}

export interface JobEditModalConfig {
  sections: SectionConfig[];
  sectionNames: string[];
}

const materials = [
  "Gray Iron",
  "Ductile Iron",
  "Aluminum Bronze",
  "Stainless Steel",
  "Carbon Steel",
  "Manganese Steel",
  "WCB",
  "ASTM A48 Cl 30A G.I",
  "WCB - LOW CARBON STEEL",
  "C355",
  "A356",
  "CF8M",
];

export const foundryConfig: JobEditModalConfig = {
  sectionNames: [
    "Design",
    "Assembly",
    "Pouring Instructions",
    "Cleaning Room",
    "Additional Processes",
    "Lessons Learned",
  ],
  sections: [
    {
      title: "Job Information",
      colorClass: "text-blue-600 dark:text-blue-400",
      borderClass: "border-blue-200 dark:border-blue-400/30",
      gridCols: 4,
      fields: [
        { label: "Job Number", field: "jobNumber", disabled: true },
        { label: "Company", field: "company", disabled: true },
        { label: "Part Number", field: "partNumber", disabled: true },
        { label: "Task", field: "task", placeholder: "Leave blank for JobBoss task" },
        { label: "Material", field: "material", type: "select", options: materials },
        { label: "Pour Weight", field: "pourWeight", placeholder: "lbs" },
        { label: "Quantity Needed", field: "quantityNeeded", type: "number", disabled: true },
        { label: "Molds Needed", field: "moldsNeeded", type: "number", disabled: true },
        { label: "Owner", field: "owner" },
        { label: "Certs", field: "certs", type: "select", options: ["Yes", "No"], disabled: true },
        { label: "Promised Date", field: "promisedDate", disabled: true },
        { label: "Cores Ordered", field: "coresOrdered", type: "date" },
        { label: "Model Approved", field: "modelApproved", type: "date" },
        { label: "Custom Chills", field: "customChills" },
        { label: "Heat Treat", field: "heatTreat" },
        { label: "Est Assembly Time", field: "estAssemblyTime" },
        { label: "Assembly Code", field: "assemblyCode" },
        {
          label: "Inform Melt",
          field: "informMelt",
          type: "select",
          options: ["Yes", "No"],
        },
        { label: "Molds Split Off", field: "moldsSplitOff", disabled: true },
        { label: "Qty Completed", field: "quantityCompleted", type: "number", disabled: true },
        { label: "Days On Floor", field: "daysOnFloor", type: "number", disabled: true },
        { label: "Notes", field: "notes", type: "textarea", colSpan: 4, placeholder: "Job notes..." },
      ],
    },
    {
      title: "Design",
      colorClass: "text-green-600 dark:text-green-400",
      borderClass: "border-green-200 dark:border-green-400/30",
      gridCols: 3,
      hasPhotos: true,
      hasFiles: true,
      fields: [
        { label: "Solidification", field: "designInfo.solidification" },
        {
          label: "Solidification Quality",
          field: "designInfo.solidificationQuality",
          type: "select",
          options: ["Nova", "Magma"],
        },
        { label: "Basin Size", field: "designInfo.basinSize", type: "select", options: ["Small", "Large", "Double", "3\" DP", "Direct pour"] },
        { label: "Gating System", field: "designInfo.gatingSystem" },
        { label: "Pour Rate Design", field: "designInfo.pourRateDesign" },
        { label: "Flow Iterations", field: "designInfo.flowIterations" },
        { label: "Final Flow Sim Time", field: "designInfo.finalFlowSimTime" },
        { label: "CAD", field: "designInfo.cad" },
        { label: "Parting", field: "designInfo.parting" },
        { label: "Mold Type", field: "designInfo.moldType", type: "select", options: ["Printed", "Sand", "Shell"] },
        { label: "Sand Mold Size", field: "designInfo.sandMoldSize", placeholder: "Cope/Cheek/Drag" },
        { label: "Castings Per Mold", field: "designInfo.castingsPerMold" },
        { label: "Orientation", field: "designInfo.orientation" },
        { label: "Filter Type", field: "designInfo.filterType" },
        { label: "Number of Sprues", field: "designInfo.numberOfSprues" },
        {
          label: "Design Notes",
          field: "designInfo.designNotes",
          type: "textarea",
          colSpan: 3,
          placeholder: "Design notes...",
        },
      ],
    },
    {
      title: "Assembly",
      colorClass: "text-yellow-600 dark:text-yellow-400",
      borderClass: "border-yellow-200 dark:border-yellow-400/30",
      gridCols: 3,
      hasPhotos: true,
      hasFiles: true,
      fields: [
        { label: "Sand Mold Size", field: "assemblyInfo.moldSize", disabled: true },
        { label: "Paint", field: "assemblyInfo.paint" },
        { label: "Robot Time Cope", field: "assemblyInfo.robotTimeCope", disabled: true },
        { label: "Robot Time Drag", field: "assemblyInfo.robotTimeDrag", disabled: true },
        {
          label: "Assembly Notes",
          field: "assemblyInfo.assemblyNotes",
          type: "textarea",
          colSpan: 3,
          placeholder: "Assembly notes...",
        },
      ],
    },
    {
      title: "Pouring Instructions",
      colorClass: "text-orange-600 dark:text-orange-400",
      borderClass: "border-orange-200 dark:border-orange-400/30",
      gridCols: 3,
      hasPhotos: true,
      hasFiles: true,
      fields: [
        { label: "Pour Temp Min", field: "pouringInstructions.pourTempMin" },
        { label: "Pour Temp Max", field: "pouringInstructions.pourTempMax" },
        { label: "Tap Out Temp", field: "pouringInstructions.tapOutTemp" },
        { label: "Vacuum Time", field: "pouringInstructions.vacuumTime" },
        {
          label: "Test Bar Type",
          field: "pouringInstructions.testBarType",
          type: "select",
          options: ["N/A", "1\" Wye", "1\" Wye before/after casting", "B", "1\" & 3\" Wye"],
        },
        {
          label: "Tilt Step Direction",
          field: "pouringInstructions.tiltStepDirection",
          type: "select",
          options: ["Uphill", "Downhill"],
        },
        { label: "Pour Uphill Step", field: "pouringInstructions.pourUphillStep" },
        { label: "Pour Uphill", field: "pouringInstructions.pourUphill", type: "checkbox" },
        { label: "Vacuum Vents", field: "pouringInstructions.vacuumVents", type: "checkbox" },
        { label: "Hot Top", field: "pouringInstructions.hotTop", type: "checkbox" },
        { label: "Knock Off Risers", field: "pouringInstructions.knockOffRisers", type: "checkbox" },
        { label: "Degas In Ladle", field: "pouringInstructions.degasInLadle", type: "checkbox" },
        { label: "Charpy Required", field: "pouringInstructions.charpyRequired", type: "checkbox" },
        { label: "Build Wall", field: "pouringInstructions.buildWall", type: "checkbox" },
        { label: "Needs Borescope", field: "pouringInstructions.needsBorescope", type: "checkbox" },
        {
          label: "Pouring Notes",
          field: "pouringInstructions.pouringNotes",
          type: "textarea",
          colSpan: 3,
          placeholder: "Pouring notes...",
        },
      ],
    },
    {
      title: "Cleaning Room",
      colorClass: "text-purple-600 dark:text-purple-400",
      borderClass: "border-purple-200 dark:border-purple-400/30",
      gridCols: 3,
      hasPhotos: true,
      hasFiles: true,
      fields: [
        { label: "Clean Time", field: "cleaningInfo.cleanTime", disabled: true },
        { label: "Casting Rating", field: "cleaningInfo.castingRating", disabled: true },
        { label: "Casting Weight (lbs)", field: "cleaningInfo.castingWeight" },
        {
          label: "Cleaning Room Notes",
          field: "cleaningInfo.cleaningNotes",
          type: "textarea",
          colSpan: 3,
          placeholder: "Cleaning room notes...",
        },
      ],
    },
    {
      title: "Additional Processes",
      colorClass: "text-red-600 dark:text-red-400",
      borderClass: "border-red-200 dark:border-red-400/30",
      layout: "list",
      hasPhotos: true,
      hasFiles: true,
      fields: [
        {
          label: "MPI",
          field: "ndTestRequirements.mpiRequired",
          type: "checkbox",
          children: [
            { label: "Certed", field: "ndTestRequirements.mpiCerted", type: "checkbox" },
          ],
        },
        {
          label: "LPI",
          field: "ndTestRequirements.lpiRequired",
          type: "checkbox",
          children: [
            { label: "Certed", field: "ndTestRequirements.lpiCerted", type: "checkbox" },
          ],
        },
        {
          label: "UT",
          field: "ndTestRequirements.utRequired",
          type: "checkbox",
          children: [
            { label: "Certed", field: "ndTestRequirements.utCerted", type: "checkbox" },
          ],
        },
        {
          label: "Charpy",
          field: "ndTestRequirements.charpyRequired",
          type: "checkbox",
          children: [
            { label: "Certed", field: "ndTestRequirements.charpyCerted", type: "checkbox" },
          ],
        },
        {
          label: "Xray",
          field: "ndTestRequirements.xrayRequired",
          type: "checkbox",
          children: [
            { label: "Certed", field: "ndTestRequirements.xrayCerted", type: "checkbox" },
          ],
        },
        { label: "Laser Scan", field: "ndTestRequirements.scanIfRepeated", type: "checkbox" },
        { label: "Borescope", field: "ndTestRequirements.borescopeRequired", type: "checkbox" },
        { label: "Skim Cuts", field: "ndTestRequirements.skimCuts", type: "checkbox" },
        {
          label: "Heat Treat Charts",
          field: "ndTestRequirements.heatTreatCharts",
          type: "checkbox",
          children: [
            { label: "Spec", field: "ndTestRequirements.heatTreatChartsSpec", type: "text", placeholder: "Enter spec..." },
          ],
        },
        {
          label: "Chemicals",
          field: "ndTestRequirements.chemicalsRequired",
          type: "checkbox",
          children: [
            { label: "Spec", field: "ndTestRequirements.chemicalsSpec", type: "text", placeholder: "Enter spec..." },
          ],
        },
        {
          label: "Mechanicals",
          field: "ndTestRequirements.mechanicalsRequired",
          type: "checkbox",
          children: [
            { label: "Spec", field: "ndTestRequirements.mechanicalsSpec", type: "text", placeholder: "Enter spec..." },
          ],
        },
        {
          label: "Process Notes",
          field: "ndTestRequirements.processNotes",
          type: "textarea",
          placeholder: "Process notes...",
        },
      ],
    },
    {
      title: "Lessons Learned",
      colorClass: "text-amber-600 dark:text-amber-400",
      borderClass: "border-amber-200 dark:border-amber-400/30",
      hasPhotos: true,
      hasFiles: true,
      fields: [
        {
          label: "Lessons Learned Notes",
          field: "lessonsLearned.notes",
          type: "textarea",
          placeholder: "Lessons learned...",
        },
      ],
    },
  ],
};

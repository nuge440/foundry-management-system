import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge, JobStatus } from "@/components/StatusBadge";
import { DesignFormModal } from "@/components/DesignFormModal";
import { Pencil, Plus, FileText, ExternalLink, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";

// TODO: Remove mock data
const mockDesignData = [
  {
    id: "1",
    status: "CAD Work" as JobStatus,
    jobNumber: "J-2024-001",
    company: "ABB",
    solidification: "Standard Flow",
    quality: "High Grade",
    sprues: "2",
    basinSize: "12x8",
    gatingSystem: "Bottom Gate",
    pourRate: "15 lbs/sec",
    pourRateActual: "",
    cad: "Complete",
    cam: "In Progress",
    parting: "Horizontal",
    moldType: "Green Sand",
    castingsPerMold: "1",
    orientation: "Vertical",
    powerpointLink: "",
  },
];

function PowerPointPreview({ url }: { url: string }) {
  if (!url) return <span className="text-muted-foreground">—</span>;
  
  const isNetworkPath = url.startsWith('\\\\') || url.startsWith('file:');
  const isOfficeUrl = url.includes('sharepoint.com') || url.includes('onedrive.com') || url.includes('office.com');
  
  // For network paths, we can't use a link - just display the path
  if (isNetworkPath) {
    return (
      <div 
        className="flex items-center gap-2 text-foreground cursor-default"
        title={url}
        data-testid="text-powerpoint-path"
      >
        <Presentation className="w-5 h-5 text-orange-600" />
        <span className="text-xs truncate max-w-[120px]">{url}</span>
      </div>
    );
  }
  
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-primary hover:underline"
      data-testid="link-powerpoint"
    >
      <Presentation className="w-5 h-5 text-orange-600" />
      <span className="text-xs truncate max-w-[100px]">
        {isOfficeUrl ? "View Presentation" : "Open Link"}
      </span>
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export default function DesignInformation() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<any>(null);

  const handleEdit = (design: any) => {
    setEditingDesign(design);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6" data-testid="page-design-information">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Design Information</h1>
        <Button onClick={() => { setEditingDesign(null); setIsModalOpen(true); }} data-testid="button-add-design">
          <Plus className="w-4 h-4 mr-2" />
          Add Design
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Job #</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Customer</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Solidification</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Solidification Quality</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Sprues</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Basin Size</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Gating System</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Pour Rate (Design)</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Pour Rate (Actual)</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">CAD</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">CAM</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Parting</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Mold Type</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Castings/Mold</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Orientation</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">PowerPoint</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockDesignData.map((item, idx) => (
              <tr
                key={item.id}
                className={cn(
                  "border-t hover-elevate transition-colors",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/30"
                )}
              >
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3 whitespace-nowrap font-medium">{item.jobNumber}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.company}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.solidification}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.quality}</td>
                <td className="px-4 py-3">{item.sprues}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.basinSize}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.gatingSystem}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.pourRate}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.pourRateActual || ""}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.cad}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.cam}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.parting}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.moldType}</td>
                <td className="px-4 py-3">{item.castingsPerMold}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.orientation}</td>
                <td className="px-4 py-3">
                  <PowerPointPreview url={item.powerpointLink || ""} />
                </td>
                <td className="px-4 py-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleEdit(item)}
                    data-testid={`button-edit-design-${item.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DesignFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingDesign(null); }}
        initialData={editingDesign}
      />
    </div>
  );
}

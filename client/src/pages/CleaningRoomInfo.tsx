import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge, JobStatus } from "@/components/shared/StatusBadge";
import { CleaningFormModal } from "@/components/modals/CleaningFormModal";
import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// TODO: Remove mock data
const mockCleaningData = [
  {
    id: "1",
    status: "Grinding Room" as JobStatus,
    jobNumber: "J-2024-001",
    company: "ABB",
    cleanTime: "6.5 hrs",
    moldRating: "CM",
    pouringPictures: "Pouring",
    castingPictures: "Casting",
    coreAssembly: "N/A",
    coreCost: "$76",
    moldAssembly: "576",
    castingWeightLbs: "N/A",
    additionalNotesInitial: "N/A",
    pourPoint: "N/A",
    assembly: "N/A",
  },
];

export default function CleaningRoomInfo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCleaning, setEditingCleaning] = useState<any>(null);

  const handleEdit = (cleaning: any) => {
    setEditingCleaning(cleaning);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6" data-testid="page-cleaning-room">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cleaning Room Info</h1>
        <Button onClick={() => { setEditingCleaning(null); setIsModalOpen(true); }} data-testid="button-add-cleaning">
          <Plus className="w-4 h-4 mr-2" />
          Add Cleaning Info
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Job #</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Customer</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Clean Time</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Mold Rating</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Pouring Pictures</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Casting Pictures</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Core Assembly</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Core Cost</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Mold Assembly</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Casting Weight (lbs)</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Pour Point</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Assembly</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Additional Notes</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockCleaningData.map((item, idx) => (
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
                <td className="px-4 py-3 whitespace-nowrap">{item.cleanTime}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.moldRating}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.pouringPictures}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.castingPictures}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.coreAssembly}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.coreCost}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.moldAssembly}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.castingWeightLbs}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.pourPoint}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.assembly}</td>
                <td className="px-4 py-3 max-w-xs truncate">{item.additionalNotesInitial}</td>
                <td className="px-4 py-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleEdit(item)}
                    data-testid={`button-edit-cleaning-${item.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CleaningFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCleaning(null); }}
        initialData={editingCleaning}
      />
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge, JobStatus } from "@/components/StatusBadge";
import { AssemblyFormModal } from "@/components/AssemblyFormModal";
import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// TODO: Remove mock data
const mockAssemblyData = [
  {
    id: "1",
    status: "Being Assembled" as JobStatus,
    jobNumber: "J-2024-001",
    company: "ABB",
    moldSize: "24x18x12",
    paint: "Black Oxide",
    robotTimeCope: "45 min",
    robotTimeDrag: "38 min",
    assemblyTime: "4 hours",
    coreCost: "$1,250",
    mpi: "Yes",
    ut: "No",
  },
];

export default function AssemblyInformation() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssembly, setEditingAssembly] = useState<any>(null);

  const handleEdit = (assembly: any) => {
    setEditingAssembly(assembly);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6" data-testid="page-assembly-information">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Assembly Information</h1>
        <Button onClick={() => { setEditingAssembly(null); setIsModalOpen(true); }} data-testid="button-add-assembly">
          <Plus className="w-4 h-4 mr-2" />
          Add Assembly
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Job #</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Customer</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Mold Size</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Paint</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Robot Time Cope</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Robot Time Drag</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Assembly Time</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Core Cost</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">MPI</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">UT</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockAssemblyData.map((item, idx) => (
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
                <td className="px-4 py-3 whitespace-nowrap">{item.moldSize}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.paint}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.robotTimeCope}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.robotTimeDrag}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.assemblyTime}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.coreCost}</td>
                <td className="px-4 py-3">{item.mpi}</td>
                <td className="px-4 py-3">{item.ut}</td>
                <td className="px-4 py-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleEdit(item)}
                    data-testid={`button-edit-assembly-${item.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AssemblyFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingAssembly(null); }}
        initialData={editingAssembly}
      />
    </div>
  );
}

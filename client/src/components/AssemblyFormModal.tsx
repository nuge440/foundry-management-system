import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AssemblyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  initialData?: any;
}

export function AssemblyFormModal({ isOpen, onClose, onSave, initialData }: AssemblyFormModalProps) {
  const [formData, setFormData] = useState(initialData || {});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    console.log("Assembly form submitted:", formData);
    onClose();
  };

  const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="grid grid-cols-[180px_1fr] items-center gap-4">
      <Label className="text-right text-sm text-muted-foreground">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border rounded-md w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-card z-10">
          <h2 className="text-xl font-semibold">{initialData ? 'Edit Assembly' : 'Add Assembly Information'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-assembly-modal">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-2">
            <FormField label="Status">
              <Select 
                defaultValue={formData.status || "New"}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger data-testid="select-assembly-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Waiting to be Assembled">Waiting to be Assembled</SelectItem>
                  <SelectItem value="Being Assembled">Being Assembled</SelectItem>
                  <SelectItem value="Assembled">Assembled</SelectItem>
                  <SelectItem value="Ready to Pour">Ready to Pour</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Job Number">
              <Input 
                placeholder="Enter job number" 
                defaultValue={formData.jobNumber}
                onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                data-testid="input-assembly-job-number" 
              />
            </FormField>

            <FormField label="Company">
              <Select 
                defaultValue={formData.company}
                onValueChange={(value) => setFormData({ ...formData, company: value })}
              >
                <SelectTrigger data-testid="select-assembly-company">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABB">ABB</SelectItem>
                  <SelectItem value="AGCO">AGCO</SelectItem>
                  <SelectItem value="CAT">CAT</SelectItem>
                  <SelectItem value="EATON">EATON</SelectItem>
                  <SelectItem value="General Electric">General Electric</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Mold Size">
              <Input 
                placeholder="e.g., 24x18x12" 
                defaultValue={formData.moldSize}
                onChange={(e) => setFormData({ ...formData, moldSize: e.target.value })}
                data-testid="input-assembly-mold-size" 
              />
            </FormField>

            <FormField label="Paint">
              <Input 
                placeholder="e.g., Black Oxide" 
                defaultValue={formData.paint}
                onChange={(e) => setFormData({ ...formData, paint: e.target.value })}
                data-testid="input-assembly-paint" 
              />
            </FormField>

            <FormField label="Robot Time - Cope">
              <Input 
                placeholder="e.g., 45 min" 
                defaultValue={formData.robotTimeCope}
                onChange={(e) => setFormData({ ...formData, robotTimeCope: e.target.value })}
                data-testid="input-robot-time-cope" 
              />
            </FormField>

            <FormField label="Robot Time - Drag">
              <Input 
                placeholder="e.g., 38 min" 
                defaultValue={formData.robotTimeDrag}
                onChange={(e) => setFormData({ ...formData, robotTimeDrag: e.target.value })}
                data-testid="input-robot-time-drag" 
              />
            </FormField>

            <FormField label="Assembly Time">
              <Input 
                placeholder="e.g., 4 hours" 
                defaultValue={formData.assemblyTime}
                onChange={(e) => setFormData({ ...formData, assemblyTime: e.target.value })}
                data-testid="input-assembly-time" 
              />
            </FormField>

            <FormField label="Core Cost">
              <Input 
                placeholder="e.g., $1,250" 
                defaultValue={formData.coreCost}
                onChange={(e) => setFormData({ ...formData, coreCost: e.target.value })}
                data-testid="input-core-cost" 
              />
            </FormField>

            <FormField label="MPI Certified">
              <Select 
                defaultValue={formData.mpi || "No"}
                onValueChange={(value) => setFormData({ ...formData, mpi: value })}
              >
                <SelectTrigger data-testid="select-mpi">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="UT (Ultrasonic Testing)">
              <Select 
                defaultValue={formData.ut || "No"}
                onValueChange={(value) => setFormData({ ...formData, ut: value })}
              >
                <SelectTrigger data-testid="select-ut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t bg-card">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-assembly">
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-assembly">
              Save Assembly
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

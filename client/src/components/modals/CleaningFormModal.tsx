import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CleaningFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  initialData?: any;
}

export function CleaningFormModal({ isOpen, onClose, onSave, initialData }: CleaningFormModalProps) {
  const [formData, setFormData] = useState(initialData || {});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    console.log("Cleaning form submitted:", formData);
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
          <h2 className="text-xl font-semibold">{initialData ? 'Edit Cleaning Info' : 'Add Cleaning Room Information'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-cleaning-modal">
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
                <SelectTrigger data-testid="select-cleaning-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Cooling">Cooling</SelectItem>
                  <SelectItem value="Grinding Room">Grinding Room</SelectItem>
                  <SelectItem value="Heat Treat">Heat Treat</SelectItem>
                  <SelectItem value="Inspection">Inspection</SelectItem>
                  <SelectItem value="Shipping">Shipping</SelectItem>
                  <SelectItem value="SHIPPED">SHIPPED</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Job Number">
              <Input 
                placeholder="Enter job number" 
                defaultValue={formData.jobNumber}
                onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                data-testid="input-cleaning-job-number" 
              />
            </FormField>

            <FormField label="Company">
              <Select 
                defaultValue={formData.company}
                onValueChange={(value) => setFormData({ ...formData, company: value })}
              >
                <SelectTrigger data-testid="select-cleaning-company">
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

            <FormField label="Clean Time">
              <Input 
                placeholder="e.g., 6.5 hrs" 
                defaultValue={formData.cleanTime}
                onChange={(e) => setFormData({ ...formData, cleanTime: e.target.value })}
                data-testid="input-clean-time" 
              />
            </FormField>

            <FormField label="Mold Rating">
              <Input 
                placeholder="e.g., CM" 
                defaultValue={formData.moldRating}
                onChange={(e) => setFormData({ ...formData, moldRating: e.target.value })}
                data-testid="input-mold-rating" 
              />
            </FormField>

            <FormField label="Pouring Pictures">
              <Input 
                placeholder="e.g., Pouring" 
                defaultValue={formData.pouringPictures}
                onChange={(e) => setFormData({ ...formData, pouringPictures: e.target.value })}
                data-testid="input-pouring-pictures" 
              />
            </FormField>

            <FormField label="Casting Pictures">
              <Input 
                placeholder="e.g., Casting" 
                defaultValue={formData.castingPictures}
                onChange={(e) => setFormData({ ...formData, castingPictures: e.target.value })}
                data-testid="input-casting-pictures" 
              />
            </FormField>

            <FormField label="Core Assembly">
              <Input 
                placeholder="e.g., N/A" 
                defaultValue={formData.coreAssembly}
                onChange={(e) => setFormData({ ...formData, coreAssembly: e.target.value })}
                data-testid="input-core-assembly" 
              />
            </FormField>

            <FormField label="Core Cost">
              <Input 
                placeholder="e.g., $76" 
                defaultValue={formData.coreCost}
                onChange={(e) => setFormData({ ...formData, coreCost: e.target.value })}
                data-testid="input-core-cost" 
              />
            </FormField>

            <FormField label="Mold Assembly">
              <Input 
                placeholder="e.g., 576" 
                defaultValue={formData.moldAssembly}
                onChange={(e) => setFormData({ ...formData, moldAssembly: e.target.value })}
                data-testid="input-mold-assembly" 
              />
            </FormField>

            <FormField label="Casting Weight (lbs)">
              <Input 
                placeholder="e.g., N/A or 450" 
                defaultValue={formData.castingWeightLbs}
                onChange={(e) => setFormData({ ...formData, castingWeightLbs: e.target.value })}
                data-testid="input-casting-weight" 
              />
            </FormField>

            <FormField label="Pour Point">
              <Input 
                placeholder="e.g., N/A" 
                defaultValue={formData.pourPoint}
                onChange={(e) => setFormData({ ...formData, pourPoint: e.target.value })}
                data-testid="input-pour-point" 
              />
            </FormField>

            <FormField label="Assembly">
              <Input 
                placeholder="e.g., N/A" 
                defaultValue={formData.assembly}
                onChange={(e) => setFormData({ ...formData, assembly: e.target.value })}
                data-testid="input-assembly" 
              />
            </FormField>

            <FormField label="Additional Notes">
              <Textarea 
                rows={4}
                placeholder="Enter additional notes and observations" 
                defaultValue={formData.additionalNotesInitial}
                onChange={(e) => setFormData({ ...formData, additionalNotesInitial: e.target.value })}
                data-testid="input-additional-notes" 
              />
            </FormField>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t bg-card">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-cleaning">
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-cleaning">
              Save Cleaning Info
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

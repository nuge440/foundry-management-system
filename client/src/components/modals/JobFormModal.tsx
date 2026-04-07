import { useState, useEffect } from "react";
import { X, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUploadSection } from "@/components/job/FileUploadSection";
import type { Material } from "@shared/schema";

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  initialData?: any;
}

export function JobFormModal({ isOpen, onClose, onSave, initialData }: JobFormModalProps) {
  const [formData, setFormData] = useState<any>({});

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  useEffect(() => {
    if (isOpen) {
      const data = { ...(initialData || {}) };
      const weight = parseFloat(data.pourWeight);
      if (!isNaN(weight) && weight > 1500 && (!data.informMelt || data.informMelt === "No")) {
        data.informMelt = "Yes";
      }
      setFormData(data);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isEditing = !!initialData?.id;

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const updated = { ...prev, [field]: value };

      if (field === "pourWeight") {
        const numericWeight = parseFloat(value);
        if (!isNaN(numericWeight) && numericWeight > 1500) {
          updated.informMelt = "Yes";
        }
      }

      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    onClose();
  };

  const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="grid grid-cols-[160px_1fr] items-center gap-4">
      <Label className="text-right text-sm text-muted-foreground">{label}</Label>
      {children}
    </div>
  );

  const ReadOnlyField = ({ label, value }: { label: string; value?: string | number }) => (
    <div className="grid grid-cols-[160px_1fr] items-center gap-4">
      <Label className="text-right text-sm text-muted-foreground flex items-center justify-end gap-1.5">
        <Lock className="w-3 h-3 flex-shrink-0 opacity-50" />
        {label}
      </Label>
      <div className="text-sm py-1.5 px-3 rounded-md bg-muted/50 border border-border/50 min-h-[36px] flex items-center text-foreground/80" data-testid={`readonly-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {value || "—"}
      </div>
    </div>
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose} data-testid="modal-backdrop">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-card border rounded-md w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-card z-10">
          <h2 className="text-xl font-semibold">{isEditing ? 'Edit Job' : 'Add New Job'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-modal">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-5">

            {isEditing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">JobBoss Data</h3>
                  <div className="flex-1 border-t border-border/50" />
                  <span className="text-xs text-muted-foreground">Synced from JobBoss</span>
                </div>

                <ReadOnlyField label="Job Number" value={formData.jobNumber} />
                <ReadOnlyField label="Customer" value={formData.customer || formData.company} />
                <ReadOnlyField label="Part Number" value={formData.partNumber} />
                <ReadOnlyField label="Description" value={formData.description} />
                <ReadOnlyField label="Part Type" value={formData.partType} />
                <ReadOnlyField label="Casting Type" value={formData.castingType} />
                <ReadOnlyField label="Material" value={formData.material} />
                <ReadOnlyField label="Owner" value={formData.owner} />
                <ReadOnlyField label="Order Qty" value={formData.quantityNeeded} />
                <ReadOnlyField label="Molds Needed" value={formData.moldsNeeded} />
                <ReadOnlyField label="Certs Required" value={formData.certs} />
                <ReadOnlyField label="Order Date" value={formatDate(formData.orderDate)} />
                <ReadOnlyField label="Promised Date" value={formatDate(formData.promisedDate)} />
                <ReadOnlyField label="Current Task" value={formData.task} />
                <ReadOnlyField label="Molds Split Off" value={formData.moldsSplitOff} />
              </div>
            )}

            {!isEditing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Job Info</h3>
                  <div className="flex-1 border-t border-border/50" />
                </div>

                <FormField label="Job Number">
                  <Input
                    value={formData.jobNumber || ""}
                    onChange={(e) => handleChange("jobNumber", e.target.value)}
                    placeholder="Enter job number"
                    data-testid="input-job-number"
                  />
                </FormField>

                <FormField label="Customer">
                  <Input
                    value={formData.customer || ""}
                    onChange={(e) => {
                      handleChange("customer", e.target.value);
                      handleChange("company", e.target.value);
                    }}
                    placeholder="Enter customer name"
                    data-testid="input-customer"
                  />
                </FormField>

                <FormField label="Part Number">
                  <Input
                    value={formData.partNumber || ""}
                    onChange={(e) => handleChange("partNumber", e.target.value)}
                    placeholder="Enter part number"
                    data-testid="input-part-number"
                  />
                </FormField>

                <FormField label="Description">
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={2}
                    placeholder="Enter job description"
                    data-testid="input-description"
                  />
                </FormField>

                <FormField label="Material">
                  <Select
                    value={formData.material || ""}
                    onValueChange={(v) => handleChange("material", v)}
                  >
                    <SelectTrigger data-testid="select-material">
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.code}>
                          {material.code} - {material.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Quantity Needed">
                  <Input
                    type="number"
                    value={formData.quantityNeeded || ""}
                    onChange={(e) => handleChange("quantityNeeded", e.target.value)}
                    placeholder="0"
                    data-testid="input-quantity"
                  />
                </FormField>

                <FormField label="Promised Date">
                  <Input
                    type="date"
                    value={formData.promisedDate || ""}
                    onChange={(e) => handleChange("promisedDate", e.target.value)}
                    data-testid="input-promised-date"
                  />
                </FormField>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dashboard Fields</h3>
                <div className="flex-1 border-t border-border/50" />
                <span className="text-xs text-muted-foreground">Editable by your team</span>
              </div>

              {isEditing && (
                <FormField label="Task Override">
                  <Input
                    value={formData.task || ""}
                    onChange={(e) => handleChange("task", e.target.value)}
                    placeholder="Leave blank to use JobBoss-derived task"
                    data-testid="input-task-override"
                  />
                </FormField>
              )}

              <FormField label="Pour Weight (lbs)">
                <div className="space-y-1">
                  <Input
                    value={formData.pourWeight || ""}
                    onChange={(e) => handleChange("pourWeight", e.target.value)}
                    placeholder="Enter weight in lbs"
                    data-testid="input-pour-weight"
                  />
                  {formData.pourWeight && parseFloat(formData.pourWeight) > 1500 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Weight exceeds 1,500 lbs — Inform Melt has been auto-set to Yes
                    </p>
                  )}
                </div>
              </FormField>

              <FormField label="Custom Chills">
                <Input
                  value={formData.customChills || ""}
                  onChange={(e) => handleChange("customChills", e.target.value)}
                  placeholder="Enter details"
                  data-testid="input-chills"
                />
              </FormField>

              <FormField label="Cores Ordered">
                <Input
                  type="date"
                  value={formData.coresOrdered || ""}
                  onChange={(e) => handleChange("coresOrdered", e.target.value)}
                  data-testid="input-cores-date"
                />
              </FormField>

              <FormField label="Heat Treat">
                <Input
                  value={formData.heatTreat || ""}
                  onChange={(e) => handleChange("heatTreat", e.target.value)}
                  placeholder="Enter heat treat details"
                  data-testid="input-heat-treat"
                />
              </FormField>

              <FormField label="Assembly Code">
                <Input
                  value={formData.assemblyCode || ""}
                  onChange={(e) => handleChange("assemblyCode", e.target.value)}
                  placeholder="Enter assembly code"
                  data-testid="input-assembly-code"
                />
              </FormField>

              <FormField label="Est Assembly Time">
                <Input
                  value={formData.estAssemblyTime || ""}
                  onChange={(e) => handleChange("estAssemblyTime", e.target.value)}
                  placeholder="Enter estimated time"
                  data-testid="input-assembly-time"
                />
              </FormField>

              <FormField label="Model Approved Date">
                <Input
                  type="date"
                  value={formData.modelApproved || ""}
                  onChange={(e) => handleChange("modelApproved", e.target.value)}
                  data-testid="input-model-date"
                />
              </FormField>

              <FormField label="Inform Melt">
                <Select value={formData.informMelt || "No"} onValueChange={(v) => handleChange("informMelt", v)}>
                  <SelectTrigger data-testid="select-inform-melt">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Notes">
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  placeholder="Enter notes"
                  data-testid="input-notes"
                />
              </FormField>

              <div className="pt-4">
                <h3 className="text-sm font-medium mb-4">Attachments</h3>
                <FileUploadSection />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t bg-card">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save">
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

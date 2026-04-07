import { useState, useRef } from "react";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobStatus } from "./StatusBadge";
import { useToast } from "@/hooks/use-toast";

interface DesignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  initialData?: any;
}

export function DesignFormModal({ isOpen, onClose, onSave, initialData }: DesignFormModalProps) {
  const [formData, setFormData] = useState(initialData || {});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(ppt|pptx)$/i)) {
      toast({
        title: "Invalid file type",
        description: "Please select a PowerPoint file (.ppt or .pptx)",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // Step 1: Get signed upload URL
      const { authFetch } = await import("@/lib/queryClient");
      const urlResponse = await authFetch('/api/attachments/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name })
      });

      if (!urlResponse.ok) throw new Error('Failed to get upload URL');
      const { uploadURL, filePath } = await urlResponse.json();

      // Step 2: Upload file to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      // Step 3: Get view URL for the uploaded file
      const viewResponse = await authFetch('/api/attachments/powerpoint-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });

      if (!viewResponse.ok) throw new Error('Failed to get view URL');
      const { viewURL } = await viewResponse.json();

      setFormData({ ...formData, powerpointLink: viewURL });
      toast({
        title: "File uploaded",
        description: "PowerPoint file uploaded successfully"
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload PowerPoint file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    console.log("Design form submitted:", formData);
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
          <h2 className="text-xl font-semibold">{initialData ? 'Edit Design' : 'Add Design Information'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-design-modal">
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
                <SelectTrigger data-testid="select-design-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Solidification/Casting">Solidification/Casting</SelectItem>
                  <SelectItem value="CAD Work">CAD Work</SelectItem>
                  <SelectItem value="Waiting on CAM">Waiting on CAM</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Job Number">
              <Input 
                placeholder="Enter job number" 
                defaultValue={formData.jobNumber}
                onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                data-testid="input-design-job-number" 
              />
            </FormField>

            <FormField label="Company">
              <Select 
                defaultValue={formData.company}
                onValueChange={(value) => setFormData({ ...formData, company: value })}
              >
                <SelectTrigger data-testid="select-design-company">
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

            <FormField label="Solidification">
              <Input 
                placeholder="e.g., Standard Flow" 
                defaultValue={formData.solidification}
                onChange={(e) => setFormData({ ...formData, solidification: e.target.value })}
                data-testid="input-solidification" 
              />
            </FormField>

            <FormField label="Solidification Quality">
              <Select 
                defaultValue={formData.quality}
                onValueChange={(value) => setFormData({ ...formData, quality: value })}
              >
                <SelectTrigger data-testid="select-quality">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nova">Nova</SelectItem>
                  <SelectItem value="Magma">Magma</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Number of Sprues">
              <Input 
                type="number" 
                placeholder="0" 
                defaultValue={formData.sprues}
                onChange={(e) => setFormData({ ...formData, sprues: e.target.value })}
                data-testid="input-sprues" 
              />
            </FormField>

            <FormField label="Basin Size">
              <Select 
                defaultValue={formData.basinSize}
                onValueChange={(value) => setFormData({ ...formData, basinSize: value })}
              >
                <SelectTrigger data-testid="select-basin-size">
                  <SelectValue placeholder="Select basin size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small">Small</SelectItem>
                  <SelectItem value="Large">Large</SelectItem>
                  <SelectItem value="Double">Double</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Gating System">
              <Select 
                defaultValue={formData.gatingSystem}
                onValueChange={(value) => setFormData({ ...formData, gatingSystem: value })}
              >
                <SelectTrigger data-testid="select-gating-system">
                  <SelectValue placeholder="Select gating system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Top Gate">Top Gate</SelectItem>
                  <SelectItem value="Bottom Gate">Bottom Gate</SelectItem>
                  <SelectItem value="Side Gate">Side Gate</SelectItem>
                  <SelectItem value="Parting Line Gate">Parting Line Gate</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Pour Rate (Design)">
              <Input 
                placeholder="e.g., 15 lbs/sec" 
                defaultValue={formData.pourRate}
                onChange={(e) => setFormData({ ...formData, pourRate: e.target.value })}
                data-testid="input-pour-rate" 
              />
            </FormField>

            <FormField label="Pour Rate (Actual)">
              <Input 
                placeholder="e.g., 14 lbs/sec" 
                defaultValue={formData.pourRateActual}
                onChange={(e) => setFormData({ ...formData, pourRateActual: e.target.value })}
                data-testid="input-pour-rate-actual" 
              />
            </FormField>

            <FormField label="CAD Status">
              <Select 
                defaultValue={formData.cad || "Not Started"}
                onValueChange={(value) => setFormData({ ...formData, cad: value })}
              >
                <SelectTrigger data-testid="select-cad-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Complete">Complete</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="CAM Status">
              <Select 
                defaultValue={formData.cam || "Not Started"}
                onValueChange={(value) => setFormData({ ...formData, cam: value })}
              >
                <SelectTrigger data-testid="select-cam-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Complete">Complete</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Parting Line">
              <Select 
                defaultValue={formData.parting}
                onValueChange={(value) => setFormData({ ...formData, parting: value })}
              >
                <SelectTrigger data-testid="select-parting">
                  <SelectValue placeholder="Select parting line" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Horizontal">Horizontal</SelectItem>
                  <SelectItem value="Vertical">Vertical</SelectItem>
                  <SelectItem value="Diagonal">Diagonal</SelectItem>
                  <SelectItem value="Multiple">Multiple</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Mold Type">
              <Select 
                defaultValue={formData.moldType}
                onValueChange={(value) => setFormData({ ...formData, moldType: value })}
              >
                <SelectTrigger data-testid="select-mold-type">
                  <SelectValue placeholder="Select mold type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Green Sand">Green Sand</SelectItem>
                  <SelectItem value="Resin Sand">Resin Sand</SelectItem>
                  <SelectItem value="No-Bake">No-Bake</SelectItem>
                  <SelectItem value="Shell Mold">Shell Mold</SelectItem>
                  <SelectItem value="Investment">Investment</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Castings Per Mold">
              <Input 
                type="number" 
                placeholder="1" 
                defaultValue={formData.castingsPerMold}
                onChange={(e) => setFormData({ ...formData, castingsPerMold: e.target.value })}
                data-testid="input-castings-per-mold" 
              />
            </FormField>

            <FormField label="Orientation">
              <Select 
                defaultValue={formData.orientation}
                onValueChange={(value) => setFormData({ ...formData, orientation: value })}
              >
                <SelectTrigger data-testid="select-orientation">
                  <SelectValue placeholder="Select orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vertical">Vertical</SelectItem>
                  <SelectItem value="Horizontal">Horizontal</SelectItem>
                  <SelectItem value="Angled">Angled</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <div className="col-span-2 pt-4 border-t">
              <FormField label="PowerPoint Link">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input 
                      type="text"
                      placeholder="\\server\share\file.pptx or https://..." 
                      value={formData.powerpointLink || ''}
                      onChange={(e) => setFormData({ ...formData, powerpointLink: e.target.value })}
                      data-testid="input-powerpoint-link" 
                      className="flex-1"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      data-testid="button-browse-powerpoint"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter a network path (\\server\share\file.pptx), web URL, or upload a file
                  </p>
                </div>
              </FormField>
            </div>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t bg-card">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-design">
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-design">
              Save Design
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

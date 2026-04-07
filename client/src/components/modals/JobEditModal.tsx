import { useState, useEffect, useRef } from "react";
import { X, Lock, Save, Upload, File as FileIcon, Image, Trash2, CheckSquare, Loader2, Camera } from "lucide-react";
import { MoldChecklistModal } from "@/components/modals/MoldChecklistModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NdtSpecification } from "@shared/schema";
import type {
  FieldConfig,
  SectionConfig,
  JobEditModalConfig,
} from "@/config/foundryConfig";

async function uploadToObjectStorage(file: File): Promise<{ filePath: string; viewUrl: string }> {
  const res = await authFetch("/api/attachments/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name }),
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  const { uploadURL, filePath } = await res.json();

  const uploadRes = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!uploadRes.ok) throw new Error("Failed to upload file");

  const viewRes = await authFetch("/api/attachments/powerpoint-view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filePath }),
  });
  if (!viewRes.ok) throw new Error("Failed to get view URL");
  const { viewURL } = await viewRes.json();

  return { filePath, viewUrl: viewURL };
}

interface JobEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  initialData?: any;
  config: JobEditModalConfig;
  saving?: boolean;
}

interface FieldRendererProps {
  fieldConfig: FieldConfig;
  formData: any;
  isEditing: boolean;
  onFieldChange: (field: string, value: any) => void;
  formatDate: (dateStr?: string) => string;
}

function FieldRenderer({ fieldConfig, formData, isEditing, onFieldChange, formatDate }: FieldRendererProps) {
  const {
    label,
    field,
    type = "text",
    options,
    disabled,
    placeholder,
  } = fieldConfig;
  const value = getNestedValue(formData, field);

  if (type === "checkbox") {
    return (
      <label className="flex items-center gap-2 py-1 cursor-pointer" data-testid={`field-${field}`}>
        <Checkbox
          checked={!!value}
          onCheckedChange={(checked) =>
            onFieldChange(field, checked === true)
          }
          data-testid={`checkbox-${field}`}
        />
        <span className="text-sm">{label}</span>
      </label>
    );
  }

  const isLocked = disabled && isEditing;

  return (
    <div className="flex flex-col gap-1" data-testid={`field-${field}`}>
      <Label
        className={cn(
          "text-xs text-muted-foreground flex items-center gap-1",
          isLocked && "opacity-70"
        )}
      >
        {isLocked && <Lock className="w-3 h-3 flex-shrink-0" />}
        {label}
      </Label>

      {isLocked ? (
        <div
          className="text-sm py-1.5 px-3 rounded-md bg-muted/50 border border-border/50 min-h-[36px] flex items-center text-foreground/70"
          data-testid={`readonly-${field}`}
        >
          {field === "promisedDate" || field === "orderDate"
            ? formatDate(value as string)
            : value || "\u2014"}
        </div>
      ) : type === "select" ? (
        <Select
          value={value || ""}
          onValueChange={(v) => onFieldChange(field, v)}
        >
          <SelectTrigger data-testid={`select-${field}`}>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {options?.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === "textarea" ? (
        <Textarea
          value={value || ""}
          onChange={(e) => onFieldChange(field, e.target.value)}
          placeholder={placeholder}
          rows={2}
          data-testid={`textarea-${field}`}
        />
      ) : type === "date" ? (
        <Input
          type="date"
          value={value || ""}
          onChange={(e) => onFieldChange(field, e.target.value)}
          data-testid={`input-${field}`}
        />
      ) : (
        <Input
          type={type}
          value={value || ""}
          onChange={(e) => onFieldChange(field, e.target.value)}
          placeholder={placeholder}
          data-testid={`input-${field}`}
        />
      )}
    </div>
  );
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

function setNestedValue(obj: any, path: string, value: any): any {
  const result = { ...obj };
  const parts = path.split(".");
  if (parts.length === 1) {
    result[path] = value;
    return result;
  }
  const [first, ...rest] = parts;
  result[first] = setNestedValue(result[first] || {}, rest.join("."), value);
  return result;
}

export function JobEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  config,
  saving = false,
}: JobEditModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: ndtSpecifications = [] } = useQuery<NdtSpecification[]>({
    queryKey: ["/api/ndt-specifications"],
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      const data = { ...(initialData || {}) };
      const weight = parseFloat(data.pourWeight);
      if (
        !isNaN(weight) &&
        weight > 1500 &&
        (!data.informMelt || data.informMelt === "No")
      ) {
        data.informMelt = "Yes";
      }
      if (data.sandMoldSize && !data.designInfo?.sandMoldSize) {
        data.designInfo = { ...(data.designInfo || {}), sandMoldSize: data.sandMoldSize };
      }
      if (data.sandMoldSize && !data.assemblyInfo?.moldSize) {
        data.assemblyInfo = { ...(data.assemblyInfo || {}), moldSize: data.sandMoldSize };
      }
      setFormData(data);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen || !formData) return;
    const filePaths: string[] = [];
    (formData.photos || []).forEach((p: any) => { if (p.filePath) filePaths.push(p.filePath); });
    (formData.fileLinks || []).forEach((f: any) => { if (f.filePath) filePaths.push(f.filePath); });
    if (formData.thumbnailPath) filePaths.push(formData.thumbnailPath);
    if (filePaths.length === 0) return;

    authFetch("/api/attachments/resolve-urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePaths }),
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.urls) return;
        const urls = data.urls as Record<string, string>;
        setFormData((prev: any) => {
          const updated = { ...prev };
          if (updated.photos) {
            updated.photos = updated.photos.map((p: any) =>
              p.filePath && urls[p.filePath] ? { ...p, url: urls[p.filePath] } : p
            );
          }
          if (updated.fileLinks) {
            updated.fileLinks = updated.fileLinks.map((f: any) =>
              f.filePath && urls[f.filePath] ? { ...f, url: urls[f.filePath] } : f
            );
          }
          if (updated.thumbnailPath && urls[updated.thumbnailPath]) {
            updated.thumbnailUrl = urls[updated.thumbnailPath];
          }
          return updated;
        });
      })
      .catch(() => {});
  }, [isOpen, initialData?.id]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isEditing = !!initialData?.id;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      let updated = setNestedValue(prev, field, value);

      if (field === "pourWeight") {
        const numericWeight = parseFloat(value);
        if (!isNaN(numericWeight) && numericWeight > 1500) {
          updated.informMelt = "Yes";
        }
      }

      const certedFields = [
        "ndTestRequirements.mpiCerted",
        "ndTestRequirements.lpiCerted",
        "ndTestRequirements.utCerted",
        "ndTestRequirements.charpyCerted",
        "ndTestRequirements.xrayCerted",
      ];
      if (certedFields.includes(field)) {
        const anyCerted = certedFields.some((f) =>
          f === field ? value : getNestedValue(updated, f)
        );
        if (!anyCerted) {
          updated.ndtSpecId = "";
        }
      }

      if (field === "designInfo.sandMoldSize") {
        updated.sandMoldSize = value;
        updated.assemblyInfo = { ...(updated.assemblyInfo || {}), moldSize: value };
      }

      return updated;
    });
  };

  const handleSubmit = () => {
    const cleanedData = { ...formData };
    delete cleanedData.thumbnailUrl;
    if (cleanedData.photos) {
      cleanedData.photos = cleanedData.photos.map((p: any) => {
        const { url, data, ...rest } = p;
        return rest;
      });
    }
    if (cleanedData.fileLinks) {
      cleanedData.fileLinks = cleanedData.fileLinks.map((f: any) => {
        const { url, ...rest } = f;
        return rest;
      });
    }
    onSave?.(cleanedData);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setThumbnailUploading(true);
    try {
      const { filePath, viewUrl } = await uploadToObjectStorage(file);
      handleFieldChange("thumbnailPath", filePath);
      handleFieldChange("thumbnailUrl", viewUrl);
    } catch {
      toast({ title: "Upload failed", description: "Could not upload thumbnail", variant: "destructive" });
    } finally {
      setThumbnailUploading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const gridColsMap: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  };

  const colSpanMap: Record<number, string> = {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5",
    6: "col-span-6",
  };

  const renderField = (fieldConfig: FieldConfig) => {
    if (fieldConfig.showWhen && !getNestedValue(formData, fieldConfig.showWhen))
      return null;

    const fieldRendererProps = {
      formData,
      isEditing,
      onFieldChange: handleFieldChange,
      formatDate,
    };

    if (fieldConfig.children && fieldConfig.type === "checkbox") {
      const parentValue = getNestedValue(formData, fieldConfig.field);
      return (
        <div key={fieldConfig.field}>
          <FieldRenderer fieldConfig={fieldConfig} {...fieldRendererProps} />
          {parentValue && (
            <div className="ml-6 mt-1 space-y-1">
              {fieldConfig.children.map((child) => {
                const isCertedField =
                  child.field === "ndTestRequirements.mpiCerted" ||
                  child.field === "ndTestRequirements.lpiCerted" ||
                  child.field === "ndTestRequirements.utCerted" ||
                  child.field === "ndTestRequirements.charpyCerted" ||
                  child.field === "ndTestRequirements.xrayCerted";
                const certedChecked = isCertedField && getNestedValue(formData, child.field);
                return (
                  <div key={child.field}>
                    <div className={isCertedField ? "flex items-center gap-3" : ""}>
                      <FieldRenderer fieldConfig={child} {...fieldRendererProps} />
                      {certedChecked && (
                        <Select
                          value={formData.ndtSpecId || ""}
                          onValueChange={(v) => handleFieldChange("ndtSpecId", v === "__none__" ? "" : v)}
                        >
                          <SelectTrigger data-testid={`select-ndtSpecId-${child.field}`} className="h-7 w-48 text-xs">
                            <SelectValue placeholder="Select spec..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {ndtSpecifications.map((spec) => (
                              <SelectItem key={spec.id} value={spec.id}>
                                {spec.code} — {spec.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const colClass = fieldConfig.colSpan
      ? colSpanMap[fieldConfig.colSpan] || ""
      : "";

    return (
      <div key={fieldConfig.field} className={colClass}>
        <FieldRenderer fieldConfig={fieldConfig} {...fieldRendererProps} />
      </div>
    );
  };

  const SectionPhotos = ({ section }: { section: string }) => {
    const photos = formData.photos?.filter((p: any) => p.section === section) || [];
    if (photos.length === 0) return null;

    return (
      <div className="mt-3 pt-2 border-t border-dashed border-border">
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <Image className="w-3 h-3" /> Photos/Videos
        </div>
        <div className="flex flex-wrap gap-2">
          {photos.map((photo: any) => {
            const src = photo.url || photo.data;
            return (
              <div key={photo.id} className="relative group">
                {src ? (
                  <img
                    src={src}
                    alt={photo.name}
                    className="h-16 w-20 object-cover rounded-md border cursor-pointer"
                    onClick={() => src && window.open(src, "_blank")}
                  />
                ) : (
                  <div className="h-16 w-20 flex items-center justify-center rounded-md border bg-muted">
                    <Image className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <button
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs invisible group-hover:visible"
                  onClick={() =>
                    handleFieldChange(
                      "photos",
                      (formData.photos || []).filter(
                        (p: any) => p.id !== photo.id
                      )
                    )
                  }
                  data-testid={`button-remove-photo-${photo.id}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const SectionFiles = ({ section }: { section: string }) => {
    const files =
      formData.fileLinks?.filter((f: any) => f.section === section) || [];
    if (files.length === 0) return null;

    return (
      <div className="mt-3 pt-2 border-t border-dashed border-border">
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <FileIcon className="w-3 h-3" /> Files
        </div>
        <div className="flex flex-wrap gap-2">
          {files.map((file: any) => (
            <div
              key={file.id}
              className="relative group flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs bg-muted/50 hover-elevate cursor-pointer"
              onClick={() => {
                if (file.url) window.open(file.url, "_blank");
              }}
              data-testid={`file-link-${file.id}`}
            >
              <FileIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="truncate max-w-[120px]">
                {file.name || file.path}
              </span>
              <button
                className="h-4 w-4 flex items-center justify-center text-muted-foreground invisible group-hover:visible flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFieldChange(
                    "fileLinks",
                    (formData.fileLinks || []).filter(
                      (f: any) => f.id !== file.id
                    )
                  );
                }}
                data-testid={`button-remove-file-${file.id}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const AddMediaControls = ({ sectionTitle }: { sectionTitle: string }) => {
    const photoInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const addPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      const isVideo = file.type.startsWith("video/");
      setUploading(true);
      try {
        const { filePath, viewUrl } = await uploadToObjectStorage(file);
        const newPhoto = {
          id: Date.now(),
          name: file.name,
          section: sectionTitle,
          filePath,
          url: viewUrl,
          isVideo,
        };
        handleFieldChange("photos", [
          ...(formData.photos || []),
          newPhoto,
        ]);
      } catch {
        toast({ title: "Upload failed", description: "Could not upload photo", variant: "destructive" });
      } finally {
        setUploading(false);
      }
    };

    const addFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      e.target.value = "";
      setUploading(true);
      try {
        const uploaded = [];
        for (const file of files) {
          const { filePath, viewUrl } = await uploadToObjectStorage(file);
          uploaded.push({
            id: Date.now() + uploaded.length,
            name: file.name,
            section: sectionTitle,
            filePath,
            url: viewUrl,
          });
        }
        handleFieldChange("fileLinks", [
          ...(formData.fileLinks || []),
          ...uploaded,
        ]);
      } catch {
        toast({ title: "Upload failed", description: "Could not upload file", variant: "destructive" });
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={addPhoto}
          className="hidden"
          data-testid={`input-photo-${sectionTitle}`}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={addFile}
          className="hidden"
          data-testid={`input-file-${sectionTitle}`}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => photoInputRef.current?.click()}
          disabled={uploading}
          data-testid={`button-add-photo-${sectionTitle}`}
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Image className="w-3.5 h-3.5 mr-1.5" />}
          Photo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          data-testid={`button-add-file-${sectionTitle}`}
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
          File
        </Button>
      </div>
    );
  };

  const renderSection = (section: SectionConfig) => {
    const isListLayout = section.layout === "list";
    const gridCols = section.gridCols || 3;
    const gridClass = gridColsMap[gridCols] || "grid-cols-3";

    return (
      <Card
        key={section.title}
        className="p-4 overflow-visible"
        data-testid={`section-${section.title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <h3
          className={cn(
            "text-sm font-semibold mb-3 pb-2 border-b",
            section.colorClass,
            section.borderClass
          )}
        >
          {section.title}
        </h3>

        {section.title === "Job Information" && (
          <div className="mb-3 flex items-start gap-3">
            <div className="relative group">
              {formData.thumbnailUrl || formData.thumbnailPath ? (
                <img
                  src={formData.thumbnailUrl}
                  alt="Part thumbnail"
                  className="h-24 w-24 object-cover rounded-lg border cursor-pointer"
                  onClick={() => formData.thumbnailUrl && window.open(formData.thumbnailUrl, "_blank")}
                  data-testid="img-thumbnail"
                />
              ) : (
                <div
                  className="h-24 w-24 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  onClick={() => thumbnailInputRef.current?.click()}
                  data-testid="placeholder-thumbnail"
                >
                  <Camera className="w-6 h-6 text-muted-foreground/50 mb-1" />
                  <span className="text-[10px] text-muted-foreground/50">Part Photo</span>
                </div>
              )}
              {(formData.thumbnailUrl || formData.thumbnailPath) && (
                <button
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs invisible group-hover:visible"
                  onClick={() => {
                    handleFieldChange("thumbnailPath", "");
                    handleFieldChange("thumbnailUrl", "");
                  }}
                  data-testid="button-remove-thumbnail"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {thumbnailUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Part Thumbnail</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={thumbnailUploading}
                data-testid="button-upload-thumbnail"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                {formData.thumbnailPath ? "Change" : "Upload"}
              </Button>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="hidden"
                data-testid="input-thumbnail"
              />
            </div>
          </div>
        )}

        <div
          className={
            isListLayout ? "space-y-1" : `grid ${gridClass} gap-3`
          }
        >
          {(section.title === "Design"
            ? section.fields.filter(f => f.field !== "designInfo.designNotes")
            : section.fields
          ).map(renderField)}
        </div>

        {section.title === "Design" && isEditing && formData.id && (
          <div className="mt-3 mb-1">
            <Button
              variant="outline"
              size="sm"
              className="text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
              onClick={() => setChecklistOpen(true)}
              data-testid="button-open-checklist"
            >
              <CheckSquare className="w-4 h-4 mr-1.5" />
              Mold Design Checklist
            </Button>
          </div>
        )}

        {section.title === "Design" &&
          section.fields.filter(f => f.field === "designInfo.designNotes").map(renderField)}

        {section.hasPhotos && <SectionPhotos section={section.title} />}
        {section.hasFiles && <SectionFiles section={section.title} />}
        {(section.hasPhotos || section.hasFiles) && (
          <AddMediaControls sectionTitle={section.title} />
        )}
      </Card>
    );
  };

  const pourWeightWarning =
    formData.pourWeight && parseFloat(formData.pourWeight) > 1500;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      onClick={onClose}
      data-testid="modal-backdrop"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        ref={modalRef}
        className="relative bg-background border rounded-md w-full max-w-6xl max-h-[95vh] flex flex-col shadow-xl mt-4 mb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-background z-10 rounded-t-md">
          <div>
            <h2 className="text-lg font-semibold" data-testid="text-modal-title">
              {isEditing
                ? `Edit Job: ${formData.jobNumber || ""}`
                : "Add New Job"}
            </h2>
            {isEditing && formData.company && (
              <p className="text-sm text-muted-foreground">
                {formData.company}
                {formData.partNumber ? ` \u2014 ${formData.partNumber}` : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {pourWeightWarning && (
              <span
                className="text-xs text-amber-600 dark:text-amber-400 font-medium mr-2"
                data-testid="text-inform-melt-warning"
              >
                Pour weight &gt; 1,500 lbs \u2014 Inform Melt set to Yes
              </span>
            )}
            <Button
              onClick={handleSubmit}
              disabled={saving}
              data-testid="button-save"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {config.sections.map(renderSection)}
        </div>
      </div>

      {isEditing && formData.id && (
        <MoldChecklistModal
          isOpen={checklistOpen}
          onClose={() => setChecklistOpen(false)}
          jobId={formData.id}
          jobNumber={formData.jobNumber || ""}
        />
      )}
    </div>
  );
}

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Upload, Trash2, Link2, Copy, ExternalLink, FolderOpen } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "./ObjectUploader";
import { DocumentThumbnail } from "./DocumentThumbnail";
import { DocumentViewer } from "./DocumentViewer";
import { LocalFileLinkDialog } from "./LocalFileLinkDialog";
import type { JobAttachment } from "@shared/schema";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface DetailField {
  label: string;
  value: string | number | null | undefined;
}

interface JobDetailPanelProps {
  jobId: string;
  designInfo?: DetailField[];
  assemblyInfo?: DetailField[];
  cleaningInfo?: DetailField[];
  checklistInfo?: DetailField[];
  onEditDesign?: () => void;
  onEditAssembly?: () => void;
  onEditCleaning?: () => void;
  onEditChecklist?: () => void;
}

function DetailCard({ 
  title, 
  fields, 
  headerColor, 
  onEdit 
}: { 
  title: string; 
  fields: DetailField[]; 
  headerColor: string; 
  onEdit?: () => void;
}) {
  const hasData = fields.some(f => f.value);

  return (
    <Card className="flex-1">
      <CardHeader className={`${headerColor} text-white py-3 px-4 flex flex-row items-center justify-between space-y-0`}>
        <h3 className="text-base font-semibold">{title}</h3>
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={onEdit}
            data-testid={`button-edit-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
        {hasData ? (
          <div className="space-y-3">
            {fields.map((field, idx) => (
              field.value && (
                <div key={idx}>
                  <dt className="text-xs text-muted-foreground mb-1">{field.label}</dt>
                  <dd className="text-sm font-medium">{field.value}</dd>
                </div>
              )
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
        )}
      </CardContent>
    </Card>
  );
}


export function JobDetailPanel({ 
  jobId,
  designInfo = [], 
  assemblyInfo = [], 
  cleaningInfo = [], 
  checklistInfo = [],
  onEditDesign,
  onEditAssembly,
  onEditCleaning,
  onEditChecklist
}: JobDetailPanelProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{ attachment: JobAttachment; viewURL: string } | null>(null);
  const [isLocalFileLinkDialogOpen, setIsLocalFileLinkDialogOpen] = useState(false);
  const filePathMapRef = useRef<Map<string, string>>(new Map());

  const { data: attachments = [], isLoading } = useQuery<JobAttachment[]>({
    queryKey: ["/api/attachments", jobId],
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/attachments/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attachments", jobId] });
      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete attachment",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async (file: any) => {
    console.log("Getting upload parameters for file:", file.name);
    const fileName = file.name;
    const res = await apiRequest("POST", "/api/attachments/upload", { fileName });
    const data = await res.json();
    console.log("Upload parameters received:", data);
    
    // Store the permanent path in our ref map, keyed by unique file.id
    filePathMapRef.current.set(file.id, data.filePath);
    
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: any) => {
    console.log("Upload complete, result:", result);
    setIsUploading(true);
    try {
      for (const file of result.successful) {
        console.log("Processing uploaded file:", file);
        const fileName = file.name;
        const fileType = file.type || "application/octet-stream";
        const fileSize = file.size?.toString() || "0";
        
        // Look up the permanent path from our map using the unique file.id
        const filePath = filePathMapRef.current.get(file.id);
        console.log("File path from map:", filePath);
        
        if (!filePath) {
          throw new Error(`No file path found for ${fileName} (id: ${file.id})`);
        }
        
        console.log("Saving attachment metadata:", { jobId, fileName, fileType, filePath, fileSize });
        await apiRequest("POST", "/api/attachments", {
          jobId,
          fileName,
          fileType,
          filePath,
          fileSize,
          uploadedAt: new Date().toISOString(),
        });
        
        // Clean up the map entry
        filePathMapRef.current.delete(file.id);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/attachments", jobId] });
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save file metadata",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewDocument = async (attachment: JobAttachment) => {
    // If it's a local link, don't try to view in browser
    if (attachment.attachmentType === "local_link") {
      return;
    }

    try {
      const res = await apiRequest("GET", `/api/attachments/view/${attachment.id}`);
      const data = await res.json();
      setViewingDocument({ attachment, viewURL: data.viewURL });
    } catch (error) {
      console.error("Error getting view URL:", error);
      toast({
        title: "Error",
        description: "Failed to load document preview",
        variant: "destructive",
      });
    }
  };

  const handleCopyPath = (localFilePath: string) => {
    navigator.clipboard.writeText(localFilePath);
    toast({
      title: "Success",
      description: "File path copied to clipboard",
    });
  };

  const handleOpenFileProtocol = (localFilePath: string) => {
    // Convert path to file:// URL format
    let fileUrl = localFilePath;
    
    // Handle Windows paths (C:\... or \\server\...)
    if (localFilePath.includes('\\')) {
      // Replace backslashes with forward slashes
      fileUrl = localFilePath.replace(/\\/g, '/');
      // Add file:/// prefix for Windows paths (three slashes for absolute paths)
      if (fileUrl.match(/^[a-zA-Z]:/)) {
        fileUrl = 'file:///' + fileUrl;
      } else if (fileUrl.startsWith('//')) {
        // UNC path (\\server\share)
        fileUrl = 'file:' + fileUrl;
      }
    } else if (localFilePath.startsWith('/')) {
      // Unix/Mac absolute path
      fileUrl = 'file://' + fileUrl;
    }
    
    // Try to open the file
    window.open(fileUrl, '_blank');
    
    toast({
      title: "Opening file",
      description: "Attempting to open file in default application",
    });
  };

  const handleSaveLocalFileLink = async (data: { fileName: string; localFilePath: string }) => {
    try {
      const fileExtension = data.localFilePath.split('.').pop()?.toLowerCase() || "";
      const fileType = getFileTypeFromExtension(fileExtension);
      
      await apiRequest("POST", "/api/attachments", {
        jobId,
        fileName: data.fileName,
        fileType,
        attachmentType: "local_link",
        localFilePath: data.localFilePath,
        filePath: null,
        fileSize: "0", // Local links don't have a size
        uploadedAt: new Date().toISOString(),
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/attachments", jobId] });
      toast({
        title: "Success",
        description: "Local file link added successfully",
      });
    } catch (error) {
      console.error("Error saving local file link:", error);
      toast({
        title: "Error",
        description: "Failed to save local file link",
        variant: "destructive",
      });
    }
  };

  const getFileTypeFromExtension = (extension: string): string => {
    const typeMap: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      txt: "text/plain",
      csv: "text/csv",
    };
    return typeMap[extension] || "application/octet-stream";
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="panel-job-details">
        <DetailCard 
          title="Design Information" 
          fields={designInfo}
          headerColor="bg-status-solidification"
          onEdit={onEditDesign}
        />
        <DetailCard 
          title="Assembly Information" 
          fields={assemblyInfo}
          headerColor="bg-status-cad"
          onEdit={onEditAssembly}
        />
        <DetailCard 
          title="Cleaning Room Info" 
          fields={cleaningInfo}
          headerColor="bg-status-waitingSample"
          onEdit={onEditCleaning}
        />
        <DetailCard 
          title="Mold Design Checklist" 
          fields={checklistInfo}
          headerColor="bg-status-waitingCam"
          onEdit={onEditChecklist}
        />
      </div>

      <Card>
        <CardHeader className="bg-primary text-primary-foreground py-3 px-4 flex flex-row items-center justify-between gap-2 space-y-0">
          <h3 className="text-base font-semibold">Attachments</h3>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="h-8"
              onClick={() => setIsLocalFileLinkDialogOpen(true)}
              data-testid="button-add-local-link"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Link Local File
            </Button>
            <ObjectUploader
              maxNumberOfFiles={10}
              maxFileSize={104857600}
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="h-8"
              buttonVariant="secondary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </ObjectUploader>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading attachments...</p>
          ) : attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No attachments</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {attachments.map((attachment) => {
                const isLocalLink = attachment.attachmentType === "local_link";
                const fileSizeKB = Math.round(parseInt(attachment.fileSize) / 1024);
                const fileUrl = `/api/attachments/download/${attachment.id}`;
                
                return (
                  <div
                    key={attachment.id}
                    className="relative group"
                    data-testid={`attachment-${attachment.id}`}
                  >
                    {isLocalLink ? (
                      // Local file link display
                      <div className="border-2 border-dashed border-primary/50 rounded-lg p-4 h-32 flex flex-col items-center justify-center gap-2 bg-muted/30 hover-elevate cursor-pointer">
                        <Link2 className="w-8 h-8 text-primary" />
                        <Badge variant="outline" className="text-xs">
                          <FolderOpen className="w-3 h-3 mr-1" />
                          Local Link
                        </Badge>
                      </div>
                    ) : (
                      // Uploaded file thumbnail
                      <DocumentThumbnail
                        fileUrl={fileUrl}
                        fileName={attachment.fileName}
                        fileType={attachment.fileType}
                        onClick={() => handleViewDocument(attachment)}
                      />
                    )}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" title={attachment.fileName}>
                            {attachment.fileName}
                          </p>
                          {!isLocalLink && (
                            <p className="text-xs text-muted-foreground">
                              {fileSizeKB} KB
                            </p>
                          )}
                          {isLocalLink && attachment.localFilePath && (
                            <p className="text-xs text-muted-foreground truncate" title={attachment.localFilePath}>
                              {attachment.localFilePath}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAttachmentMutation.mutate(attachment.id);
                          }}
                          data-testid={`button-delete-${attachment.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {isLocalLink && attachment.localFilePath && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs flex-1"
                            onClick={() => handleCopyPath(attachment.localFilePath!)}
                            data-testid={`button-copy-path-${attachment.id}`}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy Path
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs flex-1"
                            onClick={() => handleOpenFileProtocol(attachment.localFilePath!)}
                            data-testid={`button-open-file-${attachment.id}`}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Open
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {viewingDocument && (
        <DocumentViewer
          isOpen={!!viewingDocument}
          onClose={() => setViewingDocument(null)}
          fileUrl={viewingDocument.viewURL}
          fileName={viewingDocument.attachment.fileName}
          fileType={viewingDocument.attachment.fileType}
          downloadUrl={`/api/attachments/download/${viewingDocument.attachment.id}`}
        />
      )}

      <LocalFileLinkDialog
        isOpen={isLocalFileLinkDialogOpen}
        onClose={() => setIsLocalFileLinkDialogOpen(false)}
        onSave={handleSaveLocalFileLink}
      />
    </div>
  );
}

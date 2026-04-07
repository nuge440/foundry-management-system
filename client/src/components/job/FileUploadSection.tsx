import { useState } from "react";
import { Upload, X, Download, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  url: string;
}

interface FileUploadSectionProps {
  files?: UploadedFile[];
  onUpload?: (files: File[]) => void;
  onDelete?: (fileId: string) => void;
}

export function FileUploadSection({ files = [], onUpload, onDelete }: FileUploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    onUpload?.(droppedFiles);
    console.log("Files dropped:", droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    onUpload?.(selectedFiles);
    console.log("Files selected:", selectedFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4" data-testid="section-file-upload">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-md p-8 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border"
        )}
      >
        <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop files here, or click to select
        </p>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          data-testid="input-file-upload"
        />
        <label htmlFor="file-upload">
          <Button variant="outline" size="sm" asChild>
            <span>Select Files</span>
          </Button>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files</h4>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 rounded-md border bg-card"
              data-testid={`file-item-${file.id}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => console.log("Download file:", file.id)}
                  data-testid={`button-download-${file.id}`}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onDelete?.(file.id)}
                  data-testid={`button-delete-${file.id}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

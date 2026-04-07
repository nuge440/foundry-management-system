import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, FolderOpen } from "lucide-react";

interface LocalFileLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { fileName: string; localFilePath: string }) => void;
}

export function LocalFileLinkDialog({ isOpen, onClose, onSave }: LocalFileLinkDialogProps) {
  const [fileName, setFileName] = useState("");
  const [localFilePath, setLocalFilePath] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !localFilePath.trim()) {
      return;
    }
    onSave({ fileName: fileName.trim(), localFilePath: localFilePath.trim() });
    setFileName("");
    setLocalFilePath("");
    onClose();
  };

  const handleCancel = () => {
    setFileName("");
    setLocalFilePath("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-local-file-link">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Add Local File Link
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                placeholder="e.g., Design Drawing.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                data-testid="input-file-name"
                required
              />
              <p className="text-xs text-muted-foreground">
                Display name for this file link
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="localFilePath" className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Local File Path
              </Label>
              <Input
                id="localFilePath"
                placeholder="e.g., C:\Documents\file.pdf or /Users/name/Documents/file.pdf"
                value={localFilePath}
                onChange={(e) => setLocalFilePath(e.target.value)}
                data-testid="input-local-file-path"
                required
              />
              <p className="text-xs text-muted-foreground">
                Full path to the file on your local drive system
              </p>
            </div>
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This creates a reference to a file on your local computer or network drive. 
                The file won't be uploaded to the cloud. To open the file, you'll need access to the specified path.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} data-testid="button-cancel">
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-link">
              Save Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

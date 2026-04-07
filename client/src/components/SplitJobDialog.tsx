import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface SplitJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSplit: (count: number) => void;
  jobNumber: string;
  isPending?: boolean;
}

export function SplitJobDialog({ isOpen, onClose, onSplit, jobNumber, isPending }: SplitJobDialogProps) {
  const [splitCount, setSplitCount] = useState(2);

  const handleSplit = () => {
    if (splitCount >= 2 && splitCount <= 100) {
      onSplit(splitCount);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[360px]" data-testid="dialog-split-job">
        <DialogHeader>
          <DialogTitle>Split Job</DialogTitle>
          <DialogDescription>
            Split job {jobNumber} into multiple parts. Each part will inherit all job information.
          </DialogDescription>
        </DialogHeader>
        <div className="py-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="split-count">Number of parts</Label>
            <Input
              id="split-count"
              type="number"
              min={2}
              max={100}
              value={splitCount}
              onChange={(e) => setSplitCount(parseInt(e.target.value) || 2)}
              data-testid="input-split-count"
            />
            <p className="text-xs text-muted-foreground">
              Creates {splitCount} child jobs: {jobNumber}-1 through {jobNumber}-{splitCount}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending} data-testid="button-cancel-split">
            Cancel
          </Button>
          <Button
            onClick={handleSplit}
            disabled={isPending || splitCount < 2 || splitCount > 100}
            data-testid="button-confirm-split"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Split into {splitCount} parts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { insertShiftTemplateSchema, type ShiftTemplate } from "@shared/schema";

interface ShiftTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: ShiftTemplate;
  onSubmit: (data: z.infer<typeof insertShiftTemplateSchema>) => void;
  isPending: boolean;
}

export function ShiftTemplateFormDialog({
  open,
  onOpenChange,
  template,
  onSubmit,
  isPending,
}: ShiftTemplateFormDialogProps) {
  const form = useForm<z.infer<typeof insertShiftTemplateSchema>>({
    resolver: zodResolver(insertShiftTemplateSchema),
    defaultValues: {
      name: "",
      startTime: "08:00",
      endTime: "17:00",
      description: "",
      color: "#3b82f6",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: template?.name || "",
        startTime: template?.startTime || "08:00",
        endTime: template?.endTime || "17:00",
        description: template?.description || "",
        color: template?.color || "#3b82f6",
      });
    } else {
      form.reset({
        name: "",
        startTime: "08:00",
        endTime: "17:00",
        description: "",
        color: "#3b82f6",
      });
    }
  }, [template, open, form]);

  const handleSubmit = (data: z.infer<typeof insertShiftTemplateSchema>) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-shift-template-form">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {template ? "Edit Shift Template" : "Create Shift Template"}
          </DialogTitle>
          <DialogDescription>
            {template
              ? "Update the shift template details"
              : "Create a new reusable shift template for scheduling"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Morning Shift"
                      data-testid="input-shift-template-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        data-testid="input-shift-template-start-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        data-testid="input-shift-template-end-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="color"
                      data-testid="input-shift-template-color"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add notes or description"
                      data-testid="input-shift-template-description"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel-shift-template"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-submit-shift-template"
              >
                {isPending ? "Saving..." : template ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

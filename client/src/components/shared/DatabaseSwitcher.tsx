import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Database } from "lucide-react";

interface DatabaseInfo {
  active: string;
  available: string[];
}

export function DatabaseSwitcher() {
  const { data, isLoading } = useQuery<DatabaseInfo>({
    queryKey: ["/api/database/active"],
  });

  const switchMutation = useMutation({
    mutationFn: async (database: string) => {
      const res = await apiRequest("POST", "/api/database/switch", { database });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/database/active"] });
      queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/mongo/jobs") });
    },
  });

  if (isLoading || !data) {
    return null;
  }

  return (
    <div className="flex items-center gap-3" data-testid="database-switcher">
      <Database className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <RadioGroup
        value={data.active}
        onValueChange={(value) => switchMutation.mutate(value)}
        className="flex items-center gap-4"
        disabled={switchMutation.isPending}
      >
        {data.available.map((db) => (
          <div key={db} className="flex items-center gap-1.5">
            <RadioGroupItem
              value={db}
              id={`db-${db}`}
              data-testid={`radio-db-${db}`}
            />
            <Label
              htmlFor={`db-${db}`}
              className="text-sm cursor-pointer font-normal"
            >
              {db}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";

const STORAGE_KEY = "foundry_current_user";

export function getCurrentUser(): string {
  return localStorage.getItem(STORAGE_KEY) || "";
}

export function UserIdentitySelector() {
  const [currentUser, setCurrentUser] = useState(getCurrentUser);

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  useEffect(() => {
    if (users && users.length > 0 && !currentUser) {
      const first = users[0].name;
      setCurrentUser(first);
      localStorage.setItem(STORAGE_KEY, first);
    }
  }, [users, currentUser]);

  const handleChange = (value: string) => {
    setCurrentUser(value);
    localStorage.setItem(STORAGE_KEY, value);
  };

  if (!users || users.length === 0) return null;

  const selectValue = currentUser && users.some((u: any) => u.name === currentUser) ? currentUser : undefined;

  return (
    <div className="flex items-center gap-2" data-testid="user-identity-selector">
      <User className="h-4 w-4 text-muted-foreground" />
      <Select value={selectValue} onValueChange={handleChange}>
        <SelectTrigger className="w-[180px] h-8 text-sm" data-testid="select-current-user">
          <SelectValue placeholder="Select user..." />
        </SelectTrigger>
        <SelectContent>
          {users.map((user: any) => (
            <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

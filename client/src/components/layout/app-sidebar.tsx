import { LayoutDashboard, Users, ListChecks, Package, History, ShieldCheck, CheckSquare, RefreshCw } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Workflow Status", url: "/workflow-status", icon: ListChecks },
  { title: "Materials", url: "/materials", icon: Package },
  { title: "NDT Specifications", url: "/ndt-specifications", icon: ShieldCheck },
  { title: "Checklist Design", url: "/checklist-design", icon: CheckSquare },
  { title: "User Management", url: "/users", icon: Users },
  { title: "Change Log", url: "/change-log", icon: History },
  { title: "Sync / Import", url: "/import-job-boss", icon: RefreshCw },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Foundry Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

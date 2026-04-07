import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import JobDetail from "@/pages/JobDetail";
import JobInformation from "@/pages/JobInformation";
import DesignInformation from "@/pages/DesignInformation";
import AssemblyInformation from "@/pages/AssemblyInformation";
import CleaningRoomInfo from "@/pages/CleaningRoomInfo";
import ChecklistDesign from "@/pages/ChecklistDesign";
import WorkflowStatus from "@/pages/WorkflowStatus";
import UserManagement from "@/pages/UserManagement";
import Materials from "@/pages/Materials";
import NdtSpecifications from "@/pages/NdtSpecifications";
import TimeAttendance from "@/pages/TimeAttendance";
import EmployeeScheduling from "@/pages/EmployeeScheduling";
import ImportFromJobBoss from "@/pages/ImportFromJobBoss";
import OrganizationSetup from "@/pages/OrganizationSetup";
import PouringInstructions from "@/pages/PouringInstructions";
import NdTestRequirements from "@/pages/NdTestRequirements";
import LessonsLearned from "@/pages/LessonsLearned";
import ChangeLog from "@/pages/ChangeLog";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Dashboard} />
      <Route path="/job/:id">{() => <ProtectedRoute component={JobDetail} />}</Route>
      <Route path="/jobs">{() => <ProtectedRoute component={JobInformation} />}</Route>
      <Route path="/design">{() => <ProtectedRoute component={DesignInformation} />}</Route>
      <Route path="/assembly">{() => <ProtectedRoute component={AssemblyInformation} />}</Route>
      <Route path="/cleaning">{() => <ProtectedRoute component={CleaningRoomInfo} />}</Route>
      <Route path="/pouring">{() => <ProtectedRoute component={PouringInstructions} />}</Route>
      <Route path="/nd-test">{() => <ProtectedRoute component={NdTestRequirements} />}</Route>
      <Route path="/lessons-learned">{() => <ProtectedRoute component={LessonsLearned} />}</Route>
      <Route path="/checklist-design">{() => <ProtectedRoute component={ChecklistDesign} />}</Route>
      <Route path="/workflow-status">{() => <ProtectedRoute component={WorkflowStatus} />}</Route>
      <Route path="/users">{() => <ProtectedRoute component={UserManagement} />}</Route>
      <Route path="/materials">{() => <ProtectedRoute component={Materials} />}</Route>
      <Route path="/ndt-specifications">{() => <ProtectedRoute component={NdtSpecifications} />}</Route>
      <Route path="/time-attendance">{() => <ProtectedRoute component={TimeAttendance} />}</Route>
      <Route path="/employee-scheduling">{() => <ProtectedRoute component={EmployeeScheduling} />}</Route>
      <Route path="/import-job-boss">{() => <ProtectedRoute component={ImportFromJobBoss} />}</Route>
      <Route path="/organization-setup">{() => <ProtectedRoute component={OrganizationSetup} />}</Route>
      <Route path="/change-log">{() => <ProtectedRoute component={ChangeLog} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="flex items-center gap-2" data-testid="user-menu">
      <User className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium" data-testid="text-current-user">{user.name}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={logout}
        data-testid="button-logout"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

function AppLayout() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (location === "/login" || (!user && location !== "/")) {
    return <Router />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-lg font-semibold">Foundry Management System</h1>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <UserMenu />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AuthProvider>
            <AppLayout />
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

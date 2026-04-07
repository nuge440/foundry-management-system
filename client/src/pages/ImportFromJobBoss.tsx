import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, AlertCircle, CheckCircle2, Loader2, Trash2, Users, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ImportFromJobBoss() {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [importMessage, setImportMessage] = useState("");
  const [isWiping, setIsWiping] = useState(false);
  const [wipeStatus, setWipeStatus] = useState<"idle" | "success" | "error">("idle");
  const [wipeMessage, setWipeMessage] = useState("");
  const { toast } = useToast();

  const handleImport = async () => {
    setIsImporting(true);
    setImportStatus("idle");
    setImportMessage("");

    try {
      const { authFetch } = await import("@/lib/queryClient");
      const response = await authFetch("/api/import-job-boss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        setImportStatus("success");
        setImportMessage(data.message || "Import completed successfully!");
        toast({
          title: "Import Successful",
          description: data.message || "Data has been imported from Job Boss",
        });
      } else {
        throw new Error(data.error || "Import failed");
      }
    } catch (error: any) {
      setImportStatus("error");
      setImportMessage(error.message || "An error occurred during import");
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message || "Failed to import data from Job Boss",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleWipe = async () => {
    if (!confirm("Are you sure you want to wipe ALL job data from MongoDB? This cannot be undone. You will need to run the sync script to repopulate.")) {
      return;
    }
    setIsWiping(true);
    setWipeStatus("idle");
    setWipeMessage("");

    try {
      const response = await apiRequest("POST", "/api/mongo/jobs/wipe");
      const data = await response.json();
      setWipeStatus("success");
      setWipeMessage(data.message || "Database wiped successfully.");
      toast({
        title: "Database Wiped",
        description: data.message,
      });
    } catch (error: any) {
      setWipeStatus("error");
      setWipeMessage(error.message || "Failed to wipe database");
      toast({
        variant: "destructive",
        title: "Wipe Failed",
        description: error.message,
      });
    } finally {
      setIsWiping(false);
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState("");

  const { data: bambooStatus } = useQuery<{ configured: boolean; lastSyncTime: string | null; lastSyncResult: any }>({
    queryKey: ["/api/bamboohr/status"],
  });

  const handleBambooSync = async () => {
    setIsSyncing(true);
    setSyncStatus("idle");
    setSyncMessage("");

    try {
      const response = await apiRequest("POST", "/api/bamboohr/sync");
      const data = await response.json();
      setSyncStatus("success");
      setSyncMessage(data.message || "Sync completed successfully!");
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bamboohr/status"] });
      toast({
        title: "BambooHR Sync Complete",
        description: data.message,
      });
    } catch (error: any) {
      setSyncStatus("error");
      setSyncMessage(error.message || "Failed to sync from BambooHR");
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import & Sync</h1>
        <p className="text-muted-foreground mt-2">
          Import job data from Job Boss and sync employees from BambooHR
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            BambooHR Employee Sync
          </CardTitle>
          <CardDescription>
            Sync employee data and departments from BambooHR into the system. This populates the user list for change tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              {bambooStatus?.configured ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">Connected</Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">Not Configured</Badge>
              )}
            </div>
            {bambooStatus?.lastSyncTime && (
              <div className="text-muted-foreground">
                Last sync: {new Date(bambooStatus.lastSyncTime).toLocaleString()}
              </div>
            )}
            {bambooStatus?.lastSyncResult && (
              <div className="text-muted-foreground">
                {bambooStatus.lastSyncResult.created} created, {bambooStatus.lastSyncResult.updated} updated
              </div>
            )}
          </div>

          {syncStatus === "success" && (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {syncMessage}
              </AlertDescription>
            </Alert>
          )}

          {syncStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{syncMessage}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleBambooSync}
            disabled={isSyncing || !bambooStatus?.configured}
            data-testid="button-bamboohr-sync"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync from BambooHR
              </>
            )}
          </Button>

          {!bambooStatus?.configured && (
            <p className="text-sm text-muted-foreground">
              Set BAMBOOHR_API_KEY and BAMBOOHR_COMPANY environment variables to enable syncing.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job Boss Data Import</CardTitle>
          <CardDescription>
            Click the button below to start importing data from the Job Boss system. This will
            fetch data and store it in your MongoDB database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {importStatus === "success" && (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {importMessage}
              </AlertDescription>
            </Alert>
          )}

          {importStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{importMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-primary/10 p-6">
              <Upload className="h-12 w-12 text-primary" />
            </div>
            
            <Button
              size="lg"
              onClick={handleImport}
              disabled={isImporting}
              data-testid="button-import-job-boss"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Start Import
                </>
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center max-w-md">
              This process will connect to the Job Boss system and import all available data
              into your MongoDB collections. Please ensure you have a stable internet connection.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-1">
            <p><strong>Source:</strong> Job Boss System</p>
            <p><strong>Destination:</strong> MongoDB Database (training_mgmt_metro_pd)</p>
            <p><strong>Connection Status:</strong> <span className="text-green-600 dark:text-green-400">Connected</span></p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Wipe & Reset Database</CardTitle>
          <CardDescription>
            Clear all job data from MongoDB so it can be refreshed from scratch by the JobBoss sync script.
            This removes all jobs, including any dashboard-only edits (notes, pour weight, custom fields, etc.).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {wipeStatus === "success" && (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {wipeMessage}
              </AlertDescription>
            </Alert>
          )}

          {wipeStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{wipeMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="rounded-full bg-destructive/10 p-6">
              <Trash2 className="h-12 w-12 text-destructive" />
            </div>

            <Button
              size="lg"
              variant="destructive"
              onClick={handleWipe}
              disabled={isWiping}
              data-testid="button-wipe-database"
            >
              {isWiping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wiping...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Wipe All Job Data
                </>
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center max-w-md">
              This will delete ALL jobs and sync metadata from MongoDB. After wiping, run the
              sync script on your local machine to do a full re-sync from JobBoss SQL Server.
              Any manual edits (notes, pour weights, custom fields) will be lost.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

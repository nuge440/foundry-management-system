import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/queryClient";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Search, ChevronLeft, ChevronRight, ExternalLink, Radio } from "lucide-react";

interface ChangeLogChange {
  field: string;
  oldValue: any;
  newValue: any;
}

interface ChangeLogEntry {
  _id: string;
  jobId: string;
  jobNumber: string;
  changedBy: string;
  changedAt: string;
  source: "dashboard" | "sync" | "system";
  changes: ChangeLogChange[];
}

function formatValue(value: any): string {
  if (value === null || value === undefined || value === "") return "(empty)";
  if (typeof value === "object") {
    try {
      const str = JSON.stringify(value);
      return str.length > 100 ? str.substring(0, 100) + "..." : str;
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    dashboard: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    sync: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    system: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  };
  return (
    <Badge variant="outline" className={colors[source] || colors.system} data-testid={`badge-source-${source}`}>
      {source}
    </Badge>
  );
}

export default function ChangeLog() {
  const qc = useQueryClient();
  const [jobNumberFilter, setJobNumberFilter] = useState("");
  const [changedByFilter, setChangedByFilter] = useState("");
  const [page, setPage] = useState(0);
  const [liveConnected, setLiveConnected] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    const es = new EventSource("/api/change-log/stream");
    es.onopen = () => setLiveConnected(true);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "connected") return;
        qc.invalidateQueries({ queryKey: ["/api/change-log"] });
        setNewCount((c) => c + 1);
        setTimeout(() => setNewCount((c) => Math.max(0, c - 1)), 3000);
      } catch {}
    };
    es.onerror = () => setLiveConnected(false);
    return () => es.close();
  }, [qc]);

  const searchParams = new URLSearchParams();
  if (jobNumberFilter) searchParams.set("jobNumber", jobNumberFilter);
  if (changedByFilter && changedByFilter !== "__all__") searchParams.set("changedBy", changedByFilter);
  searchParams.set("limit", String(pageSize));
  searchParams.set("offset", String(page * pageSize));

  const { data, isLoading, error } = useQuery<{ entries: ChangeLogEntry[]; total: number }>({
    queryKey: ["/api/change-log", jobNumberFilter, changedByFilter, page],
    queryFn: async () => {
      const res = await authFetch(`/api/change-log?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch change log");
      return res.json();
    },
  });

  const { data: usersData } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const entries = data?.entries || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Change Log</h1>
          <p className="text-muted-foreground mt-2">
            Track all changes made to jobs across the system
          </p>
        </div>
        <div className="flex items-center gap-2" data-testid="status-live-indicator">
          <Radio className={`h-4 w-4 ${liveConnected ? "text-green-500" : "text-muted-foreground"}`} />
          <span className={`text-sm font-medium ${liveConnected ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
            {liveConnected ? "Live" : "Connecting..."}
          </span>
          {newCount > 0 && (
            <Badge variant="secondary" className="animate-pulse" data-testid="badge-new-changes">
              {newCount} new
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by job number..."
                value={jobNumberFilter}
                onChange={(e) => { setJobNumberFilter(e.target.value); setPage(0); }}
                data-testid="input-filter-job-number"
              />
            </div>
            <div className="min-w-[200px]">
              <Select
                value={changedByFilter || "__all__"}
                onValueChange={(v) => { setChangedByFilter(v === "__all__" ? "" : v); setPage(0); }}
              >
                <SelectTrigger data-testid="select-filter-changed-by">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All users</SelectItem>
                  {(usersData || []).map((user: any) => (
                    <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="text-center py-12 text-destructive" data-testid="text-change-log-error">
              Failed to load change log. Please try again later.
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-no-changes">
              No changes recorded yet. Changes will appear here when job data is edited.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Job Number</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Old Value</TableHead>
                    <TableHead>New Value</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) =>
                    entry.changes.map((change, changeIdx) => (
                      <TableRow key={`${entry._id}-${changeIdx}`} data-testid={`row-change-${entry._id}-${changeIdx}`}>
                        {changeIdx === 0 ? (
                          <TableCell rowSpan={entry.changes.length} className="align-top whitespace-nowrap">
                            {formatDate(entry.changedAt)}
                          </TableCell>
                        ) : null}
                        {changeIdx === 0 ? (
                          <TableCell rowSpan={entry.changes.length} className="align-top">
                            <Link href={`/job/${entry.jobId}`} className="text-primary hover:underline flex items-center gap-1">
                              {entry.jobNumber}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </TableCell>
                        ) : null}
                        <TableCell className="font-mono text-sm">{change.field}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground" title={formatValue(change.oldValue)}>
                          {formatValue(change.oldValue)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm font-medium" title={formatValue(change.newValue)}>
                          {formatValue(change.newValue)}
                        </TableCell>
                        {changeIdx === 0 ? (
                          <TableCell rowSpan={entry.changes.length} className="align-top" data-testid={`text-changed-by-${entry._id}`}>
                            {entry.changedBy}
                          </TableCell>
                        ) : null}
                        {changeIdx === 0 ? (
                          <TableCell rowSpan={entry.changes.length} className="align-top">
                            <SourceBadge source={entry.source} />
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground" data-testid="text-pagination-info">
            Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} of {total} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              data-testid="button-next-page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

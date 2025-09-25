import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Trash2, List, Globe, Edit2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUrlSchema, type Url, type InsertUrl } from "@shared/schema";

interface UrlListProps {
  urls: Url[];
  onUrlDeleted: () => void;
}

export default function UrlList({ urls, onUrlDeleted }: UrlListProps) {
  const { toast } = useToast();
  const [editingUrl, setEditingUrl] = useState<Url | null>(null);
  const [deletingUrl, setDeletingUrl] = useState<Url | null>(null);

  const form = useForm<InsertUrl>({
    resolver: zodResolver(insertUrlSchema),
    defaultValues: {
      url: "",
      name: "",
    },
  });

  // Update form when editing URL changes
  useState(() => {
    if (editingUrl) {
      form.reset({
        url: editingUrl.url,
        name: editingUrl.name || "",
      });
    }
  });

  const deleteUrlMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/urls/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "URL deleted successfully",
      });
      onUrlDeleted();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete URL",
        variant: "destructive",
      });
    },
  });

  const formatTimestamp = (timestamp: Date | string | null) => {
    if (!timestamp) return "Never";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const formatResponseTime = (responseTime: number | null) => {
    if (!responseTime) return "N/A";
    if (responseTime >= 1000) return `${(responseTime / 1000).toFixed(1)}s`;
    return `${responseTime}ms`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "offline":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getResponseTimeColor = (responseTime: number | null, status: string) => {
    if (!responseTime || status === "offline") return "text-red-600";
    if (responseTime > 5000) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <Card>
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center space-x-2">
            <List className="text-primary w-4 h-4" />
            <span>Monitored URLs</span>
          </h2>
          <span className="text-sm text-muted-foreground" data-testid="text-url-count">
            {urls.length} URLs
          </span>
        </div>
      </div>
      
      <CardContent className="p-0">
        {urls.length === 0 ? (
          <div className="p-8 text-center" data-testid="empty-state">
            <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No URLs Added Yet</h3>
            <p className="text-muted-foreground mb-4">Add your first URL to start monitoring your websites.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {urls.map((url) => (
              <div
                key={url.id}
                className="p-4 hover:bg-accent/50 transition-colors"
                data-testid={`url-item-${url.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(url.status || "pending")}`}
                        data-testid={`status-${url.id}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate" data-testid={`name-${url.id}`}>
                        {url.name || "Unnamed URL"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate" data-testid={`url-${url.id}`}>
                        {url.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Last Ping</p>
                      <p className="text-xs font-medium" data-testid={`last-ping-${url.id}`}>
                        {formatTimestamp(url.lastPing)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Response</p>
                      <p 
                        className={`text-xs font-medium ${getResponseTimeColor(url.responseTime, url.status || "pending")}`}
                        data-testid={`response-time-${url.id}`}
                      >
                        {url.lastError || formatResponseTime(url.responseTime)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteUrlMutation.mutate(url.id)}
                      disabled={deleteUrlMutation.isPending}
                      className="text-destructive hover:text-destructive/80 p-1"
                      data-testid={`button-delete-${url.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

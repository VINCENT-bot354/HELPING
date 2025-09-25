import { TrendingUp, Play, Square, Activity, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface ServiceStatusProps {
  status: any;
  onStatusChange: () => void;
  totalUrls: number;
}

export default function ServiceStatus({ status, onStatusChange, totalUrls }: ServiceStatusProps) {
  const stats = status?.stats;
  const { toast } = useToast();

  const isRunning = status?.status === "running";

  const formatTimeUntilNext = (nextCycleTime: string | null) => {
    if (!nextCycleTime) return "N/A";

    const next = new Date(nextCycleTime);
    const now = new Date();
    const diffMs = next.getTime() - now.getTime();

    if (diffMs <= 0) return "Starting soon...";

    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor((diffMs % 60000) / 1000);

    if (diffMinutes > 0) {
      return `${diffMinutes}m ${diffSeconds}s`;
    }
    return `${diffSeconds}s`;
  };

  const calculateProgress = () => {
    if (!stats || !totalUrls) return 0;
    return Math.round((stats.currentUrlIndex / totalUrls) * 100);
  };

  const stopServiceMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/service/stop");
    },
    onSuccess: () => {
      toast({
        title: "Service Stopped",
        description: "Ping monitoring has been stopped",
      });
      onStatusChange();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to stop service",
        variant: "destructive",
      });
    },
  });

  const toggleRecklessMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await apiRequest("POST", "/api/service/reckless", { enabled });
    },
    onSuccess: (_, enabled) => {
      toast({
        title: enabled ? "Reckless Mode Enabled" : "Reckless Mode Disabled",
        description: enabled ? "Ignoring 10-minute wait time between cycles" : "Restored 10-minute wait time between cycles",
      });
      onStatusChange();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to toggle reckless mode",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <TrendingUp className="text-primary w-4 h-4" />
          <span>Service Status</span>
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current Cycle</span>
            <span className="text-sm font-medium text-foreground" data-testid="text-current-cycle">
              {stats?.currentCycle || 0}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Next Cycle</span>
            <span className="text-sm font-medium text-foreground" data-testid="text-next-cycle">
              {formatTimeUntilNext(stats?.nextCycleTime)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total URLs</span>
            <span className="text-sm font-medium text-foreground" data-testid="text-total-urls">
              {totalUrls}
            </span>
          </div>

          <div className="w-full bg-secondary rounded-full h-2 mt-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${calculateProgress()}%` }}
              data-testid="progress-bar"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">Cycle Progress</p>
        </div>

        <div className="flex justify-center space-x-4 mt-6">
          <Button
            onClick={() => stopServiceMutation.mutate()}
            disabled={!isRunning || stopServiceMutation.isPending}
            variant="destructive"
            size="sm"
            data-testid="button-stop-service"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Service
          </Button>

          <Button
            onClick={() => toggleRecklessMutation.mutate(!status?.recklessMode)}
            disabled={!isRunning || toggleRecklessMutation.isPending}
            variant={status?.recklessMode ? "secondary" : "outline"}
            size="sm"
            data-testid="button-reckless-mode"
          >
            <Zap className="w-4 h-4 mr-2" />
            {status?.recklessMode ? "Disable Reckless" : "Reckless Loop"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
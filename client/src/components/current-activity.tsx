import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CurrentActivityProps {
  status: any;
}

export default function CurrentActivity({ status }: CurrentActivityProps) {
  const stats = status?.stats;
  const currentUrl = status?.urls?.find((url: any) => url.id === stats?.currentUrlId);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatToday = () => {
    return new Date().toLocaleDateString();
  };

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Clock className="text-primary w-4 h-4" />
          <span>Current Activity</span>
          {stats?.recklessMode && (
            <span className="text-xs bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full font-medium">
              RECKLESS MODE
            </span>
          )}
        </h3>
        
        <div className="space-y-3">
          {stats?.isRunning && currentUrl ? (
            <div className="flex items-center justify-between p-3 bg-accent/30 rounded-md border-l-4 border-primary">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm font-medium">Currently Pinging:</span>
              </div>
              <span className="text-sm text-muted-foreground" data-testid="text-current-url">
                {currentUrl.url}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                <span className="text-sm font-medium">Status:</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {stats?.isRunning ? "Waiting for next cycle" : "Service stopped"}
              </span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cycle Started:</span>
            <span className="font-medium" data-testid="text-cycle-start">
              {formatTime(stats?.cycleStartTime)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Next Full Cycle:</span>
            <span className="font-medium" data-testid="text-next-full-cycle">
              {formatTime(stats?.nextCycleTime)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Successful Pings Today:</span>
            <span className="font-medium text-green-600" data-testid="text-successful-pings">
              {stats?.successfulPingsToday || 0}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Failed Pings Today:</span>
            <span className="font-medium text-red-600" data-testid="text-failed-pings">
              {stats?.failedPingsToday || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

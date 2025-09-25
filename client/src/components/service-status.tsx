import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ServiceStatusProps {
  status: any;
  totalUrls: number;
}

export default function ServiceStatus({ status, totalUrls }: ServiceStatusProps) {
  const stats = status?.stats;

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
      </CardContent>
    </Card>
  );
}

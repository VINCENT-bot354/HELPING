import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Satellite } from "lucide-react";
import AddUrlForm from "@/components/add-url-form";
import UrlList from "@/components/url-list";
import ServiceStatus from "@/components/service-status";
import CurrentActivity from "@/components/current-activity";

interface StatusData {
  isRunning: boolean;
  stats: any;
  urls: any[];
}

export default function Home() {
  const [statusData, setStatusData] = useState<StatusData | null>(null);

  // Fetch initial data
  const { data: urls, refetch: refetchUrls } = useQuery({
    queryKey: ["/api/urls"],
  });

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ["/api/status"],
  });

  // WebSocket temporarily disabled - using polling instead
  useEffect(() => {
    const interval = setInterval(() => {
      refetchUrls();
      refetchStatus();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [refetchUrls, refetchStatus]);

  // Use WebSocket data if available, otherwise fall back to query data
  const currentUrls = statusData?.urls || urls || [];
  const currentStatus = statusData || status;

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Satellite className="text-primary-foreground w-4 h-4" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">URL Ping Monitor</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className={`w-3 h-3 rounded-full ${currentStatus?.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {currentStatus?.isRunning && (
                    <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full pulse-ring"></div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {currentStatus?.isRunning ? 'Service Active' : 'Service Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <AddUrlForm onUrlAdded={refetchUrls} />
            <ServiceStatus status={currentStatus} totalUrls={currentUrls.length} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <UrlList urls={currentUrls} onUrlDeleted={refetchUrls} />
            <CurrentActivity status={currentStatus} />
          </div>
        </div>
      </div>
    </div>
  );
}

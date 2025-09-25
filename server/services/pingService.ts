import { storage } from "../storage";
import { type Url } from "@shared/schema";

class PingService {
  private isRunning = false;
  private currentTimeout: NodeJS.Timeout | null = null;
  private recklessMode = false;
  private isInCycle = false;

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    await storage.updateStats({ isRunning: true });
    console.log("Ping service started");
    
    this.runCycle();
  }

  async stop() {
    this.isRunning = false;
    await storage.updateStats({ isRunning: false });
    
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    
    console.log("Ping service stopped");
  }

  private async runCycle() {
    if (!this.isRunning) return;

    // Check for new URLs in URLs.txt file before starting cycle
    await storage.checkUrlsTextFile();

    const urls = await storage.getUrls();
    if (urls.length === 0) {
      // No URLs to ping, wait 10 seconds and check again
      this.isInCycle = false;
      this.currentTimeout = setTimeout(() => this.runCycle(), 10000);
      return;
    }

    this.isInCycle = true;
    const cycleStartTime = new Date();
    await storage.updateStats({
      cycleStartTime,
      currentCycle: ((await storage.getStats())?.currentCycle || 0) + 1,
      totalUrls: urls.length,
      currentUrlIndex: 0,
    });

    console.log(`Starting ping cycle with ${urls.length} URLs`);

    // Ping each URL sequentially with 1-second delay
    for (let i = 0; i < urls.length; i++) {
      if (!this.isRunning) return;

      const url = urls[i];
      await storage.updateStats({
        currentUrlIndex: i,
        currentUrlId: url.id,
      });

      await this.pingUrl(url);
      
      // Wait 1 second before next ping (except for the last URL)
      if (i < urls.length - 1) {
        await this.delay(1000);
      }
    }

    const cycleEndTime = new Date();
    const cycleDuration = cycleEndTime.getTime() - cycleStartTime.getTime();
    const minimumCycleTime = 10 * 60 * 1000; // 10 minutes in milliseconds

    let waitTime = 0;
    if (!this.recklessMode && cycleDuration < minimumCycleTime) {
      waitTime = minimumCycleTime - cycleDuration;
    }

    const nextCycleTime = new Date(Date.now() + waitTime);
    await storage.updateStats({
      nextCycleTime,
      currentUrlId: null,
      currentUrlIndex: 0,
    });

    console.log(`Cycle completed in ${cycleDuration}ms. Next cycle in ${waitTime}ms`);

    this.isInCycle = false;
    if (waitTime > 0) {
      this.currentTimeout = setTimeout(() => this.runCycle(), waitTime);
    } else {
      // Start next cycle immediately
      this.currentTimeout = setTimeout(() => this.runCycle(), 0);
    }
  }

  private async pingUrl(url: Url): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`Pinging ${url.url}`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url.url, {
        method: "GET",
        headers: {
          "User-Agent": "URL-Ping-Monitor/1.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const responseTime = Date.now() - startTime;
      let status: "online" | "warning" | "offline" = "online";

      if (response.ok) {
        if (responseTime > 5000) {
          status = "warning"; // Slow response
        }
      } else {
        status = "offline";
      }

      await storage.updateUrl(url.id, {
        status,
        lastPing: new Date(),
        responseTime,
        lastError: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
      });

      const stats = await storage.getStats();
      if (response.ok) {
        await storage.updateStats({
          successfulPingsToday: (stats?.successfulPingsToday || 0) + 1,
        });
      } else {
        await storage.updateStats({
          failedPingsToday: (stats?.failedPingsToday || 0) + 1,
        });
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      await storage.updateUrl(url.id, {
        status: "offline",
        lastPing: new Date(),
        responseTime,
        lastError: error instanceof Error ? error.message : "Unknown error",
      });

      const stats = await storage.getStats();
      await storage.updateStats({
        failedPingsToday: (stats?.failedPingsToday || 0) + 1,
      });

      console.error(`Failed to ping ${url.url}:`, error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getStatus() {
    return {
      isRunning: this.isRunning,
      recklessMode: this.recklessMode,
      stats: await storage.getStats(),
      urls: await storage.getUrls(),
    };
  }

  async pingNewUrlIfIdle(urlId: string) {
    // Only ping immediately if service is running but not currently in a cycle
    if (!this.isRunning || this.isInCycle) {
      return;
    }

    const url = await storage.getUrl(urlId);
    if (!url) return;

    console.log(`Pinging new URL immediately: ${url.url}`);
    await this.pingUrl(url);
  }

  async setRecklessMode(enabled: boolean) {
    this.recklessMode = enabled;
    await storage.updateStats({ recklessMode: enabled });
    console.log(`Reckless mode ${enabled ? 'enabled' : 'disabled'}`);
    
    // If enabling reckless mode and service is running, restart cycle immediately
    if (enabled && this.isRunning) {
      if (this.currentTimeout) {
        clearTimeout(this.currentTimeout);
        this.currentTimeout = null;
      }
      // Start next cycle immediately
      this.currentTimeout = setTimeout(() => this.runCycle(), 0);
    }
  }
}

export const pingService = new PingService();

// Auto-start the service
pingService.start();

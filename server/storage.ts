import { type Url, type InsertUrl, type PingStats, type InsertPingStats } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export interface IStorage {
  // URL operations
  getUrls(): Promise<Url[]>;
  getUrl(id: string): Promise<Url | undefined>;
  createUrl(url: InsertUrl): Promise<Url>;
  updateUrl(id: string, updates: Partial<Url>): Promise<Url | undefined>;
  deleteUrl(id: string): Promise<boolean>;
  
  // Stats operations
  getStats(): Promise<PingStats | undefined>;
  updateStats(updates: Partial<PingStats>): Promise<PingStats>;
  
  // File operations
  saveToFile(): Promise<void>;
  loadFromFile(): Promise<void>;
}

export class MemStorage implements IStorage {
  private urls: Map<string, Url>;
  private stats: PingStats;
  private filePath: string;

  constructor() {
    this.urls = new Map();
    this.stats = {
      id: "default",
      currentCycle: 0,
      totalUrls: 0,
      cycleStartTime: null,
      nextCycleTime: null,
      currentUrlIndex: 0,
      currentUrlId: null,
      isRunning: false,
      successfulPingsToday: 0,
      failedPingsToday: 0,
    };
    this.filePath = path.join(process.cwd(), "URLs.json");
    this.loadFromFile();
  }

  async getUrls(): Promise<Url[]> {
    return Array.from(this.urls.values());
  }

  async getUrl(id: string): Promise<Url | undefined> {
    return this.urls.get(id);
  }

  async createUrl(insertUrl: InsertUrl): Promise<Url> {
    const id = randomUUID();
    const url: Url = {
      ...insertUrl,
      name: insertUrl.name || null,
      id,
      status: "pending",
      lastPing: null,
      responseTime: null,
      lastError: null,
      createdAt: new Date(),
    };
    this.urls.set(id, url);
    await this.saveToFile();
    return url;
  }

  async updateUrl(id: string, updates: Partial<Url>): Promise<Url | undefined> {
    const existing = this.urls.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.urls.set(id, updated);
    await this.saveToFile();
    return updated;
  }

  async deleteUrl(id: string): Promise<boolean> {
    const deleted = this.urls.delete(id);
    if (deleted) {
      await this.saveToFile();
    }
    return deleted;
  }

  async getStats(): Promise<PingStats | undefined> {
    return this.stats;
  }

  async updateStats(updates: Partial<PingStats>): Promise<PingStats> {
    this.stats = { ...this.stats, ...updates };
    return this.stats;
  }

  async saveToFile(): Promise<void> {
    try {
      const data = {
        urls: Array.from(this.urls.values()),
        stats: this.stats,
      };
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save URLs to file:", error);
    }
  }

  async loadFromFile(): Promise<void> {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(data);
      
      if (parsed.urls) {
        this.urls.clear();
        parsed.urls.forEach((url: Url) => {
          this.urls.set(url.id, {
            ...url,
            lastPing: url.lastPing ? new Date(url.lastPing) : null,
            createdAt: url.createdAt ? new Date(url.createdAt) : new Date(),
          });
        });
      }
      
      if (parsed.stats) {
        this.stats = {
          ...parsed.stats,
          cycleStartTime: parsed.stats.cycleStartTime ? new Date(parsed.stats.cycleStartTime) : null,
          nextCycleTime: parsed.stats.nextCycleTime ? new Date(parsed.stats.nextCycleTime) : null,
        };
      }
    } catch (error) {
      // File doesn't exist or is invalid, start with empty state
      console.log("URLs.json not found or invalid, starting with empty state");
    }
  }
}

export const storage = new MemStorage();

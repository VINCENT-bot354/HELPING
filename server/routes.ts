import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUrlSchema } from "@shared/schema";
import { pingService } from "./services/pingService";
// import { WebSocketServer } from "ws"; // Temporarily disabled

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket temporarily disabled due to conflict with Vite HMR
  // Will re-enable after resolving port conflicts
  
  // Broadcast function (no-op for now)
  const broadcast = (data: any) => {
    // TODO: Re-enable WebSocket broadcasting
    console.log("Broadcast:", data.type);
  };

  // Get all URLs
  app.get("/api/urls", async (req, res) => {
    try {
      const urls = await storage.getUrls();
      res.json(urls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch URLs" });
    }
  });

  // Get single URL
  app.get("/api/urls/:id", async (req, res) => {
    try {
      const url = await storage.getUrl(req.params.id);
      if (!url) {
        return res.status(404).json({ message: "URL not found" });
      }
      res.json(url);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch URL" });
    }
  });

  // Create new URL
  app.post("/api/urls", async (req, res) => {
    try {
      const validatedData = insertUrlSchema.parse(req.body);
      const url = await storage.createUrl(validatedData);
      
      // Broadcast update
      const status = await pingService.getStatus();
      broadcast({ type: "url_added", data: { url, status } });
      
      res.status(201).json(url);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid URL data", errors: error });
      }
      res.status(500).json({ message: "Failed to create URL" });
    }
  });

  // Delete URL
  app.delete("/api/urls/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteUrl(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "URL not found" });
      }
      
      // Broadcast update
      const status = await pingService.getStatus();
      broadcast({ type: "url_deleted", data: { id: req.params.id, status } });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete URL" });
    }
  });

  // Get service status
  app.get("/api/status", async (req, res) => {
    try {
      const status = await pingService.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch status" });
    }
  });

  // Control service
  app.post("/api/service/:action", async (req, res) => {
    try {
      const { action } = req.params;
      
      if (action === "start") {
        await pingService.start();
      } else if (action === "stop") {
        await pingService.stop();
      } else {
        return res.status(400).json({ message: "Invalid action" });
      }
      
      const status = await pingService.getStatus();
      broadcast({ type: "service_status_changed", data: status });
      
      res.json({ message: `Service ${action}ed successfully` });
    } catch (error) {
      res.status(500).json({ message: `Failed to ${req.params.action} service` });
    }
  });

  return httpServer;
}

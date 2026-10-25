import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { mlClient } from "../../services/mlClient.js";

export const healthRouter = Router();

healthRouter.get("/live", (req: Request, res: Response) => {
  res.json({ status: "alive", timestamp: new Date().toISOString() });
});

healthRouter.get("/ready", async (req: Request, res: Response) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  const mlHealth = await mlClient.checkHealth();

  const isReady = isMongoConnected;

  res.status(isReady ? 200 : 503).json({
    status: isReady ? "ready" : "degraded",
    components: {
      mongodb: isMongoConnected ? "connected" : "disconnected",
      mlService: mlHealth.status,
    },
    timestamp: new Date().toISOString(),
  });
});

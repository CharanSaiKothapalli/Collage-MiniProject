import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || "An unexpected internal server error occurred.";

  logger.error(
    {
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      err: err.stack || err.message,
    },
    "Unhandled request error"
  );

  res.status(statusCode).json({
    ok: false,
    error: statusCode === 500 && config.isProduction ? "Internal server error" : message,
    code: err.code || "INTERNAL_ERROR",
  });
}

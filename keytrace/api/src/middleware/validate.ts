import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { sanitizeNoSqlInput } from "../utils/security.js";

export function validate(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.body) {
        // Sanitize NoSql operators from user input
        const cleanBody = sanitizeNoSqlInput(req.body);
        req.body = await schema.body.parseAsync(cleanBody);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        }));
        res.status(400).json({
          ok: false,
          error: issues[0]?.message || "Validation failed",
          details: issues,
          code: "VALIDATION_ERROR",
        });
        return;
      }
      next(error);
    }
  };
}

import { AnyZodObject } from "zod"; // Import Zod type
import { Request, Response, NextFunction } from "express"; // For Express types

export const zodValidater =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse all request data
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // If valid, move to the next middleware or route handler
      next();
    } catch (e: any) {
      // If invalid, send a 400 response with Zod's error details
      console.error("Validation error:", e.errors);
      return res.status(400).json({ error: e.errors });
    }
  };

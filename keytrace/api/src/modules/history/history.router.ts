import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.js";
import { VerificationEvent } from "../../models/VerificationEvent.js";

export const historyRouter = Router();

historyRouter.use(authenticate);

/**
 * GET /api/v1/history
 * Paginated verification event history with filtering
 */
historyRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = { userId: user._id };
  if (req.query.decision) {
    filter.decision = req.query.decision;
  }

  const [events, total] = await Promise.all([
    VerificationEvent.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    VerificationEvent.countDocuments(filter),
  ]);

  res.json({
    ok: true,
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * GET /api/v1/history/:eventId
 */
historyRouter.get("/:eventId", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { eventId } = req.params;

  const event = await VerificationEvent.findOne({
    _id: eventId,
    userId: user._id,
  });

  if (!event) {
    res.status(404).json({ ok: false, error: "Verification event not found.", code: "NOT_FOUND" });
    return;
  }

  res.json({
    ok: true,
    event,
  });
});

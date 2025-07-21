import type { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import catchAsync from "src/lib/utils";

export const access = (roles: Array<"ADMIN" | "MANAGER" | "USER">) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await User.findById(req.userId);
    if (!user || roles.includes(user.role))
      return res.status(401).json({ success: false, message: "Unauthorized" });
    next();
    return;
  });
};

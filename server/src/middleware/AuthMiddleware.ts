import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import env from "src/env";

export const authCheck = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

    if (!payload.id || typeof payload.id !== "string") {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.userId = payload.id;
    next();
    return;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }

    console.error("Authentication error:", error);
    return res.status(500).json({ message: "Authentication failed" });
  }
};

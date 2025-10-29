import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import jwt from "jsonwebtoken";

export const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.jwt;
    const secret = process.env.JWT_SECRET;
    console.log(req);

    if (!token)
      return res.status(401).json({ error: "Unauthorized: No Token Provided" });

    if (!secret) {
      console.error("JWT_SECRET is not defined in environment variables!");
      return res.status(500).json({ error: "Internal Server Error" });
    }
    const decoded: any = jwt.verify(token, secret);

    if (!decoded)
      return res.status(401).json({ error: "Unauthorized: Invalid Token" });

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    (req as any).user = user;
    console.log((req as any).user);

    next();
  } catch (err: any) {
    console.log("Error in protectRoute middleware", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

import jwt from "jsonwebtoken";
import { Response } from "express";

export const generateTokenAndSetCookie = (
  userId: string,
  res: Response
): void => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.cookie("jwt", token, {
    maxAge: 24 * 60 * 60 * 1000, // milliseconds
    httpOnly: true,
    sameSite: "strict",
  });
};

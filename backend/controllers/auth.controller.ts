import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import { generateTokenAndSetCookie } from "../utils/generateToken";

export const signup = async (req: Request, res: Response) => {
  try {
    const { fullName, username, email, password } = req.body;

    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ error: "Username is already taken" });

    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ error: "Email is already taken" });

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate token and set cookie
    generateTokenAndSetCookie(newUser._id.toString(), res);

    res.status(201).json({
      _id: newUser._id.toString(),
      fullName: newUser.fullName,
      username: newUser.username,
      email: newUser.email,
      followers: newUser.followers,
      following: newUser.following,
      profileImg: newUser.profileImg,
      coverImg: newUser.coverImg,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log("Error in signup controller", error.message);
      res.status(500).json({ error: error.message });
    }
  }
};

// ---------------- LOGIN ----------------
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ error: "Invalid username or password" });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect)
      return res.status(400).json({ error: "Invalid username or password" });

    generateTokenAndSetCookie(user._id.toString(), res);

    res.status(200).json({
      _id: user._id.toString(),
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      followers: user.followers,
      following: user.following,
      profileImg: user.profileImg,
      coverImg: user.coverImg,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log("Error in login controller", error.message);
      res.status(500).json({ error: error.message });
    }
  }
};

// ---------------- LOGOUT ----------------
export const logout = async (_req: Request, res: Response) => {
  try {
    res.cookie("jwt", "", { maxAge: 0, httpOnly: true, sameSite: "strict" });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log("Error in logout controller", error.message);
      res.status(500).json({ error: error.message });
    }
  }
};

// ---------------- GET ME ----------------
export const getMe = async (req: Request, res: Response) => {
  try {
    console.log(req);

    // if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    // res.status(200).json(req.user);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log("Error in getMe controller", error.message);
      res.status(500).json({ error: error.message });
    }
  }
};

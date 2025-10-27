import Notification from "../models/notification.model";
import { Request, Response } from "express";

// Extend Request to include user property
interface AuthRequest extends Request {
  user?: { _id: string };
}

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const notifications = await Notification.find({ to: userId }).populate({
      path: "from",
      select: "username profileImg",
    });

    await Notification.updateMany({ to: userId }, { read: true });

    res.status(200).json(notifications);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log("Error in getNotifications function", error.message);
      res.status(500).json({ error: error.message });
    } else {
      console.log("Unknown error in getNotifications function", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

export const deleteNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await Notification.deleteMany({ to: userId });

    res.status(200).json({ message: "Notifications deleted successfully" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log("Error in deleteNotifications function", error.message);
      res.status(500).json({ error: error.message });
    } else {
      console.log("Unknown error in deleteNotifications function", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

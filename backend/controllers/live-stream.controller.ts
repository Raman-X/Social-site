import { Request, Response } from "express";
import LiveStream from "../models/live-stream.model";

export const getAllLiveStreams = async (req: Request, res: Response) => {
  try {
    const liveStream = await LiveStream.find()
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "-password" });

    return res.status(200).json(liveStream);
  } catch (error: any) {
    return res.status(500).json("internal server error");
  }
};

export const createLiveStream = async (req: Request, res: Response) => {
  try {
    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: "url or name not given" });
    }

    const liveStream = new LiveStream({
      user: (req as any).user._id,
      name: name,
      url: url,
    });
    await liveStream.save();

    res.status(201).json(liveStream);
  } catch (error: unknown) {
    return res.status(500).json("internal server error");
  }
};

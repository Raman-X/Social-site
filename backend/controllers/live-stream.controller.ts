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

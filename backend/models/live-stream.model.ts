import { createSecretKey } from "crypto";
import { create } from "domain";
import mongoose, { Types } from "mongoose";

interface ILiveStream {
  user: Types.ObjectId;
  name: String;
  url: String;
}

const liveStreamSchema = new mongoose.Schema<ILiveStream>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const LiveStream = mongoose.model<ILiveStream>("LiveStream", liveStreamSchema);
export default LiveStream;

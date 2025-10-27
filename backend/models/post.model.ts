import mongoose, { Document, Types } from "mongoose";

export interface IComment {
  text: string;
  user: Types.ObjectId;
}

export interface IPost extends Document {
  user: Types.ObjectId;
  text?: string;
  img?: string;
  likes: Types.ObjectId[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema

const postSchema = new mongoose.Schema<IPost>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    img: {
      type: String,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        text: {
          type: String,
          required: true,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const Post = mongoose.model<IPost>("Post", postSchema);

export default Post;

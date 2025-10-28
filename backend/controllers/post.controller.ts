import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import Notification from "../models/notification.model";
import Post from "../models/post.model";
import User from "../models/user.model";
import { v2 as cloudinary } from "cloudinary";

// Extend Request to include authenticated user
interface AuthRequest extends Request {
  user?: { _id: string };
}

// CREATE POST
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { text, img: imgBody } = req.body;
    let img = imgBody;
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!text && !img) {
      return res.status(400).json({ error: "Post must have text or image" });
    }

    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const newPost = new Post({ user: userObjectId, text, img });
    await newPost.save();

    res.status(201).json(newPost);
  } catch (error: unknown) {
    if (error instanceof Error)
      console.log("Error in createPost controller:", error.message);
    else console.log("Unknown error in createPost controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE POST
export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.user.toString() !== userId) {
      return res
        .status(401)
        .json({ error: "You are not authorized to delete this post" });
    }

    if (post.img) {
      const imgId = post.img.split("/").pop()?.split(".")[0];
      if (imgId) await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error: unknown) {
    if (error instanceof Error)
      console.log("Error in deletePost controller:", error.message);
    else console.log("Unknown error in deletePost controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// COMMENT ON POST
export const commentOnPost = async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!text) return res.status(400).json({ error: "Text field is required" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userObjectId = new mongoose.Types.ObjectId(userId);
    post.comments.push({ user: userObjectId, text });
    await post.save();

    res.status(200).json(post);
  } catch (error: unknown) {
    if (error instanceof Error)
      console.log("Error in commentOnPost controller:", error.message);
    else console.log("Unknown error in commentOnPost controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// LIKE / UNLIKE POST
export const likeUnlikePost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id: postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const userLikedPost = post.likes.some((id) => id.equals(userObjectId));

    if (userLikedPost) {
      // Unlike
      await Post.updateOne({ _id: postId }, { $pull: { likes: userObjectId } });
      await User.updateOne(
        { _id: userObjectId },
        { $pull: { likedPosts: postId } }
      );

      const updatedLikes = post.likes.filter((id) => !id.equals(userObjectId));
      res.status(200).json(updatedLikes);
    } else {
      // Like
      post.likes.push(userObjectId);
      await User.updateOne(
        { _id: userObjectId },
        { $push: { likedPosts: postId } }
      );
      await post.save();

      const notification = new Notification({
        from: userObjectId,
        to: post.user,
        type: "like",
      });
      await notification.save();

      res.status(200).json(post.likes);
    }
  } catch (error: unknown) {
    if (error instanceof Error)
      console.log("Error in likeUnlikePost controller:", error.message);
    else console.log("Unknown error in likeUnlikePost controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET ALL POSTS
export const getAllPosts = async (_req: Request, res: Response) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    res.status(200).json(posts);
  } catch (error: unknown) {
    if (error instanceof Error)
      console.log("Error in getAllPosts controller:", error.message);
    else console.log("Unknown error in getAllPosts controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET USER'S LIKED POSTS
export const getLikedPosts = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    res.status(200).json(likedPosts);
  } catch (error: unknown) {
    if (error instanceof Error)
      console.log("Error in getLikedPosts controller:", error.message);
    else console.log("Unknown error in getLikedPosts controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET FOLLOWING POSTS
export const getFollowingPosts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const feedPosts = await Post.find({ user: { $in: user.following } })
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    res.status(200).json(feedPosts);
  } catch (error: unknown) {
    if (error instanceof Error)
      console.log("Error in getFollowingPosts controller:", error.message);
    else console.log("Unknown error in getFollowingPosts controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET POSTS BY USER
export const getUserPosts = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    res.status(200).json(posts);
  } catch (error: unknown) {
    if (error instanceof Error)
      console.log("Error in getUserPosts controller:", error.message);
    else console.log("Unknown error in getUserPosts controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

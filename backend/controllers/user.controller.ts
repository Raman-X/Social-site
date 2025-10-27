import bcrypt from "bcryptjs";
import Notification from "../models/notification.model";
import User from "../models/user.model"; // Import IUser
import { v2 as cloudinary } from "cloudinary";
import { Request, Response } from "express";
import { Types } from "mongoose";

// Extend Request to include authenticated user
// This interface should ideally be defined in a global declaration file (e.g., express.d.ts)
// as discussed in the previous response, but for this file's context,
// we'll define it here to make it work.
// For a cleaner project, move this to a global `backend/types/express.d.ts` file.
interface AuthRequest extends Request {
  user?: { _id: string | Types.ObjectId };
}

// GET USER PROFILE
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error: unknown) {
    if (error instanceof Error)
      console.log("Error in getUserProfile:", error.message);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

// FOLLOW / UNFOLLOW USER
export const followUnfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?._id;
    if (!currentUserId) return res.status(401).json({ error: "Unauthorized" });

    if (id === currentUserId?.toString()) {
      // Use .toString() for comparison if currentUserId is ObjectId
      return res
        .status(400)
        .json({ error: "You can't follow/unfollow yourself" });
    }

    const userToModify = await User.findById(id);
    const currentUser = await User.findById(currentUserId);

    if (!userToModify || !currentUser)
      return res.status(404).json({ error: "User not found" });

    const isFollowing = currentUser.following.includes(id as any); // Cast to any or ensure types match

    if (isFollowing) {
      await User.findByIdAndUpdate(id, { $pull: { followers: currentUserId } });
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: id } });
      res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      await User.findByIdAndUpdate(id, { $push: { followers: currentUserId } });
      await User.findByIdAndUpdate(currentUserId, { $push: { following: id } });

      const newNotification = new Notification({
        type: "follow",
        from: currentUserId,
        to: userToModify._id,
      });
      await newNotification.save();

      res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error: unknown) {
    if (error instanceof Error)
      console.log("Error in followUnfollowUser:", error.message);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

// GET SUGGESTED USERS
export const getSuggestedUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Explicitly define the type expected from .select('following')
    type UserWithFollowing = { following: (Types.ObjectId | string)[] };

    const usersFollowedByMe = await User.findById(userId).select("following");

    if (!usersFollowedByMe) {
      return res.status(404).json({ error: "Current user not found" });
    }

    // Now, assert the type of usersFollowedByMe to include 'following'
    const followedIds = (usersFollowedByMe as UserWithFollowing).following.map(
      (id) => id.toString()
    );

    const users = await User.aggregate([
      // Exclude the current user
      { $match: { _id: { $ne: userId } } },
      // Get a random sample of 10 users
      { $sample: { size: 10 } },
    ]);

    // Filter out users that are already followed by the current user
    const filteredUsers = users.filter((u) => {
      // Ensure u._id is compared correctly, convert to string if it's ObjectId
      return !followedIds.includes(u._id.toString());
    });

    const suggestedUsers = filteredUsers.slice(0, 4);

    // Remove password field for security
    suggestedUsers.forEach((u: any) => (u.password = undefined)); // Use undefined instead of null for consistency

    res.status(200).json(suggestedUsers);
  } catch (error: unknown) {
    if (error instanceof Error)
      console.log("Error in getSuggestedUsers:", error.message);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

// UPDATE USER
export const updateUser = async (req: AuthRequest, res: Response) => {
  const { fullName, email, username, currentPassword, newPassword, bio, link } =
    req.body;
  let { profileImg, coverImg } = req.body;
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Password validation
    if (
      (!newPassword && currentPassword) ||
      (!currentPassword && newPassword)
    ) {
      return res.status(400).json({
        error: "Please provide both current password and new password",
      });
    }

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch)
        return res.status(400).json({ error: "Current password is incorrect" });
      if (newPassword.length < 6)
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters long" });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // Handle profileImg upload
    if (profileImg) {
      if (user.profileImg) {
        // Correctly extract public ID for Cloudinary deletion
        const publicIdMatch = user.profileImg.match(/\/v\d+\/(.+?)\.\w+$/);
        const publicId = publicIdMatch ? publicIdMatch[1] : null;

        if (publicId) await cloudinary.uploader.destroy(publicId);
      }
      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedResponse.secure_url;
    }

    // Handle coverImg upload
    if (coverImg) {
      if (user.coverImg) {
        // Correctly extract public ID for Cloudinary deletion
        const publicIdMatch = user.coverImg.match(/\/v\d+\/(.+?)\.\w+$/);
        const publicId = publicIdMatch ? publicIdMatch[1] : null;

        if (publicId) await cloudinary.uploader.destroy(publicId);
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();
    user.password = ""; // Clear password before sending response

    return res.status(200).json(user);
  } catch (error: unknown) {
    if (error instanceof Error)
      console.log("Error in updateUser:", error.message);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

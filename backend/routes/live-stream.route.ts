import express from "express";
import {
  createLiveStream,
  getAllLiveStreams,
} from "../controllers/live-stream.controller";
import { protectRoute } from "../middleware/protectRoute";

const router = express.Router();

router.get("/all", protectRoute, getAllLiveStreams);
router.post("/create", protectRoute, createLiveStream);

export default router;

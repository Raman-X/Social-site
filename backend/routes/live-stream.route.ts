import express from "express";
import { getAllLiveStreams } from "../controllers/live-stream.controller";
import { protectRoute } from "../middleware/protectRoute";

const router = express.Router();

router.get("/all", protectRoute, getAllLiveStreams);

export default router;

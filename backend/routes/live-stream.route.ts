import express from "express";
import { protectRoute } from "../middleware/protectRoute";
import { getAllLiveStreams } from "../controllers/live-stream.controller";

const router = express.Router();

router.get('/all',protectRoute,getAllLiveStreams);

export default router;

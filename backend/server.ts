import express from "express";
import dotenv from "dotenv";
import connectDB from "./connectdb/connectdb.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to my site!");
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  connectDB();
});

import express from "express";
import uploadRoutes from "./routes/upload";
import { pollSQS } from "./consumers/sqsListener";
import { config } from "./config";

const app = express();
app.use(express.json());

app.use("/api", uploadRoutes);

app.listen(3000, () => {
  console.log("API running on http://localhost:3000");
  if (config.queueUrl) {
    pollSQS();
  }
});

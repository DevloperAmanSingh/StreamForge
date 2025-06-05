import path from "path";
import { downloadFromS3, uploadFolderToS3 } from "./utils/s3";
import { convertToHLS } from "./ffmpeg/builder";
import fs from "fs";

const key = process.argv[2]; // e.g., uploads/filename.mp4

if (!key) {
  console.error("Missing S3 key argument");
  process.exit(1);
}

(async () => {
  const fileName = path.basename(key);
  const localPath = `tmp/${fileName}`;
  const outputDir = `tmp/hls-${Date.now()}`;

  fs.mkdirSync("tmp", { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  console.log("Downloading from S3...");
  await downloadFromS3(key, localPath);

  console.log("Converting to HLS...");
  await convertToHLS(localPath, outputDir);

  console.log("Uploading to S3...");
  await uploadFolderToS3(outputDir, key.replace("uploads/", "hls/"));

  console.log("Done!");
})();

import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import { config } from "../config";

const s3 = new AWS.S3({ region: config.region });

export async function downloadFromS3(key: string, downloadPath: string) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
  };

  const file = fs.createWriteStream(downloadPath);

  const s3Stream = s3.getObject(params).createReadStream();
  return new Promise<void>((resolve, reject) => {
    s3Stream
      .pipe(file)
      .on("error", reject)
      .on("close", () => resolve());
  });
}

export async function uploadFolderToS3(localPath: string, s3Prefix: string) {
  async function uploadRecursively(currentPath: string, currentPrefix: string) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        // Recursively upload subdirectory
        await uploadRecursively(itemPath, `${currentPrefix}/${item}`);
      } else {
        // Upload file
        const s3Key = `${currentPrefix}/${item}`;
        const body = fs.readFileSync(itemPath);

        let contentType = "application/octet-stream";
        if (item.endsWith(".m3u8")) {
          contentType = "application/vnd.apple.mpegurl";
        } else if (item.endsWith(".ts")) {
          contentType = "video/MP2T";
        }

        console.log(`Uploading: ${s3Key}`);
        await s3
          .upload({
            Bucket: process.env.S3_BUCKET_OUTPUT!,
            Key: s3Key,
            Body: body,
            ContentType: contentType,
          })
          .promise();
      }
    }
  }

  await uploadRecursively(localPath, s3Prefix);
}

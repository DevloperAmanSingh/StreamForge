import AWS from "aws-sdk";
import { config } from "../config";
import fs from "fs";

const s3 = new AWS.S3({ region: config.region });

export function uploadFile(filePath: string, key: string) {
  if (!config.s3Bucket) {
    throw new Error("S3_BUCKET_NAME environment variable is not set");
  }

  const fileStream = fs.createReadStream(filePath);

  const params = {
    Bucket: config.s3Bucket,
    Key: key,
    Body: fileStream,
  };

  return s3.upload(params).promise();
}

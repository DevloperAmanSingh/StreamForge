import dotenv from "dotenv";
dotenv.config();
export const config = {
  region: process.env.AWS_REGION,
  s3Bucket: process.env.S3_BUCKET_NAME,
  queueUrl: process.env.SQS_QUEUE_URL,
};

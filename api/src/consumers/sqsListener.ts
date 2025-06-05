import AWS from "aws-sdk";
import { config } from "../config";

const sqs = new AWS.SQS({ region: config.region });

export async function pollSQS() {
  if (!config.queueUrl) {
    throw new Error("SQS_QUEUE_URL environment variable is not set");
  }

  const params = {
    QueueUrl: config.queueUrl,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20,
  };

  while (true) {
    const res = await sqs.receiveMessage(params).promise();
    const messages = res.Messages;

    if (messages && messages.length > 0) {
      for (const msg of messages) {
        console.log("SQS Message:", msg.Body);

        // Skip S3 test events
        if (msg.Body && msg.Body.includes("s3:TestEvent")) {
          console.log("Skipping S3 test event");
          if (msg.ReceiptHandle) {
            await sqs
              .deleteMessage({
                QueueUrl: config.queueUrl,
                ReceiptHandle: msg.ReceiptHandle,
              })
              .promise();
          }
          continue;
        }

        // Later → trigger Docker/Fargate job

        if (msg.ReceiptHandle) {
          await sqs
            .deleteMessage({
              QueueUrl: config.queueUrl,
              ReceiptHandle: msg.ReceiptHandle,
            })
            .promise();
        }
      }
    }
  }
}

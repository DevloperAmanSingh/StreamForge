import AWS from "aws-sdk";
import { spawn } from "child_process";
import { config } from "../config";

const sqs = new AWS.SQS({ region: config.region });

async function runHLSTranscoder(videoKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Starting HLS transcoding for: ${videoKey}`);
    const dockerArgs = [
      "run",
      "--rm", // Remove container after completion
      "--env-file",
      "../hls-transcoder/.env", // Load environment variables
      "-e",
      `VIDEO_KEY=${videoKey}`, // Pass video key as environment variable
      "hls-transcoder", // Docker image name
    ];

    console.log("Docker command:", "docker", dockerArgs.join(" "));

    const dockerProcess = spawn("docker", dockerArgs, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    dockerProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      stdout += output;
      console.log("📺 Transcoder:", output.trim());
    });

    dockerProcess.stderr?.on("data", (data) => {
      const output = data.toString();
      stderr += output;
      console.error("🔥 Transcoder Error:", output.trim());
    });

    dockerProcess.on("close", (code) => {
      if (code === 0) {
        console.log(
          `✅ HLS transcoding completed successfully for: ${videoKey}`
        );
        resolve();
      } else {
        console.error(
          `❌ HLS transcoding failed with exit code ${code} for: ${videoKey}`
        );
        console.error("Stderr:", stderr);
        reject(new Error(`Docker process exited with code ${code}`));
      }
    });

    dockerProcess.on("error", (error) => {
      console.error("🚨 Docker process error:", error);
      reject(error);
    });

    setTimeout(() => {
      dockerProcess.kill();
      reject(new Error("Docker process timed out after 10 minutes"));
    }, 10 * 60 * 1000);
  });
}

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

        let videoKey: string;
        try {
          const parsedMessage = JSON.parse(msg.Body || "");
          if (
            parsedMessage.Records &&
            parsedMessage.Records[0]?.s3?.object?.key
          ) {
            videoKey = parsedMessage.Records[0].s3.object.key;
          } else {
            videoKey = msg.Body || "";
          }
        } catch {
          videoKey = msg.Body || "";
        }

        if (!videoKey) {
          console.error("No video key found in message:", msg.Body);
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

        console.log("Processing video:", videoKey);
        try {
          await runHLSTranscoder(videoKey);
          console.log(
            "✅ HLS transcoding completed successfully for:",
            videoKey
          );
        } catch (error) {
          console.error("❌ HLS transcoding failed for:", videoKey, error);
        }

        // Delete message after processing
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

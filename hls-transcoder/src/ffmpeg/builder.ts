import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

interface QualityVariant {
  name: string;
  resolution: string;
  videoBitrate: string;
  audioBitrate: string;
}

const QUALITY_VARIANTS: QualityVariant[] = [
  {
    name: "240p",
    resolution: "426x240",
    videoBitrate: "400k",
    audioBitrate: "64k",
  },
  {
    name: "360p",
    resolution: "640x360",
    videoBitrate: "800k",
    audioBitrate: "96k",
  },
  {
    name: "720p",
    resolution: "1280x720",
    videoBitrate: "2500k",
    audioBitrate: "128k",
  },
];

export async function convertToHLS(inputPath: string, outputDir: string) {
  return new Promise<void>((resolve, reject) => {
    try {
      // Create directories for each quality variant
      QUALITY_VARIANTS.forEach((variant) => {
        const variantDir = path.join(outputDir, variant.name);
        fs.mkdirSync(variantDir, { recursive: true });
      });

      // Build ffmpeg command for multiple outputs
      const ffmpegCommand = ffmpeg(inputPath).outputOptions([
        "-preset veryfast",
        "-g 48",
        "-sc_threshold 0",
      ]);

      QUALITY_VARIANTS.forEach((variant, index) => {
        const variantDir = path.join(outputDir, variant.name);
        const playlistPath = path.join(variantDir, "prog.m3u8");
        const segmentPath = path.join(variantDir, "segment_%03d.ts");

        ffmpegCommand
          .output(playlistPath)
          .outputOptions([
            `-map 0:v:0`,
            `-map 0:a:0?`,
            `-s:v:${index} ${variant.resolution}`,
            `-b:v:${index} ${variant.videoBitrate}`,
            `-b:a:${index} ${variant.audioBitrate}`,
            `-f hls`,
            `-hls_time 4`,
            `-hls_playlist_type vod`,
            `-hls_segment_filename ${segmentPath}`,
          ]);
      });

      ffmpegCommand
        .on("end", () => {
          console.log("HLS conversion completed");

          createMasterPlaylist(outputDir);
          resolve();
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err.message);
          reject(err);
        })
        .run();
    } catch (error) {
      reject(error);
    }
  });
}

function createMasterPlaylist(outputDir: string) {
  const masterPlaylistPath = path.join(outputDir, "master.m3u8");

  let masterContent = "#EXTM3U\n#EXT-X-VERSION:3\n\n";

  QUALITY_VARIANTS.forEach((variant) => {
    const bandwidth =
      parseInt(variant.videoBitrate) * 1000 +
      parseInt(variant.audioBitrate) * 1000;
    const [width, height] = variant.resolution.split("x");

    masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${width}x${height}\n`;
    masterContent += `${variant.name}/prog.m3u8\n\n`;
  });

  fs.writeFileSync(masterPlaylistPath, masterContent);
  console.log(`Master playlist created: ${masterPlaylistPath}`);
}

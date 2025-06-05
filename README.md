# 🎬 StreamForge - HLS Video Transcoding System

A scalable, cloud-native video transcoding system that automatically converts uploaded videos into adaptive bitrate HLS streams with multiple quality levels.

## 🏗️ Architecture Overview

StreamForge is built with a microservices architecture designed for scalability and reliability:

### Core Components

1. **🐳 HLS Transcoder Service** (`hls-transcoder/`)

   - Dockerized FFmpeg-based transcoding service
   - Converts videos to adaptive bitrate HLS streams
   - Generates multiple quality levels (240p, 360p, 720p)
   - Automatically uploads processed content to S3

2. **⚡ API Service** (`api/`)

   - Node.js/TypeScript API server
   - SQS message consumer
   - Docker container orchestration
   - Process monitoring and logging

3. **🎥 Test Player** (`hls-transcoder/test-player.html`)
   - Modern HTML5 video player with HLS.js
   - Quality selection controls
   - Adaptive bitrate streaming support
   - Real-time quality monitoring

## 🔄 Processing Flow

<img width="1088" alt="image" src="https://github.com/user-attachments/assets/5f6d9926-0511-4f08-800e-344658e27dfb" />

### Step-by-Step Process

1. **Video Upload**: User uploads video to S3 bucket
2. **Event Trigger**: S3 triggers notification to SQS queue
3. **Message Processing**: API service polls SQS for new messages
4. **Container Launch**: API spawns Docker container with video key
5. **Transcoding**: FFmpeg converts video to multiple HLS qualities
6. **Upload**: Processed HLS files uploaded back to S3
7. **Cleanup**: Container removed, SQS message deleted

## 🎯 Key Features

### 📹 Advanced Video Processing

- **Adaptive Bitrate Streaming**: Multiple quality levels for optimal viewing
- **HLS Protocol**: Industry-standard HTTP Live Streaming
- **Smart Quality Selection**: Automatic quality switching based on bandwidth
- **Segment-based Delivery**: Efficient streaming with 4-second segments

### 🔧 Quality Levels

| Quality | Resolution | Video Bitrate | Audio Bitrate | Use Case                |
| ------- | ---------- | ------------- | ------------- | ----------------------- |
| 240p    | 426×240    | 400 kbps      | 64 kbps       | Mobile/Slow connections |
| 360p    | 640×360    | 800 kbps      | 96 kbps       | Standard mobile viewing |
| 720p    | 1280×720   | 2.5 Mbps      | 128 kbps      | HD desktop viewing      |

### 🚀 Scalability Features

- **Containerized Processing**: Isolated, scalable transcoding jobs
- **Queue-based Architecture**: Handle high volumes with SQS
- **Stateless Design**: Easy horizontal scaling
- **Cloud-native**: AWS S3, SQS integration

### 🛡️ Reliability & Monitoring

- **Error Handling**: Comprehensive error catching and logging
- **Process Timeout**: 10-minute timeout protection
- **Real-time Logging**: Live transcoding progress monitoring
- **Graceful Cleanup**: Automatic container removal

## 📁 Output Structure

For each processed video, the system creates:

```
s3://your-bucket/hls/video-name/
├── master.m3u8                 # Master playlist (entry point)
├── 240p/
│   ├── prog.m3u8              # 240p playlist
│   ├── segment_000.ts         # Video segments
│   ├── segment_001.ts
│   └── ...
├── 360p/
│   ├── prog.m3u8              # 360p playlist
│   ├── segment_000.ts
│   └── ...
└── 720p/
    ├── prog.m3u8              # 720p playlist
    ├── segment_000.ts
    └── ...
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- AWS Account (S3, SQS access)
- FFmpeg (included in Docker image)

### 1. Environment Setup

```bash
# Clone repository
git clone <repository-url>
cd streamforge

# Set up HLS Transcoder
cd hls-transcoder
cp .env.example .env
# Configure AWS credentials in .env

# Set up API
cd ../api
npm install
cp .env.example .env
# Configure SQS queue URL and AWS credentials
```

### 2. Build Docker Image

```bash
cd hls-transcoder
docker build -t hls-transcoder .
```

### 3. Configure AWS Services

```bash
# Create S3 bucket
aws s3 mb s3://your-video-bucket

# Create SQS queue
aws sqs create-queue --queue-name video-processing-queue

# Set up S3 event notifications to SQS
# (Configure in AWS Console or via CLI)
```

### 4. Start Services

```bash
# Start API service
cd api
npm run dev

# The API will automatically poll SQS and process videos
```

### 5. Test with Video Player

```bash
# Open test player
open hls-transcoder/test-player.html

# Enter your HLS master playlist URL:
# https://your-bucket.s3.region.amazonaws.com/hls/video-name/master.m3u8
```

## 📝 Configuration

### Environment Variables

**HLS Transcoder** (`.env`):

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your-video-bucket
AWS_REGION=us-east-1
```

**API Service** (`.env`):

```env
SQS_QUEUE_URL=https://sqs.region.amazonaws.com/account/queue-name
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

### FFmpeg Configuration

The system uses optimized FFmpeg settings:

- **Preset**: `veryfast` for speed
- **GOP Size**: 48 frames for efficient streaming
- **Segment Length**: 4 seconds
- **Format**: HLS with VOD playlist type

## 📊 Performance

### Typical Processing Times

- **5-minute 1080p video**: ~2-3 minutes
- **10-minute 720p video**: ~3-4 minutes
- **30-minute 4K video**: ~15-20 minutes

### Resource Requirements

- **CPU**: 2+ cores recommended
- **Memory**: 2GB+ RAM
- **Storage**: Temporary space for processing
- **Network**: High bandwidth for S3 uploads

## 🔧 Advanced Configuration

### Custom Quality Levels

Modify `hls-transcoder/src/ffmpeg/builder.ts`:

```typescript
const QUALITY_VARIANTS: QualityVariant[] = [
  {
    name: "480p",
    resolution: "854x480",
    videoBitrate: "1200k",
    audioBitrate: "96k",
  },
  // Add more variants...
];
```

### Processing Timeout

Adjust timeout in `api/src/consumers/sqsListener.ts`:

```typescript
setTimeout(() => {
  dockerProcess.kill();
  reject(new Error("Docker process timed out"));
}, 20 * 60 * 1000); // 20 minutes
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---


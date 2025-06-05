FROM node:18-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY . .

RUN npm install

CMD ["sh", "-c", "npx ts-node src/index.ts \"$VIDEO_KEY\""]

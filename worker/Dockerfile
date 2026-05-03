FROM node:20-slim

# Install FFmpeg + curl (needed for some fetch operations)
RUN apt-get update && \
    apt-get install -y ffmpeg curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy worker source
COPY . .

# Verify FFmpeg is installed
RUN ffmpeg -version | head -1

EXPOSE 4000

CMD ["npx", "tsx", "index.ts"]
